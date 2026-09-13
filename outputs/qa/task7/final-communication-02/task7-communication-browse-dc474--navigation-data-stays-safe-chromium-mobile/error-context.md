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
Error: strict mode violation: getByText(/No real appointment was booked or medical or emergency service contacted/) resolved to 2 elements:
    1) <p lang="en">The appointment-request practice is complete. Pre…</p> aka getByRole('group').getByText('The appointment-request')
    2) <p lang="en">The appointment-request practice is complete. Pre…</p> aka getByLabel('本轮结尾').getByText('The appointment-request')

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for getByText(/No real appointment was booked or medical or emergency service contacted/)

```

# Page snapshot

```yaml
- generic [active] [ref=f5e1]:
  - alert [ref=f5e2]
  - main [ref=f5e3]:
    - generic [ref=f5e4]:
      - link "退出本次练习" [ref=f5e5] [cursor=pointer]:
        - /url: /scenes?level=A1
      - generic [ref=f5e8]:
        - paragraph [ref=f5e9]: SpeakMate
        - heading "Dialogue Stage" [level=1] [ref=f5e10]
        - generic [ref=f5e11]: 情境演练 · 预约医生
      - generic [ref=f5e12]:
        - strong [ref=f5e13]: 3 / 3
        - generic [ref=f5e14]: A1 · 已提交轮次
    - region "当前练习场景" [ref=f5e15]:
      - img "现代诊所预约前台" [ref=f5e17]
    - region "完整情境与材料" [ref=f5e18]:
      - heading "模拟接待员（未发送询问）" [level=2] [ref=f5e19]
      - paragraph [ref=f5e20]: 这是已编写的虚构语言演练，不是医疗、报警、救援或物业服务。没有拨号或发送消息，不诊断、不判断安全、不确认预约或服务。只使用情境中的虚构材料，不提供真实身份、地址或医疗资料。
      - paragraph [ref=f5e21]: 虚构诊所预约英语演练；练习搭档扮演接待员。纸卡仅展示供练习选择的周二上午、周四下午以及电话或当面咨询形式，不是真实空位或临床推荐。示例卡写有 arrival time 和 appointment time 两个栏位，但没有默认时间。你可以使用参考答案的虚构偏好，不提供真实姓名、证件、联系方式或病历。本轮仅准备预约请求，不做分诊、不确认真实预约、不联系医疗或紧急服务。
      - paragraph [ref=f5e22]: 帮助和改答也占用轮次；还可提交 0 轮。到上限可能仍有目标未确认，可结束后开启新一轮，不代表练习失败。
    - status [ref=f5e23]: 本地朗读暂时不可用，请直接阅读文字继续练习。
    - group [ref=f5e24]:
      - generic "本轮对话记录（3 轮）" [ref=f5e25] [cursor=pointer]
    - region "本轮结尾" [ref=f5e26]:
      - generic [ref=f5e27]:
        - generic [ref=f5e28]: 本地编写的情境问答
        - button "播放本地助手回复" [ref=f5e29] [cursor=pointer]
      - generic [ref=f5e33]:
        - paragraph [ref=f5e34]: The appointment-request practice is complete. Preferred times and formats are requests only. No real appointment was booked or medical or emergency service contacted.
        - button "记录词句" [ref=f5e35] [cursor=pointer]
    - region "本轮表达反馈" [ref=f5e37]:
      - button "已匹配本地参考表达 本地收录范围有限，不作全面正确性评估" [ref=f5e38] [cursor=pointer]:
        - generic [ref=f5e42]:
          - strong [ref=f5e43]: 已匹配本地参考表达
          - generic [ref=f5e44]: 本地收录范围有限，不作全面正确性评估
    - button "停止本次练习" [ref=f5e47] [cursor=pointer]
    - generic [ref=f5e48]:
      - paragraph [ref=f5e49]: 所选流程的目标已确认，请确认结束。
      - button "确认结束并保存复盘" [ref=f5e50] [cursor=pointer]
  - status [ref=f5e51]:
    - paragraph [ref=f5e52]: 已记录
    - link "查看词句" [ref=f5e53] [cursor=pointer]:
      - /url: /notebook/note?id=9da8fa11-949c-4e43-b0a9-6c6686fe6fe0&from=%2Fsession%3Fid%3Dsession_92ac1967-e115-42a6-82df-305549c4d26d%26scene%3Ddoctor-appointment%26level%3DA1%26mode%3Dshort
    - button "撤销记录" [ref=f5e54] [cursor=pointer]
  - status [ref=f5e55]: 正在准备对话舞台…
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
> 27 |   await expect(page.getByText(/No real appointment was booked or medical or emergency service contacted/)).toBeVisible()
     |                                                                                                            ^ Error: expect(locator).toBeVisible() failed
  28 |   await page.getByRole('button',{name:'确认结束并保存复盘'}).click()
  29 |   await expect(page.getByRole('heading',{name:'这轮已保存。'})).toBeVisible()
  30 |   await expect(page.getByText(/也不代表真实服务已完成/)).toBeVisible()
  31 |   await page.getByRole('link',{name:'查看本次复盘'}).click()
  32 |   await expect(page.getByText(/不提供语法、词汇、自然度或发音分数/)).toBeVisible()
  33 |   const before=await localState(page)
  34 |   expect(before.sessions.find(session=>session.id===healthId)!.status).toBe('completed')
  35 |   expect(before.pointsLedger).toEqual([])
  36 |   await page.goto(`/notebook/note?id=${note.id}`)
  37 |   await page.evaluate(noteUrl=>sessionStorage.setItem('speakmate-route-stack',JSON.stringify(['/notebook',noteUrl])),`/notebook/note?id=${note.id}`)
  38 |   await page.reload()
  39 |   await page.getByRole('link',{name:'返回记录簿',exact:true}).click()
  40 |   await expect(page.getByRole('heading',{name:'记录簿',exact:true})).toBeVisible()
  41 |   await expect(page.getByRole('heading',{name:note.text,exact:true})).toBeVisible()
  42 |   expect(await localState(page)).toEqual(before)
  43 |   await writeFile(info.outputPath('communication-boundaries.json'),JSON.stringify({socialId,healthId,before,returnedUrl:page.url(),legacyArray:'safe return; not precise history reconstruction'},null,2))
  44 |   await audit(info)
  45 | })
  46 | 
```