// Read-only evidence audit; writes only its derived Task7 QA inventories.
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import vm from 'node:vm'
import assert from 'node:assert/strict'

const root = 'outputs/qa/task7'
const groups = [
  'final-chromium',
  'final-webkit',
  'final-recovery-webkit',
  'final-webkit-server-down',
  'final-pwa-webkit',
  'final-communication-03',
  'fh-complete-01',
  'native-scroll-04',
  'coverage-02',
  'simulation-return-01',
  'phase-01',
  'cache-privacy-02',
  'controller-fault-04',
  'category-fault-02',
  'update-capture-06',
  'legacy-micro-03',
  'retained-05',
  'cap-legacy-red',
  'legacy-offline-final',
  'in2-fh',
  'terminal-red',
  'notebook-03',
  'webkit-offline-red',
]
const files = [],
  network = []
function parseNetwork(data, path) {
  const requestOnly = Array.isArray(data)
  assert.ok(
    requestOnly ||
      (data && Array.isArray(data.requests) && Array.isArray(data.errors)),
    `Unknown network evidence structure: ${path}`,
  )
  const requests = requestOnly ? data : data.requests
  assert.ok(
    requests.every(
      (row) =>
        row && typeof row.method === 'string' && typeof row.url === 'string',
    ),
    `Invalid request record: ${path}`,
  )
  return { requests, errors: requestOnly ? null : data.errors }
}
// Guard the two actual producer formats and reject missing evidence, not empty it.
assert.deepEqual(parseNetwork([], 'array'), { requests: [], errors: null })
assert.deepEqual(parseNetwork({ requests: [], errors: [] }, 'object'), {
  requests: [],
  errors: [],
})
assert.throws(() => parseNetwork({}, 'unknown'))
assert.throws(() => parseNetwork({ requests: [] }, 'missing-errors'))
assert.throws(() => parseNetwork([{}], 'bad-request'))
for (const group of groups) {
  async function visit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const path = join(dir, entry.name).replaceAll('\\', '/')
      if (entry.isDirectory()) {
        await visit(path)
        continue
      }
      if (!/\.(json|png|md|log)$/.test(path)) continue
      const bytes = await readFile(path)
      files.push({
        path,
        bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
        selectedForGit: bytes.length <= 1_000_000,
      })
      if (path.endsWith('network.json')) {
        const data = JSON.parse(bytes)
        const { requests, errors } = parseNetwork(data, path)
        const invalid = requests.filter(
          (row) =>
            !['GET', 'HEAD'].includes(row.method) ||
            !/^http:\/\/127\.0\.0\.1:313[0-5](\/|$)/.test(row.url),
        )
        assert.equal(invalid.length, 0, path)
        if (errors !== null) assert.deepEqual(errors, [], path)
        network.push({
          path,
          requests: requests.length,
          invalid: invalid.length,
          errors,
          pageErrorEvidence:
            errors === null
              ? 'Not serialized: task7-learning.spec.ts asserts its pageerror list before writing this request-only array.'
              : 'Serialized errors array checked.',
        })
      }
    }
  }
  await visit(join(root, group))
}
const unit = JSON.parse(await readFile(join(root, 'final-unit-results.json')))
const failed = unit.testResults.flatMap((file) =>
  file.assertionResults
    .filter((test) => test.status === 'failed')
    .map((test) => ({
      file: file.name,
      title: test.fullName,
      failure: test.failureMessages,
    })),
)
assert.equal(unit.numTotalTests, 6409)
assert.equal(failed.length, 1)
const manifestSource = await readFile('public/offline-build.js', 'utf8')
const sandbox = { self: {} }
vm.runInNewContext(manifestSource, sandbox)
const manifest = sandbox.self.SPEAKMATE_OFFLINE
const build = (await readFile('.next/BUILD_ID', 'utf8')).trim()
assert.equal(manifest.buildId, build)
assert.equal(manifest.shells.length, 16)
assert.equal(manifest.assets.length, 70)
const summary = {
  normalBuild: build,
  recoveryBuild: (await readFile('.next-recovery/BUILD_ID', 'utf8')).trim(),
  manifestSha256: createHash('sha256').update(manifestSource).digest('hex'),
  shellCount: manifest.shells.length,
  assetCount: manifest.assets.length,
  sharedBytes: [...manifest.shells, ...manifest.assets].reduce(
    (sum, entry) => sum + entry.bytes,
    0,
  ),
  categoryBytes: manifest.categories.reduce(
    (sum, entry) => sum + entry.bytes,
    0,
  ),
  unit: {
    total: unit.numTotalTests,
    passed: unit.numPassedTests,
    failed: unit.numFailedTests,
    pending: unit.numPendingTests,
    fileCountFromStdout: 104,
    started: new Date(unit.startTime).toISOString(),
    durationSecondsFromStdout: 203.56,
    failedAssertions: failed,
    correction:
      'Only obsolete accessible-name expectation updated; full scene-library file 25PASS/25.29s. No second full-suite run per controller.',
  },
  network,
  inventory: {
    count: files.length,
    bytes: files.reduce((sum, file) => sum + file.bytes, 0),
    selectedCount: files.filter((file) => file.selectedForGit).length,
    selectedBytes: files
      .filter((file) => file.selectedForGit)
      .reduce((sum, file) => sum + file.bytes, 0),
  },
}
await writeFile(
  join(root, 'selected-artifacts.json'),
  JSON.stringify(files, null, 2),
)
await writeFile(
  join(root, 'verification-summary.json'),
  JSON.stringify(summary, null, 2),
)
console.log(
  JSON.stringify(
    {
      ...summary,
      network: {
        files: network.length,
        requests: network.reduce((sum, value) => sum + value.requests, 0),
        invalid: 0,
        serializedPageErrorFiles: network.filter(
          (value) => value.errors !== null,
        ).length,
        requestOnlyFiles: network.filter((value) => value.errors === null)
          .length,
      },
      unit: {
        ...summary.unit,
        failedAssertions: failed.map((test) => test.title),
      },
    },
    null,
    2,
  ),
)
