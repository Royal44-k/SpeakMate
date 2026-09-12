# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: final-fix.spec.ts >> consecutive reviewed round, contextual bookmark preview/undo, and notebook source
- Location: tests\e2e\final-fix.spec.ts:11:1

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '使用参考 1 并确认' })

```

# Page snapshot

```yaml
- generic [active] [ref=f3e1]:
  - alert [ref=f3e2]
  - main [ref=f3e3]:
    - generic [ref=f3e4]:
      - link "退出本次练习" [ref=f3e5]:
        - /url: /scenes?level=C1
      - generic [ref=f3e8]:
        - paragraph [ref=f3e9]: SpeakMate
        - heading "Dialogue Stage" [level=1] [ref=f3e10]
        - generic [ref=f3e11]: 情境演练 · 咖啡点单
      - generic [ref=f3e12]:
        - strong [ref=f3e13]: 2 / 3
        - generic [ref=f3e14]: C1 · 已提交轮次
    - region "当前练习场景" [ref=f3e15]:
      - img "自然光咖啡店吧台和咖啡师" [ref=f3e17]
    - region "完整情境与材料" [ref=f3e18]:
      - heading "咖啡师角色" [level=2] [ref=f3e19]
      - paragraph [ref=f3e20]: 这是已编写的本地角色与回应演练，不是实时人员服务。请先阅读所选情境；问题可能包含排练提示，所有交易、安排与材料只属于练习。
      - paragraph [ref=f3e21]: 现场点单：美式和滴滤均有货，默认热饮、不加奶不加糖。短练确认饮品、杯型及堂食/外带；标准练加个性化和支付方式；拓展再确定收据、取餐称呼、降温及点心。只是练习，不代表真实支付或出单。
      - paragraph [ref=f3e22]: 帮助和改答也占用轮次；还可提交 1 轮。到上限可能仍有目标未确认，可结束后开启新一轮，不代表练习失败。
    - status [ref=f3e23]: 本地朗读暂时不可用，请直接阅读文字继续练习。
    - group [ref=f3e24]:
      - generic "本轮对话记录（2 轮）" [ref=f3e25] [cursor=pointer]
    - region "当前问题" [ref=f3e26]:
      - generic [ref=f3e27]:
        - generic [ref=f3e28]: 本地编写的情境问答
        - button "播放本地助手回复" [ref=f3e29] [cursor=pointer]
      - group "当前应答问题" [ref=f3e32]:
        - generic [ref=f3e33]:
          - paragraph [ref=f3e34]: There is space to sit in, although I cannot promise it will remain quiet. Would staying or taking it away suit you better?
          - button "记录词句" [ref=f3e35] [cursor=pointer]
      - paragraph [ref=f3e36]: 不把当前空位误解为未来安静保证。
    - group [ref=f3e37]:
      - generic "本题参考表达" [ref=f3e38] [cursor=pointer]
    - region "本轮表达反馈" [ref=f3e40]:
      - button "已匹配本地参考表达 本地收录范围有限，不作全面正确性评估" [ref=f3e41] [cursor=pointer]:
        - generic [ref=f3e45]:
          - strong [ref=f3e46]: 已匹配本地参考表达
          - generic [ref=f3e47]: 本地收录范围有限，不作全面正确性评估
    - region "帮助与调整" [ref=f3e50]:
      - button "请再解释一下" [ref=f3e51] [cursor=pointer]
      - button "我需要表达提示" [ref=f3e52] [cursor=pointer]
      - button "帮我回到当前问题" [ref=f3e53] [cursor=pointer]
      - button "修改第 1 轮已确认回答" [ref=f3e54] [cursor=pointer]
      - button "修改第 2 轮已确认回答" [ref=f3e55] [cursor=pointer]
    - button "停止本次练习" [ref=f3e56] [cursor=pointer]
    - region "语音输入" [ref=f3e58]:
      - generic [ref=f3e59]:
        - button "开始录音" [ref=f3e64] [cursor=pointer]:
          - generic [ref=f3e67]: 按住说英语
        - generic [ref=f3e71]: 最长 30 秒 · 录音不会保存
        - button "改用键盘输入" [ref=f3e72] [cursor=pointer]:
          - strong [ref=f3e75]: 键盘输入
  - status [ref=f3e76]: 正在准备对话舞台…
```

# Test source

```ts
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
  78  |   await page.goto('/welcome')
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
> 127 |   await page.getByRole('button', { name: '使用参考 1 并确认' }).click()
      |                                                          ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  128 |   const text = await page
  129 |     .getByRole('textbox', { name: '英文内容' })
  130 |     .inputValue()
  131 |   await page.getByRole('button', { name: '提交这一轮' }).click()
  132 |   await expect(page.getByRole('textbox', { name: '英文内容' })).toBeHidden()
  133 |   return text
  134 | }
  135 | 
```