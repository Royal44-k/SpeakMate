# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: final-fix.spec.ts >> consecutive reviewed round, contextual bookmark preview/undo, and notebook source
- Location: tests\e2e\final-fix.spec.ts:5:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3130/welcome
Call log:
  - navigating to "http://127.0.0.1:3130/welcome", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "嗯… 无法访问此页面" [level=1] [ref=e7]
    - paragraph [ref=e8]:
      - strong [ref=e9]: 127.0.0.1
      - text: 拒绝连接。
    - generic [ref=e10]:
      - paragraph [ref=e11]: 请尝试：
      - list [ref=e12]:
        - listitem [ref=e13]: •检查连接
        - listitem [ref=e14]:
          - text: •
          - link "检查代理和防火墙" [ref=e15] [cursor=pointer]:
            - /url: "#buttons"
    - generic [ref=e16]: ERR_CONNECTION_REFUSED
  - button "刷新" [ref=e19] [cursor=pointer]
```

# Test source

```ts
  1   | import {
  2   |   expect,
  3   |   type Page,
  4   |   type BrowserContext,
  5   |   type TestInfo,
  6   | } from '@playwright/test'
  7   | import { writeFile } from 'node:fs/promises'
  8   | import type { DataState } from '../../src/infrastructure/persistence/storage'
  9   | 
  10  | export async function localState(page: Page): Promise<DataState> {
  11  |   return page.evaluate(async () => {
  12  |     const db = await new Promise<IDBDatabase>((resolve, reject) => {
  13  |       const request = indexedDB.open('speakmate-v1')
  14  |       request.onupgradeneeded = () => {
  15  |         request.transaction?.abort()
  16  |         reject(new Error('Expected existing synthetic DB'))
  17  |       }
  18  |       request.onerror = () => reject(request.error)
  19  |       request.onsuccess = () => resolve(request.result)
  20  |     })
  21  |     try {
  22  |       const names = Array.from(db.objectStoreNames),
  23  |         tx = db.transaction(names, 'readonly')
  24  |       return Object.fromEntries(
  25  |         await Promise.all(
  26  |           names.map(
  27  |             (name) =>
  28  |               new Promise<[string, unknown[]]>((resolve, reject) => {
  29  |                 const request = tx.objectStore(name).getAll()
  30  |                 request.onsuccess = () => resolve([name, request.result])
  31  |                 request.onerror = () => reject(request.error)
  32  |               }),
  33  |           ),
  34  |         ),
  35  |       ) as DataState
  36  |     } finally {
  37  |       db.close()
  38  |     }
  39  |   })
  40  | }
  41  | export async function protect(
  42  |   context: BrowserContext,
  43  |   origin: string,
  44  |   label = '',
  45  | ) {
  46  |   context.setDefaultTimeout(10000)
  47  |   const requests: { method: string; url: string }[] = [],
  48  |     errors: string[] = []
  49  |   context.on('request', (request) =>
  50  |     requests.push({ method: request.method(), url: request.url() }),
  51  |   )
  52  |   context.on('page', (page) =>
  53  |     page.on('pageerror', (error) => errors.push(error.message)),
  54  |   )
  55  |   for (const page of context.pages())
  56  |     page.on('pageerror', (error) => errors.push(error.message))
  57  |   await context.route('**/*', (route) =>
  58  |     new URL(route.request().url()).origin === origin
  59  |       ? route.continue()
  60  |       : route.abort(),
  61  |   )
  62  |   return async (info: TestInfo) => {
  63  |     await writeFile(
  64  |       info.outputPath(`${label}network.json`),
  65  |       JSON.stringify({ requests, errors }, null, 2),
  66  |     )
  67  |     expect(
  68  |       requests.filter(
  69  |         (request) =>
  70  |           !['GET', 'HEAD'].includes(request.method) ||
  71  |           new URL(request.url).origin !== origin,
  72  |       ),
  73  |     ).toEqual([])
  74  |     expect(errors).toEqual([])
  75  |   }
  76  | }
  77  | export async function onboard(page: Page, level = 'A2') {
> 78  |   await page.goto('/welcome')
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3130/welcome
  79  |   await page.getByRole('button', { name: new RegExp(level) }).click()
  80  |   await page.getByRole('button', { name: '旅行', exact: true }).click()
  81  |   await page.getByRole('button', { name: '每天 5 分钟' }).click()
  82  |   await page
  83  |     .getByRole('button', { name: /^(开始第一次练习|保存设置)$/ })
  84  |     .click()
  85  |   await expect(page.getByRole('heading', { name: '今日目标' })).toBeVisible()
  86  |   // This helper's consumers cover notebook/history, not the separate first-use
  87  |   // registration timing matrix. Wait for actual native control, never stub it.
  88  |   await page.waitForFunction(
  89  |     () => !!navigator.serviceWorker.controller,
  90  |     undefined,
  91  |     { timeout: 30000 },
  92  |   )
  93  | }
  94  | export async function enterScene(page: Page, slug: string, level: string) {
  95  |   await page.goto(`/scenes/prepare?scene=${slug}&level=${level}&mode=short`)
  96  |   await page.getByRole('link', { name: '进入对话舞台' }).click()
  97  |   await expect(
  98  |     page.getByRole('heading', { name: 'Dialogue Stage' }),
  99  |   ).toBeVisible()
  100 |   await expect
  101 |     .poll(() => new URL(page.url()).searchParams.get('id'))
  102 |     .not.toBe('new')
  103 |   return new URL(page.url()).searchParams.get('id')!
  104 | }
  105 | export async function capture(
  106 |   page: Page,
  107 |   text: string,
  108 |   kind: 'word' | 'phrase' | 'sentence',
  109 | ) {
  110 |   await page
  111 |     .getByRole('region', { name: '当前问题', exact: true })
  112 |     .getByRole('button', { name: '记录词句', exact: true })
  113 |     .last()
  114 |     .click()
  115 |   await page.getByRole('textbox', { name: '待存原文' }).fill(text)
  116 |   await page.getByRole('combobox', { name: /词句类型/ }).selectOption(kind)
  117 |   await page.getByRole('button', { name: '保存词句', exact: true }).click()
  118 |   await expect(page.getByRole('dialog')).toHaveCount(0)
  119 |   const note = (await localState(page)).notebook.find(
  120 |     (note) => note.text.toLowerCase() === text.toLowerCase(),
  121 |   )!
  122 |   expect(note).toBeTruthy()
  123 |   return note
  124 | }
  125 | export async function answer(page: Page) {
  126 |   await page.getByText('本题参考表达', { exact: true }).click()
  127 |   await page.getByRole('button', { name: '使用参考 1 并确认' }).click()
  128 |   const text = await page
  129 |     .getByRole('textbox', { name: '英文内容' })
  130 |     .inputValue()
  131 |   await page.getByRole('button', { name: '提交这一轮' }).click()
  132 |   await expect(page.getByRole('textbox', { name: '英文内容' })).toBeHidden()
  133 |   return text
  134 | }
  135 | 
```