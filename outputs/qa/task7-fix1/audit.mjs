import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = 'outputs/qa/task7-fix1'
const files = (directory) => readdirSync(directory, { withFileTypes: true })
  .flatMap((entry) => entry.isDirectory()
    ? files(join(directory, entry.name)) : [join(directory, entry.name)])
const originals = files(root).filter((path) => /\.(json|png|md)$/.test(path)
  && !['README.md', 'evidence-index.json'].includes(path.split(/[\\/]/).at(-1))
  && !path.endsWith('.last-run.json')).sort()
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const selected = originals.map((path) => {
  const bytes = readFileSync(path)
  return { path: relative(root, path).replaceAll('\\', '/'), bytes: bytes.length, sha256: hash(bytes) }
})
const networks = selected.filter(({ path }) => path.startsWith('combined-') && path.endsWith('/network.json'))
  .map(({ path }) => {
    const value = JSON.parse(readFileSync(join(root, path), 'utf8'))
    assert(!Array.isArray(value) && Array.isArray(value.requests) && Array.isArray(value.errors), path)
    for (const request of value.requests) {
      assert(['GET', 'HEAD'].includes(request.method), path)
      assert.equal(new URL(request.url).origin, 'http://127.0.0.1:3130', path)
    }
    assert.deepEqual(value.errors, [], path)
    return { path, requests: value.requests.length, errors: value.errors }
  })
assert.equal(networks.length, 5)
const histories = selected.filter(({ path }) => path.startsWith('combined-') && path.endsWith('/source-phase-history.json'))
  .map(({ path }) => {
    const { reportUrl, backUrl, returnedUrl, listPosition, forwardPosition, contrast, reportAppearance } =
      JSON.parse(readFileSync(join(root, path), 'utf8'))
    assert.equal(backUrl, reportUrl)
    assert(listPosition > 300 && Math.abs(listPosition - forwardPosition) < 3)
    return { path, reportUrl, backUrl, returnedUrl, listPosition, forwardPosition, contrast, reportAppearance }
  })
assert.equal(histories.length, 2)
const buildId = readFileSync('.next/BUILD_ID', 'utf8').trim()
assert.equal(buildId, 'k0yzzgwBqGIzDUEhQ1m3Y')
const result = {
  fixBase: '6d8d9188ed09eb24cfb13adb4a86cd5b79a18ab8', buildId,
  offlineManifestSha256: hash(readFileSync('public/offline-build.js')),
  networks, requestCount: networks.reduce((sum, item) => sum + item.requests, 0),
  histories, selected,
}
writeFileSync(join(root, 'evidence-index.json'), JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ buildId, originals: selected.length, requestCount: result.requestCount, networks: networks.length, histories: histories.length }))
