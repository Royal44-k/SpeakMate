import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'

const SHELLS = [
  '/',
  '/install',
  '/scenes',
  '/practice',
  '/me',
  '/privacy',
  '/session',
  '/session/report',
  '/scenes/prepare',
  '/notebook',
  '/notebook/note',
  '/notebook/simulation',
  '/rewards',
  '/guide',
  '/welcome',
  '/auth',
]
const CATEGORIES = [
  'travel',
  'dining',
  'daily',
  'work',
  'social',
  'study',
  'emergency',
]

/** Next 16.3.4 output boundary: public .body routes and .next/static only. */
export async function createOfflineManifest(root) {
  const build = join(root, '.next')
  const buildId = (await readFile(join(build, 'BUILD_ID'), 'utf8')).trim()
  if (!/^[\w-]{1,100}$/.test(buildId))
    throw new Error('Invalid production BUILD_ID')
  async function entry(url, path) {
    const bytes = await readFile(path)
    if (!bytes.length || bytes.length >= 20_000_000)
      throw new Error(`Invalid public artifact size: ${url}`)
    return {
      url,
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    }
  }
  async function inventory(directory, prefix) {
    const output = []
    for (const item of (await readdir(directory, { withFileTypes: true })).sort(
      (a, b) => a.name.localeCompare(b.name, 'en'),
    )) {
      const path = join(directory, item.name)
      const url = `${prefix}/${item.name}`
      if (item.isSymbolicLink())
        throw new Error(`Unsupported public artifact symlink: ${url}`)
      if (item.isDirectory()) output.push(...(await inventory(path, url)))
      else if (
        /\.(js|css|woff2?|ttf|otf|png|svg|webp|avif|jpg|jpeg|ico)$/.test(
          item.name,
        )
      )
        output.push(await entry(url, path))
      else if (!item.name.endsWith('.map'))
        throw new Error(`Unsupported public artifact: ${url}`)
    }
    return output
  }
  const shells = await Promise.all(
    SHELLS.map((url) =>
      entry(
        url,
        join(
          build,
          'server/app',
          url === '/' ? 'index.html' : `${url.slice(1)}.html`,
        ),
      ),
    ),
  )
  const sceneMedia = await Promise.all(
    [...CATEGORIES, 'hotel'].map((name) =>
      entry(
        `/scenes/${name}.webp`,
        join(root, 'public/scenes', `${name}.webp`),
      ),
    ),
  )
  const assets = [
    ...(await inventory(join(build, 'static'), '/_next/static')),
    ...(await inventory(join(root, 'public/icons'), '/icons')),
    ...sceneMedia,
  ]
  if (
    !assets.some((item) => item.url.endsWith('.js')) ||
    !assets.some((item) => item.url.endsWith('.css')) ||
    !assets.some((item) => item.url.endsWith('.woff2'))
  )
    throw new Error('Missing production script/style/font artifacts')
  const categories = await Promise.all(
    CATEGORIES.map(async (category) => {
      const path = join(build, 'server/app/content/v1', `${category}.body`)
      const data = JSON.parse(await readFile(path, 'utf8'))
      const meta = JSON.parse(
        await readFile(path.replace(/\.body$/, '.meta'), 'utf8'),
      )
      if (
        data.schemaVersion !== 1 ||
        data.contentVersion !== 1 ||
        data.category !== category ||
        data.packs?.length !== 30 ||
        !meta.headers?.['content-type']?.includes('application/json')
      )
        throw new Error(`Unsupported static category output: ${category}`)
      return entry(`/content/v1/${category}`, path)
    }),
  )
  return { schemaVersion: 1, buildId, shells, assets, categories }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const root = process.cwd()
  const manifest = await createOfflineManifest(root)
  await writeFile(
    join(root, 'public/offline-build.js'),
    `self.SPEAKMATE_OFFLINE = ${JSON.stringify(manifest)};\n`,
  )
  console.log(
    JSON.stringify(
      {
        buildId: manifest.buildId,
        shells: manifest.shells.length,
        assets: manifest.assets.length,
        sharedBytes: [...manifest.shells, ...manifest.assets].reduce(
          (sum, item) => sum + item.bytes,
          0,
        ),
        categories: manifest.categories.map(({ url, bytes }) => ({
          url,
          bytes,
        })),
      },
      null,
      2,
    ),
  )
}
