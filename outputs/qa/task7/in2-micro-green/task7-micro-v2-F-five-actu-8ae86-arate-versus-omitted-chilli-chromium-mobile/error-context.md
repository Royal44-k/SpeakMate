# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-micro-v2.spec.ts >> F: five actual v2 source selections retain independent source levels and confirm separate versus omitted chilli
- Location: tests\e2e\task7-micro-v2.spec.ts:5:1

# Error details

```
Error: expect(received).toMatch(expected)

Expected pattern: /omit|leave.*out|no chilli|prefer none/i
Received string:  "Would you like the chilli left out or a little added, while keeping the other ingredients unchanged?·
记录词句"
```

# Page snapshot

```yaml
- generic [active] [ref=f20e1]:
  - alert [ref=f20e2]
  - main [ref=f20e3]:
    - generic [ref=f20e4]:
      - link "退出本次练习" [ref=f20e5] [cursor=pointer]:
        - /url: /notebook/note?id=2fa2d6d7-1aaa-459a-b6e8-d9180e85b654
      - generic [ref=f20e8]:
        - paragraph [ref=f20e9]: SpeakMate
        - heading "Dialogue Stage" [level=1] [ref=f20e10]
        - generic [ref=f20e11]: 情境演练 · 餐厅点餐
      - generic [ref=f20e12]:
        - strong [ref=f20e13]: 3 / 3
        - generic [ref=f20e14]: B2 · 已提交轮次
    - link "返回词句或记录簿" [ref=f20e15] [cursor=pointer]:
      - /url: /notebook/note?id=2fa2d6d7-1aaa-459a-b6e8-d9180e85b654
    - region "当前练习场景" [ref=f20e16]:
      - img "现代餐厅餐桌与菜单" [ref=f20e18]
    - region "完整情境与材料" [ref=f20e19]:
      - paragraph [ref=f20e20]: 定向应用 · 使用保存的来源等级与独立校审路径。这是新的固定情境，不沿用原对话事实；仅本地规则确认收录表达，不为造句、语义或发音评分。
      - heading "餐厅服务员角色" [level=2] [ref=f20e21]
      - paragraph [ref=f20e22]: 这是已编写的本地角色与回应演练，不是实时人员服务。请先阅读所选情境；问题可能包含排练提示，所有交易、安排与材料只属于练习。
      - paragraph [ref=f20e23]: 虚构餐厅，你与同行者用餐，分别选择自己的主食。顾客与服务员面谈：番茄意面和蘑菇意面均有货，均可选小份/普通份、辣椒、配菜和面包；默认不加辣椒、无配菜。无气水/气泡水免费，餐食约20分钟，吧台可安排较安静座位。短练仅选自己的主食、份量和饮品，标准再谈定制，拓展加现场服务细节；只是练习，不下单或扣款。
      - paragraph [ref=f20e24]: 帮助和改答也占用轮次；还可提交 0 轮。到上限可能仍有目标未确认，可结束后开启新一轮，不代表练习失败。
    - status [ref=f20e25]: 本地朗读暂时不可用，请直接阅读文字继续练习。
    - group [ref=f20e26]:
      - generic "本轮对话记录（3 轮）" [ref=f20e27] [cursor=pointer]
    - region "本轮结尾" [ref=f20e28]:
      - generic [ref=f20e29]:
        - generic [ref=f20e30]: 本地编写的情境问答
        - button "播放本地助手回复" [ref=f20e31] [cursor=pointer]
      - generic [ref=f20e35]:
        - paragraph [ref=f20e36]: This short practice is complete. No real service or decision has been made.
        - button "记录词句" [ref=f20e37] [cursor=pointer]
    - region "本轮表达反馈" [ref=f20e39]:
      - button "已匹配本地参考表达 本地收录范围有限，不作全面正确性评估" [ref=f20e40] [cursor=pointer]:
        - generic [ref=f20e44]:
          - strong [ref=f20e45]: 已匹配本地参考表达
          - generic [ref=f20e46]: 本地收录范围有限，不作全面正确性评估
    - button "停止本次练习" [ref=f20e49] [cursor=pointer]
    - generic [ref=f20e50]:
      - paragraph [ref=f20e51]: 所选流程的目标已确认，请确认结束。
      - button "确认结束并保存复盘" [ref=f20e52] [cursor=pointer]
  - status [ref=f20e53]: 正在准备对话舞台…
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test'
  2  | import { writeFile } from 'node:fs/promises'
  3  | import { localState, protect, onboard, enterScene, capture, answer } from './task7-browser-helpers'
  4  | 
  5  | test('F: five actual v2 source selections retain independent source levels and confirm separate versus omitted chilli', async ({ page, context, baseURL }, info) => {
  6  |   test.setTimeout(180000)
  7  |   const finishNetwork = await protect(context, baseURL!)
  8  |   await onboard(page)
  9  |   const results: unknown[] = []
  10 |   for (const level of ['A1', 'A2', 'B1', 'B2', 'C1']) {
  11 |     const separate = ['A1', 'A2'].includes(level)
  12 |     await enterScene(page, 'restaurant-order', level)
  13 |     const note = await capture(page, separate ? 'on the side' : 'No chilli, please.', separate ? 'phrase' : 'sentence')
  14 |     const selected = note.sources.at(-1)!
  15 |     await page.getByRole('link', { name: '查看词句', exact: true }).click()
  16 |     await page.getByLabel('解析所用来源').selectOption(selected.id)
  17 |     await expect(page.getByText('本语境完整匹配', { exact: true })).toBeVisible()
  18 |     await page.getByRole('button', { name: '用所选来源模拟练习' }).click()
  19 |     await page.getByRole('button', { name: '开始这次定向练习' }).click()
  20 |     await page.getByRole('textbox', { name: '我回忆的表达' }).fill(separate ? 'I remember serving separately.' : 'I remember leaving chilli out.')
  21 |     await page.getByRole('button', { name: '保存回忆并查看' }).click()
  22 |     await page.getByRole('textbox', { name: '我的替换或造句' }).fill(separate ? 'Could I have the chilli on the side?' : 'No chilli, please.')
  23 |     await page.getByRole('button', { name: '保存造句并应用' }).click()
  24 |     await expect(page.getByRole('region', { name: '当前问题', exact: true })).toBeVisible()
  25 |     const id = new URL(page.url()).searchParams.get('id')!
  26 |     const initial = (await localState(page)).sessions.find(session => session.id === id)!
  27 |     expect(initial.level).toBe(level)
  28 |     expect(initial.simulation!.source).toMatchObject({ noteId: note.id, sourceId: selected.id, snapshot: selected })
  29 |     expect(initial.simulation!.descriptor.version).toBe(2)
  30 |     expect(initial.simulation!.descriptor.questionIds).toHaveLength(3)
  31 |     await answer(page)
  32 |     await answer(page)
  33 |     const question = page.getByRole('group', { name: '当前应答问题' })
  34 |     const actualQuestion = await question.innerText()
  35 |     const actualAnswer = await answer(page)
  36 |     const terminal = (await localState(page)).sessions.find(session => session.id === id)!
  37 |     expect(terminal.gradedDialogue!.state.facts.find(fact => fact.key === 'chilli')?.value).toBe(separate ? 'separate' : 'no')
> 38 |     expect(actualQuestion).toMatch(separate ? /side|separat/i : /omit|leave.*out|no chilli|prefer none/i)
     |                            ^ Error: expect(received).toMatch(expected)
  39 |     expect(actualAnswer).toMatch(separate ? /side|separat/i : /omit|leave.*out|no chilli/i)
  40 |     await page.getByRole('button', { name: '确认结束并保存复盘' }).click()
  41 |     await expect(page.getByRole('heading', { name: '这轮已保存。' })).toBeVisible()
  42 |     await page.reload()
  43 |     const saved = (await localState(page)).sessions.find(session => session.id === id)!
  44 |     expect(saved.status).toBe('completed')
  45 |     expect(saved.gradedDialogue).toEqual(terminal.gradedDialogue)
  46 |     results.push({ level, actualQuestion, actualAnswer, session: saved })
  47 |   }
  48 |   expect((await localState(page)).notebook).toHaveLength(2)
  49 |   expect((await localState(page)).pointsLedger).toEqual([])
  50 |   await writeFile(info.outputPath('v2-five-real-simulations.json'), JSON.stringify(results, null, 2))
  51 |   await finishNetwork(info)
  52 | })
  53 | 
```