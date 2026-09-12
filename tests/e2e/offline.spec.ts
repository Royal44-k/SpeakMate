import { expect, test } from '@playwright/test'
import vm from 'node:vm'
import { createHash } from 'node:crypto'

test('current build prepares exact privacy-safe shells while categories stay separate', async ({
  request,
  page,
}) => {
  const response = await request.get('/offline-build.js')
  expect(response.ok()).toBe(true)
  const sandbox = {
    self: {} as {
      SPEAKMATE_OFFLINE?: {
        schemaVersion: number
        buildId: string
        shells: { url: string; sha256: string }[]
      }
    },
  }
  vm.runInNewContext(await response.text(), sandbox)
  const manifest = sandbox.self.SPEAKMATE_OFFLINE!
  expect(manifest.schemaVersion).toBe(1)
  const paths = manifest.shells.map((shell) => shell.url)
  for (const path of [
    '/',
    '/install',
    '/scenes',
    '/session',
    '/session/report',
    '/notebook',
    '/notebook/note',
    '/notebook/simulation',
  ])
    expect(paths).toContain(path)
  expect(paths).not.toContain('/recovery')
  for (const shell of manifest.shells) {
    const actual = await request.get(shell.url)
    expect(actual.status()).toBe(200)
    expect(actual.headers()['content-type']).toContain('text/html')
    expect(
      createHash('sha256')
        .update(await actual.body())
        .digest('hex'),
    ).toBe(shell.sha256)
  }
  await page.goto('/install')
  await page.waitForFunction(
    () => !!navigator.serviceWorker.controller,
    undefined,
    { timeout: 20000 },
  )
  const status = await page.evaluate(
    () =>
      new Promise<{
        buildId: string
        shellReady: boolean
        categories: Record<string, boolean>
      }>((resolve, reject) => {
        const worker = navigator.serviceWorker.controller!
        const timeout = setTimeout(
          () => reject(new Error('Offline readiness response missing')),
          5000,
        )
        const receive = (event: MessageEvent) => {
          if (
            event.source === worker &&
            event.data?.type === 'OFFLINE_STATUS'
          ) {
            clearTimeout(timeout)
            navigator.serviceWorker.removeEventListener('message', receive)
            resolve(event.data)
          }
        }
        navigator.serviceWorker.addEventListener('message', receive)
        worker.postMessage({ type: 'OFFLINE_STATUS' })
      }),
  )
  expect(status.buildId).toBe(manifest.buildId)
  expect(status.shellReady).toBe(true)
  expect(Object.values(status.categories)).toEqual(Array(7).fill(false))
})

test('installed public shell remains available after the network goes offline', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Offline service-worker verification runs in the Chromium production target.',
  )
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  if (
    !(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
  ) {
    await page.reload()
  }
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  await page.goto('/install')
  await expect(
    page.getByRole('heading', { level: 1, name: '安装到手机' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { level: 2, name: '把练习放到主屏幕' }),
  ).toBeVisible()
  expect(
    await page.evaluate(async () => Boolean(await caches.match('/install'))),
  ).toBe(true)

  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(
    page.getByRole('heading', { level: 1, name: '安装到手机' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { level: 2, name: '把练习放到主屏幕' }),
  ).toBeVisible()
  await context.setOffline(false)
})

test('visited scene library and local session shell recover offline', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Offline service-worker verification runs in the Chromium production target.',
  )
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))))
    await page.reload()
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))

  await page.goto('/scenes')
  await expect(page.locator('h1')).toContainText('把英语练进生活里')
  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator('h1')).toContainText('把英语练进生活里')

  await context.setOffline(false)
  await page.goto('/session/new?scene=hotel-check-in&level=B1')
  await expect(page.getByRole('group', { name: '当前应答问题' })).toBeVisible()
  await page.waitForFunction(() => {
    const id = new URL(location.href).searchParams.get('id')
    return !!id && id !== 'new'
  })
  const sessionId = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('speakmate-v1')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const sessions = await new Promise<Array<{ id: string }>>(
      (resolve, reject) => {
        const request = database
          .transaction('sessions', 'readonly')
          .objectStore('sessions')
          .getAll()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      },
    )
    database.close()
    return sessions[0]?.id
  })
  expect(sessionId).toBeTruthy()
  await page.goto(`/session/${sessionId}`)
  await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  const privateSessionUrl = page.url()
  expect(
    await page.evaluate(
      async (url) => Boolean(await caches.match(url)),
      privateSessionUrl,
    ),
  ).toBe(false)
  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(
    page.getByRole('heading', { name: 'Dialogue Stage' }),
  ).toBeVisible()
  expect(page.url()).toBe(privateSessionUrl)
  await context.setOffline(false)
})
