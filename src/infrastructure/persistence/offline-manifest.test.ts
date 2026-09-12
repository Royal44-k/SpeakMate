import { describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createOfflineManifest } from '../../../scripts/offline-manifest.mjs'

describe('installed production offline artifact binding', () => {
  it('inventories the installed output layout without publishing server code or maps', async () => {
    const fixture = await mkdtemp(join(tmpdir(), 'speakmate-manifest-test-'))
    const put = async (path: string, text: string) => {
      const target = join(fixture, path)
      await mkdir(join(target, '..'), { recursive: true })
      await writeFile(target, text)
    }
    try {
      await put('.next/BUILD_ID', 'fixture-build')
      for (const name of [
        'index',
        'install',
        'scenes',
        'practice',
        'me',
        'privacy',
        'session',
        'session/report',
        'scenes/prepare',
        'notebook',
        'notebook/note',
        'notebook/simulation',
        'rewards',
        'guide',
        'welcome',
        'auth',
      ])
        await put(`.next/server/app/${name}.html`, '<html>shell</html>')
      for (const name of [
        'main.js',
        'style.css',
        'font.woff2',
        'private.js.map',
      ])
        await put(`.next/static/${name}`, 'public')
      await put('public/icons/app.svg', '<svg/>')
      for (const category of [
        'travel',
        'dining',
        'daily',
        'work',
        'social',
        'study',
        'emergency',
        'hotel',
      ])
        await put(`public/scenes/${category}.webp`, `image-${category}`)
      for (const category of [
        'travel',
        'dining',
        'daily',
        'work',
        'social',
        'study',
        'emergency',
      ]) {
        await put(
          `.next/server/app/content/v1/${category}.body`,
          JSON.stringify({
            schemaVersion: 1,
            contentVersion: 1,
            category,
            packs: Array(30).fill({}),
          }),
        )
        await put(
          `.next/server/app/content/v1/${category}.meta`,
          JSON.stringify({ headers: { 'content-type': 'application/json' } }),
        )
      }
      const manifest = await createOfflineManifest(fixture)
      expect(manifest.shells.map((entry: { url: string }) => entry.url)).not.toContain('/recovery')
      expect(manifest.buildId).toMatch(/^[\w-]+$/)
      expect(
        manifest.shells.map((entry: { url: string }) => entry.url),
      ).toEqual(
        expect.arrayContaining([
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
        ]),
      )
      expect(
        manifest.assets.some((entry: { url: string }) =>
          entry.url.endsWith('.woff2'),
        ),
      ).toBe(true)
      expect(manifest.categories).toHaveLength(7)
      expect(
        manifest.assets.filter((entry: { url: string }) =>
          entry.url.startsWith('/scenes/'),
        ),
      ).toHaveLength(8)
      expect(JSON.stringify(manifest)).not.toMatch(/\.map|route\.js|server\//)
      expect(
        manifest.categories.every(
          (entry: { bytes: number; sha256: string }) =>
            entry.bytes > 0 && /^[a-f0-9]{64}$/.test(entry.sha256),
        ),
      ).toBe(true)
    } finally {
      await rm(fixture, { recursive: true, force: true })
    }
  })
  it('fails closed when the production output does not exist', async () => {
    await expect(
      createOfflineManifest('/missing-production-output'),
    ).rejects.toThrow()
  })
})
