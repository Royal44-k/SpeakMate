# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-notebook-native.spec.ts >> F/H: canonical two-source note, source A2 vs current B2, five-question real simulation and phase-owned stale recall; native source return
- Location: tests\e2e\task7-notebook-native.spec.ts:5:1

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: '进入对话舞台' })

```

# Page snapshot

```yaml
- generic [ref=f2e1]:
  - article [ref=f2e2]:
    - generic [ref=f2e3]:
      - link "返回场景库" [ref=f2e4] [cursor=pointer]:
        - /url: /scenes?level=A2
      - generic [ref=f2e7]:
        - paragraph [ref=f2e8]: SCENE BRIEF
        - heading "向老师提问" [active] [level=1] [ref=f2e9]
    - generic [ref=f2e10]:
      - img "学生课后向老师提问" [ref=f2e12]
      - generic [ref=f2e13]:
        - generic [ref=f2e14]: STUDY
        - generic [ref=f2e15]: A2
    - generic [ref=f2e16]:
      - paragraph [ref=f2e17]: Asking a teacher
      - heading "向老师提问" [level=2] [ref=f2e18]
      - generic [ref=f2e19]: 约 3–5 分钟 · 约 3 轮
    - paragraph [ref=f2e22]: 向老师 Lee 演练澄清文字材料和提出问题。
    - group "选择练习长度" [ref=f2e23]:
      - generic [ref=f2e25] [cursor=pointer]:
        - radio "简短 · 约 3 轮 约 3–5 分钟" [checked] [ref=f2e26]
        - generic [ref=f2e27]: 简短 · 约 3 轮约 3–5 分钟
      - generic [ref=f2e28] [cursor=pointer]:
        - radio "标准 · 约 6 轮 约 5–8 分钟" [ref=f2e29]
        - generic [ref=f2e30]: 标准 · 约 6 轮约 5–8 分钟
      - generic [ref=f2e31] [cursor=pointer]:
        - radio "深入 · 约 10 轮 约 8–12 分钟" [ref=f2e32]
        - generic [ref=f2e33]: 深入 · 约 10 轮约 8–12 分钟
    - status [ref=f2e34]: 页面离线准备尚未确认。 此分类离线缓存尚未确认。 缓存可能被浏览器清理；已保存的对话快照与公开分类下载分别管理。
    - alert [ref=f2e35]:
      - paragraph [ref=f2e36]: 此分类下载或读取失败，未替换为其他语料。已保存的练习仍可用原快照恢复。公开语料验证尚未完成。请使用 HTTPS（或本机 localhost）并允许 Service Worker；Safari 请检查网站限制。可返回今日练习，完成并关闭其他窗口后更新，再回来重试。已保存的练习与备份仍可读取。
      - button "重试下载此分类" [ref=f2e37] [cursor=pointer]
      - link "返回今日练习检查更新" [ref=f2e38] [cursor=pointer]:
        - /url: /practice
  - alert [ref=f2e39]
  - status [ref=f2e40]: 向老师提问
```

# Test source

```ts
  1  | import { expect, type Page, type BrowserContext, type TestInfo } from '@playwright/test'
  2  | import { writeFile } from 'node:fs/promises'
  3  | import type { DataState } from '../../src/infrastructure/persistence/storage'
  4  | 
  5  | export async function localState(page: Page): Promise<DataState> {
  6  |   return page.evaluate(async () => {
  7  |     const db = await new Promise<IDBDatabase>((resolve, reject) => {
  8  |       const request = indexedDB.open('speakmate-v1')
  9  |       request.onupgradeneeded = () => { request.transaction?.abort(); reject(new Error('Expected existing synthetic DB')) }
  10 |       request.onerror = () => reject(request.error)
  11 |       request.onsuccess = () => resolve(request.result)
  12 |     })
  13 |     try {
  14 |       const names = Array.from(db.objectStoreNames), tx = db.transaction(names, 'readonly')
  15 |       return Object.fromEntries(await Promise.all(names.map(name => new Promise<[string, unknown[]]>((resolve, reject) => {
  16 |         const request = tx.objectStore(name).getAll()
  17 |         request.onsuccess = () => resolve([name, request.result])
  18 |         request.onerror = () => reject(request.error)
  19 |       })))) as DataState
  20 |     } finally { db.close() }
  21 |   })
  22 | }
  23 | export async function protect(context: BrowserContext, origin: string) {
  24 |   context.setDefaultTimeout(10000)
  25 |   const requests: { method: string; url: string }[] = [], errors: string[] = []
  26 |   context.on('request', request => requests.push({ method: request.method(), url: request.url() }))
  27 |   context.on('page', page => page.on('pageerror', error => errors.push(error.message)))
  28 |   for (const page of context.pages()) page.on('pageerror', error => errors.push(error.message))
  29 |   await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort())
  30 |   return async (info: TestInfo) => {
  31 |     await writeFile(info.outputPath('network.json'), JSON.stringify({ requests, errors }, null, 2))
  32 |     expect(requests.filter(request => !['GET', 'HEAD'].includes(request.method) || new URL(request.url).origin !== origin)).toEqual([])
  33 |     expect(errors).toEqual([])
  34 |   }
  35 | }
  36 | export async function onboard(page: Page, level = 'A2') {
  37 |   await page.goto('/welcome')
  38 |   await page.getByRole('button', { name: new RegExp(level) }).click()
  39 |   await page.getByRole('button', { name: '旅行', exact: true }).click()
  40 |   await page.getByRole('button', { name: '每天 5 分钟' }).click()
  41 |   await page.getByRole('button', { name: /^(开始第一次练习|保存设置)$/ }).click()
  42 |   await expect(page.getByRole('heading', { name: '今日目标' })).toBeVisible()
  43 | }
  44 | export async function enterScene(page: Page, slug: string, level: string) {
  45 |   await page.goto(`/scenes/prepare?scene=${slug}&level=${level}&mode=short`)
> 46 |   await page.getByRole('link', { name: '进入对话舞台' }).click()
     |                                                    ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  47 |   await expect(page.getByRole('heading', { name: 'Dialogue Stage' })).toBeVisible()
  48 |   await expect.poll(() => new URL(page.url()).searchParams.get('id')).not.toBe('new')
  49 |   return new URL(page.url()).searchParams.get('id')!
  50 | }
  51 | export async function capture(page: Page, text: string, kind: 'word' | 'phrase' | 'sentence') {
  52 |   await page.getByRole('region', { name: '当前问题', exact: true }).getByRole('button', { name: '记录词句', exact: true }).last().click()
  53 |   await page.getByRole('textbox', { name: '待存原文' }).fill(text)
  54 |   await page.getByRole('combobox', { name: /词句类型/ }).selectOption(kind)
  55 |   await page.getByRole('button', { name: '保存词句', exact: true }).click()
  56 |   await expect(page.getByRole('dialog')).toHaveCount(0)
  57 |   const note = (await localState(page)).notebook.find(note => note.text.toLowerCase() === text.toLowerCase())!
  58 |   expect(note).toBeTruthy()
  59 |   return note
  60 | }
  61 | export async function answer(page: Page) {
  62 |   await page.getByText('本题参考表达', { exact: true }).click()
  63 |   await page.getByRole('button', { name: '使用参考 1 并确认' }).click()
  64 |   const text = await page.getByRole('textbox', { name: '英文内容' }).inputValue()
  65 |   await page.getByRole('button', { name: '提交这一轮' }).click()
  66 |   await expect(page.getByRole('textbox', { name: '英文内容' })).toBeHidden()
  67 |   return text
  68 | }
  69 | 
```