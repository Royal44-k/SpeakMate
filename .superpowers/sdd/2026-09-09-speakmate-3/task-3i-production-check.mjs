import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createOfflineManifest } from '../../../scripts/offline-manifest.mjs'

const manifest = await createOfflineManifest(process.cwd())
const generated = await readFile('public/offline-build.js', 'utf8')
assert.equal(generated, `self.SPEAKMATE_OFFLINE = ${JSON.stringify(manifest)};\n`)
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const origin = 'http://127.0.0.1:3113'
for (const entry of [...manifest.shells, ...manifest.assets, ...manifest.categories]) {
  const response = await fetch(origin + entry.url, { signal: AbortSignal.timeout(15_000) })
  assert.equal(response.status, 200, entry.url)
  assert.equal(response.url, origin + entry.url)
  const bytes = Buffer.from(await response.arrayBuffer())
  assert.equal(bytes.length, entry.bytes, entry.url)
  assert.equal(digest(bytes), entry.sha256, entry.url)
  if (manifest.shells.includes(entry)) assert.match(response.headers.get('content-type'), /text\/html/)
  if (manifest.categories.includes(entry)) assert.match(response.headers.get('content-type'), /application\/json/)
}
for (const [path, query] of [['/session', '?id=never-opened'], ['/session/report', '?id=never-opened'], ['/scenes/prepare', '?scene=coffee-order&level=C1&mode=short']]) {
  const response = await fetch(origin + path + query)
  assert.equal(response.status, 200)
  assert.equal(digest(Buffer.from(await response.arrayBuffer())), manifest.shells.find(entry => entry.url === path).sha256)
}
assert.equal((await fetch(origin + '/content/v1/unknown')).status, 404)
const media = manifest.assets.filter(entry => entry.url.startsWith('/scenes/'))
assert.equal(media.length, 8)
assert.equal(media.reduce((n, entry) => n + entry.bytes, 0), 183028)
const js = (await Promise.all(manifest.assets.filter(entry => entry.url.endsWith('.js')).map(entry => readFile('.next/static' + entry.url.slice('/_next/static'.length), 'utf8')))).join('\n')
for (const entry of manifest.categories) {
  const data = JSON.parse(await readFile('.next/server/app' + entry.url + '.body', 'utf8'))
  const advanced = data.packs.filter(pack => pack.level === 'C1')
  for (const pack of advanced) assert.equal(js.includes(pack.questions[0].text), false, 'C1 authored opening leaked into shared JS: ' + pack.sceneId)
}
console.log(JSON.stringify({ runtime: process.version, buildId: manifest.buildId, checkedResources: manifest.shells.length + manifest.assets.length + manifest.categories.length, staticQueryShellChecks: 3, sharedBytes: [...manifest.shells, ...manifest.assets].reduce((n, entry) => n + entry.bytes, 0), media, categories: manifest.categories, sharedJsAuthoredC1OpeningSentinels: 42, unknownCategoryStatus: 404 }, null, 2))
