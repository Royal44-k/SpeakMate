# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-learning.spec.ts >> A/G: real zero-point onboarding → warmup → terminal refresh → capture choice → simulation → 35-point backup
- Location: tests\e2e\task7-learning.spec.ts:46:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: '确认结束并保存复盘' })
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for getByRole('button', { name: '确认结束并保存复盘' })

```

```yaml
- alert
- main:
  - link "退出本次练习":
    - /url: /?date=2026-09-10&task=scene
  - paragraph: SpeakMate
  - heading "Dialogue Stage" [level=1]
  - text: 情境演练 · 安检沟通
  - strong: 3 / 3
  - text: A2 · 已提交轮次
  - region "当前练习场景":
    - img "机场安检通道和托盘"
  - region "完整情境与材料":
    - heading "安检工作人员角色" [level=2]
    - paragraph: 这是已编写的本地角色与回应演练，不是实时人员服务。请先阅读所选情境；问题可能包含排练提示，所有交易、安排与材料只属于练习。
    - paragraph: 虚构安检练习。你带一个背包、一台笔记本电脑、一只空水瓶和外套，口袋里有手机和钥匙。桌上已有两个托盘，周围比较嘈杂。此练习通道要求电脑单独放盘，空瓶留包内；其他步骤先问工作人员，不推断真实机场规则。你可要求慢说或保留对额外问题的回应。短练只练习理解指示，不代表已通过安检。
    - paragraph: 帮助和改答也占用轮次；还可提交 0 轮。到上限可能仍有目标未确认，可结束后开启新一轮，不代表练习失败。
  - status: 本地朗读暂时不可用，请直接阅读文字继续练习。
  - group: 本轮对话记录（3 轮）
  - region "本轮结尾":
    - text: 本地编写的情境问答
    - button "播放本地助手回复"
    - paragraph: We will pause the practice with some screening details still unconfirmed. This is not a security clearance.
    - button "记录词句"
  - region "本轮表达反馈":
    - button "本轮帮助操作 本地收录范围有限，不作全面正确性评估":
      - strong: 本轮帮助操作
      - text: 本地收录范围有限，不作全面正确性评估
  - button "停止本次练习"
  - paragraph: 本轮已到上限，仍有目标未确认。
  - paragraph: 任务结算尚未接通，不能在此标记任务完成。
- status: 正在准备对话舞台…
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test'
  2   | import { readFile } from 'node:fs/promises'
  3   | import type { DataState } from '../../src/infrastructure/persistence/storage'
  4   | 
  5   | async function localState(page: Page): Promise<DataState> {
  6   |   return page.evaluate(async () => {
  7   |     const database = await new Promise<IDBDatabase>((resolve, reject) => {
  8   |       const request = indexedDB.open('speakmate-v1')
  9   |       request.onsuccess = () => resolve(request.result)
  10  |       request.onerror = () => reject(request.error)
  11  |       request.onupgradeneeded = () => { request.transaction?.abort(); reject(new Error('Expected existing synthetic database')) }
  12  |     })
  13  |     try {
  14  |       const names = Array.from(database.objectStoreNames)
  15  |       const tx = database.transaction(names, 'readonly')
  16  |       const rows = await Promise.all(names.map((name) => new Promise<[string, unknown[]]>((resolve, reject) => {
  17  |         const request = tx.objectStore(name).getAll()
  18  |         request.onsuccess = () => resolve([name, request.result])
  19  |         request.onerror = () => reject(request.error)
  20  |       })))
  21  |       return Object.fromEntries(rows) as DataState
  22  |     } finally { database.close() }
  23  |   })
  24  | }
  25  | 
  26  | async function onboard(page: Page) {
  27  |   await page.goto('/welcome')
  28  |   await page.getByRole('button', { name: /A2/ }).click()
  29  |   await page.getByRole('button', { name: '旅行', exact: true }).click()
  30  |   await page.getByRole('button', { name: '每天 5 分钟' }).click()
  31  |   await page.getByRole('button', { name: '开始第一次练习', exact: true }).click()
  32  |   await expect(page.getByRole('heading', { name: '今日目标' })).toBeVisible()
  33  | }
  34  | 
  35  | function balance(state: DataState) {
  36  |   return state.pointsLedger.reduce((total, entry) => total + entry.delta, 0)
  37  | }
  38  | 
  39  | async function actualAnswer(page: Page) {
  40  |   await page.getByText('本题参考表达', { exact: true }).click()
  41  |   await page.getByRole('button', { name: '使用参考 1 并确认' }).click()
  42  |   await expect(page.getByRole('textbox', { name: '英文内容' })).not.toHaveValue('')
  43  |   await page.getByRole('button', { name: '提交这一轮' }).click()
  44  | }
  45  | 
  46  | test('A/G: real zero-point onboarding → warmup → terminal refresh → capture choice → simulation → 35-point backup', async ({ page, context, baseURL }, info) => {
  47  |   test.setTimeout(180_000)
  48  |   await page.clock.setFixedTime(new Date('2026-09-10T02:00:00Z'))
  49  |   const requests: { method: string; url: string; body: string | null }[] = []
  50  |   context.on('request', (request) => requests.push({ method: request.method(), url: request.url(), body: request.postData() }))
  51  |   await context.route('**/*', (route) => new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort())
  52  |   const errors: string[] = []
  53  |   page.on('pageerror', (error) => errors.push(error.message))
  54  |   await onboard(page)
  55  |   const originalPlan = (await localState(page)).dailyPlans
  56  |   expect(balance(await localState(page))).toBe(0)
  57  |   await page.reload()
  58  |   await expect(page.getByRole('heading', { name: '今日目标' })).toBeVisible()
  59  |   expect((await localState(page)).dailyPlans).toEqual(originalPlan)
  60  |   const other = await context.newPage()
  61  |   await other.goto('/')
  62  |   await expect(other.getByRole('heading', { name: '今日目标' })).toBeVisible()
  63  |   expect((await localState(other)).dailyPlans).toEqual(originalPlan)
  64  |   await other.close()
  65  | 
  66  |   await page.getByRole('button', { name: '准备表达热身' }).click()
  67  |   const flow = page.getByRole('region', { name: '表达热身流程' })
  68  |   await expect(flow).toBeVisible()
  69  |   // No locator action is allowed to scroll the newly inserted flow before this check.
  70  |   const entered = await flow.evaluate((element) => {
  71  |     const rect = element.getBoundingClientRect()
  72  |     return { top: rect.top, bottom: rect.bottom, viewport: innerHeight, focused: element.contains(document.activeElement) }
  73  |   })
  74  |   expect(entered.top).toBeGreaterThan(-80)
  75  |   expect(entered.top).toBeLessThan(entered.viewport - 100)
  76  |   expect(entered.focused).toBe(true)
  77  |   await page.screenshot({ path: info.outputPath('warmup-entered.png'), fullPage: false })
  78  |   await page.getByRole('button', { name: '隐藏参考，开始回忆' }).click()
  79  |   const recall = page.getByRole('textbox', { name: '我的回忆', exact: true })
  80  |   await expect(recall).toBeVisible()
  81  |   await recall.fill('I remember black coffee.')
  82  |   await page.getByRole('button', { name: '确认完成热身' }).click()
  83  |   await expect(page.getByText('热身已完成，已保存这次回忆。')).toBeVisible()
  84  |   await expect.poll(async () => balance(await localState(page))).toBe(10)
  85  | 
  86  |   await page.getByRole('button', { name: '开始场景应用' }).click()
  87  |   await expect(page.getByRole('heading', { name: 'Dialogue Stage' })).toBeVisible()
  88  |   expect(new URL(page.url()).searchParams.get('id')).not.toBe('new')
  89  |   const sceneId = new URL(page.url()).searchParams.get('id')!
  90  |   await actualAnswer(page)
  91  |   const goal = originalPlan[0].tasks.find((task) => task.slot === 'scene')!
  92  |   if (goal.target.kind !== 'scene') throw new Error('Expected actual scene target')
  93  |   for (let turn = 1; turn < goal.target.requiredUserTurns; turn += 1) {
  94  |     await page.getByRole('button', { name: '我需要表达提示' }).click()
  95  |     await expect.poll(async () => (await localState(page)).turns.filter((value) => value.sessionId === sceneId).length).toBe(turn + 1)
  96  |   }
> 97  |   await expect(page.getByRole('button', { name: '确认结束并保存复盘' })).toBeVisible()
      |                                                                 ^ Error: expect(locator).toBeVisible() failed
  98  |   expect(balance(await localState(page))).toBe(10)
  99  |   await page.reload()
  100 |   await page.getByRole('button', { name: '确认结束并保存复盘' }).click()
  101 |   await expect(page.getByRole('heading', { name: '这轮已保存。' })).toBeVisible()
  102 |   expect(balance(await localState(page))).toBe(20)
  103 |   await page.getByRole('link', { name: '查看本次复盘' }).click()
  104 |   await page.getByRole('link', { name: '返回 2026-09-10 的原任务' }).click()
  105 | 
  106 |   await page.getByRole('button', { name: '选择巩固材料' }).click()
  107 |   await page.getByRole('button', { name: '查看校审备用词句' }).click()
  108 |   await expect(page.getByText('black', { exact: true })).toBeVisible()
  109 |   expect((await localState(page)).notebook).toEqual([])
  110 |   await page.getByRole('button', { name: '记录这条校审词句并用于任务' }).click()
  111 |   await page.getByRole('button', { name: '开始这次定向练习' }).click()
  112 |   await page.getByRole('textbox', { name: '我回忆的表达' }).fill('black')
  113 |   await page.getByRole('button', { name: '保存回忆并查看' }).click()
  114 |   await page.reload()
  115 |   await page.getByRole('textbox', { name: '我的替换或造句' }).fill('I would like black coffee, please.')
  116 |   await page.getByRole('button', { name: '保存造句并应用' }).click()
  117 |   const simulationId = new URL(page.url()).searchParams.get('id')!
  118 |   const simulation = (await localState(page)).sessions.find((session) => session.id === simulationId)!
  119 |   expect(simulation.simulation?.recall?.text).toBe('black')
  120 |   expect(simulation.simulation?.composition?.text).toBe('I would like black coffee, please.')
  121 |   const simulationTask = (await localState(page)).dailyPlans[0].tasks.find((task) => task.slot === 'consolidation')!
  122 |   if (simulationTask.target.kind !== 'simulation') throw new Error('Expected atomically bound simulation target')
  123 |   for (let turn = 0; turn < simulationTask.target.requiredUserTurns; turn += 1) {
  124 |     await actualAnswer(page)
  125 |     await expect.poll(async () => (await localState(page)).turns.filter((value) => value.sessionId === simulationId).length).toBe(turn + 1)
  126 |   }
  127 |   await page.getByRole('button', { name: '确认结束并保存复盘' }).click()
  128 |   await expect(page.getByRole('heading', { name: '这轮已保存。' })).toBeVisible()
  129 |   await expect.poll(async () => balance(await localState(page))).toBe(35)
  130 |   await page.reload()
  131 |   expect(balance(await localState(page))).toBe(35)
  132 |   await page.getByRole('link', { name: '查看本次复盘' }).click()
  133 |   await page.reload()
  134 |   expect(balance(await localState(page))).toBe(35)
  135 |   await page.goto('/privacy')
  136 |   const downloadPromise = page.waitForEvent('download')
  137 |   await page.getByRole('button', { name: '导出学习数据' }).click()
  138 |   const download = await downloadPromise
  139 |   const path = info.outputPath('synthetic-completed-backup.json')
  140 |   await download.saveAs(path)
  141 |   const exported = JSON.parse(await readFile(path, 'utf8'))
  142 |   const state = await localState(page)
  143 |   expect(exported.schemaVersion).toBe(2)
  144 |   expect(exported.sessions).toEqual(state.sessions)
  145 |   expect(exported.notebook).toEqual(state.notebook)
  146 |   expect(exported.learningEvents).toEqual(state.learningEvents)
  147 |   expect(exported.pointsLedger).toEqual(state.pointsLedger)
  148 |   expect(errors).toEqual([])
  149 |   expect(requests.filter((request) => !['GET', 'HEAD'].includes(request.method))).toEqual([])
  150 |   expect(requests.filter((request) => new URL(request.url).origin !== baseURL)).toEqual([])
  151 |   await info.attach('network', { body: JSON.stringify(requests, null, 2), contentType: 'application/json' })
  152 |   await info.attach('final-local-state', { body: JSON.stringify(state, null, 2), contentType: 'application/json' })
  153 | })
  154 | 
```