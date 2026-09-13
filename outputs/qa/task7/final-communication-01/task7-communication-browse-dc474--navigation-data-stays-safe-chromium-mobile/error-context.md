# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-communication-browser.spec.ts >> Named brief boundaries: a private polite refusal completes normally; health request remains fictional; legacy navigation data stays safe
- Location: tests\e2e\task7-communication-browser.spec.ts:5:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/No real appointment was booked or medical or emergency service contacted/)
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for getByText(/No real appointment was booked or medical or emergency service contacted/)

```

```yaml
- alert
- main:
  - paragraph: PRACTICE SAVED
  - heading "这轮已保存。" [level=1]
  - paragraph: 所选流程的目标已由本地收录表达确认。 这不是语言能力评分，也不代表真实服务已完成。
  - link "查看本次复盘":
    - /url: /session/report?id=session_262b276e-f76c-47fc-a771-76161b697575
  - link "再练一轮新对话":
    - /url: /session?id=new&scene=doctor-appointment&level=A1&mode=short&round=session_262b276e-f76c-47fc-a771-76161b697575
  - link "返回来源页面":
    - /url: /scenes?level=A1
- status: 正在准备对话舞台…
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test'
  2  | import { writeFile } from 'node:fs/promises'
  3  | import { onboard, enterScene, answer, capture, localState, protect } from './task7-browser-helpers'
  4  | 
  5  | test('Named brief boundaries: a private polite refusal completes normally; health request remains fictional; legacy navigation data stays safe', async ({page,context,baseURL},info) => {
  6  |   const audit=await protect(context,baseURL!)
  7  |   await onboard(page)
  8  |   const socialId=await enterScene(page,'polite-refusal','A1')
  9  |   await answer(page)
  10 |   await page.getByText('本题参考表达',{exact:true}).click()
  11 |   await page.getByRole('button',{name:'使用参考 2 并确认'}).click()
  12 |   await expect(page.getByRole('textbox',{name:'英文内容'})).toHaveValue("I'd rather not say.")
  13 |   await page.getByRole('button',{name:'提交这一轮'}).click()
  14 |   await expect(page.getByRole('textbox',{name:'英文内容'})).toBeHidden()
  15 |   await answer(page)
  16 |   await page.getByRole('button',{name:'确认结束并保存复盘'}).click()
  17 |   await expect(page.getByRole('heading',{name:'这轮已保存。'})).toBeVisible()
  18 |   const social=(await localState(page)).sessions.find(session=>session.id===socialId)!
  19 |   expect(social.status).toBe('completed')
  20 |   await page.goto('/scenes/prepare?scene=doctor-appointment&level=A1&mode=short')
  21 |   await expect(page.getByText(/本轮仅准备预约请求，不做分诊、不确认真实预约/)).toBeVisible()
  22 |   await page.getByRole('link',{name:'进入对话舞台'}).click()
  23 |   await expect(page.getByRole('region',{name:'当前问题',exact:true})).toBeVisible()
  24 |   const healthId=new URL(page.url()).searchParams.get('id')!
  25 |   const note=await capture(page,'synthetic fictional request','phrase')
  26 |   for(let n=0;n<3;n++) await answer(page)
  27 |   await page.getByRole('button',{name:'确认结束并保存复盘'}).click()
  28 |   await expect(page.getByRole('heading',{name:'这轮已保存。'})).toBeVisible()
> 29 |   await expect(page.getByText(/No real appointment was booked or medical or emergency service contacted/)).toBeVisible()
     |                                                                                                            ^ Error: expect(locator).toBeVisible() failed
  30 |   await page.getByRole('link',{name:'查看本次复盘'}).click()
  31 |   await expect(page.getByText(/不提供语法、词汇、自然度或发音分数/)).toBeVisible()
  32 |   const before=await localState(page)
  33 |   expect(before.sessions.find(session=>session.id===healthId)!.status).toBe('completed')
  34 |   expect(before.pointsLedger).toEqual([])
  35 |   await page.goto(`/notebook/note?id=${note.id}`)
  36 |   await page.evaluate(noteUrl=>sessionStorage.setItem('speakmate-route-stack',JSON.stringify(['/notebook',noteUrl])),`/notebook/note?id=${note.id}`)
  37 |   await page.reload()
  38 |   await page.getByRole('link',{name:'返回记录簿',exact:true}).click()
  39 |   await expect(page.getByRole('heading',{name:'记录簿',exact:true})).toBeVisible()
  40 |   await expect(page.getByRole('heading',{name:note.text,exact:true})).toBeVisible()
  41 |   expect(await localState(page)).toEqual(before)
  42 |   await writeFile(info.outputPath('communication-boundaries.json'),JSON.stringify({socialId,healthId,before,returnedUrl:page.url(),legacyArray:'safe return; not precise history reconstruction'},null,2))
  43 |   await audit(info)
  44 | })
  45 | 
```