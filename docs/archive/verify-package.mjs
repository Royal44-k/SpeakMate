import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const manifestPath = 'docs/archive/file-manifest.json'
const hash = data => createHash('sha256').update(data).digest('hex')
function safePath(name) {
  const full = path.resolve(root, name)
  if (!full.startsWith(root + path.sep) || name.includes('\\')) throw new Error(`Unsafe manifest path: ${name}`)
  return full
}
if (process.argv.includes('--write')) {
  // Maintainers only: stage intended files first. This never adds or commits.
  const files = execFileSync('git', ['-C', root, 'ls-files', '-z']).toString().split('\0').filter(x => x && x !== manifestPath).sort()
  const entries = files.map(name => {
    const data = readFileSync(safePath(name))
    return { path: name, bytes: data.length, sha256: hash(data) }
  })
  writeFileSync(path.join(root, manifestPath), JSON.stringify({ schemaVersion: 1, date: '2026-09-13', algorithm: 'SHA256', excludes: [manifestPath], files: entries }, null, 2) + '\n')
}
const manifest = JSON.parse(readFileSync(path.join(root, manifestPath), 'utf8'))
if (manifest.schemaVersion !== 1 || manifest.algorithm !== 'SHA256') throw new Error('Unknown manifest format')
const seen = new Set()
const failures = []
for (const entry of manifest.files) {
  const file = safePath(entry.path)
  if (seen.has(entry.path)) throw new Error('Duplicate manifest entry')
  seen.add(entry.path)
  if (!existsSync(file)) { failures.push({ path: entry.path, error: 'missing' }); continue }
  const bytes = readFileSync(file)
  if (bytes.length !== entry.bytes || hash(bytes) !== entry.sha256) failures.push({ path: entry.path, error: 'hash/size mismatch' })
}
console.log(JSON.stringify({ files: manifest.files.length, bytes: manifest.files.reduce((n, x) => n + x.bytes, 0), failures }, null, 2))
if (failures.length) process.exitCode = 1
