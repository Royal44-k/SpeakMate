import { expect, test } from '@playwright/test'
import vm from 'node:vm'

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
  const installed = await manifest.json()
  expect(installed).toMatchObject({
    display: 'standalone',
    start_url: '/',
    scope: '/',
  })
  expect(installed.shortcuts.map((item: { url: string }) => item.url)).toEqual([
    '/practice/today',
    '/scenes',
  ])
  const health = await request.get('/api/v1/health')
  expect(await health.json()).toMatchObject({
    version: '3.0.0',
    mode: 'local-learning',
  })

  const serviceWorker = await request.get('/sw.js')
  expect(serviceWorker.ok()).toBe(true)
  const build = await request.get('/offline-build.js')
  const sandbox = { self: {} as { SPEAKMATE_OFFLINE?: { buildId: string } } }
  vm.runInNewContext(await build.text(), sandbox)
  await page.waitForFunction(
    () => !!navigator.serviceWorker.controller,
    undefined,
    { timeout: 20000 },
  )
  const nativeBuild = await page.evaluate(
    () =>
      new Promise<string>((resolve, reject) => {
        const worker = navigator.serviceWorker.controller!
        const timeout = setTimeout(
          () => reject(new Error('Actual controller did not identify build')),
          5000,
        )
        const receive = (event: MessageEvent) => {
          if (event.source === worker && event.data?.type === 'BUILD_ID') {
            clearTimeout(timeout)
            navigator.serviceWorker.removeEventListener('message', receive)
            resolve(event.data.buildId)
          }
        }
        navigator.serviceWorker.addEventListener('message', receive)
        worker.postMessage({ type: 'GET_BUILD_ID' })
      }),
  )
  expect(nativeBuild).toBe(sandbox.self.SPEAKMATE_OFFLINE!.buildId)
})

test('shows iPhone add-to-home-screen instructions', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'webkit', 'iPhone guidance is validated in WebKit')
  await page.goto('/install')
  const instructions = page.getByRole('tabpanel', { name: 'iPhone' })
  await expect(instructions.getByRole('listitem')).toHaveCount(3)
  await expect(instructions.getByText(/打开 Safari 的共享菜单/)).toBeVisible()
  await expect(instructions.getByText(/选择“添加到主屏幕”/)).toBeVisible()
  await expect(instructions.getByText(/作为网页 App 打开/)).toBeVisible()
})
