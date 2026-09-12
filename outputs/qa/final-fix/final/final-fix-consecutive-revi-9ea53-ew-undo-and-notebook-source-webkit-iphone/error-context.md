# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: final-fix.spec.ts >> consecutive reviewed round, contextual bookmark preview/undo, and notebook source
- Location: tests\e2e\final-fix.spec.ts:11:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('dialog')
Expected substring: "coffee-order.C1.drink"
Received string:    "记录词句预览来源：dining-01 · C1 · coffee.C1.drink · turn_093f01d6-4b02-44c6-8ec2-59229c11a4d2待存原文The Americano sounds right. I am after a pronounced flavour, rather than choosing it for the caffeine.词句类型单词短语整句选词使用整句取消保存词句"
Timeout: 8000ms

Call log:
  - Expect "toContainText" with timeout 8000ms
  - waiting for getByRole('dialog')
    18 × locator resolved to <dialog open="" aria-labelledby="capture-title" class="notebook-module__FVsBHG__captureDialog">…</dialog>
       - unexpected value "记录词句预览来源：dining-01 · C1 · coffee.C1.drink · turn_093f01d6-4b02-44c6-8ec2-59229c11a4d2待存原文The Americano sounds right. I am after a pronounced flavour, rather than choosing it for the caffeine.词句类型单词短语整句选词使用整句取消保存词句"

```

```yaml
- dialog "记录词句预览":
  - heading "记录词句预览" [level=2]
  - paragraph: 来源：dining-01 · C1 · coffee.C1.drink · turn_093f01d6-4b02-44c6-8ec2-59229c11a4d2
  - text: 待存原文
  - textbox "待存原文": The Americano sounds right. I am after a pronounced flavour, rather than choosing it for the caffeine.
  - text: 词句类型
  - combobox "词句类型":
    - option "单词"
    - option "短语"
    - option "整句" [selected]
  - button "选词"
  - button "使用整句"
  - button "取消"
  - button "保存词句"
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
> 59  |     await expect(page.getByRole('dialog')).toContainText(
      |                                            ^ Error: expect(locator).toContainText(expected) failed
  60  |       'coffee-order.C1.drink',
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
  75  |       questionId: 'coffee-order.C1.drink',
  76  |       originalText: expression,
  77  |     })
  78  |     await page.getByRole('button', { name: '撤销记录' }).click()
  79  |     await expect(page.getByText('已撤销本次记录。')).toBeVisible()
  80  |     expect((await localState(page)).notebook).toEqual([])
  81  |     await bookmark.click()
  82  |     await page.getByRole('button', { name: '保存词句', exact: true }).click()
  83  |     await page.getByRole('link', { name: '查看词句', exact: true }).click()
  84  |     await expect(
  85  |       page.getByRole('heading', { name: expression, exact: true }),
  86  |     ).toBeVisible()
  87  |     await expect(
  88  |       page.getByText('coffee-order.C1.drink', { exact: true }),
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