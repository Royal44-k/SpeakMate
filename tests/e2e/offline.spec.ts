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
    if (!navigator.serviceWorker.controller) window.location.reload()
  })
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))

  await context.setOffline(true)
  await page.goto('/install', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: /装到主屏幕/ })).toBeVisible()
  await context.setOffline(false)
})
