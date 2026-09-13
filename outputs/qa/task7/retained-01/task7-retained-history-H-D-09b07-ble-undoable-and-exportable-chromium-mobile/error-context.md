# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-retained-history.spec.ts >> H/D: 121 pinned historical sessions including long ASCII and Unicode IDs remain completely readable, undoable and exportable
- Location: tests\e2e\task7-retained-history.spec.ts:5:1

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '确认合并恢复' })

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - main [ref=e4]:
      - generic [ref=e5]:
        - link "返回我的练习" [ref=e6] [cursor=pointer]:
          - /url: /me
        - generic [ref=e9]:
          - paragraph [ref=e10]: PRIVACY FIRST
          - heading "隐私与数据" [active] [level=1] [ref=e11]
      - generic [ref=e12]:
        - article [ref=e13]:
          - generic [ref=e16]:
            - heading "原始录音不写入学习记录" [level=2] [ref=e17]
            - paragraph [ref=e18]: 录音核对或重试时可能保留临时录音；取消、提交结束、离开或组件卸载时释放。导出不含录音。
        - article [ref=e19]:
          - generic [ref=e22]:
            - heading "游客优先" [level=2] [ref=e23]
            - paragraph [ref=e24]: 不要求昵称、头像、手机号或微信账号；学习记录默认留在本机。
        - article [ref=e25]:
          - generic [ref=e28]:
            - heading "本机私密学习" [level=2] [ref=e29]
            - paragraph [ref=e30]: 本版不连接云端智能、账号或自动同步；个人学习文字只保存在这个浏览器。
      - generic [ref=e31]:
        - heading "删除与备份范围" [level=2] [ref=e32]
        - paragraph [ref=e33]: 删除单条历史只删除会话与话轮。词句笔记和任务完成凭据可能仍含学习文字，计划、积分与奖励保留。需要彻底清除本机学习数据时，请在下方明确确认清空。
        - paragraph [ref=e34]: Safari 与主屏幕网页应用的数据可能分开，不能保证自动迁移。清理站点数据、换设备或系统回收空间都可能丢失记录；先导出并在文件 App 确认保存，再操作。
      - region [ref=e35]:
        - heading "你的数据" [level=2] [ref=e36]
        - paragraph [ref=e37]: 练习记录默认只保存在这台设备。导出文件不包含原始录音。
        - paragraph [ref=e38]: 建议每周及清理站点数据、升级或换设备前导出备份。清理浏览器数据或设备回收空间可能删除本地数据；浏览器即使允许持久存储也不能代替备份。本版没有跨设备自动同步。
        - paragraph [ref=e39]: 本地积分可自行修改，不代表经过验证的真实排行榜成绩。
        - button "导出学习数据" [ref=e40] [cursor=pointer]
        - generic [ref=e43]:
          - generic [ref=e44]: 选择学习数据备份
          - button "选择学习数据备份" [ref=e45]
          - paragraph [ref=e46]: 支持版本 1 / 2 JSON，最多 10 MB。预览不会修改数据；确认后按时间合并，不覆盖较新的记录。
          - button "重新预览并重试" [ref=e47] [cursor=pointer]
        - generic [ref=e48]:
          - heading "清空本机数据" [level=3] [ref=e49]
          - paragraph [ref=e50]: 此操作无法撤销，将清空此浏览器内的学习记录、笔记、任务、积分与奖励。请先生成导出并确认文件已保存；本版没有云端副本。
          - generic [ref=e51]: 输入“清空”以确认
          - textbox "输入“清空”以确认" [ref=e52]
          - button "永久清空本机数据" [disabled] [ref=e53]
        - alert [ref=e56]: "恢复预览没有完成。BACKUP_INVALID: sessions.2 COMPLETION_EVIDENCE_MISMATCH"
      - paragraph [ref=e58]: 面向中国大陆公开运营前，仍需完成备案、隐私政策、数据跨境与生成式 AI 合规评估。本测试部署不等于公开运营许可。
    - navigation "主要导航" [ref=e59]:
      - link "目标" [ref=e60] [cursor=pointer]:
        - /url: /
      - link "练习" [ref=e64] [cursor=pointer]:
        - /url: /practice
      - link "场景" [ref=e68] [cursor=pointer]:
        - /url: /scenes
      - link "记录簿" [ref=e72] [cursor=pointer]:
        - /url: /notebook
      - link "我的" [ref=e76] [cursor=pointer]:
        - /url: /me
  - alert [ref=e80]
  - status [ref=e81]: 隐私与数据
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test'
  2  | import { readFile, writeFile } from 'node:fs/promises'
  3  | import { localState, protect } from './task7-browser-helpers'
  4  | 
  5  | test('H/D: 121 pinned historical sessions including long ASCII and Unicode IDs remain completely readable, undoable and exportable', async ({ page, context, baseURL }, info) => {
  6  |   test.setTimeout(120000)
  7  |   const finishNetwork = await protect(context, baseURL!)
  8  |   // Explicit historical-ID fixture: derives pinned complete content from an
  9  |   // actual earlier UI download, never a replacement for the live learning story.
  10 |   const fixture = JSON.parse(await readFile('outputs/qa/task7/core-online-green/synthetic-completed-backup.json', 'utf8'))
  11 |   const original = fixture.sessions.find((session: { simulation?: unknown }) => !session.simulation)
  12 |   const originalTurns = fixture.turns.filter((turn: { sessionId: string }) => turn.sessionId === original.id)
  13 |   const ids = ['a'.repeat(121), '旧的完整记录', ...Array.from({ length: 117 }, (_, index) => `retained-${String(index).padStart(3, '0')}`)]
  14 |   for (const [index, id] of ids.entries()) {
  15 |     const session = structuredClone(original)
  16 |     delete session.provenance
  17 |     session.id = id
  18 |     session.startedAt = '2026-07-01T01:00:00.000Z'
  19 |     session.updatedAt = new Date(Date.parse('2026-07-01T01:00:00Z') + index * 1000).toISOString()
  20 |     fixture.sessions.push(session)
  21 |     for (const [turnIndex, turn] of originalTurns.entries()) fixture.turns.push({ ...turn, id: `${id}:turn:${turnIndex}`, sessionId: id })
  22 |   }
  23 |   expect(fixture.sessions).toHaveLength(121)
  24 |   await page.goto('/privacy')
  25 |   await page.locator('input[type=file]').setInputFiles({ name: 'historical-ids-121.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture)) })
> 26 |   await page.getByRole('button', { name: '确认合并恢复' }).click()
     |                                                      ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  27 |   await expect(page.getByText(/恢复完成/)).toBeVisible()
  28 |   const restored = await localState(page)
  29 |   expect(restored.sessions).toHaveLength(121)
  30 |   await page.addInitScript(() => {
  31 |     const audit = { transactions: [] as string[] }
  32 |     Object.assign(window, { __historyAudit: audit })
  33 |     const original = IDBDatabase.prototype.transaction
  34 |     IDBDatabase.prototype.transaction = function (...args) {
  35 |       audit.transactions.push(String(args[1] ?? 'readonly'))
  36 |       return Reflect.apply(original, this, args)
  37 |     }
  38 |   })
  39 |   await page.goto('/me')
  40 |   const history = page.getByRole('region', { name: '完整练习历史' })
  41 |   await expect(history.getByRole('button', { name: /^删除此练习/ })).toHaveCount(121)
  42 |   const eagerTransactions = await page.evaluate(() => (window as unknown as { __historyAudit: { transactions: string[] } }).__historyAudit.transactions.length)
  43 |   expect(eagerTransactions).toBeLessThan(20)
  44 |   const oldLinks = history.getByRole('button', { name: /在此查看保留记录/ })
  45 |   await expect(oldLinks).toHaveCount(2)
  46 |   const rendered: string[] = []
  47 |   for (let index = 0; index < 2; index++) {
  48 |     await oldLinks.nth(index).click()
  49 |     await expect(page.getByRole('heading', { name: '保留的练习记录（只读）' })).toBeVisible()
  50 |     const content = await page.getByRole('region', { name: '完整练习历史' }).innerText()
  51 |     for (const turn of originalTurns) if (turn.learnerText) expect(content).toContain(turn.learnerText)
  52 |     await expect(page.getByRole('button', { name: '提交这一轮' })).toHaveCount(0)
  53 |     rendered.push(content)
  54 |     await page.getByRole('button', { name: '返回本页列表' }).click()
  55 |   }
  56 |   await history.getByRole('button', { name: /^删除此练习/ }).last().click()
  57 |   await page.getByRole('button', { name: '确认删除这条历史' }).click()
  58 |   await page.getByRole('button', { name: '撤销本次删除' }).click()
  59 |   await expect(page.getByText(/本次历史已恢复/)).toBeVisible()
  60 |   const afterUndo = await localState(page)
  61 |   expect(afterUndo.sessions).toEqual(restored.sessions)
  62 |   expect(afterUndo.turns).toEqual(restored.turns)
  63 |   expect(afterUndo.pointsLedger).toEqual(restored.pointsLedger)
  64 |   await page.goto('/privacy')
  65 |   const downloadPromise = page.waitForEvent('download')
  66 |   await page.getByRole('button', { name: '导出学习数据' }).click()
  67 |   const download = await downloadPromise, path = info.outputPath('actual-121-session-backup.json')
  68 |   await download.saveAs(path)
  69 |   const bytes = await readFile(path), exported = JSON.parse(bytes.toString())
  70 |   expect(exported.sessions).toEqual(restored.sessions)
  71 |   expect(exported.turns).toEqual(restored.turns)
  72 |   await writeFile(info.outputPath('retained-readability.json'), JSON.stringify({ eagerTransactions, sessions: restored.sessions.length, bytes: bytes.byteLength, specialIds: ids.slice(0, 2), rendered }, null, 2))
  73 |   await finishNetwork(info)
  74 | })
  75 | 
```