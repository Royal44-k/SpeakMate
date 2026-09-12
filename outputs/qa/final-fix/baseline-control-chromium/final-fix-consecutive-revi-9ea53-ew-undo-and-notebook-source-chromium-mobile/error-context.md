# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: final-fix.spec.ts >> consecutive reviewed round, contextual bookmark preview/undo, and notebook source
- Location: tests\e2e\final-fix.spec.ts:11:1

# Error details

```
Test timeout of 150000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 150000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://127.0.0.1:3130/session?id=session_86da5f95-2afe-4a41-8629-be86b11f19b4&scene=coffee-order&level=C1&mode=short&from=%2Fscenes%3Flevel%3DC1"
  navigated to "http://127.0.0.1:3130/session?id=session_86da5f95-2afe-4a41-8629-be86b11f19b4&scene=coffee-order&level=C1&mode=short&from=%2Fscenes%3Flevel%3DC1"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=f3e1]:
  - alert [ref=f3e2]
  - main [ref=f3e3]:
    - paragraph [ref=f3e7]: PRACTICE SAVED
    - heading "这轮已保存。" [level=1] [ref=f3e8]
    - paragraph [ref=f3e9]: 所选流程的目标已由本地收录表达确认。 这不是语言能力评分，也不代表真实服务已完成。
    - link "查看本次复盘" [ref=f3e10] [cursor=pointer]:
      - /url: /session/report?id=session_86da5f95-2afe-4a41-8629-be86b11f19b4
    - link "再练一轮新对话" [ref=f3e11] [cursor=pointer]:
      - /url: /session?id=new&scene=coffee-order&level=C1&mode=short&round=session_86da5f95-2afe-4a41-8629-be86b11f19b4
    - link "返回来源页面" [ref=f3e12] [cursor=pointer]:
      - /url: /scenes?level=C1
  - status [ref=f3e13]: 正在准备对话舞台…
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test'
  2   | import { writeFile } from 'node:fs/promises'
  3   | import {
  4   |   answer,
  5   |   enterScene,
  6   |   localState,
  7   |   onboard,
  8   |   protect,
  9   | } from './task7-browser-helpers'
  10  | 
  11  | test('consecutive reviewed round, contextual bookmark preview/undo, and notebook source', async ({
  12  |   page,
  13  |   context,
  14  |   baseURL,
  15  | }, info) => {
  16  |   test.setTimeout(150000)
  17  |   const finishNetwork = await protect(context, baseURL!)
  18  |   try {
  19  |     await onboard(page, 'C1')
  20  |     const first = await enterScene(page, 'coffee-order', 'C1')
  21  |     const expression = await answer(page)
  22  |     await answer(page)
  23  |     await answer(page)
  24  |     await page.getByRole('button', { name: '确认结束并保存复盘' }).click()
> 25  |     await page.waitForURL(/\/session\/report/)
      |                ^ Error: page.waitForURL: Test timeout of 150000ms exceeded.
  26  |     const firstState = await localState(page)
  27  |     const original = firstState.sessions.find(
  28  |       (session) => session.id === first,
  29  |     )!
  30  |     expect(original.gradedDialogue!.state.variantId).toBe('counter')
  31  |     const bookmark = page.getByRole('button', {
  32  |       name: `收藏表达：${expression}`,
  33  |     })
  34  |     const layout = []
  35  |     for (const [width, scale] of [
  36  |       [320, 1],
  37  |       [390, 2],
  38  |     ]) {
  39  |       await page.setViewportSize({ width, height: 844 })
  40  |       await page.evaluate((scale) => {
  41  |         document.documentElement.style.fontSize = `${16 * scale}px`
  42  |       }, scale)
  43  |       await bookmark.scrollIntoViewIfNeeded()
  44  |       layout.push(
  45  |         await bookmark.evaluate((node) => ({
  46  |           rect: node.getBoundingClientRect().toJSON(),
  47  |           text: getComputedStyle(document.body).fontSize,
  48  |           clientWidth: document.documentElement.clientWidth,
  49  |           scrollWidth: document.documentElement.scrollWidth,
  50  |         })),
  51  |       )
  52  |       await page.screenshot({
  53  |         path: info.outputPath(`bookmark-${width}-${scale * 100}.png`),
  54  |       })
  55  |     }
  56  |     await bookmark.click()
  57  |     await expect(page.getByRole('dialog')).toBeVisible()
  58  |     await expect(page.getByRole('dialog')).toContainText(
  59  |       'coffee-order.C1.drink',
  60  |     )
  61  |     await page.screenshot({ path: info.outputPath('preview-390-200.png') })
  62  |     await page.getByRole('button', { name: '保存词句', exact: true }).click()
  63  |     await expect(page.getByRole('dialog')).toHaveCount(0)
  64  |     const captured = (await localState(page)).notebook[0]
  65  |     expect(captured.sources[0]).toMatchObject({
  66  |       sessionId: first,
  67  |       level: 'C1',
  68  |       sceneId: 'dining-01',
  69  |       questionId: 'coffee-order.C1.drink',
  70  |       originalText: expression,
  71  |     })
  72  |     await page.getByRole('button', { name: '撤销记录' }).click()
  73  |     await expect(page.getByText('已撤销本次记录。')).toBeVisible()
  74  |     expect((await localState(page)).notebook).toEqual([])
  75  |     await bookmark.click()
  76  |     await page.getByRole('button', { name: '保存词句', exact: true }).click()
  77  |     await page.getByRole('link', { name: '查看词句', exact: true }).click()
  78  |     await expect(
  79  |       page.getByRole('heading', { name: expression, exact: true }),
  80  |     ).toBeVisible()
  81  |     await expect(
  82  |       page.getByText('coffee-order.C1.drink', { exact: true }),
  83  |     ).toBeVisible()
  84  |     await page.setViewportSize({ width: 320, height: 844 })
  85  |     await page.screenshot({ path: info.outputPath('note-320-100.png') })
  86  |     await page.goto(`/session?id=${first}`)
  87  |     await page.getByRole('link', { name: '再练一轮新对话' }).click()
  88  |     await expect(
  89  |       page.getByRole('button', { name: '停止本次练习' }),
  90  |     ).toBeVisible()
  91  |     await expect
  92  |       .poll(() => new URL(page.url()).searchParams.get('id'))
  93  |       .not.toBe('new')
  94  |     const second = new URL(page.url()).searchParams.get('id')!
  95  |     const finalState = await localState(page)
  96  |     const next = finalState.sessions.find((session) => session.id === second)!
  97  |     expect(next.gradedDialogue!.state.variantId).toBe('planned')
  98  |     expect(finalState.sessions.find((session) => session.id === first)).toEqual(
  99  |       original,
  100 |     )
  101 |     await expect(
  102 |       page.getByText(
  103 |         '安排取餐：同一在售菜单及默认热黑咖啡；先确认饮品、堂食/外带、杯型。拓展练安排现在/稍后出杯和杯具方案，替代现场版的降温及点心，并非随机拼接。',
  104 |       ),
  105 |     ).toBeVisible()
  106 |     await writeFile(
  107 |       info.outputPath('state-and-layout.json'),
  108 |       JSON.stringify(
  109 |         { original, next, notebook: finalState.notebook, layout },
  110 |         null,
  111 |         2,
  112 |       ),
  113 |     )
  114 |     for (const row of layout) {
  115 |       expect(row.rect.width).toBeGreaterThanOrEqual(44)
  116 |       expect(row.rect.height).toBeGreaterThanOrEqual(44)
  117 |       expect(row.scrollWidth).toBe(row.clientWidth)
  118 |     }
  119 |   } finally {
  120 |     await finishNetwork(info)
  121 |   }
  122 | })
  123 | 
```