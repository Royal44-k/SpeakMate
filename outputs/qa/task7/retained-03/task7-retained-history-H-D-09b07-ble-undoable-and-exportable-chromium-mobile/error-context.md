# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-retained-history.spec.ts >> H/D: 121 pinned historical sessions including long ASCII and Unicode IDs remain completely readable, undoable and exportable
- Location: tests\e2e\task7-retained-history.spec.ts:5:1

# Error details

```
TimeoutError: locator.innerText: Timeout 10000ms exceeded.
Call log:
  - waiting for getByRole('region', { name: '完整练习历史' })

```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - generic [ref=f1e2]:
    - main [ref=f1e3]:
      - generic [ref=f1e4]:
        - heading "保留的练习记录（只读）" [level=1] [ref=f1e5]
        - heading "房间问题" [level=2] [ref=f1e6]
        - paragraph [ref=f1e7]: A2 · 当时已结束。此编号不能直接链接或从此路由续练。此处只读展示原文、时间和当时保存的反馈；另行开始新版练习不会改写本记录或引用。
        - link "导出本机备份" [ref=f1e8] [cursor=pointer]:
          - /url: /privacy
        - paragraph [ref=f1e9]: 开始：2026-07-01T01:00:00.000Z；最后保存：2026-07-01T01:00:01.000Z
        - generic [ref=f1e11]:
          - heading "当时开场" [level=2] [ref=f1e12]
          - generic [ref=f1e13]:
            - paragraph [ref=f1e14]: How would you like to confirm which room you are in?
            - button "记录词句" [ref=f1e15] [cursor=pointer]
        - generic [ref=f1e16]:
          - heading "第 1 轮" [level=2] [ref=f1e17]
          - paragraph [ref=f1e18]: 你
          - generic [ref=f1e19]:
            - paragraph [ref=f1e20]: My room number is 204.
            - button "记录词句" [ref=f1e21] [cursor=pointer]
          - paragraph [ref=f1e22]: 当时回复
          - generic [ref=f1e23]:
            - paragraph [ref=f1e24]: Can you describe what the air conditioning is doing?
            - button "记录词句" [ref=f1e25] [cursor=pointer]
        - generic [ref=f1e26]:
          - heading "第 2 轮" [level=2] [ref=f1e27]
          - paragraph [ref=f1e28]: 你
          - paragraph [ref=f1e29]: 当时回复
          - generic [ref=f1e30]:
            - paragraph [ref=f1e31]: A short description is enough. Use the fictional room details and ask for repetition if needed. 均表示没有制冷，前者明确不启动。
            - button "记录词句" [ref=f1e32] [cursor=pointer]
          - generic [ref=f1e33]:
            - paragraph [ref=f1e34]: Can you describe what the air conditioning is doing?
            - button "记录词句" [ref=f1e35] [cursor=pointer]
        - generic [ref=f1e36]:
          - heading "第 3 轮" [level=2] [ref=f1e37]
          - paragraph [ref=f1e38]: 你
          - paragraph [ref=f1e39]: 当时回复
          - generic [ref=f1e40]:
            - paragraph [ref=f1e41]: We have practised part of reporting the room problem. Unconfirmed access, timing and alternatives remain open.
            - button "记录词句" [ref=f1e42] [cursor=pointer]
        - link "开始新版练习" [ref=f1e43] [cursor=pointer]:
          - /url: /scenes/prepare?scene=hotel-room-problem&level=A2
        - button "返回本页列表" [ref=f1e44]
        - navigation "复盘后操作" [ref=f1e45]:
          - link "返回我的练习" [ref=f1e46] [cursor=pointer]:
            - /url: /me
          - link "回到今日练习" [ref=f1e47] [cursor=pointer]:
            - /url: /practice
          - link "换个场景" [ref=f1e48] [cursor=pointer]:
            - /url: /scenes
    - navigation "主要导航" [ref=f1e49]:
      - link "目标" [ref=f1e50] [cursor=pointer]:
        - /url: /
      - link "练习" [ref=f1e54] [cursor=pointer]:
        - /url: /practice
      - link "场景" [ref=f1e58] [cursor=pointer]:
        - /url: /scenes
      - link "记录簿" [ref=f1e62] [cursor=pointer]:
        - /url: /notebook
      - link "我的" [ref=f1e66] [cursor=pointer]:
        - /url: /me
  - alert [ref=f1e70]
  - status [ref=f1e71]: 我的练习
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
  20 |     session.completedAt = session.updatedAt
  21 |     // Retained imports predate current finish evidence and may have IDs the
  22 |     // modern command boundary cannot address. They remain readable, never run.
  23 |     delete session.completionEvidence
  24 |     fixture.sessions.push(session)
  25 |     for (const [turnIndex, turn] of originalTurns.entries()) fixture.turns.push({ ...turn, id: `${id}:turn:${turnIndex}`, sessionId: id, createdAt: session.updatedAt })
  26 |   }
  27 |   expect(fixture.sessions).toHaveLength(121)
  28 |   await page.goto('/privacy')
  29 |   await page.locator('input[type=file]').setInputFiles({ name: 'historical-ids-121.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture)) })
  30 |   await page.getByRole('button', { name: '确认合并恢复' }).click()
  31 |   await expect(page.getByText(/恢复完成/)).toBeVisible()
  32 |   const restored = await localState(page)
  33 |   expect(restored.sessions).toHaveLength(121)
  34 |   await page.addInitScript(() => {
  35 |     const audit = { transactions: [] as string[] }
  36 |     Object.assign(window, { __historyAudit: audit })
  37 |     const original = IDBDatabase.prototype.transaction
  38 |     IDBDatabase.prototype.transaction = function (...args) {
  39 |       audit.transactions.push(String(args[1] ?? 'readonly'))
  40 |       return Reflect.apply(original, this, args)
  41 |     }
  42 |   })
  43 |   await page.goto('/me')
  44 |   const history = page.getByRole('region', { name: '完整练习历史' })
  45 |   await expect(history.getByRole('button', { name: /^删除此练习/ })).toHaveCount(121)
  46 |   const eagerTransactions = await page.evaluate(() => (window as unknown as { __historyAudit: { transactions: string[] } }).__historyAudit.transactions.length)
  47 |   expect(eagerTransactions).toBeLessThan(20)
  48 |   const oldLinks = history.getByRole('button', { name: /在此查看保留记录/ })
  49 |   await expect(oldLinks).toHaveCount(2)
  50 |   const rendered: string[] = []
  51 |   for (let index = 0; index < 2; index++) {
  52 |     await oldLinks.nth(index).click()
  53 |     await expect(page.getByRole('heading', { name: '保留的练习记录（只读）' })).toBeVisible()
> 54 |     const content = await page.getByRole('region', { name: '完整练习历史' }).innerText()
     |                                                                        ^ TimeoutError: locator.innerText: Timeout 10000ms exceeded.
  55 |     for (const turn of originalTurns) if (turn.learnerText) expect(content).toContain(turn.learnerText)
  56 |     await expect(page.getByRole('button', { name: '提交这一轮' })).toHaveCount(0)
  57 |     rendered.push(content)
  58 |     await page.getByRole('button', { name: '返回本页列表' }).click()
  59 |   }
  60 |   await history.getByRole('button', { name: /^删除此练习/ }).last().click()
  61 |   await page.getByRole('button', { name: '确认删除这条历史' }).click()
  62 |   await page.getByRole('button', { name: '撤销本次删除' }).click()
  63 |   await expect(page.getByText(/本次历史已恢复/)).toBeVisible()
  64 |   const afterUndo = await localState(page)
  65 |   expect(afterUndo.sessions).toEqual(restored.sessions)
  66 |   expect(afterUndo.turns).toEqual(restored.turns)
  67 |   expect(afterUndo.pointsLedger).toEqual(restored.pointsLedger)
  68 |   await page.goto('/privacy')
  69 |   const downloadPromise = page.waitForEvent('download')
  70 |   await page.getByRole('button', { name: '导出学习数据' }).click()
  71 |   const download = await downloadPromise, path = info.outputPath('actual-121-session-backup.json')
  72 |   await download.saveAs(path)
  73 |   const bytes = await readFile(path), exported = JSON.parse(bytes.toString())
  74 |   expect(exported.sessions).toEqual(restored.sessions)
  75 |   expect(exported.turns).toEqual(restored.turns)
  76 |   await writeFile(info.outputPath('retained-readability.json'), JSON.stringify({ eagerTransactions, sessions: restored.sessions.length, bytes: bytes.byteLength, specialIds: ids.slice(0, 2), rendered }, null, 2))
  77 |   await finishNetwork(info)
  78 | })
  79 | 
```