# Read-only release check. Requires PowerShell 7; sends no credentials or learner data.
param([Parameter(Mandatory = $true)][string]$ReportPath)
$ErrorActionPreference = 'Stop'
$newOrigin = 'https://speakmate-v3.vercel.app'
$oldOrigin = 'https://speakmate-pwa.vercel.app'
$startedAt = [DateTimeOffset]::UtcNow.ToString('o')

function Read-PublicResponse([string]$Url) {
    $response = Invoke-WebRequest -Uri $Url -MaximumRedirection 0 -TimeoutSec 20 -SkipHttpErrorCheck
    if ([int]$response.StatusCode -ne 200) { throw "HTTP $($response.StatusCode): $Url" }
    return $response
}

$oldBefore = (Read-PublicResponse "$oldOrigin/api/v1/health").Content | ConvertFrom-Json
$newHealth = (Read-PublicResponse "$newOrigin/api/v1/health").Content | ConvertFrom-Json
$manifestResponse = Read-PublicResponse "$newOrigin/offline-build.js"
$match = [regex]::Match([string]$manifestResponse.Content, '^self\.SPEAKMATE_OFFLINE = (\{.*\});\s*$', 'Singleline')
if (-not $match.Success) { throw 'Unexpected offline manifest wrapper; refusing to evaluate JavaScript.' }
$manifest = $match.Groups[1].Value | ConvertFrom-Json
if ($manifest.schemaVersion -ne 1) { throw 'Unexpected manifest schema.' }
$entries = @($manifest.shells) + @($manifest.assets) + @($manifest.categories)
foreach ($entry in $entries) {
    if ($entry.url -notmatch '^/(?!/)[A-Za-z0-9_./-]*$' -or $entry.url.Contains('..') -or $entry.sha256 -notmatch '^[a-f0-9]{64}$') {
        throw 'Unsafe or invalid manifest entry.'
    }
}
$results = @($entries | ForEach-Object -Parallel {
    $entry = $_
    $url = $using:newOrigin + $entry.url
    $result = [ordered]@{ path = $entry.url; status = $null; expectedBytes = $entry.bytes; bytes = $null; expectedSha256 = $entry.sha256; sha256 = $null; passed = $false; error = $null }
    try {
        $response = Invoke-WebRequest -Uri $url -MaximumRedirection 0 -TimeoutSec 20 -SkipHttpErrorCheck -ErrorAction Stop
        $result.status = [int]$response.StatusCode
        $response.RawContentStream.Position = 0
        $buffer = [System.IO.MemoryStream]::new()
        try {
            $response.RawContentStream.CopyTo($buffer)
            $bytes = $buffer.ToArray()
        } finally { $buffer.Dispose() }
        $result.bytes = $bytes.Length
        $result.sha256 = [Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant()
        $result.passed = $result.status -eq 200 -and $result.bytes -eq $entry.bytes -and $result.sha256 -eq $entry.sha256
    } catch { $result.error = $_.Exception.Message }
    [pscustomobject]$result
} -ThrottleLimit 6 | Sort-Object path)

$smoke = @()
foreach ($resource in @('/manifest.webmanifest', '/sw.js', '/api/v1/capabilities')) {
    try {
        $response = Read-PublicResponse ($newOrigin + $resource)
        $smoke += [pscustomobject]@{ path = $resource; status = [int]$response.StatusCode; contentType = [string]$response.Headers['Content-Type']; error = $null }
    } catch { $smoke += [pscustomobject]@{ path = $resource; status = $null; error = $_.Exception.Message } }
}
$oldAfter = (Read-PublicResponse "$oldOrigin/api/v1/health").Content | ConvertFrom-Json
$oldUnchanged = $oldBefore.version -eq '2.3.0' -and $oldAfter.version -eq $oldBefore.version -and $oldBefore.buildSha -eq 'eb2a6e7f76a6' -and $oldAfter.buildSha -eq $oldBefore.buildSha
$newExpected = $newHealth.version -eq '3.0.0' -and $newHealth.mode -eq 'local-learning' -and $newHealth.aiMode -eq 'local' -and $newHealth.buildSha -eq '9b61835b873a' -and $manifest.buildId -eq 'MT7REtpdsjw4wZzxLgBzF'
$failed = @($results | Where-Object { -not $_.passed }).Count
$report = [ordered]@{
    startedAtUtc = $startedAt
    completedAtUtc = [DateTimeOffset]::UtcNow.ToString('o')
    method = 'Anonymous HTTPS GET via PowerShell Invoke-WebRequest; no auth headers, cookies or learning writes.'
    newOrigin = $newOrigin
    oldOrigin = $oldOrigin
    oldBefore = $oldBefore
    oldAfter = $oldAfter
    oldUnchanged = $oldUnchanged
    newHealth = $newHealth
    newExpected = $newExpected
    buildId = $manifest.buildId
    shells = @($manifest.shells).Count
    assets = @($manifest.assets).Count
    categories = @($manifest.categories).Count
    checkedResources = $results.Count
    failedResources = $failed
    smoke = $smoke
    resources = $results
    limitations = @('HTTP artifact checks, not browser interaction or Service Worker installation tests.', 'No physical iPhone, microphone, keyboard, personal backup or carrier coverage test.')
}
$destination = [IO.Path]::GetFullPath($ReportPath)
[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($destination)) | Out-Null
$reportJson = ($report | ConvertTo-Json -Depth 10).Replace("`r`n", "`n") + "`n"
[IO.File]::WriteAllText($destination, $reportJson, [Text.UTF8Encoding]::new($false))
[pscustomobject]@{ report = $destination; oldUnchanged = $oldUnchanged; newExpected = $newExpected; checkedResources = $results.Count; failedResources = $failed; smoke = $smoke } | ConvertTo-Json -Depth 5
if (-not $oldUnchanged -or -not $newExpected -or $failed -gt 0 -or @($smoke | Where-Object { $_.status -ne 200 }).Count -gt 0) { exit 1 }
