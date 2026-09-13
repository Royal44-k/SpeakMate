# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline.spec.ts >> visited scene library and local session shell recover offline
- Location: tests\e2e\offline.spec.ts:77:1

# Error details

```
Error: expect(received).toBeTruthy()

Received: undefined
```

# Page snapshot

```yaml
- generic [ref=f3e1]:
  - alert [ref=f3e2]
  - main [ref=f3e3]:
    - generic [ref=f3e4]:
      - link "退出本次练习" [ref=f3e5] [cursor=pointer]:
        - /url: /scenes/prepare?scene=hotel-check-in&level=B1&mode=standard
      - generic [ref=f3e8]:
        - paragraph [ref=f3e9]: SpeakMate
        - heading "Dialogue Stage" [level=1] [ref=f3e10]
        - generic [ref=f3e11]: 情境演练 · 酒店入住
      - generic [ref=f3e12]:
        - strong [ref=f3e13]: 0 / 6
        - generic [ref=f3e14]: B1 · 已提交轮次
    - region "当前练习场景" [ref=f3e15]:
      - img "温暖灯光下的精品酒店前台" [ref=f3e17]
    - region "完整情境与材料" [ref=f3e18]:
      - heading "酒店前台角色" [level=2] [ref=f3e19]
      - paragraph [ref=f3e20]: 这是已编写的本地角色与回应演练，不是实时人员服务。请先阅读所选情境；问题可能包含排练提示，所有交易、安排与材料只属于练习。
      - paragraph [ref=f3e21]: 虚构Harbour Hotel前台。你是Alex Chen，一人订了9月10日入住、12日离店的两晚标准房，有预订确认、身份证明和一只旅行包。前台展示一张样例房卡及文字用法，不是给你的真实钥匙。本练习标准房不含早餐；早餐可另询价，安静房与提前入住都只是可询问的偏好，未确认。情境时刻为13:00，示例通常入住时间15:00。短练核对身份、日期和房型资料，不表示完成入住。
      - paragraph [ref=f3e22]: 帮助和改答也占用轮次；还可提交 6 轮。到上限可能仍有目标未确认，可结束后开启新一轮，不代表练习失败。
    - region "当前问题" [ref=f3e23]:
      - generic [ref=f3e24]:
        - generic [ref=f3e25]: 本地编写的情境问答
        - button "播放本地助手回复" [ref=f3e26] [cursor=pointer]
      - group "当前应答问题" [active] [ref=f3e29]:
        - generic [ref=f3e30]:
          - paragraph [ref=f3e31]: What would you prefer to present first to help locate and check the Alex Chen reservation?
          - button "记录词句" [ref=f3e32] [cursor=pointer]
      - paragraph [ref=f3e33]: 只选核对顺序。
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
  - status [ref=f3e60]: 正在准备对话舞台…
```

# Test source

```ts
  22  |   }
  23  |   await page.goto('/install')
  24  |   await page.waitForFunction(()=>!!navigator.serviceWorker.controller,undefined,{timeout:20000})
  25  |   const status=await page.evaluate(()=>new Promise<{buildId:string;shellReady:boolean;categories:Record<string,boolean>}>((resolve,reject)=>{
  26  |     const worker=navigator.serviceWorker.controller!
  27  |     const timeout=setTimeout(()=>reject(new Error('Offline readiness response missing')),5000)
  28  |     const receive=(event:MessageEvent)=>{if(event.source===worker&&event.data?.type==='OFFLINE_STATUS'){clearTimeout(timeout);navigator.serviceWorker.removeEventListener('message',receive);resolve(event.data)}}
  29  |     navigator.serviceWorker.addEventListener('message',receive);worker.postMessage({type:'OFFLINE_STATUS'})
  30  |   }))
  31  |   expect(status.buildId).toBe(manifest.buildId)
  32  |   expect(status.shellReady).toBe(true)
  33  |   expect(Object.values(status.categories)).toEqual(Array(7).fill(false))
  34  | })
  35  | 
  36  | test('installed public shell remains available after the network goes offline', async ({
  37  |   page,
  38  |   context,
  39  |   browserName,
  40  | }) => {
  41  |   test.skip(
  42  |     browserName !== 'chromium',
  43  |     'Offline service-worker verification runs in the Chromium production target.',
  44  |   )
  45  |   await page.goto('/')
  46  |   await page.evaluate(async () => {
  47  |     await navigator.serviceWorker.ready
  48  |   })
  49  |   if (
  50  |     !(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
  51  |   ) {
  52  |     await page.reload()
  53  |   }
  54  |   await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  55  |   await page.goto('/install')
  56  |   await expect(
  57  |     page.getByRole('heading', { level: 1, name: '安装到手机' }),
  58  |   ).toBeVisible()
  59  |   await expect(
  60  |     page.getByRole('heading', { level: 2, name: '把练习放到主屏幕' }),
  61  |   ).toBeVisible()
  62  |   expect(
  63  |     await page.evaluate(async () => Boolean(await caches.match('/install'))),
  64  |   ).toBe(true)
  65  | 
  66  |   await context.setOffline(true)
  67  |   await page.reload({ waitUntil: 'domcontentloaded' })
  68  |   await expect(
  69  |     page.getByRole('heading', { level: 1, name: '安装到手机' }),
  70  |   ).toBeVisible()
  71  |   await expect(
  72  |     page.getByRole('heading', { level: 2, name: '把练习放到主屏幕' }),
  73  |   ).toBeVisible()
  74  |   await context.setOffline(false)
  75  | })
  76  | 
  77  | test('visited scene library and local session shell recover offline', async ({
  78  |   page,
  79  |   context,
  80  |   browserName,
  81  | }) => {
  82  |   test.skip(
  83  |     browserName !== 'chromium',
  84  |     'Offline service-worker verification runs in the Chromium production target.',
  85  |   )
  86  |   await page.goto('/')
  87  |   await page.evaluate(async () => {
  88  |     await navigator.serviceWorker.ready
  89  |   })
  90  |   if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))))
  91  |     await page.reload()
  92  |   await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  93  | 
  94  |   await page.goto('/scenes')
  95  |   await expect(page.locator('h1')).toContainText('把英语练进生活里')
  96  |   await context.setOffline(true)
  97  |   await page.reload({ waitUntil: 'domcontentloaded' })
  98  |   await expect(page.locator('h1')).toContainText('把英语练进生活里')
  99  | 
  100 |   await context.setOffline(false)
  101 |   await page.goto('/session/new?scene=hotel-check-in&level=B1')
  102 |   await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  103 |   const sessionId = await page.evaluate(async () => {
  104 |     const database = await new Promise<IDBDatabase>((resolve, reject) => {
  105 |       const request = indexedDB.open('speakmate-v1')
  106 |       request.onsuccess = () => resolve(request.result)
  107 |       request.onerror = () => reject(request.error)
  108 |     })
  109 |     const sessions = await new Promise<Array<{ id: string }>>(
  110 |       (resolve, reject) => {
  111 |         const request = database
  112 |           .transaction('sessions', 'readonly')
  113 |           .objectStore('sessions')
  114 |           .getAll()
  115 |         request.onsuccess = () => resolve(request.result)
  116 |         request.onerror = () => reject(request.error)
  117 |       },
  118 |     )
  119 |     database.close()
  120 |     return sessions[0]?.id
  121 |   })
> 122 |   expect(sessionId).toBeTruthy()
      |                     ^ Error: expect(received).toBeTruthy()
  123 |   await page.goto(`/session/${sessionId}`)
  124 |   await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  125 |   const privateSessionUrl = page.url()
  126 |   expect(
  127 |     await page.evaluate(
  128 |       async (url) => Boolean(await caches.match(url)),
  129 |       privateSessionUrl,
  130 |     ),
  131 |   ).toBe(false)
  132 |   await context.setOffline(true)
  133 |   await page.reload({ waitUntil: 'domcontentloaded' })
  134 |   await expect(
  135 |     page.getByRole('heading', { name: 'Dialogue Stage' }),
  136 |   ).toBeVisible()
  137 |   expect(page.url()).toBe(privateSessionUrl)
  138 |   await context.setOffline(false)
  139 | })
  140 | 
```