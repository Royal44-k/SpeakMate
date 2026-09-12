# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-settlement-browser.spec.ts >> E: UI-earned points, same/different reward races and actual 100/200/300 applications
- Location: tests\e2e\task7-settlement-browser.spec.ts:573:1

# Error details

```
Test timeout of 300000ms exceeded.
```

```
Error: locator.click: Test timeout of 300000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '隐藏参考，开始回忆' })

```

# Test source

```ts
  49  |         try {
  50  |           return (await (await fetch(`${origin}/api/v1/health`)).json()).mode
  51  |         } catch {
  52  |           return 'not-ready'
  53  |         }
  54  |       },
  55  |       { timeout: 30000 },
  56  |     )
  57  |     .toBe('local-learning')
  58  | })
  59  | test.afterAll(async ({}, info) => {
  60  |   const owned = server
  61  |   server = undefined
  62  |   if (owned && owned.exitCode === null)
  63  |     await new Promise<void>((resolve) => {
  64  |       owned.once('exit', () => resolve())
  65  |       owned.kill('SIGTERM')
  66  |     })
  67  |   await writeFile(info.outputPath('owned-server.log'), serverOutput.join(''))
  68  | })
  69  | 
  70  | async function state(page: Page): Promise<DataState> {
  71  |   return page.evaluate(async () => {
  72  |     const db = await new Promise<IDBDatabase>((resolve, reject) => {
  73  |       const request = indexedDB.open('speakmate-v1')
  74  |       request.onupgradeneeded = () => {
  75  |         request.transaction?.abort()
  76  |         reject(new Error('Expected existing synthetic DB'))
  77  |       }
  78  |       request.onerror = () => reject(request.error)
  79  |       request.onsuccess = () => resolve(request.result)
  80  |     })
  81  |     try {
  82  |       const names = Array.from(db.objectStoreNames)
  83  |       const tx = db.transaction(names, 'readonly')
  84  |       return Object.fromEntries(
  85  |         await Promise.all(
  86  |           names.map(
  87  |             (name) =>
  88  |               new Promise<[string, unknown[]]>((resolve, reject) => {
  89  |                 const request = tx.objectStore(name).getAll()
  90  |                 request.onsuccess = () => resolve([name, request.result])
  91  |                 request.onerror = () => reject(request.error)
  92  |               }),
  93  |           ),
  94  |         ),
  95  |       ) as DataState
  96  |     } finally {
  97  |       db.close()
  98  |     }
  99  |   })
  100 | }
  101 | const points = (data: DataState) =>
  102 |   data.pointsLedger.reduce((sum, row) => sum + row.delta, 0)
  103 | const earned = (data: DataState) =>
  104 |   data.pointsLedger.reduce((sum, row) => sum + Math.max(0, row.delta), 0)
  105 | 
  106 | async function protect(context: BrowserContext, origin: string) {
  107 |   const network: { method: string; url: string }[] = []
  108 |   const errors: string[] = []
  109 |   context.on('request', (request) =>
  110 |     network.push({ method: request.method(), url: request.url() }),
  111 |   )
  112 |   context.on('page', (page) =>
  113 |     page.on('pageerror', (error) => errors.push(error.message)),
  114 |   )
  115 |   for (const page of context.pages())
  116 |     page.on('pageerror', (error) => errors.push(error.message))
  117 |   await context.route('**/*', (route) =>
  118 |     new URL(route.request().url()).origin === origin
  119 |       ? route.continue()
  120 |       : route.abort(),
  121 |   )
  122 |   return async (info: TestInfo, label: string) => {
  123 |     await writeFile(
  124 |       info.outputPath(`${label}-network.json`),
  125 |       JSON.stringify({ network, errors }, null, 2),
  126 |     )
  127 |     expect(
  128 |       network.filter(
  129 |         (row) =>
  130 |           !['GET', 'HEAD'].includes(row.method) ||
  131 |           new URL(row.url).origin !== origin,
  132 |       ),
  133 |     ).toEqual([])
  134 |     expect(errors).toEqual([])
  135 |   }
  136 | }
  137 | async function onboard(page: Page) {
  138 |   await page.goto('/welcome')
  139 |   await page.getByRole('button', { name: /A2/ }).click()
  140 |   await page.getByRole('button', { name: '旅行', exact: true }).click()
  141 |   await page.getByRole('button', { name: '每天 5 分钟' }).click()
  142 |   await page
  143 |     .getByRole('button', { name: '开始第一次练习', exact: true })
  144 |     .click()
  145 |   await expect(page.getByRole('heading', { name: '今日目标' })).toBeVisible()
  146 | }
  147 | async function warmup(page: Page) {
  148 |   await page.getByRole('button', { name: '准备表达热身' }).click()
> 149 |   await page.getByRole('button', { name: '隐藏参考，开始回忆' }).click()
      |                                                         ^ Error: locator.click: Test timeout of 300000ms exceeded.
  150 |   await page
  151 |     .getByRole('textbox', { name: '我的回忆', exact: true })
  152 |     .fill('I remember a useful expression.')
  153 |   await page.getByRole('button', { name: '确认完成热身' }).click()
  154 |   await expect(page.getByText('热身已完成，已保存这次回忆。')).toBeVisible()
  155 | }
  156 | async function answer(page: Page) {
  157 |   await page.getByText('本题参考表达', { exact: true }).click()
  158 |   await page.getByRole('button', { name: '使用参考 1 并确认' }).click()
  159 |   await expect(page.getByRole('textbox', { name: '英文内容' })).not.toHaveValue(
  160 |     '',
  161 |   )
  162 |   await page.getByRole('button', { name: '提交这一轮' }).click()
  163 |   await expect(page.getByRole('textbox', { name: '英文内容' })).toBeHidden()
  164 | }
  165 | async function reachTerminal(page: Page) {
  166 |   await expect(
  167 |     page.getByRole('heading', { name: 'Dialogue Stage' }),
  168 |   ).toBeVisible()
  169 |   const id = new URL(page.url()).searchParams.get('id')!
  170 |   expect(id).not.toBe('new')
  171 |   await answer(page)
  172 |   const data = await state(page)
  173 |   const session = data.sessions.find((row) => row.id === id)!
  174 |   const provenance = session.provenance!
  175 |   const target = data.dailyPlans
  176 |     .find((plan) => plan.id === provenance.planId)!
  177 |     .tasks.find((task) => task.id === provenance.sourceTaskId)!.target
  178 |   if (target.kind !== 'scene' && target.kind !== 'simulation')
  179 |     throw new Error('Expected actual bound target')
  180 |   for (let turn = 1; turn < target.requiredUserTurns; turn++) {
  181 |     await page.getByRole('button', { name: '我需要表达提示' }).click()
  182 |     await expect
  183 |       .poll(
  184 |         async () =>
  185 |           (await state(page)).turns.filter((row) => row.sessionId === id)
  186 |             .length,
  187 |       )
  188 |       .toBe(turn + 1)
  189 |   }
  190 |   await expect(page.getByRole('button', { name: finishLabel })).toBeVisible()
  191 |   return id
  192 | }
  193 | async function finish(page: Page) {
  194 |   await page.getByRole('button', { name: finishLabel }).click()
  195 |   await expect(
  196 |     page.getByRole('heading', { name: '这轮已保存。' }),
  197 |   ).toBeVisible()
  198 | }
  199 | async function download(page: Page, info: TestInfo, name: string) {
  200 |   await page.goto('/privacy')
  201 |   const downloading = page.waitForEvent('download')
  202 |   await page.getByRole('button', { name: '导出学习数据' }).click()
  203 |   const path = info.outputPath(`${name}.json`)
  204 |   await (await downloading).saveAs(path)
  205 |   return { path, text: await readFile(path, 'utf8') }
  206 | }
  207 | async function restore(page: Page, text: string) {
  208 |   await page.goto('/privacy')
  209 |   await page.getByLabel('选择学习数据备份').setInputFiles({
  210 |     name: 'synthetic-earned.json',
  211 |     mimeType: 'application/json',
  212 |     buffer: Buffer.from(text),
  213 |   })
  214 |   await expect(page.getByRole('heading', { name: '恢复预览' })).toBeVisible()
  215 |   await page.getByRole('button', { name: '确认合并恢复' }).click()
  216 |   await expect(page.getByText(/恢复完成：/)).toBeVisible()
  217 | }
  218 | async function finalTaskCheckpoint(page: Page) {
  219 |   await onboard(page)
  220 |   await warmup(page)
  221 |   await page.getByRole('button', { name: '开始场景应用' }).click()
  222 |   await reachTerminal(page)
  223 |   await finish(page)
  224 |   expect(points(await state(page))).toBe(20)
  225 |   await page.goto('/')
  226 |   await page.getByRole('button', { name: '选择巩固材料' }).click()
  227 |   await page.getByRole('button', { name: '查看校审备用词句' }).click()
  228 |   await page.getByRole('button', { name: '记录这条校审词句并用于任务' }).click()
  229 |   await page.getByRole('button', { name: '开始这次定向练习' }).click()
  230 |   await page.getByRole('textbox', { name: '我回忆的表达' }).fill('black')
  231 |   await page.getByRole('button', { name: '保存回忆并查看' }).click()
  232 |   await page
  233 |     .getByRole('textbox', { name: '我的替换或造句' })
  234 |     .fill('I would like black coffee, please.')
  235 |   await page.getByRole('button', { name: '保存造句并应用' }).click()
  236 |   await reachTerminal(page)
  237 |   return page.url()
  238 | }
  239 | 
  240 | // Catches split settlement writes, lost retry identity and non-idempotent finishes.
  241 | test('B: abort the final bonus write, retry same finish, then simultaneous finishes settle once', async ({
  242 |   page,
  243 |   context,
  244 |   browser,
  245 |   baseURL,
  246 | }, info) => {
  247 |   test.setTimeout(180000)
  248 |   const audit = await protect(context, baseURL!)
  249 |   await page.clock.setFixedTime(new Date(anchor))
```