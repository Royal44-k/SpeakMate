import {
  expect,
  type Page,
  type BrowserContext,
  type TestInfo,
} from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import type { DataState } from '../../src/infrastructure/persistence/storage'

export async function localState(page: Page): Promise<DataState> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('speakmate-v1')
      request.onupgradeneeded = () => {
        request.transaction?.abort()
        reject(new Error('Expected existing synthetic DB'))
      }
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
    try {
      const names = Array.from(db.objectStoreNames),
        tx = db.transaction(names, 'readonly')
      return Object.fromEntries(
        await Promise.all(
          names.map(
            (name) =>
              new Promise<[string, unknown[]]>((resolve, reject) => {
                const request = tx.objectStore(name).getAll()
                request.onsuccess = () => resolve([name, request.result])
                request.onerror = () => reject(request.error)
              }),
          ),
        ),
      ) as DataState
    } finally {
      db.close()
    }
  })
}
export async function protect(
  context: BrowserContext,
  origin: string,
  label = '',
) {
  context.setDefaultTimeout(10000)
  const requests: { method: string; url: string }[] = [],
    errors: string[] = []
  context.on('request', (request) =>
    requests.push({ method: request.method(), url: request.url() }),
  )
  context.on('page', (page) =>
    page.on('pageerror', (error) => errors.push(error.message)),
  )
  for (const page of context.pages())
    page.on('pageerror', (error) => errors.push(error.message))
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === origin
      ? route.continue()
      : route.abort(),
  )
  return async (info: TestInfo) => {
    await writeFile(
      info.outputPath(`${label}network.json`),
      JSON.stringify({ requests, errors }, null, 2),
    )
    expect(
      requests.filter(
        (request) =>
          !['GET', 'HEAD'].includes(request.method) ||
          new URL(request.url).origin !== origin,
      ),
    ).toEqual([])
    expect(errors).toEqual([])
  }
}
export async function onboard(page: Page, level = 'A2') {
  await page.goto('/welcome')
  await page.getByRole('button', { name: new RegExp(level) }).click()
  await page.getByRole('button', { name: '旅行', exact: true }).click()
  await page.getByRole('button', { name: '每天 5 分钟' }).click()
  await page
    .getByRole('button', { name: /^(开始第一次练习|保存设置)$/ })
    .click()
  await expect(page.getByRole('heading', { name: '今日目标' })).toBeVisible()
  // This helper's consumers cover notebook/history, not the separate first-use
  // registration timing matrix. Wait for actual native control, never stub it.
  await page.waitForFunction(
    () => !!navigator.serviceWorker.controller,
    undefined,
    { timeout: 30000 },
  )
}
export async function enterScene(page: Page, slug: string, level: string) {
  await page.goto(`/scenes/prepare?scene=${slug}&level=${level}&mode=short`)
  await page.getByRole('link', { name: '进入对话舞台' }).click()
  await expect(
    page.getByRole('heading', { name: 'Dialogue Stage' }),
  ).toBeVisible()
  await expect
    .poll(() => new URL(page.url()).searchParams.get('id'))
    .not.toBe('new')
  return new URL(page.url()).searchParams.get('id')!
}
export async function capture(
  page: Page,
  text: string,
  kind: 'word' | 'phrase' | 'sentence',
) {
  await page
    .getByRole('region', { name: '当前问题', exact: true })
    .getByRole('button', { name: '记录词句', exact: true })
    .last()
    .click()
  await page.getByRole('textbox', { name: '待存原文' }).fill(text)
  await page.getByRole('combobox', { name: /词句类型/ }).selectOption(kind)
  await page.getByRole('button', { name: '保存词句', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const note = (await localState(page)).notebook.find(
    (note) => note.text.toLowerCase() === text.toLowerCase(),
  )!
  expect(note).toBeTruthy()
  return note
}
export async function answer(page: Page) {
  await page.getByText('本题参考表达', { exact: true }).click()
  await page.getByRole('button', { name: '使用参考 1 并确认' }).click()
  const text = await page
    .getByRole('textbox', { name: '英文内容' })
    .inputValue()
  await page.getByRole('button', { name: '提交这一轮' }).click()
  await expect(page.getByRole('textbox', { name: '英文内容' })).toBeHidden()
  return text
}
