import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
const root = 'outputs/qa/final-fix'
const sha = (file) =>
  createHash('sha256').update(readFileSync(file)).digest('hex')
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name).replaceAll('\\', '/')
    return entry.isDirectory() ? files(path) : [path]
  })
}
const selected = files(root).filter(
  (path) =>
    /\.(json|png|md|mjs)$/.test(path) &&
    !path.endsWith('/evidence-index.json') &&
    !path.endsWith('/README.md') &&
    !path.endsWith('/.last-run.json'),
)
const networks = selected
  .filter(
    (path) => path.includes('/source-ready/') && path.endsWith('/network.json'),
  )
  .map((path) => {
    const { requests, errors } = JSON.parse(readFileSync(path, 'utf8'))
    const unexpected = requests.filter(
      (request) =>
        !['GET', 'HEAD'].includes(request.method) ||
        new URL(request.url).origin !== 'http://127.0.0.1:3130',
    )
    if (errors.length || unexpected.length)
      throw new Error(`Network audit failed: ${path}`)
    return { path, requests: requests.length, errors, unexpected }
  })
const result = {
  generatedAt: new Date().toISOString(),
  runtime: process.version,
  fixBase: 'd73b698c3ea8a352c2561ee7c2148134453a14b1',
  buildId: readFileSync('.next/BUILD_ID', 'utf8').trim(),
  recoveryBuildId: readFileSync('.next-recovery/BUILD_ID', 'utf8').trim(),
  manifestSha256: sha('public/offline-build.js'),
  networks,
  originals: selected.map((path) => ({
    path,
    bytes: readFileSync(path).length,
    sha256: sha(path),
  })),
}
writeFileSync(
  `${root}/evidence-index.json`,
  JSON.stringify(result, null, 2) + '\n',
)
console.log(
  JSON.stringify({ ...result, originals: result.originals.length }, null, 2),
)
