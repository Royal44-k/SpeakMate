# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-cache-privacy.spec.ts >> SW/privacy: private searches stay local; corrupt/uncached categories fail offline while pinned records and exact shells/fonts/images remain available
- Location: tests\e2e\task7-cache-privacy.spec.ts:6:1

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: '进入对话舞台' })

```

# Page snapshot

```yaml
- generic [ref=f14e1]:
  - article [ref=f14e2]:
    - generic [ref=f14e3]:
      - link "返回场景库" [ref=f14e4] [cursor=pointer]:
        - /url: /scenes?level=A2
      - generic [ref=f14e7]:
        - paragraph [ref=f14e8]: SCENE BRIEF
        - heading "咖啡点单" [active] [level=1] [ref=f14e9]
    - generic [ref=f14e10]:
      - img "自然光咖啡店吧台和咖啡师" [ref=f14e12]
      - generic [ref=f14e13]:
        - generic [ref=f14e14]: DINING
        - generic [ref=f14e15]: A2
    - generic [ref=f14e16]:
      - paragraph [ref=f14e17]: Ordering coffee
      - heading "咖啡点单" [level=2] [ref=f14e18]
      - generic [ref=f14e19]: 约 3–5 分钟 · 约 3 轮
    - paragraph [ref=f14e22]: 选择饮品、规格和取餐方式。
    - group "选择练习长度" [ref=f14e23]:
      - generic [ref=f14e25] [cursor=pointer]:
        - radio "简短 · 约 3 轮 约 3–5 分钟" [checked] [ref=f14e26]
        - generic [ref=f14e27]: 简短 · 约 3 轮约 3–5 分钟
      - generic [ref=f14e28] [cursor=pointer]:
        - radio "标准 · 约 6 轮 约 5–8 分钟" [ref=f14e29]
        - generic [ref=f14e30]: 标准 · 约 6 轮约 5–8 分钟
      - generic [ref=f14e31] [cursor=pointer]:
        - radio "深入 · 约 10 轮 约 8–12 分钟" [ref=f14e32]
        - generic [ref=f14e33]: 深入 · 约 10 轮约 8–12 分钟
    - status [ref=f14e34]: 本版页面与共享资源已验证缓存。 此分类离线缓存尚未确认。 缓存可能被浏览器清理；已保存的对话快照与公开分类下载分别管理。
    - alert [ref=f14e35]:
      - paragraph [ref=f14e36]: 此分类下载或读取失败，未替换为其他语料。已保存的练习仍可用原快照恢复。公开语料验证尚未完成。请使用 HTTPS（或本机 localhost）并允许 Service Worker；Safari 请检查网站限制。可返回今日练习，完成并关闭其他窗口后更新，再回来重试。已保存的练习与备份仍可读取。
      - button "重试下载此分类" [ref=f14e37] [cursor=pointer]
      - link "返回今日练习检查更新" [ref=f14e38] [cursor=pointer]:
        - /url: /practice
  - alert [ref=f14e39]
  - status [ref=f14e40]: 咖啡点单
```

# Test source

```ts
  1   | import {expect,test} from '@playwright/test'
  2   | import {readFile,writeFile} from 'node:fs/promises'
  3   | import vm from 'node:vm'
  4   | import {onboard,enterScene,capture,localState,protect} from './task7-browser-helpers'
  5   | 
  6   | test('SW/privacy: private searches stay local; corrupt/uncached categories fail offline while pinned records and exact shells/fonts/images remain available',async({page,context,baseURL},info)=>{
  7   |   test.setTimeout(120000)
  8   |   const finishNetwork=await protect(context,baseURL!)
  9   |   const urls:string[]=[]
  10  |   context.on('request',request=>urls.push(request.url()))
  11  |   const sandbox={self:{} as {SPEAKMATE_OFFLINE?:{buildId:string;shells:{url:string;sha256:string}[];assets:{url:string;sha256:string}[]}}}
  12  |   vm.runInNewContext(await readFile('public/offline-build.js','utf8'),sandbox)
  13  |   const manifest=sandbox.self.SPEAKMATE_OFFLINE!
  14  |   await onboard(page)
  15  |   const id=await enterScene(page,'coffee-order','A2')
  16  |   const note=await capture(page,'black','word')
  17  |   await page.getByRole('link',{name:'退出本次练习'}).click()
  18  |   await page.goto('/scenes')
  19  |   const sceneSearch=page.getByRole('searchbox',{name:'搜索场景'})
  20  |   const sceneSecret='synthetic-private-scene-8264'
  21  |   await sceneSearch.fill(sceneSecret)
  22  |   await sceneSearch.press('Enter')
  23  |   await page.getByRole('button',{name:'搜索',exact:true}).click()
  24  |   expect(page.url()).not.toContain(sceneSecret)
  25  |   await page.getByRole('button',{name:'清空搜索',exact:true}).click()
  26  |   await sceneSearch.fill('咖啡')
  27  |   await sceneSearch.press('Enter')
  28  |   const card=page.getByRole('link',{name:'准备练习：咖啡点单'})
  29  |   await expect(card).toHaveCount(1)
  30  |   expect((await card.getAttribute('href'))!).not.toMatch(/q=|%E5%92%96/)
  31  |   await card.click()
  32  |   await page.getByRole('link',{name:'返回场景库'}).click()
  33  |   await expect(sceneSearch).toHaveValue('咖啡')
  34  |   await page.goto('/notebook')
  35  |   const noteSecret='synthetic-private-notebook-4682'
  36  |   const noteSearch=page.getByRole('textbox',{name:'搜索词句与备注'})
  37  |   await noteSearch.fill(noteSecret)
  38  |   await noteSearch.press('Enter')
  39  |   expect(page.url()).not.toContain(noteSecret)
  40  |   await noteSearch.fill('black')
  41  |   await page.getByRole('link',{name:'查看词句',exact:true}).click()
  42  |   expect(page.url()).not.toMatch(/q=|synthetic-private/)
  43  |   await page.getByRole('link',{name:'返回记录簿',exact:true}).click()
  44  |   await expect(noteSearch).toHaveValue('black')
  45  |   const legacySecret='synthetic-legacy-private-7531'
  46  |   const beforeLegacy=urls.length
  47  |   await page.goto(`/scenes?q=${legacySecret}`)
  48  |   await expect(sceneSearch).toHaveValue(legacySecret)
  49  |   await page.getByRole('button',{name:'清空搜索',exact:true}).click()
  50  |   await page.getByRole('link',{name:'准备练习：咖啡点单'}).click()
  51  |   expect(urls.slice(beforeLegacy).filter(url=>url.includes(legacySecret))).toHaveLength(1)
  52  |   expect(urls.some(url=>url.includes(sceneSecret)||url.includes(noteSecret))).toBe(false)
  53  |   const before=await localState(page)
  54  |   await page.evaluate(async build=>{
  55  |     const cache=await caches.open(`speakmate-build-v1-${build}`)
  56  |     await cache.put('/content/v1/dining',new Response('{"corrupt":true}',{headers:{'content-type':'application/json'}}))
  57  |   },manifest.buildId)
  58  |   await context.setOffline(true)
  59  |   const resources=await page.evaluate(async assets=>Promise.all(assets.map(async entry=>{
  60  |     const response=await fetch(entry.url),bytes=await response.arrayBuffer()
  61  |     const sha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('')
  62  |     return {url:entry.url,status:response.status,sha256,expected:entry.sha256}
  63  |   })),manifest.assets)
  64  |   for(const resource of resources){expect(resource.status).toBe(200);expect(resource.sha256).toBe(resource.expected)}
  65  |   const rejected=await page.evaluate(async()=>{
  66  |     const results=[]
  67  |     for(const path of ['/content/v1/dining','/content/v1/work']){const r=await fetch(path);results.push({path,status:r.status,text:await r.text()})}
  68  |     for(const [path,headers] of [['/session/report?id=unknown&_rsc=privacy-probe',{}],['/notebook/note?id=unknown',{'RSC':'1'}],['/session?id=unknown',{'Next-Router-Prefetch':'1'}]] as [string,Record<string,string>][]) {
  69  |       try{const r=await fetch(path,{headers});results.push({path,status:r.status,text:await r.text()})}catch{results.push({path,status:0,text:'network rejected'})}
  70  |     }
  71  |     return results
  72  |   })
  73  |   expect(rejected.slice(0,2).map(row=>row.status)).toEqual([503,503])
  74  |   for(const row of rejected.slice(2)){expect(row.status).toBe(0);expect(row.text).not.toMatch(/<html/i)}
  75  |   await page.goto(`/session?id=${id}`)
  76  |   await expect(page.getByRole('group',{name:'当前应答问题'})).toBeVisible()
  77  |   const pinned=(await localState(page)).sessions.find(session=>session.id===id)!
  78  |   expect(pinned).toEqual(before.sessions.find(session=>session.id===id))
  79  |   const image=page.getByRole('region',{name:'当前练习场景'}).locator('img')
  80  |   expect(await image.evaluate(element=>(element as HTMLImageElement).complete&&(element as HTMLImageElement).naturalWidth>0)).toBe(true)
  81  |   const imageEvidence=await image.evaluate(element=>({src:(element as HTMLImageElement).currentSrc,alt:element.getAttribute('alt')}))
  82  |   expect(imageEvidence.src).toContain('/scenes/dining.webp')
  83  |   await page.goto('/scenes/prepare?scene=coffee-order&level=A2&mode=short')
> 84  |   await page.getByRole('link',{name:'进入对话舞台'}).click()
      |                                                ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  85  |   await expect(page.getByText(/公开语料验证尚未完成/)).toBeVisible()
  86  |   expect((await localState(page)).sessions).toEqual(before.sessions)
  87  |   const shellEvidence=[]
  88  |   for(const entry of manifest.shells){
  89  |     const response=await page.goto(entry.url)
  90  |     expect(response!.status()).toBe(200)
  91  |     const body=await response!.body()
  92  |     const {createHash}=await import('node:crypto')
  93  |     const sha256=createHash('sha256').update(body).digest('hex')
  94  |     expect(sha256).toBe(entry.sha256)
  95  |     shellEvidence.push({path:entry.url,sha256})
  96  |   }
  97  |   await context.setOffline(false)
  98  |   await page.goto(`/notebook/note?id=${note.id}`)
  99  |   await expect(page.getByText('本语境完整匹配',{exact:true})).toBeVisible()
  100 |   expect((await localState(page)).notebook).toEqual(before.notebook)
  101 |   await writeFile(info.outputPath('cache-privacy.json'),JSON.stringify({buildId:manifest.buildId,resources,rejected,shellEvidence,imageEvidence,urls,before},null,2))
  102 |   await finishNetwork(info)
  103 | })
  104 | 
```