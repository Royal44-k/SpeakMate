import { expect, test } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import vm from 'node:vm'
import {
  onboard,
  enterScene,
  capture,
  localState,
  protect,
} from './task7-browser-helpers'

test('SW/privacy: private searches stay local; corrupt/uncached categories fail offline while pinned records and exact shells/fonts/images remain available', async ({
  page,
  context,
  baseURL,
}, info) => {
  test.setTimeout(120000)
  const finishNetwork = await protect(context, baseURL!)
  const urls: string[] = []
  context.on('request', (request) => urls.push(request.url()))
  const sandbox = {
    self: {} as {
      SPEAKMATE_OFFLINE?: {
        buildId: string
        shells: { url: string; sha256: string }[]
        assets: { url: string; sha256: string }[]
      }
    },
  }
  vm.runInNewContext(await readFile('public/offline-build.js', 'utf8'), sandbox)
  const manifest = sandbox.self.SPEAKMATE_OFFLINE!
  await onboard(page)
  const id = await enterScene(page, 'coffee-order', 'A2')
  const note = await capture(page, 'black', 'word')
  await page.getByRole('link', { name: '退出本次练习' }).click()
  await page.goto('/scenes')
  const sceneSearch = page.getByRole('searchbox', { name: '搜索场景' })
  const sceneSecret = 'synthetic-private-scene-8264'
  await sceneSearch.fill(sceneSecret)
  await sceneSearch.press('Enter')
  await page.getByRole('button', { name: '搜索', exact: true }).click()
  expect(page.url()).not.toContain(sceneSecret)
  await page.getByRole('button', { name: '清空搜索', exact: true }).click()
  await sceneSearch.fill('咖啡')
  await sceneSearch.press('Enter')
  const card = page.getByRole('link', { name: '准备练习：咖啡点单' })
  await expect(card).toHaveCount(1)
  expect((await card.getAttribute('href'))!).not.toMatch(/q=|%E5%92%96/)
  await card.click()
  await page.getByRole('link', { name: '返回场景库' }).click()
  await expect(sceneSearch).toHaveValue('咖啡')
  await page.goto('/notebook')
  const noteSecret = 'synthetic-private-notebook-4682'
  const noteSearch = page.getByRole('textbox', { name: '搜索词句与备注' })
  await noteSearch.fill(noteSecret)
  await noteSearch.press('Enter')
  expect(page.url()).not.toContain(noteSecret)
  await noteSearch.fill('black')
  await page.getByRole('link', { name: '查看词句', exact: true }).click()
  expect(page.url()).not.toMatch(/q=|synthetic-private/)
  await page.getByRole('link', { name: '返回记录簿', exact: true }).click()
  await expect(noteSearch).toHaveValue('black')
  const legacySecret = 'synthetic-legacy-private-7531'
  const beforeLegacy = urls.length
  await page.goto(`/scenes?q=${legacySecret}`)
  await expect(sceneSearch).toHaveValue(legacySecret)
  await page.getByRole('button', { name: '清空搜索', exact: true }).click()
  await page.getByRole('link', { name: '准备练习：咖啡点单' }).click()
  expect(
    urls.slice(beforeLegacy).filter((url) => url.includes(legacySecret)),
  ).toHaveLength(1)
  expect(
    urls.some((url) => url.includes(sceneSecret) || url.includes(noteSecret)),
  ).toBe(false)
  const before = await localState(page)
  await page.evaluate(async (build) => {
    const cache = await caches.open(`speakmate-build-v1-${build}`)
    await cache.put(
      '/content/v1/dining',
      new Response('{"corrupt":true}', {
        headers: { 'content-type': 'application/json' },
      }),
    )
  }, manifest.buildId)
  await context.setOffline(true)
  const resources = await page.evaluate(
    async (assets) =>
      Promise.all(
        assets.map(async (entry) => {
          const response = await fetch(entry.url),
            bytes = await response.arrayBuffer()
          const sha256 = Array.from(
            new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
            (b) => b.toString(16).padStart(2, '0'),
          ).join('')
          return {
            url: entry.url,
            status: response.status,
            sha256,
            expected: entry.sha256,
          }
        }),
      ),
    manifest.assets,
  )
  for (const resource of resources) {
    expect(resource.status).toBe(200)
    expect(resource.sha256).toBe(resource.expected)
  }
  const rejected = await page.evaluate(async () => {
    const results = []
    for (const path of ['/content/v1/dining', '/content/v1/work']) {
      const r = await fetch(path)
      results.push({ path, status: r.status, text: await r.text() })
    }
    for (const [path, headers] of [
      ['/session/report?id=unknown&_rsc=privacy-probe', {}],
      ['/notebook/note?id=unknown', { RSC: '1' }],
      ['/session?id=unknown', { 'Next-Router-Prefetch': '1' }],
    ] as [string, Record<string, string>][]) {
      try {
        const r = await fetch(path, { headers })
        results.push({ path, status: r.status, text: await r.text() })
      } catch {
        results.push({ path, status: 0, text: 'network rejected' })
      }
    }
    return results
  })
  expect(rejected.slice(0, 2).map((row) => row.status)).toEqual([503, 503])
  for (const row of rejected.slice(2)) {
    expect(row.status).toBe(0)
    expect(row.text).not.toMatch(/<html/i)
  }
  await page.goto(`/session?id=${id}`)
  await expect(page.getByRole('group', { name: '当前应答问题' })).toBeVisible()
  const pinned = (await localState(page)).sessions.find(
    (session) => session.id === id,
  )!
  expect(pinned).toEqual(before.sessions.find((session) => session.id === id))
  const image = page
    .getByRole('region', { name: '当前练习场景' })
    .locator('img')
  expect(
    await image.evaluate(
      (element) =>
        (element as HTMLImageElement).complete &&
        (element as HTMLImageElement).naturalWidth > 0,
    ),
  ).toBe(true)
  const imageEvidence = await image.evaluate((element) => ({
    src: (element as HTMLImageElement).currentSrc,
    alt: element.getAttribute('alt'),
  }))
  expect(imageEvidence.src).toContain('/scenes/dining.webp')
  await page.goto('/scenes/prepare?scene=coffee-order&level=A2&mode=short')
  await expect(page.getByText(/公开语料验证尚未完成/)).toBeVisible()
  await expect(page.getByRole('link', { name: '进入对话舞台' })).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: '重试下载此分类' }),
  ).toBeVisible()
  expect((await localState(page)).sessions).toEqual(before.sessions)
  const shellEvidence = []
  for (const entry of manifest.shells) {
    const response = await page.goto(entry.url)
    expect(response!.status()).toBe(200)
    const body = await response!.body()
    const { createHash } = await import('node:crypto')
    const sha256 = createHash('sha256').update(body).digest('hex')
    expect(sha256).toBe(entry.sha256)
    shellEvidence.push({ path: entry.url, sha256 })
  }
  await context.setOffline(false)
  await page.goto(`/notebook/note?id=${note.id}`)
  await expect(page.getByText('本语境完整匹配', { exact: true })).toBeVisible()
  expect((await localState(page)).notebook).toEqual(before.notebook)
  await writeFile(
    info.outputPath('cache-privacy.json'),
    JSON.stringify(
      {
        buildId: manifest.buildId,
        resources,
        rejected,
        shellEvidence,
        imageEvidence,
        urls,
        before,
      },
      null,
      2,
    ),
  )
  await finishNetwork(info)
})
