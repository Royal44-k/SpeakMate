# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-notebook-native.spec.ts >> F/H: canonical two-source note, source A2 vs current B2, five-question real simulation and phase-owned stale recall; native source return
- Location: tests\e2e\task7-notebook-native.spec.ts:12:1

# Error details

```
Error: expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 99.84
Received:    71.552
```

# Page snapshot

```yaml
- generic [ref=f16e1]:
  - alert [ref=f16e2]
  - main [ref=f16e3]:
    - generic [ref=f16e4]:
      - link "返回词句或记录簿" [ref=f16e5] [cursor=pointer]:
        - /url: /notebook/note?id=b3c440aa-b94c-4902-8e96-c0ef37eded1c
      - generic [ref=f16e8]:
        - paragraph [ref=f16e9]: SESSION RECORD
        - heading "本次复盘" [active] [level=1] [ref=f16e10]
    - generic [ref=f16e11]:
      - generic [ref=f16e12]:
        - heading "定向模拟练习记录" [level=2] [ref=f16e13]
        - paragraph [ref=f16e14]: 原表达：for example
        - paragraph [ref=f16e15]: 本次覆盖目标：for example
        - paragraph [ref=f16e16]: 回忆：For example, a park.
        - paragraph [ref=f16e17]: 造句：For example, we can describe a friend.
        - paragraph [ref=f16e18]: 独立路径 micro.study.for-example.A2 · v1；来源语料 v1。
        - generic [ref=f16e19]:
          - link "返回词句或记录簿" [ref=f16e20] [cursor=pointer]:
            - /url: /notebook/note?id=b3c440aa-b94c-4902-8e96-c0ef37eded1c
          - link "返回记录簿" [ref=f16e21] [cursor=pointer]:
            - /url: /notebook
      - heading "所选目标已确认 · 已确认结束并保存" [level=2] [ref=f16e22]
      - paragraph [ref=f16e23]: 流程状态与表达覆盖分开记录，不提供语法、词汇、自然度或发音分数。
    - generic [ref=f16e24]:
      - heading "本地覆盖与流程" [level=2] [ref=f16e25]
      - paragraph [ref=f16e26]: 已匹配表达：5 轮
      - paragraph [ref=f16e27]: 未匹配表达：0 轮
      - paragraph [ref=f16e28]: 帮助或停止操作：0 轮
      - paragraph [ref=f16e29]: 已提交 5 / 5 轮，其中非空表达 5 轮。匹配只确认本题已收录表达；未收录不代表说错，帮助操作不证明表达正确。
    - generic [ref=f16e30]:
      - heading "老师 Lee" [level=2] [ref=f16e31]
      - paragraph [ref=f16e32]: 这是已编写的课堂角色与回应演练（A2）；部分问题是在排练如何回应，并非角色逐字发言。完整文字材料在情境说明中；文字提到图表、图片或口头指令，不表示本页已提供对应图像或音频。
      - paragraph [ref=f16e33]: 虚构课堂，老师 Lee 与你看一张小练习纸，内容全部在题目中给出。桌上有铅笔、蓝笔和写着 apple / book 的图卡。Lee 已说：“Circle one word, then write a sentence.” 这是真正可请求重说的已给指令；尚未解释答案、批改或答应课后帮助。每道题引入自己的小例子，不要求外部课程知识。
    - generic [ref=f16e34]:
      - heading "原始对话与本题反馈" [level=2] [ref=f16e35]
      - generic [ref=f16e36]:
        - paragraph [ref=f16e37]: What would you like help with on this sheet?
        - button "记录词句" [ref=f16e38] [cursor=pointer]
      - article [ref=f16e39]:
        - heading "第 1 轮" [level=3] [ref=f16e40]
        - generic [ref=f16e41]:
          - text: 你
          - paragraph [ref=f16e42]: I need help reading the new words.
          - button "记录词句" [ref=f16e43] [cursor=pointer]
        - generic [ref=f16e44]:
          - text: 情境回复
          - paragraph [ref=f16e45]: What comes first in the instruction I gave?
          - button "记录词句" [ref=f16e46] [cursor=pointer]
        - generic [ref=f16e47]:
          - text: 本题规则反馈
          - paragraph [ref=f16e48]: 这次文字与本地已收录的参考表达匹配；这不是全面语法、语义或口语能力评估。
          - button "记录词句" [ref=f16e49] [cursor=pointer]
        - group [ref=f16e50]:
          - generic "当时对应题目的参考表达" [ref=f16e51] [cursor=pointer]
      - article [ref=f16e52]:
        - heading "第 2 轮" [level=3] [ref=f16e53]
        - generic [ref=f16e54]:
          - text: 你
          - paragraph [ref=f16e55]: First, we circle one word.
          - button "记录词句" [ref=f16e56] [cursor=pointer]
        - generic [ref=f16e57]:
          - text: 情境回复
          - paragraph [ref=f16e58]: Would a complete example or just a starting phrase help you?
          - button "记录词句" [ref=f16e59] [cursor=pointer]
        - generic [ref=f16e60]:
          - text: 本题规则反馈
          - paragraph [ref=f16e61]: 这次文字与本地已收录的参考表达匹配；这不是全面语法、语义或口语能力评估。
          - button "记录词句" [ref=f16e62] [cursor=pointer]
        - group [ref=f16e63]:
          - generic "当时对应题目的参考表达" [ref=f16e64] [cursor=pointer]
      - article [ref=f16e65]:
        - heading "第 3 轮" [level=3] [ref=f16e66]
        - generic [ref=f16e67]:
          - text: 你
          - paragraph [ref=f16e68]: A complete example would help me understand the task.
          - button "记录词句" [ref=f16e69] [cursor=pointer]
        - generic [ref=f16e70]:
          - text: 情境回复
          - paragraph [ref=f16e71]: Look at “a book” and “two books”. What do you notice?
          - button "记录词句" [ref=f16e72] [cursor=pointer]
        - generic [ref=f16e73]:
          - text: 本题规则反馈
          - paragraph [ref=f16e74]: 这次文字与本地已收录的参考表达匹配；这不是全面语法、语义或口语能力评估。
          - button "记录词句" [ref=f16e75] [cursor=pointer]
        - group [ref=f16e76]:
          - generic "当时对应题目的参考表达" [ref=f16e77] [cursor=pointer]
      - article [ref=f16e78]:
        - heading "第 4 轮" [level=3] [ref=f16e79]
        - generic [ref=f16e80]:
          - text: 你
          - paragraph [ref=f16e81]: The second example has an s at the end.
          - button "记录词句" [ref=f16e82] [cursor=pointer]
        - generic [ref=f16e83]:
          - text: 情境回复
          - paragraph [ref=f16e84]: Could you make a new example using “apple”?
          - button "记录词句" [ref=f16e85] [cursor=pointer]
        - generic [ref=f16e86]:
          - text: 本题规则反馈
          - paragraph [ref=f16e87]: 这次文字与本地已收录的参考表达匹配；这不是全面语法、语义或口语能力评估。
          - button "记录词句" [ref=f16e88] [cursor=pointer]
        - group [ref=f16e89]:
          - generic "当时对应题目的参考表达" [ref=f16e90] [cursor=pointer]
      - article [ref=f16e91]:
        - heading "第 5 轮" [level=3] [ref=f16e92]
        - generic [ref=f16e93]:
          - text: 你
          - paragraph [ref=f16e94]: "Yes: “one apple”."
          - button "记录词句" [ref=f16e95] [cursor=pointer]
        - generic [ref=f16e96]:
          - text: 情境回复
          - paragraph [ref=f16e97]: This short practice is complete. No real service or decision has been made.
          - button "记录词句" [ref=f16e98] [cursor=pointer]
        - generic [ref=f16e99]:
          - text: 本题规则反馈
          - paragraph [ref=f16e100]: 这次文字与本地已收录的参考表达匹配；这不是全面语法、语义或口语能力评估。
          - button "记录词句" [ref=f16e101] [cursor=pointer]
        - group [ref=f16e102]:
          - generic "当时对应题目的参考表达" [ref=f16e103] [cursor=pointer]
    - region [ref=f16e104]:
      - heading "你保存的表达" [level=2] [ref=f16e105]
      - paragraph [ref=f16e106]: 保留原文供回看与收藏，不因没有问题标签就判定为好表达。
      - article [ref=f16e107]:
        - paragraph [ref=f16e108]: I need help reading the new words.
        - button "收藏表达：I need help reading the new words." [ref=f16e109] [cursor=pointer]
      - article [ref=f16e112]:
        - paragraph [ref=f16e113]: First, we circle one word.
        - button "收藏表达：First, we circle one word." [ref=f16e114] [cursor=pointer]
      - article [ref=f16e117]:
        - paragraph [ref=f16e118]: A complete example would help me understand the task.
        - button "收藏表达：A complete example would help me understand the task." [ref=f16e119] [cursor=pointer]
      - article [ref=f16e122]:
        - paragraph [ref=f16e123]: The second example has an s at the end.
        - button "收藏表达：The second example has an s at the end." [ref=f16e124] [cursor=pointer]
      - article [ref=f16e127]:
        - paragraph [ref=f16e128]: "Yes: “one apple”."
        - 'button "收藏表达：Yes: “one apple”." [ref=f16e129] [cursor=pointer]'
    - navigation "复盘后操作" [ref=f16e132]:
      - link "回到今日练习" [ref=f16e133] [cursor=pointer]:
        - /url: /practice
      - link "换个场景" [ref=f16e134] [cursor=pointer]:
        - /url: /scenes
  - status [ref=f16e135]: 本次复盘
```

# Test source

```ts
  79  |     id = new URL(simulationUrl).searchParams.get('id')!
  80  |   let state = await localState(page)
  81  |   let simulation = state.sessions.find((session) => session.id === id)!
  82  |   expect(state.profile[0].level).toBe('B2')
  83  |   expect(simulation.level).toBe('A2')
  84  |   expect(simulation.simulation!.source).toMatchObject({
  85  |     noteId: original.id,
  86  |     sourceId: originalSource.id,
  87  |     snapshot: originalSource,
  88  |   })
  89  |   expect(simulation.simulation!.descriptor.questionIds).toEqual([
  90  |     'ask-teacher.A2.focus',
  91  |     'ask-teacher.A2.instruction',
  92  |     'ask-teacher.A2.example',
  93  |     'ask-teacher.A2.contrast',
  94  |     'ask-teacher.A2.apply',
  95  |   ])
  96  |   expect(simulation.simulation!.recall).toBeUndefined()
  97  |   await expect(page.getByRole('button', { name: '提交这一轮' })).toHaveCount(0)
  98  |   const oldDraft = page.getByRole('textbox', { name: '我回忆的表达' })
  99  |   await oldDraft.fill('My original recall remains mine.')
  100 |   // Second real consumer advances the same stored phase. First tab must not
  101 |   // convert its older recall draft into a composition when its save loses.
  102 |   const other = await context.newPage()
  103 |   await other.goto(simulationUrl)
  104 |   await other
  105 |     .getByRole('textbox', { name: '我回忆的表达' })
  106 |     .fill('For example, a park.')
  107 |   await other.getByRole('button', { name: '保存回忆并查看' }).click()
  108 |   await expect(
  109 |     other.getByRole('textbox', { name: '我的替换或造句' }),
  110 |   ).toBeVisible()
  111 |   await page.getByRole('button', { name: '保存回忆并查看' }).click()
  112 |   await expect(page.getByRole('button', { name: '读取最新进度' })).toBeVisible()
  113 |   await page.getByRole('button', { name: '读取最新进度' }).click()
  114 |   await expect(page.getByText(/这份输入仍保留为原来的回忆草稿/)).toBeVisible()
  115 |   await expect(oldDraft).toHaveValue('My original recall remains mine.')
  116 |   await expect(
  117 |     page.getByRole('button', { name: '保存回忆并查看' }),
  118 |   ).toBeDisabled()
  119 |   await page.getByRole('link', { name: '退出本次练习' }).click()
  120 |   await page.getByRole('button', { name: '继续练习', exact: true }).click()
  121 |   expect(page.url()).toBe(simulationUrl)
  122 |   await expect(oldDraft).toHaveValue('My original recall remains mine.')
  123 |   await page.getByRole('button', { name: '取消本次输入' }).click()
  124 |   await expect(
  125 |     page.getByRole('textbox', { name: '我的替换或造句' }),
  126 |   ).toHaveValue('')
  127 |   await other.close()
  128 |   await page
  129 |     .getByRole('textbox', { name: '我的替换或造句' })
  130 |     .fill('For example, we can describe a friend.')
  131 |   await page.getByRole('button', { name: '保存造句并应用' }).click()
  132 |   await expect(
  133 |     page.getByRole('region', { name: '当前问题', exact: true }),
  134 |   ).toBeVisible()
  135 |   await page.reload()
  136 |   const actualAnswers: string[] = []
  137 |   for (let n = 0; n < 5; n++) actualAnswers.push(await answer(page))
  138 |   await expect(
  139 |     page.getByRole('button', { name: '确认结束并保存复盘' }),
  140 |   ).toBeVisible()
  141 |   await page.getByRole('button', { name: '确认结束并保存复盘' }).click()
  142 |   await expect(
  143 |     page.getByRole('heading', { name: '这轮已保存。' }),
  144 |   ).toBeVisible()
  145 |   state = await localState(page)
  146 |   simulation = state.sessions.find((session) => session.id === id)!
  147 |   expect(simulation.status).toBe('completed')
  148 |   expect(simulation.simulation!.recall!.text).toBe('For example, a park.')
  149 |   expect(simulation.simulation!.composition!.text).toBe(
  150 |     'For example, we can describe a friend.',
  151 |   )
  152 |   expect(state.turns.filter((turn) => turn.sessionId === id)).toHaveLength(5)
  153 |   expect(state.pointsLedger).toEqual([])
  154 |   await page.getByRole('link', { name: '查看本次复盘' }).click()
  155 |   const reportUrl = page.url()
  156 |   navigationSnapshots.push(await navigationSnapshot())
  157 |   const originalViewport = page.viewportSize()!
  158 |   const typography = []
  159 |   const outcomeHeading = page.getByRole('heading', { name: '所选目标已确认 · 已确认结束并保存', exact: true })
  160 |   for (const [width, height, textScale] of [[320,568,100],[390,844,100],[390,844,200]]) {
  161 |     await page.setViewportSize({ width, height })
  162 |     await page.evaluate((percent) => document.documentElement.style.fontSize = `${percent}%`, textScale)
  163 |     await outcomeHeading.scrollIntoViewIfNeeded()
  164 |     const measurement = await outcomeHeading.evaluate((heading) => {
  165 |       const style = getComputedStyle(heading)
  166 |       const range = document.createRange()
  167 |       range.selectNodeContents(heading)
  168 |       const box = heading.getBoundingClientRect()
  169 |       return { text: heading.textContent, fontSize: Number.parseFloat(style.fontSize), lineHeight: Number.parseFloat(style.lineHeight), overflow: style.overflow,
  170 |         box: { left: box.left, right: box.right, top: box.top, bottom: box.bottom },
  171 |         rects: Array.from(range.getClientRects()).map((rect) => ({ top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right })),
  172 |         clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }
  173 |     })
  174 |     typography.push({ width, height, textScale, ...measurement })
  175 |     await page.screenshot({ path: info.outputPath(`report-outcome-${width}-${textScale}.png`) })
  176 |   }
  177 |   await writeFile(info.outputPath('report-typography.json'), JSON.stringify(typography, null, 2))
  178 |   for (const measurement of typography) {
> 179 |     expect(measurement.lineHeight).toBeGreaterThanOrEqual(measurement.fontSize * 1.2)
      |                                    ^ Error: expect(received).toBeGreaterThanOrEqual(expected)
  180 |     expect(measurement.scrollWidth).toBeLessThanOrEqual(measurement.clientWidth)
  181 |     expect(measurement.overflow).toBe('visible')
  182 |     for (const rect of measurement.rects) {
  183 |       expect(rect.left).toBeGreaterThanOrEqual(measurement.box.left - 1)
  184 |       expect(rect.right).toBeLessThanOrEqual(measurement.box.right + 1)
  185 |       expect(rect.top).toBeGreaterThanOrEqual(measurement.box.top - 1)
  186 |       expect(rect.bottom).toBeLessThanOrEqual(measurement.box.bottom + 1)
  187 |     }
  188 |     const lines = Array.from(new Set(measurement.rects.map((rect) => rect.top))).sort((a,b) => a-b)
  189 |     for (let line = 1; line < lines.length; line++) {
  190 |       const previousBottom = Math.max(...measurement.rects.filter((rect) => rect.top === lines[line-1]).map((rect) => rect.bottom))
  191 |       expect(lines[line]).toBeGreaterThanOrEqual(previousBottom - 0.5)
  192 |     }
  193 |   }
  194 |   await page.evaluate(() => document.documentElement.style.removeProperty('font-size'))
  195 |   await page.setViewportSize(originalViewport)
  196 |   const listReturn = page.getByRole('link', { name: '返回记录簿', exact: true })
  197 |   await listReturn.scrollIntoViewIfNeeded()
  198 |   await listReturn.focus()
  199 |   await expect(listReturn).toBeFocused()
  200 |   const reportAppearance = await listReturn.evaluate((link) => {
  201 |     const rect = link.getBoundingClientRect()
  202 |     const section = link.closest('section')!
  203 |     const heading = section.querySelector('h2')!
  204 |     return {
  205 |       width: rect.width,
  206 |       height: rect.height,
  207 |       top: rect.top,
  208 |       bottom: rect.bottom,
  209 |       viewportHeight: innerHeight,
  210 |       linkColor: getComputedStyle(link).color,
  211 |       headingColor: getComputedStyle(heading).color,
  212 |       background: getComputedStyle(section.closest('header')!).backgroundColor,
  213 |       outline: getComputedStyle(link).outlineStyle,
  214 |     }
  215 |   })
  216 |   expect(reportAppearance.height).toBeGreaterThanOrEqual(44)
  217 |   expect(reportAppearance.width).toBeGreaterThanOrEqual(44)
  218 |   expect(reportAppearance.top).toBeGreaterThanOrEqual(0)
  219 |   expect(reportAppearance.bottom).toBeLessThanOrEqual(
  220 |     reportAppearance.viewportHeight,
  221 |   )
  222 |   expect(reportAppearance.linkColor).toBe('rgb(255, 255, 255)')
  223 |   expect(reportAppearance.headingColor).toBe(reportAppearance.linkColor)
  224 |   expect(reportAppearance.outline).toBe('solid')
  225 |   const luminance = (color: string) =>
  226 |     color
  227 |       .match(/\d+/g)!
  228 |       .slice(0, 3)
  229 |       .map(Number)
  230 |       .map((part) => part / 255)
  231 |       .map((part) =>
  232 |         part <= 0.04045 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4,
  233 |       )
  234 |       .reduce(
  235 |         (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
  236 |         0,
  237 |       )
  238 |   const contrast =
  239 |     (luminance(reportAppearance.linkColor) + 0.05) /
  240 |     (luminance(reportAppearance.background) + 0.05)
  241 |   expect(contrast).toBeGreaterThanOrEqual(4.5)
  242 |   await page.screenshot({ path: info.outputPath('report-direct-return.png') })
  243 |   await expect(
  244 |     page.getByRole('link', { name: '返回词句或记录簿' }).last(),
  245 |   ).toHaveAttribute('href', new URL(noteUrl).pathname + new URL(noteUrl).search)
  246 |   await page.getByRole('link', { name: '返回记录簿', exact: true }).click()
  247 |   await expect(
  248 |     page.getByRole('textbox', { name: '搜索词句与备注' }),
  249 |   ).toHaveValue('for example')
  250 |   navigationSnapshots.push(await navigationSnapshot())
  251 |   await writeFile(info.outputPath('navigation-stages.json'), JSON.stringify(navigationSnapshots, null, 2))
  252 |   await expect(listLink).toBeFocused()
  253 |   expect(
  254 |     Math.abs((await page.evaluate(() => scrollY)) - listPosition),
  255 |   ).toBeLessThan(3)
  256 |   const returnedUrl = page.url()
  257 |   await page.goBack()
  258 |   const backUrl = page.url()
  259 |   await info.attach('actual-back-url', {
  260 |     body: JSON.stringify({ reportUrl, returnedUrl, backUrl }),
  261 |     contentType: 'application/json',
  262 |   })
  263 |   await expect(page).toHaveURL(reportUrl)
  264 |   await page.goForward()
  265 |   await expect(page).toHaveURL(returnedUrl)
  266 |   await expect(
  267 |     page.getByRole('textbox', { name: '搜索词句与备注' }),
  268 |   ).toHaveValue('for example')
  269 |   await expect(listLink).toBeFocused()
  270 |   const forwardPosition = await page.evaluate(() => scrollY)
  271 |   expect(Math.abs(forwardPosition - listPosition)).toBeLessThan(3)
  272 |   expect(
  273 |     (await localState(page)).sessions.filter((session) => session.simulation),
  274 |   ).toHaveLength(1)
  275 |   await writeFile(
  276 |     info.outputPath('source-phase-history.json'),
  277 |     JSON.stringify(
  278 |       {
  279 |         state,
```