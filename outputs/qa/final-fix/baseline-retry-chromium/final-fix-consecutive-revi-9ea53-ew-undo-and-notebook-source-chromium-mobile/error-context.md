# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: final-fix.spec.ts >> consecutive reviewed round, contextual bookmark preview/undo, and notebook source
- Location: tests\e2e\final-fix.spec.ts:5:1

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '确认结束本次练习' })

```

# Page snapshot

```yaml
- generic [active] [ref=f3e1]:
  - alert [ref=f3e2]
  - main [ref=f3e3]:
    - generic [ref=f3e4]:
      - link "退出本次练习" [ref=f3e5] [cursor=pointer]:
        - /url: /scenes?level=C1
      - generic [ref=f3e8]:
        - paragraph [ref=f3e9]: SpeakMate
        - heading "Dialogue Stage" [level=1] [ref=f3e10]
        - generic [ref=f3e11]: 情境演练 · 咖啡点单
      - generic [ref=f3e12]:
        - strong [ref=f3e13]: 3 / 3
        - generic [ref=f3e14]: C1 · 已提交轮次
    - region "当前练习场景" [ref=f3e15]:
      - img "自然光咖啡店吧台和咖啡师" [ref=f3e17]
    - region "完整情境与材料" [ref=f3e18]:
      - heading "咖啡师角色" [level=2] [ref=f3e19]
      - paragraph [ref=f3e20]: 这是已编写的本地角色与回应演练，不是实时人员服务。请先阅读所选情境；问题可能包含排练提示，所有交易、安排与材料只属于练习。
      - paragraph [ref=f3e21]: 现场点单：美式和滴滤均有货，默认热饮、不加奶不加糖。短练确认饮品、杯型及堂食/外带；标准练加个性化和支付方式；拓展再确定收据、取餐称呼、降温及点心。只是练习，不代表真实支付或出单。
      - paragraph [ref=f3e22]: 帮助和改答也占用轮次；还可提交 0 轮。到上限可能仍有目标未确认，可结束后开启新一轮，不代表练习失败。
    - status [ref=f3e23]: 本地朗读暂时不可用，请直接阅读文字继续练习。
    - group [ref=f3e24]:
      - generic "本轮对话记录（3 轮）" [ref=f3e25] [cursor=pointer]
    - region "本轮结尾" [ref=f3e26]:
      - generic [ref=f3e27]:
        - generic [ref=f3e28]: 本地编写的情境问答
        - button "播放本地助手回复" [ref=f3e29] [cursor=pointer]
      - generic [ref=f3e33]:
        - paragraph [ref=f3e34]: Your drink, size and serving choice are noted. This practice is complete; no real order has been placed.
        - button "记录词句" [ref=f3e35] [cursor=pointer]
    - region "本轮表达反馈" [ref=f3e37]:
      - button "已匹配本地参考表达 本地收录范围有限，不作全面正确性评估" [ref=f3e38] [cursor=pointer]:
        - generic [ref=f3e42]:
          - strong [ref=f3e43]: 已匹配本地参考表达
          - generic [ref=f3e44]: 本地收录范围有限，不作全面正确性评估
    - button "停止本次练习" [ref=f3e47] [cursor=pointer]
    - generic [ref=f3e48]:
      - paragraph [ref=f3e49]: 所选流程的目标已确认，请确认结束。
      - button "确认结束并保存复盘" [ref=f3e50] [cursor=pointer]
  - status [ref=f3e51]: 正在准备对话舞台…
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
> 14  |   baseURL,
      |                                                          ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  15  | }, info) => {
  16  |   test.setTimeout(150000)
  17  |   const finishNetwork = await protect(context, baseURL!)
  18  |   try {
  19  |     await onboard(page, 'C1')
  20  |     const first = await enterScene(page, 'coffee-order', 'C1')
  21  |     const expression = await answer(page)
  22  |     await answer(page)
  23  |     await answer(page)
  24  |     await page.getByRole('button', { name: '确认结束本次练习' }).click()
  25  |     await page.waitForURL(/\/session\/report/)
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
```