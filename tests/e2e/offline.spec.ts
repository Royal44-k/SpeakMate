import { expect, test } from '@playwright/test'

test('service worker shell contains the privacy-safe offline routes', async ({ request }) => {
  const response = await request.get('/sw.js')
  const source = await response.text()
  expect(source).toContain("['/', '/install', '/manifest.webmanifest']")
  expect(source).toContain("url.pathname.startsWith('/api/')")
  expect(source).toContain("request.destination === 'audio'")
  expect(source).toContain("event.data?.type === 'SKIP_WAITING'")
  expect(source).toContain('3_000')
})

test('installed public shell remains available after the network goes offline', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Offline service-worker verification runs in the Chromium production target.')
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  if (!await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) {
    await page.reload()
  }
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  await page.goto('/install')
  await expect(page.locator('h1')).toContainText('把练习放到主屏幕')
  expect(await page.evaluate(async () => Boolean(await caches.match('/install')))).toBe(true)

  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator('h1')).toContainText('把练习放到主屏幕')
  await context.setOffline(false)
})
