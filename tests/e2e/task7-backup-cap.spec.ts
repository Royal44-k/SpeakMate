import { expect, test } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import {
  onboard,
  enterScene,
  capture,
  localState,
  protect,
} from './task7-browser-helpers'

test('D: near-cap real export is complete and over-10MiB export fails explicitly without download or local truncation', async ({
  page,
  context,
  baseURL,
}, info) => {
  test.setTimeout(120000)
  const finishNetwork = await protect(context, baseURL!)
  await onboard(page)
  await enterScene(page, 'coffee-order', 'A2')
  const template = await capture(page, 'black', 'word')
  await page.getByRole('link', { name: '退出本次练习' }).click()
  await page.goto('/privacy')
  // Named synthetic capacity/failure fixture, not a pretend earned learning
  // story. Seed only this context's notebook with individually valid rows.
  async function add(start: number, end: number) {
    await page.evaluate(
      async ({ template, start, end }) => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const req = indexedDB.open('speakmate-v1')
          req.onsuccess = () => resolve(req.result)
          req.onerror = () => reject(req.error)
        })
        try {
          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction('notebook', 'readwrite')
            tx.oncomplete = () => resolve()
            tx.onabort = () => reject(tx.error)
            for (let i = start; i < end; i++)
              tx.objectStore('notebook').put({
                ...template,
                id: `capacity-note-${String(i).padStart(4, '0')}`,
                text: `synthetic capacity ${i}`,
                normalizedText: `synthetic capacity ${i}`,
                notes: 'x'.repeat(20000),
                favoriteIds: [],
              })
          })
        } finally {
          db.close()
        }
      },
      { template, start, end },
    )
  }
  await add(0, 480)
  const nearBefore = await localState(page)
  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出学习数据' }).click()
  const path = info.outputPath('actual-near-cap-backup.json')
  await (await downloading).saveAs(path)
  const bytes = await readFile(path),
    parsed = JSON.parse(bytes.toString())
  expect(bytes.byteLength).toBeGreaterThan(9 * 1024 * 1024)
  expect(bytes.byteLength).toBeLessThanOrEqual(10 * 1024 * 1024)
  expect(parsed.notebook).toEqual(nearBefore.notebook)
  expect(parsed.notebook).toHaveLength(481)
  await add(480, 550)
  const before = await localState(page)
  let downloads = 0
  page.on('download', () => downloads++)
  await page.getByRole('button', { name: '导出学习数据' }).click()
  await expect(
    page.getByRole('alert').filter({ hasText: /导出/ }),
  ).toBeVisible()
  expect(downloads).toBe(0)
  const after = await localState(page)
  expect(after).toEqual(before)
  expect(after.notebook).toHaveLength(551)
  await writeFile(
    info.outputPath('capacity-result.json'),
    JSON.stringify(
      {
        nearBytes: bytes.byteLength,
        nearNotes: parsed.notebook.length,
        overNotes: after.notebook.length,
        downloads,
        error: await page
          .getByRole('alert')
          .filter({ hasText: /导出/ })
          .innerText(),
      },
      null,
      2,
    ),
  )
  await finishNetwork(info)
})
