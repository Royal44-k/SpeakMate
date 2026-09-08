import { expect, test } from '@playwright/test'

test('publishes an installable manifest and service worker', async ({
  page,
  request,
}) => {
  await page.goto('/')
  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .getAttribute('href')
  expect(manifestHref).toBe('/manifest.webmanifest')

  const manifest = await request.get('/manifest.webmanifest')
  expect(manifest.ok()).toBe(true)
  expect((await manifest.json()).display).toBe('standalone')

  const serviceWorker = await request.get('/sw.js')
  expect(serviceWorker.ok()).toBe(true)
  expect(await serviceWorker.text()).toContain('speakmate-v2.2.0-shell-r1')
})

test('shows iPhone add-to-home-screen instructions', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'webkit', 'iPhone guidance is validated in WebKit')
  await page.goto('/install')
  await expect(page.getByText('打开 Safari 的分享菜单')).toBeVisible()
  await expect(page.getByText('选择“添加到主屏幕”')).toBeVisible()
})
