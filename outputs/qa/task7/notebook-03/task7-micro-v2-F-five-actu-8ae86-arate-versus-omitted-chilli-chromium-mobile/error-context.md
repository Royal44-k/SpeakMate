# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-micro-v2.spec.ts >> F: five actual v2 source selections retain independent source levels and confirm separate versus omitted chilli
- Location: tests\e2e\task7-micro-v2.spec.ts:5:1

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: '查看词句', exact: true })
    - locator resolved to <a href="/notebook/note?id=520c38a1-de17-450d-892a-dd377d42ff1f&from=%2Fsession%3Fid%3Dsession_fb25e6ca-840f-4418-8bec-0e2e73d027a3%26scene%3Drestaurant-order%26level%3DA1%26mode%3Dshort">查看词句</a>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button type="button" aria-label="改用键盘输入" class="speech-control-module__L4j3ea__keyboardButton">…</button> from <main class="practice-stage-module__lxND8G__stage">…</main> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button type="button" aria-label="改用键盘输入" class="speech-control-module__L4j3ea__keyboardButton">…</button> from <main class="practice-stage-module__lxND8G__stage">…</main> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    19 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <button type="button" aria-label="改用键盘输入" class="speech-control-module__L4j3ea__keyboardButton">…</button> from <main class="practice-stage-module__lxND8G__stage">…</main> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=f3e1]:
  - alert [ref=f3e2]
  - main [ref=f3e3]:
    - generic [ref=f3e4]:
      - link "退出本次练习" [ref=f3e5] [cursor=pointer]:
        - /url: /scenes?level=A1
      - generic [ref=f3e8]:
        - paragraph [ref=f3e9]: SpeakMate
        - heading "Dialogue Stage" [level=1] [ref=f3e10]
        - generic [ref=f3e11]: 情境演练 · 餐厅点餐
      - generic [ref=f3e12]:
        - strong [ref=f3e13]: 0 / 3
        - generic [ref=f3e14]: A1 · 已提交轮次
    - region "当前练习场景" [ref=f3e15]:
      - img "现代餐厅餐桌与菜单" [ref=f3e17]
    - region "完整情境与材料" [ref=f3e18]:
      - heading "餐厅服务员角色" [level=2] [ref=f3e19]
      - paragraph [ref=f3e20]: 这是已编写的本地角色与回应演练，不是实时人员服务。请先阅读所选情境；问题可能包含排练提示，所有交易、安排与材料只属于练习。
      - paragraph [ref=f3e21]: 虚构餐厅，你与同行者用餐，分别选择自己的主食。顾客与服务员面谈：番茄意面和蘑菇意面均有货，均可选小份/普通份、辣椒、配菜和面包；默认不加辣椒、无配菜。无气水/气泡水免费，餐食约20分钟，吧台可安排较安静座位。短练仅选自己的主食、份量和饮品，标准再谈定制，拓展加现场服务细节；只是练习，不下单或扣款。
      - paragraph [ref=f3e22]: 帮助和改答也占用轮次；还可提交 3 轮。到上限可能仍有目标未确认，可结束后开启新一轮，不代表练习失败。
    - region "当前问题" [ref=f3e23]:
      - generic [ref=f3e24]:
        - generic [ref=f3e25]: 本地编写的情境问答
        - button "播放本地助手回复" [ref=f3e26] [cursor=pointer]
      - group "当前应答问题" [ref=f3e29]:
        - generic [ref=f3e30]:
          - paragraph [ref=f3e31]: Tomato pasta or mushroom pasta?
          - button "记录词句" [active] [ref=f3e32] [cursor=pointer]
      - paragraph [ref=f3e33]: 选番茄意面或蘑菇意面。
    - group [ref=f3e34]:
      - generic "本题参考表达" [ref=f3e35] [cursor=pointer]
    - region "帮助与调整" [ref=f3e36]:
      - button "请再解释一下" [ref=f3e37] [cursor=pointer]
      - button "我需要表达提示" [ref=f3e38] [cursor=pointer]
      - button "帮我回到当前问题" [ref=f3e39] [cursor=pointer]
    - button "停止本次练习" [ref=f3e40] [cursor=pointer]
    - region "语音输入" [ref=f3e42]:
      - generic [ref=f3e43]:
        - button "开始录音" [ref=f3e48] [cursor=pointer]:
          - generic [ref=f3e51]: 按住说英语
        - generic [ref=f3e55]: 最长 30 秒 · 录音不会保存
        - button "改用键盘输入" [ref=f3e56] [cursor=pointer]:
          - strong [ref=f3e59]: 键盘输入
  - status [ref=f3e60]:
    - paragraph [ref=f3e61]: 已记录
    - link "查看词句" [ref=f3e62] [cursor=pointer]:
      - /url: /notebook/note?id=520c38a1-de17-450d-892a-dd377d42ff1f&from=%2Fsession%3Fid%3Dsession_fb25e6ca-840f-4418-8bec-0e2e73d027a3%26scene%3Drestaurant-order%26level%3DA1%26mode%3Dshort
    - button "撤销记录" [ref=f3e63] [cursor=pointer]
  - status [ref=f3e64]: 正在准备对话舞台…
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
> 15 |     await page.getByRole('link', { name: '查看词句', exact: true }).click()
     |                                                                 ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
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
  38 |     expect(actualQuestion).toMatch(separate ? /side|separat/i : /omit|leave.*out|no chilli/i)
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