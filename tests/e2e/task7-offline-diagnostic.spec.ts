import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'

test('diagnostic: verified public shell navigation under browser offline control', async ({
  page,
  context,
}, info) => {
  test.setTimeout(45000)
  const observations: Record<string, unknown> = {}
  await page.goto('/install')
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  await page.reload()
  observations.online = await page.evaluate(async () => {
    const response = await caches.match('/install')
    return {
      controller: navigator.serviceWorker.controller?.scriptURL,
      status: response?.status,
      type: response?.type,
      url: response?.url,
      bytes: (await response?.clone().arrayBuffer())?.byteLength,
      headers: response && Object.fromEntries(response.headers),
    }
  })
  await context.setOffline(true)
  observations.offlineCache = await page.evaluate(async () => ({
    online: navigator.onLine,
    bytes: (await (await caches.match('/install'))?.arrayBuffer())?.byteLength,
  }))
  let failure: unknown
  try {
    await page.reload({ waitUntil: 'domcontentloaded' })
    observations.offlineNavigation = {
      url: page.url(),
      heading: await page.locator('h1').textContent(),
    }
  } catch (error) {
    failure = error
    observations.offlineNavigation = { error: String(error) }
  }
  await context.setOffline(false)
  await page.goto('/install')
  observations.restored = await page.locator('h1').textContent()
  await writeFile(
    info.outputPath('offline-navigation-diagnostic.json'),
    JSON.stringify(observations, null, 2),
  )
  expect(failure).toBeUndefined()
})
