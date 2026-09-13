# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-backup-cap.spec.ts >> D: near-cap real export is complete and over-10MiB export fails explicitly without download or local truncation
- Location: tests\e2e\task7-backup-cap.spec.ts:5:1

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 9437184
Received:   9299054
```

# Page snapshot

```yaml
- generic [active] [ref=f5e1]:
  - generic [ref=f5e2]:
    - main [ref=f5e4]:
      - generic [ref=f5e5]:
        - link "返回我的练习" [ref=f5e6] [cursor=pointer]:
          - /url: /me
        - generic [ref=f5e9]:
          - paragraph [ref=f5e10]: PRIVACY FIRST
          - heading "隐私与数据" [level=1] [ref=f5e11]
      - generic [ref=f5e12]:
        - article [ref=f5e13]:
          - generic [ref=f5e16]:
            - heading "原始录音不写入学习记录" [level=2] [ref=f5e17]
            - paragraph [ref=f5e18]: 录音核对或重试时可能保留临时录音；取消、提交结束、离开或组件卸载时释放。导出不含录音。
        - article [ref=f5e19]:
          - generic [ref=f5e22]:
            - heading "游客优先" [level=2] [ref=f5e23]
            - paragraph [ref=f5e24]: 不要求昵称、头像、手机号或微信账号；学习记录默认留在本机。
        - article [ref=f5e25]:
          - generic [ref=f5e28]:
            - heading "本机私密学习" [level=2] [ref=f5e29]
            - paragraph [ref=f5e30]: 本版不连接云端智能、账号或自动同步；个人学习文字只保存在这个浏览器。
      - generic [ref=f5e31]:
        - heading "删除与备份范围" [level=2] [ref=f5e32]
        - paragraph [ref=f5e33]: 删除单条历史只删除会话与话轮。词句笔记和任务完成凭据可能仍含学习文字，计划、积分与奖励保留。需要彻底清除本机学习数据时，请在下方明确确认清空。
        - paragraph [ref=f5e34]: Safari 与主屏幕网页应用的数据可能分开，不能保证自动迁移。清理站点数据、换设备或系统回收空间都可能丢失记录；先导出并在文件 App 确认保存，再操作。
      - region [ref=f5e35]:
        - heading "你的数据" [level=2] [ref=f5e36]
        - paragraph [ref=f5e37]: 练习记录默认只保存在这台设备。导出文件不包含原始录音。
        - paragraph [ref=f5e38]: 建议每周及清理站点数据、升级或换设备前导出备份。清理浏览器数据或设备回收空间可能删除本地数据；浏览器即使允许持久存储也不能代替备份。本版没有跨设备自动同步。
        - paragraph [ref=f5e39]: 本地积分可自行修改，不代表经过验证的真实排行榜成绩。
        - button "导出学习数据" [ref=f5e40] [cursor=pointer]
        - generic [ref=f5e43]:
          - generic [ref=f5e44]: 选择学习数据备份
          - button "选择学习数据备份" [ref=f5e45]
          - paragraph [ref=f5e46]: 支持版本 1 / 2 JSON，最多 10 MB。预览不会修改数据；确认后按时间合并，不覆盖较新的记录。
        - generic [ref=f5e47]:
          - heading "清空本机数据" [level=3] [ref=f5e48]
          - paragraph [ref=f5e49]: 此操作无法撤销，将清空此浏览器内的学习记录、笔记、任务、积分与奖励。请先生成导出并确认文件已保存；本版没有云端副本。
          - generic [ref=f5e50]: 输入“清空”以确认
          - textbox "输入“清空”以确认" [ref=f5e51]
          - button "永久清空本机数据" [disabled] [ref=f5e52]
        - status [ref=f5e55]: 最近生成导出：2026/9/12 16:18:58。请在文件 App 确认文件已保存；生成下载请求不等于已安全备份。
      - paragraph [ref=f5e57]: 面向中国大陆公开运营前，仍需完成备案、隐私政策、数据跨境与生成式 AI 合规评估。本测试部署不等于公开运营许可。
    - navigation "主要导航" [ref=f5e58]:
      - link "目标" [ref=f5e59] [cursor=pointer]:
        - /url: /
      - link "练习" [ref=f5e63] [cursor=pointer]:
        - /url: /practice
      - link "场景" [ref=f5e67] [cursor=pointer]:
        - /url: /scenes
      - link "记录簿" [ref=f5e71] [cursor=pointer]:
        - /url: /notebook
      - link "我的" [ref=f5e75] [cursor=pointer]:
        - /url: /me
  - alert [ref=f5e79]
  - status [ref=f5e80]: 隐私与数据
```

# Test source

```ts
  1  | import {expect,test} from '@playwright/test'
  2  | import {readFile,writeFile} from 'node:fs/promises'
  3  | import {onboard,enterScene,capture,localState,protect} from './task7-browser-helpers'
  4  | 
  5  | test('D: near-cap real export is complete and over-10MiB export fails explicitly without download or local truncation',async({page,context,baseURL},info)=>{
  6  |   test.setTimeout(120000)
  7  |   const finishNetwork=await protect(context,baseURL!)
  8  |   await onboard(page)
  9  |   await enterScene(page,'coffee-order','A2')
  10 |   const template=await capture(page,'black','word')
  11 |   await page.getByRole('link',{name:'退出本次练习'}).click()
  12 |   await page.goto('/privacy')
  13 |   // Named synthetic capacity/failure fixture, not a pretend earned learning
  14 |   // story. Seed only this context's notebook with individually valid rows.
  15 |   async function add(start:number,end:number){await page.evaluate(async({template,start,end})=>{
  16 |     const db=await new Promise<IDBDatabase>((resolve,reject)=>{const req=indexedDB.open('speakmate-v1');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})
  17 |     try{await new Promise<void>((resolve,reject)=>{
  18 |       const tx=db.transaction('notebook','readwrite')
  19 |       tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error)
  20 |       for(let i=start;i<end;i++)tx.objectStore('notebook').put({...template,id:`capacity-note-${String(i).padStart(4,'0')}`,text:`synthetic capacity ${i}`,normalizedText:`synthetic capacity ${i}`,notes:'x'.repeat(20000),favoriteIds:[]})
  21 |     })}finally{db.close()}
  22 |   },{template,start,end})}
  23 |   await add(0,450)
  24 |   const nearBefore=await localState(page)
  25 |   const downloading=page.waitForEvent('download')
  26 |   await page.getByRole('button',{name:'导出学习数据'}).click()
  27 |   const path=info.outputPath('actual-near-cap-backup.json')
  28 |   await(await downloading).saveAs(path)
  29 |   const bytes=await readFile(path),parsed=JSON.parse(bytes.toString())
> 30 |   expect(bytes.byteLength).toBeGreaterThan(9*1024*1024)
     |                            ^ Error: expect(received).toBeGreaterThan(expected)
  31 |   expect(bytes.byteLength).toBeLessThanOrEqual(10*1024*1024)
  32 |   expect(parsed.notebook).toEqual(nearBefore.notebook)
  33 |   expect(parsed.notebook).toHaveLength(451)
  34 |   await add(450,550)
  35 |   const before=await localState(page)
  36 |   let downloads=0
  37 |   page.on('download',()=>downloads++)
  38 |   await page.getByRole('button',{name:'导出学习数据'}).click()
  39 |   await expect(page.getByRole('alert').filter({hasText:/导出/})).toBeVisible()
  40 |   expect(downloads).toBe(0)
  41 |   const after=await localState(page)
  42 |   expect(after).toEqual(before)
  43 |   expect(after.notebook).toHaveLength(551)
  44 |   await writeFile(info.outputPath('capacity-result.json'),JSON.stringify({nearBytes:bytes.byteLength,nearNotes:parsed.notebook.length,overNotes:after.notebook.length,downloads,error:await page.getByRole('alert').filter({hasText:/导出/}).innerText()},null,2))
  45 |   await finishNetwork(info)
  46 | })
  47 | 
```