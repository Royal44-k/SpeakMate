# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-micro-v2.spec.ts >> F: five actual v2 source selections retain independent source levels and confirm separate versus omitted chilli
- Location: tests\e2e\task7-micro-v2.spec.ts:5:1

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "How would you make clear whether chilli should be omitted or added, without suggesting changes to the rest of the dish?"
Received string:    "How would you balance having enough to eat against the possibility of leaving food?·
记录词句"
```

# Page snapshot

```yaml
- generic [active] [ref=f25e1]:
  - alert [ref=f25e2]
  - main [ref=f25e3]:
    - generic [ref=f25e4]:
      - link "退出本次练习" [ref=f25e5] [cursor=pointer]:
        - /url: /notebook/note?id=4afd1c1c-74bf-4375-937d-bde1e0081acc
      - generic [ref=f25e8]:
        - paragraph [ref=f25e9]: SpeakMate
        - heading "Dialogue Stage" [level=1] [ref=f25e10]
        - generic [ref=f25e11]: 情境演练 · 餐厅点餐
      - generic [ref=f25e12]:
        - strong [ref=f25e13]: 3 / 3
        - generic [ref=f25e14]: C1 · 已提交轮次
    - link "返回词句或记录簿" [ref=f25e15] [cursor=pointer]:
      - /url: /notebook/note?id=4afd1c1c-74bf-4375-937d-bde1e0081acc
    - region "当前练习场景" [ref=f25e16]:
      - img "现代餐厅餐桌与菜单" [ref=f25e18]
    - region "完整情境与材料" [ref=f25e19]:
      - paragraph [ref=f25e20]: 定向应用 · 使用保存的来源等级与独立校审路径。这是新的固定情境，不沿用原对话事实；仅本地规则确认收录表达，不为造句、语义或发音评分。
      - heading "餐厅服务员角色" [level=2] [ref=f25e21]
      - paragraph [ref=f25e22]: 这是已编写的本地角色与回应演练，不是实时人员服务。请先阅读所选情境；问题可能包含排练提示，所有交易、安排与材料只属于练习。
      - paragraph [ref=f25e23]: 虚构餐厅，你与同行者用餐，分别选择自己的主食。顾客与服务员面谈：番茄意面和蘑菇意面均有货，均可选小份/普通份、辣椒、配菜和面包；默认不加辣椒、无配菜。无气水/气泡水免费，餐食约20分钟，吧台可安排较安静座位。短练仅选自己的主食、份量和饮品，标准再谈定制，拓展加现场服务细节；只是练习，不下单或扣款。
      - paragraph [ref=f25e24]: 帮助和改答也占用轮次；还可提交 0 轮。到上限可能仍有目标未确认，可结束后开启新一轮，不代表练习失败。
    - status [ref=f25e25]: 本地朗读暂时不可用，请直接阅读文字继续练习。
    - group [ref=f25e26]:
      - generic "本轮对话记录（3 轮）" [ref=f25e27] [cursor=pointer]
    - region "本轮结尾" [ref=f25e28]:
      - generic [ref=f25e29]:
        - generic [ref=f25e30]: 本地编写的情境问答
        - button "播放本地助手回复" [ref=f25e31] [cursor=pointer]
      - generic [ref=f25e35]:
        - paragraph [ref=f25e36]: This short practice is complete. No real service or decision has been made.
        - button "记录词句" [ref=f25e37] [cursor=pointer]
    - region "本轮表达反馈" [ref=f25e39]:
      - button "已匹配本地参考表达 本地收录范围有限，不作全面正确性评估" [ref=f25e40] [cursor=pointer]:
        - generic [ref=f25e44]:
          - strong [ref=f25e45]: 已匹配本地参考表达
          - generic [ref=f25e46]: 本地收录范围有限，不作全面正确性评估
    - button "停止本次练习" [ref=f25e49] [cursor=pointer]
    - generic [ref=f25e50]:
      - paragraph [ref=f25e51]: 所选流程的目标已确认，请确认结束。
      - button "确认结束并保存复盘" [ref=f25e52] [cursor=pointer]
  - status [ref=f25e53]: 正在准备对话舞台…
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
  10 |   const expectedQuestions: Record<string, string> = {
  11 |     A1: 'Chilli mixed into the pasta, or on the side?',
  12 |     A2: 'Would you like a little chilli mixed into your pasta, or served on the side?',
  13 |     B1: 'Would you like chilli in your pasta, or would you prefer none? Tell me your preference.',
  14 |     B2: 'Would you like the chilli left out or a little added, while keeping the other ingredients unchanged?',
  15 |     C1: 'How would you make clear whether chilli should be omitted or added, without suggesting changes to the rest of the dish?',
  16 |   }
  17 |   for (const level of ['A1', 'A2', 'B1', 'B2', 'C1']) {
  18 |     const separate = ['A1', 'A2'].includes(level)
  19 |     await enterScene(page, 'restaurant-order', level)
  20 |     const note = await capture(page, separate ? 'on the side' : 'No chilli, please.', separate ? 'phrase' : 'sentence')
  21 |     const selected = note.sources.at(-1)!
  22 |     await page.getByRole('link', { name: '查看词句', exact: true }).click()
  23 |     await page.getByLabel('解析所用来源').selectOption(selected.id)
  24 |     await expect(page.getByText('本语境完整匹配', { exact: true })).toBeVisible()
  25 |     await page.getByRole('button', { name: '用所选来源模拟练习' }).click()
  26 |     await page.getByRole('button', { name: '开始这次定向练习' }).click()
  27 |     await page.getByRole('textbox', { name: '我回忆的表达' }).fill(separate ? 'I remember serving separately.' : 'I remember leaving chilli out.')
  28 |     await page.getByRole('button', { name: '保存回忆并查看' }).click()
  29 |     await page.getByRole('textbox', { name: '我的替换或造句' }).fill(separate ? 'Could I have the chilli on the side?' : 'No chilli, please.')
  30 |     await page.getByRole('button', { name: '保存造句并应用' }).click()
  31 |     await expect(page.getByRole('region', { name: '当前问题', exact: true })).toBeVisible()
  32 |     const id = new URL(page.url()).searchParams.get('id')!
  33 |     const initial = (await localState(page)).sessions.find(session => session.id === id)!
  34 |     expect(initial.level).toBe(level)
  35 |     expect(initial.simulation!.source).toMatchObject({ noteId: note.id, sourceId: selected.id, snapshot: selected })
  36 |     expect(initial.simulation!.descriptor.version).toBe(2)
  37 |     expect(initial.simulation!.descriptor.questionIds).toHaveLength(3)
  38 |     await answer(page)
  39 |     await answer(page)
  40 |     const question = page.getByRole('group', { name: '当前应答问题' })
  41 |     const actualQuestion = await question.innerText()
  42 |     const actualAnswer = await answer(page)
  43 |     const terminal = (await localState(page)).sessions.find(session => session.id === id)!
  44 |     expect(terminal.gradedDialogue!.state.facts.find(fact => fact.key === 'chilli')?.value).toBe(separate ? 'separate' : 'no')
> 45 |     expect(actualQuestion).toContain(expectedQuestions[level])
     |                            ^ Error: expect(received).toContain(expected) // indexOf
  46 |     expect(actualAnswer).toMatch(separate ? /side|separat/i : /omit|leave.*out|no chilli/i)
  47 |     await page.getByRole('button', { name: '确认结束并保存复盘' }).click()
  48 |     await expect(page.getByRole('heading', { name: '这轮已保存。' })).toBeVisible()
  49 |     await page.reload()
  50 |     const saved = (await localState(page)).sessions.find(session => session.id === id)!
  51 |     expect(saved.status).toBe('completed')
  52 |     expect(saved.gradedDialogue).toEqual(terminal.gradedDialogue)
  53 |     results.push({ level, actualQuestion, actualAnswer, session: saved })
  54 |   }
  55 |   expect((await localState(page)).notebook).toHaveLength(2)
  56 |   expect((await localState(page)).pointsLedger).toEqual([])
  57 |   await writeFile(info.outputPath('v2-five-real-simulations.json'), JSON.stringify(results, null, 2))
  58 |   await finishNetwork(info)
  59 | })
  60 | 
```