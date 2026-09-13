# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-coverage-browser.spec.ts >> F: partial fragment targets only selected coverage, legal cross-note source-ID collision stays note-owned, unknown text offers self-review without simulation
- Location: tests\e2e\task7-coverage-browser.spec.ts:5:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('仅部分片段有覆盖', { exact: true })
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for getByText('仅部分片段有覆盖', { exact: true })

```

```yaml
- main:
  - link "退出本次练习":
    - /url: /notebook
  - text: 原文 · 整句
  - heading "I can say for example about a park." [level=1]
  - heading "来源与语境" [level=2]
  - text: 解析所用来源
  - combobox "解析所用来源":
    - option "1 · study-02 · A2" [selected]
  - paragraph: Would a complete example or just a starting phrase help you?
  - paragraph: ask-teacher.A2.example
  - link "返回来源练习":
    - /url: /session?id=session_b088de65-13c3-47b4-8e0b-d611050933f9
  - heading "校审资料 · 本地学习助手" [level=2]
  - paragraph: 不是通用 AI，不评判未收录文字的语义、语法或发音。
  - paragraph: 本地未收录可靠匹配。保留原文，可以保存、记笔记和自行回忆，不编造语法纠正。
  - strong: 当前本地资料未收录
  - heading "把词句练起来" [level=2]
  - paragraph: 自评只代表自己的回忆情况；未收录内容不生成模拟或评分。
  - button "开始自我回忆"
  - button "本地跟读原文"
  - button "停止朗读"
  - heading "个人备注" [level=2]
  - paragraph: 还没有备注。
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
- status: I can say for example about a park.
```

# Test source

```ts
  1  | import {expect,test} from '@playwright/test'
  2  | import {readFile,writeFile} from 'node:fs/promises'
  3  | import {onboard,enterScene,capture,localState,protect,answer} from './task7-browser-helpers'
  4  | 
  5  | test('F: partial fragment targets only selected coverage, legal cross-note source-ID collision stays note-owned, unknown text offers self-review without simulation',async({page,context,browser,baseURL},info)=>{
  6  |   test.setTimeout(120000)
  7  |   const finishNetwork=await protect(context,baseURL!)
  8  |   await onboard(page)
  9  |   await enterScene(page,'ask-teacher','A2')
  10 |   const exact=await capture(page,'for example','phrase')
  11 |   await answer(page)
  12 |   await expect(page.getByRole('group',{name:'当前应答问题'})).not.toContainText(exact.sources[0].originalText)
  13 |   const partial=await capture(page,'I can say for example about a park.','sentence')
  14 |   const unknown=await capture(page,'synthetic-florbnax','word')
  15 |   await page.getByRole('link',{name:'退出本次练习'}).click()
  16 |   await page.goto('/privacy')
  17 |   const downloading=page.waitForEvent('download')
  18 |   await page.getByRole('button',{name:'导出学习数据'}).click()
  19 |   const originalPath=info.outputPath('actual-before-collision.json')
  20 |   await(await downloading).saveAs(originalPath)
  21 |   const fixture=JSON.parse(await readFile(originalPath,'utf8'))
  22 |   // Named legal identity-collision fixture only; all source text and learning
  23 |   // came from UI. Reuse a source id in another note, never merge their bodies.
  24 |   const collided=fixture.notebook.find((note:{id:string})=>note.id===partial.id)
  25 |   collided.sources[0].id=exact.sources[0].id
  26 |   const restoredContext=await browser.newContext({baseURL,viewport:{width:390,height:844},isMobile:true,hasTouch:true})
  27 |   const finishRestored=await protect(restoredContext,baseURL!)
  28 |   const restored=await restoredContext.newPage()
  29 |   try{
  30 |     await restored.goto('/privacy')
  31 |     await restored.waitForFunction(()=>!!navigator.serviceWorker.controller,undefined,{timeout:30000})
  32 |     await restored.locator('input[type=file]').setInputFiles({name:'legal-cross-note-source-id.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))})
  33 |     await restored.getByRole('button',{name:'确认合并恢复'}).click()
  34 |     await expect(restored.getByText(/恢复完成/)).toBeVisible()
  35 |     await restored.goto(`/notebook/note?id=${partial.id}`)
> 36 |     await expect(restored.getByText('仅部分片段有覆盖',{exact:true})).toBeVisible()
     |                                                               ^ Error: expect(locator).toBeVisible() failed
  37 |     await restored.getByRole('button',{name:'用所选来源模拟练习'}).click()
  38 |     await expect(restored.getByText('仅练明确选中的覆盖片段，不解析、确认或评分原整句。',{exact:true})).toBeVisible()
  39 |     await restored.getByLabel('本次练习的已覆盖表达').selectOption('study.for-example')
  40 |     await restored.getByRole('button',{name:'开始这次定向练习'}).click()
  41 |     await expect(restored.getByRole('textbox',{name:'我回忆的表达'})).toBeVisible()
  42 |     const simulation=(await localState(restored)).sessions.find(session=>session.simulation)!
  43 |     expect(simulation.simulation!.source).toMatchObject({noteId:partial.id,sourceId:exact.sources[0].id,snapshot:collided.sources[0],noteText:partial.text})
  44 |     expect(simulation.simulation!.source.snapshot.originalText).not.toBe(exact.sources[0].originalText)
  45 |     expect(simulation.simulation!.target).toMatchObject({coverage:'partial',text:'for example'})
  46 |     await restored.goto(`/notebook/note?id=${unknown.id}`)
  47 |     await expect(restored.getByText('当前本地资料未收录',{exact:true})).toBeVisible()
  48 |     await expect(restored.getByRole('button',{name:'用所选来源模拟练习'})).toHaveCount(0)
  49 |     await restored.getByRole('button',{name:'编辑词句'}).click()
  50 |     const literal='<img src=x onerror="window.syntheticLeak=1"> <script>window.syntheticLeak=2</script>'
  51 |     await restored.getByRole('textbox',{name:'个人备注',exact:true}).fill(literal)
  52 |     await restored.getByRole('button',{name:'保存修改'}).click()
  53 |     await expect(restored.getByText(literal,{exact:true})).toBeVisible()
  54 |     expect(await restored.evaluate(()=>Object.hasOwn(window,'syntheticLeak'))).toBe(false)
  55 |     await restored.getByRole('button',{name:'开始自我回忆'}).click()
  56 |     await restored.getByRole('button',{name:'已尝试回忆，查看原文'}).click()
  57 |     await restored.getByRole('button',{name:'模糊',exact:true}).click()
  58 |     await expect(restored.getByText(/本次自评已保存/)).toBeVisible()
  59 |     const final=await localState(restored)
  60 |     expect(final.reviews).toHaveLength(1)
  61 |     expect(final.pointsLedger).toEqual([])
  62 |     expect(final.sessions.filter(session=>session.simulation)).toHaveLength(1)
  63 |     await writeFile(info.outputPath('partial-unknown-collision.json'),JSON.stringify({simulation,final},null,2))
  64 |     await finishRestored(info)
  65 |   }finally{await restoredContext.close()}
  66 |   await finishNetwork(info)
  67 | })
  68 | 
```