# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: final-fix.spec.ts >> consecutive reviewed round, contextual bookmark preview/undo, and notebook source
- Location: tests\e2e\final-fix.spec.ts:11:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('dialog')
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for getByRole('dialog')

```

```yaml
- alert
- main:
  - link "返回我的练习":
    - /url: /me
  - paragraph: SESSION RECORD
  - heading "本次复盘" [level=1]
  - heading "所选目标已确认 · 已确认结束并保存" [level=2]
  - paragraph: 流程状态与表达覆盖分开记录，不提供语法、词汇、自然度或发音分数。
  - heading "本地覆盖与流程" [level=2]
  - paragraph: 已匹配表达：3 轮
  - paragraph: 未匹配表达：0 轮
  - paragraph: 帮助或停止操作：0 轮
  - paragraph: 已提交 3 / 3 轮，其中非空表达 3 轮。匹配只确认本题已收录表达；未收录不代表说错，帮助操作不证明表达正确。
  - heading "咖啡师角色" [level=2]
  - paragraph: 这是已编写的本地角色与回应演练，不是实时人员服务。请先阅读所选情境；问题可能包含排练提示，所有交易、安排与材料只属于练习。
  - paragraph: 现场点单：美式和滴滤均有货，默认热饮、不加奶不加糖。短练确认饮品、杯型及堂食/外带；标准练加个性化和支付方式；拓展再确定收据、取餐称呼、降温及点心。只是练习，不代表真实支付或出单。
  - heading "原始对话与本题反馈" [level=2]
  - paragraph: The Americano is the more assertive option; the filter coffee is subtler. What sort of flavour are you after?
  - button "记录词句"
  - article:
    - heading "第 1 轮" [level=3]
    - text: 你
    - paragraph: The Americano sounds right. I am after a pronounced flavour, rather than choosing it for the caffeine.
    - button "记录词句"
    - text: 情境回复
    - paragraph: The larger cup works out better per millilitre, though that may not make it better value for you. Which size would you prefer?
    - button "记录词句"
    - text: 本题规则反馈
    - paragraph: 这次文字与本地已收录的参考表达匹配；这不是全面语法、语义或口语能力评估。
    - button "记录词句"
    - group: 当时对应题目的参考表达
  - article:
    - heading "第 2 轮" [level=3]
    - text: 你
    - paragraph: Small, please. The lower unit price is beside the point if I end up leaving half of it.
    - button "记录词句"
    - text: 情境回复
    - paragraph: There is space to sit in, although I cannot promise it will remain quiet. Would staying or taking it away suit you better?
    - button "记录词句"
    - text: 本题规则反馈
    - paragraph: 这次文字与本地已收录的参考表达匹配；这不是全面语法、语义或口语能力评估。
    - button "记录词句"
    - group: 当时对应题目的参考表达
  - article:
    - heading "第 3 轮" [level=3]
    - text: 你
    - paragraph: I will stay. I am not expecting silence; I just need somewhere to pause between appointments.
    - button "记录词句"
    - text: 情境回复
    - paragraph: Your drink, size and serving choice are noted. This practice is complete; no real order has been placed.
    - button "记录词句"
    - text: 本题规则反馈
    - paragraph: 这次文字与本地已收录的参考表达匹配；这不是全面语法、语义或口语能力评估。
    - button "记录词句"
    - group: 当时对应题目的参考表达
  - region "你保存的表达":
    - heading "你保存的表达" [level=2]
    - paragraph: 保留原文供回看与收藏，不因没有问题标签就判定为好表达。
    - article:
      - paragraph: The Americano sounds right. I am after a pronounced flavour, rather than choosing it for the caffeine.
      - button "已收藏表达：The Americano sounds right. I am after a pronounced flavour, rather than choosing it for the caffeine." [disabled]
    - article:
      - paragraph: Small, please. The lower unit price is beside the point if I end up leaving half of it.
      - button "收藏表达：Small, please. The lower unit price is beside the point if I end up leaving half of it."
    - article:
      - paragraph: I will stay. I am not expecting silence; I just need somewhere to pause between appointments.
      - button "收藏表达：I will stay. I am not expecting silence; I just need somewhere to pause between appointments."
  - navigation "复盘后操作":
    - link "回到今日练习":
      - /url: /practice
    - link "换个场景":
      - /url: /scenes
- status: 本次复盘
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
  25  |     await page.getByRole('link', { name: '查看本次复盘' }).click()
  26  |     await page.waitForURL(/\/session\/report/)
  27  |     const firstState = await localState(page)
  28  |     const original = firstState.sessions.find(
  29  |       (session) => session.id === first,
  30  |     )!
  31  |     expect(original.gradedDialogue!.state.variantId).toBe('counter')
  32  |     const bookmark = page.getByRole('button', {
  33  |       name: `收藏表达：${expression}`,
  34  |     })
  35  |     const layout = []
  36  |     for (const [width, scale] of [
  37  |       [320, 1],
  38  |       [390, 2],
  39  |     ]) {
  40  |       await page.setViewportSize({ width, height: 844 })
  41  |       await page.evaluate((scale) => {
  42  |         document.documentElement.style.fontSize = `${16 * scale}px`
  43  |       }, scale)
  44  |       await bookmark.scrollIntoViewIfNeeded()
  45  |       layout.push(
  46  |         await bookmark.evaluate((node) => ({
  47  |           rect: node.getBoundingClientRect().toJSON(),
  48  |           text: getComputedStyle(document.body).fontSize,
  49  |           clientWidth: document.documentElement.clientWidth,
  50  |           scrollWidth: document.documentElement.scrollWidth,
  51  |         })),
  52  |       )
  53  |       await page.screenshot({
  54  |         path: info.outputPath(`bookmark-${width}-${scale * 100}.png`),
  55  |       })
  56  |     }
  57  |     await bookmark.click()
> 58  |     await expect(page.getByRole('dialog')).toBeVisible()
      |                                            ^ Error: expect(locator).toBeVisible() failed
  59  |     await expect(page.getByRole('dialog')).toContainText(
  60  |       'coffee-order.C1.drink',
  61  |     )
  62  |     await page.screenshot({ path: info.outputPath('preview-390-200.png') })
  63  |     await page.getByRole('button', { name: '保存词句', exact: true }).click()
  64  |     await expect(page.getByRole('dialog')).toHaveCount(0)
  65  |     const captured = (await localState(page)).notebook[0]
  66  |     expect(captured.sources[0]).toMatchObject({
  67  |       sessionId: first,
  68  |       level: 'C1',
  69  |       sceneId: 'dining-01',
  70  |       questionId: 'coffee-order.C1.drink',
  71  |       originalText: expression,
  72  |     })
  73  |     await page.getByRole('button', { name: '撤销记录' }).click()
  74  |     await expect(page.getByText('已撤销本次记录。')).toBeVisible()
  75  |     expect((await localState(page)).notebook).toEqual([])
  76  |     await bookmark.click()
  77  |     await page.getByRole('button', { name: '保存词句', exact: true }).click()
  78  |     await page.getByRole('link', { name: '查看词句', exact: true }).click()
  79  |     await expect(
  80  |       page.getByRole('heading', { name: expression, exact: true }),
  81  |     ).toBeVisible()
  82  |     await expect(
  83  |       page.getByText('coffee-order.C1.drink', { exact: true }),
  84  |     ).toBeVisible()
  85  |     await page.setViewportSize({ width: 320, height: 844 })
  86  |     await page.screenshot({ path: info.outputPath('note-320-100.png') })
  87  |     await page.goto(`/session?id=${first}`)
  88  |     await page.getByRole('link', { name: '再练一轮新对话' }).click()
  89  |     await expect(
  90  |       page.getByRole('button', { name: '停止本次练习' }),
  91  |     ).toBeVisible()
  92  |     await expect
  93  |       .poll(() => new URL(page.url()).searchParams.get('id'))
  94  |       .not.toBe('new')
  95  |     const second = new URL(page.url()).searchParams.get('id')!
  96  |     const finalState = await localState(page)
  97  |     const next = finalState.sessions.find((session) => session.id === second)!
  98  |     expect(next.gradedDialogue!.state.variantId).toBe('planned')
  99  |     expect(finalState.sessions.find((session) => session.id === first)).toEqual(
  100 |       original,
  101 |     )
  102 |     await expect(
  103 |       page.getByText(
  104 |         '安排取餐：同一在售菜单及默认热黑咖啡；先确认饮品、堂食/外带、杯型。拓展练安排现在/稍后出杯和杯具方案，替代现场版的降温及点心，并非随机拼接。',
  105 |       ),
  106 |     ).toBeVisible()
  107 |     await writeFile(
  108 |       info.outputPath('state-and-layout.json'),
  109 |       JSON.stringify(
  110 |         { original, next, notebook: finalState.notebook, layout },
  111 |         null,
  112 |         2,
  113 |       ),
  114 |     )
  115 |     for (const row of layout) {
  116 |       expect(row.rect.width).toBeGreaterThanOrEqual(44)
  117 |       expect(row.rect.height).toBeGreaterThanOrEqual(44)
  118 |       expect(row.scrollWidth).toBe(row.clientWidth)
  119 |     }
  120 |   } finally {
  121 |     await finishNetwork(info)
  122 |   }
  123 | })
  124 | 
```