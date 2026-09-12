import { expect, test, type Page } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import type { DataState } from '../../src/infrastructure/persistence/storage'
import { SCENE_METADATA } from '../../src/content/scenes/metadata'

async function state(page: Page): Promise<DataState> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('speakmate-v1')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
      request.onupgradeneeded = () => {
        request.transaction?.abort()
        reject(new Error('Expected existing fixture'))
      }
    })
    try {
      const names = Array.from(database.objectStoreNames)
      const transaction = database.transaction(names, 'readonly')
      return Object.fromEntries(
        await Promise.all(
          names.map(
            (name) =>
              new Promise<[string, unknown[]]>((resolve, reject) => {
                const request = transaction.objectStore(name).getAll()
                request.onsuccess = () => resolve([name, request.result])
                request.onerror = () => reject(request.error)
              }),
          ),
        ),
      ) as DataState
    } finally {
      database.close()
    }
  })
}

async function preview(page: Page, text: string) {
  await page
    .getByLabel('选择学习数据备份')
    .setInputFiles({
      name: 'synthetic.json',
      mimeType: 'application/json',
      buffer: Buffer.from(text),
    })
}

test('D: actual completed backup previews, cancels, restores twice and preserves note context/ledger through history delete and undo', async ({
  page,
}, info) => {
  test.setTimeout(120000)
  const source = await readFile(
    'outputs/qa/task7/core-online-green/synthetic-completed-backup.json',
    'utf8',
  )
  const incoming = JSON.parse(source)
  await page.goto('/privacy')
  await preview(page, source)
  await expect(page.getByRole('heading', { name: '恢复预览' })).toBeVisible()
  const empty = await state(page)
  expect(Object.values(empty).every((rows) => rows.length === 0)).toBe(true)
  await page.getByRole('button', { name: '取消恢复' }).click()
  expect(await state(page)).toEqual(empty)
  await preview(page, source)
  await page.getByRole('button', { name: '确认合并恢复' }).click()
  await expect(page.getByText(/恢复完成：/)).toBeVisible()
  const restored = await state(page)
  for (const [name, rows] of Object.entries(restored)) {
    expect(rows).toEqual(
      name === 'profile' || name === 'settings'
        ? incoming[name]
          ? [incoming[name]]
          : []
        : incoming[name],
    )
  }
  await page.reload()
  expect(await state(page)).toEqual(restored)
  await preview(page, source)
  await page.getByRole('button', { name: '确认合并恢复' }).click()
  await expect(page.getByText(/恢复完成：新增 0 条，更新 0 条/)).toBeVisible()
  expect(await state(page)).toEqual(restored)
  for (const invalid of ['{broken', ' '.repeat(10 * 1024 * 1024 + 1)]) {
    await preview(page, invalid)
    await expect(
      page.getByRole('alert').filter({ hasText: '恢复预览没有完成' }),
    ).toBeVisible()
    expect(await state(page)).toEqual(restored)
  }
  await preview(
    page,
    JSON.stringify({
      ...incoming,
      pointsLedger: [{ ...incoming.pointsLedger[0], delta: 999 }],
    }),
  )
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: 'IMMUTABLE_CONFLICT:pointsLedger' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: '确认合并恢复' }),
  ).toBeDisabled()
  expect(await state(page)).toEqual(restored)
  await page.getByRole('button', { name: '取消恢复' }).click()
  const selected = restored.sessions.find((session) => !session.simulation)!
  const deleteName = `删除此练习：${selected.sceneSnapshot?.titleZh ?? SCENE_METADATA.find((scene) => scene.id === selected.sceneId)!.titleZh}`
  await page.goto(`/session/report?id=${selected.id}`)
  await page
    .getByRole('button', { name: '记录词句', exact: true })
    .first()
    .click()
  const capturedText = await page
    .getByRole('textbox', { name: '待存原文' })
    .inputValue()
  await page.getByRole('button', { name: '保存词句', exact: true }).click()
  await expect(page.getByText('已记录', { exact: true })).toBeVisible()
  const captured = (await state(page)).notebook.find(
    (note) => note.text === capturedText,
  )!
  expect(captured.sources[0].sessionId).toBe(selected.id)
  await page.goto('/me')
  await page.getByRole('button', { name: deleteName }).click()
  const beforeDelete = await state(page)
  await page.getByRole('button', { name: '取消删除' }).click()
  expect(await state(page)).toEqual(beforeDelete)
  await page.getByRole('button', { name: deleteName }).click()
  await page.getByRole('button', { name: '确认删除这条历史' }).click()
  await expect(page.getByText(/这条历史已删除/)).toBeVisible()
  const deleted = await state(page)
  expect(deleted.sessions.some((row) => row.id === selected.id)).toBe(false)
  expect(deleted.turns.some((row) => row.sessionId === selected.id)).toBe(false)
  for (const name of [
    'notebook',
    'learningEvents',
    'pointsLedger',
    'dailyPlans',
    'favorites',
  ] as const)
    expect(deleted[name]).toEqual(beforeDelete[name])
  await page.getByRole('button', { name: '撤销本次删除' }).click()
  await expect(page.getByText(/本次历史已恢复/)).toBeVisible()
  expect(await state(page)).toEqual(beforeDelete)
  await page.getByRole('button', { name: deleteName }).click()
  await page.getByRole('button', { name: '确认删除这条历史' }).click()
  await expect(page.getByText(/这条历史已删除/)).toBeVisible()
  await page.goto(`/notebook/note?id=${captured.id}`)
  await expect(page.getByText('原练习已删除', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('heading', { level: 1, name: capturedText }),
  ).toBeVisible()
  await page.goto('/privacy')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出学习数据' }).click()
  const download = await downloadPromise
  await download.saveAs(info.outputPath('after-source-delete.json'))
  const exported = JSON.parse(
    await readFile(info.outputPath('after-source-delete.json'), 'utf8'),
  )
  expect(exported.notebook).toEqual(deleted.notebook)
  expect(
    exported.pointsLedger.reduce(
      (sum: number, row: { delta: number }) => sum + row.delta,
      0,
    ),
  ).toBe(35)
  await writeFile(
    info.outputPath('retained-state.json'),
    JSON.stringify(await state(page), null, 2),
  )
})
