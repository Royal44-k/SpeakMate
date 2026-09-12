# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-notebook-native.spec.ts >> F/H: canonical two-source note, source A2 vs current B2, five-question real simulation and phase-owned stale recall; native source return
- Location: tests\e2e\task7-notebook-native.spec.ts:12:1

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://127.0.0.1:3130/session/report?id=simulation_a8fb22a8-bbb3-4805-9bc2-07866a7391f7"
Received: "http://127.0.0.1:3130/notebook/note?id=1e822e4c-e55c-4153-8fe2-b0a93ea6603f"
Timeout:  8000ms

Call log:
  - Expect "toHaveURL" with timeout 8000ms
    19 × locator resolved to <html lang="zh-CN" data-footer-visible="true">…</html>
       - unexpected value "http://127.0.0.1:3130/notebook/note?id=1e822e4c-e55c-4153-8fe2-b0a93ea6603f"

```

```yaml
- main:
  - link "退出本次练习":
    - /url: /notebook
  - text: 原文 · 短语
  - heading "for example" [level=1]
  - heading "来源与语境" [level=2]
  - text: 解析所用来源
  - combobox "解析所用来源":
    - option "1 · study-02 · A2" [selected]
    - option "2 · dining-01 · B2"
  - paragraph: What would you like help with on this sheet?
  - paragraph: ask-teacher.A2.focus
  - link "返回来源练习":
    - /url: /session?id=session_de54071c-2705-4592-9edf-5dd6bdbb4c6c
  - heading "校审资料 · 本地学习助手" [level=2]
  - paragraph: 不是通用 AI，不评判未收录文字的语义、语法或发音。
  - paragraph: 已匹配本场景的已编写条目；仅解释该情境用法，不是通用语义判定或能力评分。
  - strong: 本语境完整匹配
  - article:
    - paragraph: 例如，用来引出某一类别或解释的具体例子；一个例子本身不证明普遍规律。
    - text: 资料版本 1 · 模型辅助校审，非教师认证
    - group: 结构、用法与常见错点
    - group: 同来源等级例句
  - heading "把词句练起来" [level=2]
  - paragraph: 自评只代表自己的回忆情况；未收录内容不生成模拟或评分。
  - button "开始自我回忆"
  - button "本地跟读原文"
  - button "停止朗读"
  - button "用所选来源模拟练习"
  - heading "个人备注" [level=2]
  - paragraph: Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context. Synthetic for example learning context.
  - paragraph
  - button "编辑词句"
  - button "删除词句"
  - link "返回记录簿":
    - /url: /notebook
  - link "导出本机数据":
    - /url: /privacy
- navigation "主要导航":
  - link "目标":
    - /url: /
  - link "练习":
    - /url: /practice
  - link "场景":
    - /url: /scenes
  - link "记录簿":
    - /url: /notebook
  - link "我的":
    - /url: /me
- alert
- status
```

# Test source

```ts
  66  |   await page.getByRole('button', { name: '用所选来源模拟练习' }).click()
  67  |   await expect(
  68  |     page.getByText(/来源等级 A2；先回忆、自己造句，再完成 5 轮应用/),
  69  |   ).toBeVisible()
  70  |   await page.getByRole('button', { name: '开始这次定向练习' }).click()
  71  |   await expect(
  72  |     page.getByRole('heading', { name: '先回忆，再查看原文' }),
  73  |   ).toBeVisible()
  74  |   const simulationUrl = page.url(),
  75  |     id = new URL(simulationUrl).searchParams.get('id')!
  76  |   let state = await localState(page)
  77  |   let simulation = state.sessions.find((session) => session.id === id)!
  78  |   expect(state.profile[0].level).toBe('B2')
  79  |   expect(simulation.level).toBe('A2')
  80  |   expect(simulation.simulation!.source).toMatchObject({
  81  |     noteId: original.id,
  82  |     sourceId: originalSource.id,
  83  |     snapshot: originalSource,
  84  |   })
  85  |   expect(simulation.simulation!.descriptor.questionIds).toEqual([
  86  |     'ask-teacher.A2.focus',
  87  |     'ask-teacher.A2.instruction',
  88  |     'ask-teacher.A2.example',
  89  |     'ask-teacher.A2.contrast',
  90  |     'ask-teacher.A2.apply',
  91  |   ])
  92  |   expect(simulation.simulation!.recall).toBeUndefined()
  93  |   await expect(page.getByRole('button', { name: '提交这一轮' })).toHaveCount(0)
  94  |   const oldDraft = page.getByRole('textbox', { name: '我回忆的表达' })
  95  |   await oldDraft.fill('My original recall remains mine.')
  96  |   // Second real consumer advances the same stored phase. First tab must not
  97  |   // convert its older recall draft into a composition when its save loses.
  98  |   const other = await context.newPage()
  99  |   await other.goto(simulationUrl)
  100 |   await other
  101 |     .getByRole('textbox', { name: '我回忆的表达' })
  102 |     .fill('For example, a park.')
  103 |   await other.getByRole('button', { name: '保存回忆并查看' }).click()
  104 |   await expect(
  105 |     other.getByRole('textbox', { name: '我的替换或造句' }),
  106 |   ).toBeVisible()
  107 |   await page.getByRole('button', { name: '保存回忆并查看' }).click()
  108 |   await expect(page.getByRole('button', { name: '读取最新进度' })).toBeVisible()
  109 |   await page.getByRole('button', { name: '读取最新进度' }).click()
  110 |   await expect(page.getByText(/这份输入仍保留为原来的回忆草稿/)).toBeVisible()
  111 |   await expect(oldDraft).toHaveValue('My original recall remains mine.')
  112 |   await expect(
  113 |     page.getByRole('button', { name: '保存回忆并查看' }),
  114 |   ).toBeDisabled()
  115 |   await page.getByRole('link', { name: '退出本次练习' }).click()
  116 |   await page.getByRole('button', { name: '继续练习', exact: true }).click()
  117 |   expect(page.url()).toBe(simulationUrl)
  118 |   await expect(oldDraft).toHaveValue('My original recall remains mine.')
  119 |   await page.getByRole('button', { name: '取消本次输入' }).click()
  120 |   await expect(
  121 |     page.getByRole('textbox', { name: '我的替换或造句' }),
  122 |   ).toHaveValue('')
  123 |   await other.close()
  124 |   await page
  125 |     .getByRole('textbox', { name: '我的替换或造句' })
  126 |     .fill('For example, we can describe a friend.')
  127 |   await page.getByRole('button', { name: '保存造句并应用' }).click()
  128 |   await expect(
  129 |     page.getByRole('region', { name: '当前问题', exact: true }),
  130 |   ).toBeVisible()
  131 |   await page.reload()
  132 |   const actualAnswers: string[] = []
  133 |   for (let n = 0; n < 5; n++) actualAnswers.push(await answer(page))
  134 |   await expect(
  135 |     page.getByRole('button', { name: '确认结束并保存复盘' }),
  136 |   ).toBeVisible()
  137 |   await page.getByRole('button', { name: '确认结束并保存复盘' }).click()
  138 |   await expect(
  139 |     page.getByRole('heading', { name: '这轮已保存。' }),
  140 |   ).toBeVisible()
  141 |   state = await localState(page)
  142 |   simulation = state.sessions.find((session) => session.id === id)!
  143 |   expect(simulation.status).toBe('completed')
  144 |   expect(simulation.simulation!.recall!.text).toBe('For example, a park.')
  145 |   expect(simulation.simulation!.composition!.text).toBe(
  146 |     'For example, we can describe a friend.',
  147 |   )
  148 |   expect(state.turns.filter((turn) => turn.sessionId === id)).toHaveLength(5)
  149 |   expect(state.pointsLedger).toEqual([])
  150 |   await page.getByRole('link', { name: '查看本次复盘' }).click()
  151 |   const reportUrl = page.url()
  152 |   await page.getByRole('link', { name: '返回词句或记录簿' }).last().click()
  153 |   await expect(page).toHaveURL(noteUrl)
  154 |   await page.getByRole('link', { name: '返回记录簿', exact: true }).click()
  155 |   await expect(
  156 |     page.getByRole('textbox', { name: '搜索词句与备注' }),
  157 |   ).toHaveValue('for example')
  158 |   await expect(listLink).toBeFocused()
  159 |   expect(
  160 |     Math.abs((await page.evaluate(() => scrollY)) - listPosition),
  161 |   ).toBeLessThan(3)
  162 |   const returnedUrl = page.url()
  163 |   await page.goBack()
  164 |   const backUrl = page.url()
  165 |   await info.attach('actual-back-url', { body: JSON.stringify({ reportUrl, returnedUrl, backUrl }), contentType: 'application/json' })
> 166 |   await expect(page).toHaveURL(reportUrl)
      |                      ^ Error: expect(page).toHaveURL(expected) failed
  167 |   await page.goForward()
  168 |   await expect(page).toHaveURL(returnedUrl)
  169 |   await expect(page.getByRole('textbox', { name: '搜索词句与备注' })).toHaveValue('for example')
  170 |   await expect(listLink).toBeFocused()
  171 |   const forwardPosition = await page.evaluate(() => scrollY)
  172 |   expect(Math.abs(forwardPosition - listPosition)).toBeLessThan(3)
  173 |   expect(
  174 |     (await localState(page)).sessions.filter((session) => session.simulation),
  175 |   ).toHaveLength(1)
  176 |   await writeFile(
  177 |     info.outputPath('source-phase-history.json'),
  178 |     JSON.stringify(
  179 |       {
  180 |         state,
  181 |         studyId,
  182 |         noteUrl,
  183 |         simulationUrl,
  184 |         reportUrl,
  185 |         backUrl,
  186 |         forwardPosition,
  187 |         returnedUrl,
  188 |         listPosition,
  189 |         actualAnswers,
  190 |       },
  191 |       null,
  192 |       2,
  193 |     ),
  194 |   )
  195 |   await finishNetwork(info)
  196 | })
  197 | 
```