# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: final-fix.spec.ts >> consecutive reviewed round, contextual bookmark preview/undo, and notebook source
- Location: tests\e2e\final-fix.spec.ts:11:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 28

- Array []
+ Array [
+   Object {
+     "createdAt": "2026-09-12T11:56:08.125Z",
+     "deletedAt": "2026-09-12T11:56:08.196Z",
+     "favoriteIds": Array [],
+     "id": "1ba9e1c5-4363-448d-9a05-682bb6a8c72c",
+     "kind": "sentence",
+     "normalizedText": "the americano sounds right. i am after a pronounced flavour, rather than choosing it for the caffeine",
+     "notes": "",
+     "profileId": "guest_3365186d-4bdf-4d58-8c20-069d267845a9",
+     "sources": Array [
+       Object {
+         "createdAt": "2026-09-12T11:56:08.125Z",
+         "id": "7270d0dd-f046-4063-985b-de0d12bcdc49",
+         "kind": "turn",
+         "level": "C1",
+         "originalText": "The Americano sounds right. I am after a pronounced flavour, rather than choosing it for the caffeine.",
+         "questionId": "coffee.C1.drink",
+         "sceneId": "dining-01",
+         "sessionId": "session_9e2aac92-9a9b-4b22-b741-bbdf3b4249a5",
+         "turnId": "turn_83e0fbe9-fe1e-4343-b209-5f7fc1beb0c6",
+       },
+     ],
+     "tags": Array [],
+     "text": "The Americano sounds right. I am after a pronounced flavour, rather than choosing it for the caffeine.",
+     "updatedAt": "2026-09-12T11:56:08.196Z",
+   },
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=f4e1]:
  - alert [ref=f4e2]
  - main [ref=f4e3]:
    - generic [ref=f4e4]:
      - link "返回我的练习" [ref=f4e5] [cursor=pointer]:
        - /url: /me
      - generic [ref=f4e8]:
        - paragraph [ref=f4e9]: SESSION RECORD
        - heading "本次复盘" [level=1] [ref=f4e10]
    - generic [ref=f4e11]:
      - heading "所选目标已确认 · 已确认结束并保存" [level=2] [ref=f4e12]
      - paragraph [ref=f4e13]: 流程状态与表达覆盖分开记录，不提供语法、词汇、自然度或发音分数。
    - generic [ref=f4e14]:
      - heading "本地覆盖与流程" [level=2] [ref=f4e15]
      - paragraph [ref=f4e16]: 已匹配表达：3 轮
      - paragraph [ref=f4e17]: 未匹配表达：0 轮
      - paragraph [ref=f4e18]: 帮助或停止操作：0 轮
      - paragraph [ref=f4e19]: 已提交 3 / 3 轮，其中非空表达 3 轮。匹配只确认本题已收录表达；未收录不代表说错，帮助操作不证明表达正确。
    - generic [ref=f4e20]:
      - heading "咖啡师角色" [level=2] [ref=f4e21]
      - paragraph [ref=f4e22]: 这是已编写的本地角色与回应演练，不是实时人员服务。请先阅读所选情境；问题可能包含排练提示，所有交易、安排与材料只属于练习。
      - paragraph [ref=f4e23]: 现场点单：美式和滴滤均有货，默认热饮、不加奶不加糖。短练确认饮品、杯型及堂食/外带；标准练加个性化和支付方式；拓展再确定收据、取餐称呼、降温及点心。只是练习，不代表真实支付或出单。
    - generic [ref=f4e24]:
      - heading "原始对话与本题反馈" [level=2] [ref=f4e25]
      - generic [ref=f4e26]:
        - paragraph [ref=f4e27]: The Americano is the more assertive option; the filter coffee is subtler. What sort of flavour are you after?
        - button "记录词句" [ref=f4e28] [cursor=pointer]
      - article [ref=f4e29]:
        - heading "第 1 轮" [level=3] [ref=f4e30]
        - generic [ref=f4e31]:
          - text: 你
          - paragraph [ref=f4e32]: The Americano sounds right. I am after a pronounced flavour, rather than choosing it for the caffeine.
          - button "记录词句" [ref=f4e33] [cursor=pointer]
        - generic [ref=f4e34]:
          - text: 情境回复
          - paragraph [ref=f4e35]: The larger cup works out better per millilitre, though that may not make it better value for you. Which size would you prefer?
          - button "记录词句" [ref=f4e36] [cursor=pointer]
        - generic [ref=f4e37]:
          - text: 本题规则反馈
          - paragraph [ref=f4e38]: 这次文字与本地已收录的参考表达匹配；这不是全面语法、语义或口语能力评估。
          - button "记录词句" [ref=f4e39] [cursor=pointer]
        - group [ref=f4e40]:
          - generic "当时对应题目的参考表达" [ref=f4e41] [cursor=pointer]
      - article [ref=f4e42]:
        - heading "第 2 轮" [level=3] [ref=f4e43]
        - generic [ref=f4e44]:
          - text: 你
          - paragraph [ref=f4e45]: Small, please. The lower unit price is beside the point if I end up leaving half of it.
          - button "记录词句" [ref=f4e46] [cursor=pointer]
        - generic [ref=f4e47]:
          - text: 情境回复
          - paragraph [ref=f4e48]: There is space to sit in, although I cannot promise it will remain quiet. Would staying or taking it away suit you better?
          - button "记录词句" [ref=f4e49] [cursor=pointer]
        - generic [ref=f4e50]:
          - text: 本题规则反馈
          - paragraph [ref=f4e51]: 这次文字与本地已收录的参考表达匹配；这不是全面语法、语义或口语能力评估。
          - button "记录词句" [ref=f4e52] [cursor=pointer]
        - group [ref=f4e53]:
          - generic "当时对应题目的参考表达" [ref=f4e54] [cursor=pointer]
      - article [ref=f4e55]:
        - heading "第 3 轮" [level=3] [ref=f4e56]
        - generic [ref=f4e57]:
          - text: 你
          - paragraph [ref=f4e58]: I will stay. I am not expecting silence; I just need somewhere to pause between appointments.
          - button "记录词句" [ref=f4e59] [cursor=pointer]
        - generic [ref=f4e60]:
          - text: 情境回复
          - paragraph [ref=f4e61]: Your drink, size and serving choice are noted. This practice is complete; no real order has been placed.
          - button "记录词句" [ref=f4e62] [cursor=pointer]
        - generic [ref=f4e63]:
          - text: 本题规则反馈
          - paragraph [ref=f4e64]: 这次文字与本地已收录的参考表达匹配；这不是全面语法、语义或口语能力评估。
          - button "记录词句" [ref=f4e65] [cursor=pointer]
        - group [ref=f4e66]:
          - generic "当时对应题目的参考表达" [ref=f4e67] [cursor=pointer]
    - region [ref=f4e68]:
      - heading "你保存的表达" [level=2] [ref=f4e69]
      - paragraph [ref=f4e70]: 保留原文供回看与收藏，不因没有问题标签就判定为好表达。
      - article [ref=f4e71]:
        - paragraph [ref=f4e72]: The Americano sounds right. I am after a pronounced flavour, rather than choosing it for the caffeine.
        - button "收藏表达：The Americano sounds right. I am after a pronounced flavour, rather than choosing it for the caffeine." [ref=f4e73] [cursor=pointer]
      - article [ref=f4e76]:
        - paragraph [ref=f4e77]: Small, please. The lower unit price is beside the point if I end up leaving half of it.
        - button "收藏表达：Small, please. The lower unit price is beside the point if I end up leaving half of it." [ref=f4e78] [cursor=pointer]
      - article [ref=f4e81]:
        - paragraph [ref=f4e82]: I will stay. I am not expecting silence; I just need somewhere to pause between appointments.
        - button "收藏表达：I will stay. I am not expecting silence; I just need somewhere to pause between appointments." [ref=f4e83] [cursor=pointer]
    - navigation "复盘后操作" [ref=f4e86]:
      - link "回到今日练习" [ref=f4e87] [cursor=pointer]:
        - /url: /practice
      - link "换个场景" [ref=f4e88] [cursor=pointer]:
        - /url: /scenes
  - status [ref=f4e89]: 已撤销本次记录。
  - status [ref=f4e90]: 本次复盘
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
  58  |     await expect(page.getByRole('dialog')).toBeVisible()
  59  |     await expect(page.getByRole('dialog')).toContainText(
  60  |       'coffee.C1.drink',
  61  |     )
  62  |     await page.screenshot({ path: info.outputPath('preview-390-200.png') })
  63  |     await page.setViewportSize({ width: 320, height: 844 })
  64  |     await page.evaluate(() => {
  65  |       document.documentElement.style.fontSize = '16px'
  66  |     })
  67  |     await page.screenshot({ path: info.outputPath('preview-320-100.png') })
  68  |     await page.getByRole('button', { name: '保存词句', exact: true }).click()
  69  |     await expect(page.getByRole('dialog')).toHaveCount(0)
  70  |     const captured = (await localState(page)).notebook[0]
  71  |     expect(captured.sources[0]).toMatchObject({
  72  |       sessionId: first,
  73  |       level: 'C1',
  74  |       sceneId: 'dining-01',
  75  |       questionId: 'coffee.C1.drink',
  76  |       originalText: expression,
  77  |     })
  78  |     await page.getByRole('button', { name: '撤销记录' }).click()
  79  |     await expect(page.getByText('已撤销本次记录。')).toBeVisible()
> 80  |     expect((await localState(page)).notebook).toEqual([])
      |                                               ^ Error: expect(received).toEqual(expected) // deep equality
  81  |     await bookmark.click()
  82  |     await page.getByRole('button', { name: '保存词句', exact: true }).click()
  83  |     await page.getByRole('link', { name: '查看词句', exact: true }).click()
  84  |     await expect(
  85  |       page.getByRole('heading', { name: expression, exact: true }),
  86  |     ).toBeVisible()
  87  |     await expect(
  88  |       page.getByText('coffee.C1.drink', { exact: true }),
  89  |     ).toBeVisible()
  90  |     await page.setViewportSize({ width: 320, height: 844 })
  91  |     await page.screenshot({ path: info.outputPath('note-320-100.png') })
  92  |     await page.getByRole('link', { name: '返回记录簿', exact: true }).click()
  93  |     await expect(
  94  |       page.getByRole('heading', { name: expression, exact: true }),
  95  |     ).toBeVisible()
  96  |     await page.goto(`/session?id=${first}`)
  97  |     await page.getByRole('link', { name: '再练一轮新对话' }).click()
  98  |     await expect(
  99  |       page.getByRole('button', { name: '停止本次练习' }),
  100 |     ).toBeVisible()
  101 |     await expect
  102 |       .poll(() => new URL(page.url()).searchParams.get('id'))
  103 |       .not.toBe('new')
  104 |     const second = new URL(page.url()).searchParams.get('id')!
  105 |     const finalState = await localState(page)
  106 |     const next = finalState.sessions.find((session) => session.id === second)!
  107 |     expect(next.gradedDialogue!.state.variantId).toBe('planned')
  108 |     expect(finalState.sessions.find((session) => session.id === first)).toEqual(
  109 |       original,
  110 |     )
  111 |     await expect(
  112 |       page.getByText(
  113 |         '安排取餐：同一在售菜单及默认热黑咖啡；先确认饮品、堂食/外带、杯型。拓展练安排现在/稍后出杯和杯具方案，替代现场版的降温及点心，并非随机拼接。',
  114 |       ),
  115 |     ).toBeVisible()
  116 |     await writeFile(
  117 |       info.outputPath('state-and-layout.json'),
  118 |       JSON.stringify(
  119 |         { original, next, notebook: finalState.notebook, layout },
  120 |         null,
  121 |         2,
  122 |       ),
  123 |     )
  124 |     for (const row of layout) {
  125 |       expect(row.rect.width).toBeGreaterThanOrEqual(44)
  126 |       expect(row.rect.height).toBeGreaterThanOrEqual(44)
  127 |       expect(row.scrollWidth).toBe(row.clientWidth)
  128 |     }
  129 |   } finally {
  130 |     await finishNetwork(info)
  131 |   }
  132 | })
  133 | 
```