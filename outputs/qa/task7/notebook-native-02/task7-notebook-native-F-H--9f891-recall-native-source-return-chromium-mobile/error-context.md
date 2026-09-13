# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-notebook-native.spec.ts >> F/H: canonical two-source note, source A2 vs current B2, five-question real simulation and phase-owned stale recall; native source return
- Location: tests\e2e\task7-notebook-native.spec.ts:5:1

# Error details

```
TimeoutError: locator.selectOption: Timeout 10000ms exceeded.
Call log:
  - waiting for getByLabel('词句类型', { exact: true })

```

# Page snapshot

```yaml
- generic [ref=f3e1]:
  - alert [ref=f3e2]
  - main [ref=f3e3]:
    - generic [ref=f3e4]:
      - link "退出本次练习" [ref=f3e5] [cursor=pointer]:
        - /url: /scenes?level=A2
      - generic [ref=f3e8]:
        - paragraph [ref=f3e9]: SpeakMate
        - heading "Dialogue Stage" [level=1] [ref=f3e10]
        - generic [ref=f3e11]: 情境演练 · 向老师提问
      - generic [ref=f3e12]:
        - strong [ref=f3e13]: 0 / 3
        - generic [ref=f3e14]: A2 · 已提交轮次
    - region "当前练习场景" [ref=f3e15]:
      - img "学生课后向老师提问" [ref=f3e17]
    - region "完整情境与材料" [ref=f3e18]:
      - heading "老师 Lee" [level=2] [ref=f3e19]
      - paragraph [ref=f3e20]: 这是已编写的课堂角色与回应演练（A2）；部分问题是在排练如何回应，并非角色逐字发言。完整文字材料在情境说明中；文字提到图表、图片或口头指令，不表示本页已提供对应图像或音频。
      - paragraph [ref=f3e21]: 虚构课堂，老师 Lee 与你看一张小练习纸，内容全部在题目中给出。桌上有铅笔、蓝笔和写着 apple / book 的图卡。Lee 已说：“Circle one word, then write a sentence.” 这是真正可请求重说的已给指令；尚未解释答案、批改或答应课后帮助。每道题引入自己的小例子，不要求外部课程知识。
      - paragraph [ref=f3e22]: 帮助和改答也占用轮次；还可提交 3 轮。到上限可能仍有目标未确认，可结束后开启新一轮，不代表练习失败。
    - region "当前问题" [ref=f3e23]:
      - generic [ref=f3e24]:
        - generic [ref=f3e25]: 本地编写的情境问答
        - button "播放本地助手回复" [ref=f3e26] [cursor=pointer]
      - group "当前应答问题" [ref=f3e29]:
        - generic [ref=f3e30]:
          - paragraph [ref=f3e31]: What would you like help with on this sheet?
          - button "记录词句" [ref=f3e32] [cursor=pointer]
      - paragraph [ref=f3e33]: 指出一个需要帮助的环节。
    - group [ref=f3e34]:
      - generic "本题参考表达" [ref=f3e35] [cursor=pointer]
    - region "帮助与调整" [ref=f3e36]:
      - button "请再解释一下" [disabled] [ref=f3e37]
      - button "我需要表达提示" [disabled] [ref=f3e38]
      - button "帮我回到当前问题" [disabled] [ref=f3e39]
    - button "停止本次练习" [disabled] [ref=f3e40]
    - region "语音输入" [ref=f3e42]:
      - generic [ref=f3e43]:
        - button "开始录音" [ref=f3e48] [cursor=pointer]:
          - generic [ref=f3e51]: 按住说英语
        - generic [ref=f3e55]: 最长 30 秒 · 录音不会保存
        - button "改用键盘输入" [ref=f3e56] [cursor=pointer]:
          - strong [ref=f3e59]: 键盘输入
  - status [ref=f3e60]: 正在准备对话舞台…
  - dialog [ref=f3e61]:
    - heading "记录词句预览" [level=2] [ref=f3e62]
    - paragraph [ref=f3e63]: 来源：study-02 · A2 · ask-teacher.A2.focus
    - generic [ref=f3e64]:
      - text: 待存原文
      - textbox "待存原文" [active] [ref=f3e65]: for example
    - generic [ref=f3e66]:
      - text: 词句类型
      - combobox "词句类型" [ref=f3e67]:
        - option "单词"
        - option "短语"
        - option "整句" [selected]
    - generic [ref=f3e68]:
      - button "选词" [ref=f3e69] [cursor=pointer]
      - button "使用整句" [ref=f3e70] [cursor=pointer]
    - generic [ref=f3e71]:
      - button "取消" [ref=f3e72] [cursor=pointer]
      - button "保存词句" [ref=f3e73] [cursor=pointer]
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
  46 |   await page.getByRole('link', { name: '进入对话舞台' }).click()
  47 |   await expect(page.getByRole('heading', { name: 'Dialogue Stage' })).toBeVisible()
  48 |   await expect.poll(() => new URL(page.url()).searchParams.get('id')).not.toBe('new')
  49 |   return new URL(page.url()).searchParams.get('id')!
  50 | }
  51 | export async function capture(page: Page, text: string, kind: 'word' | 'phrase' | 'sentence') {
  52 |   await page.getByRole('region', { name: '当前问题', exact: true }).getByRole('button', { name: '记录词句', exact: true }).last().click()
  53 |   await page.getByRole('textbox', { name: '待存原文' }).fill(text)
> 54 |   await page.getByLabel('词句类型', { exact: true }).selectOption(kind)
     |                                                  ^ TimeoutError: locator.selectOption: Timeout 10000ms exceeded.
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