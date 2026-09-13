# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-update-browser.spec.ts >> SW: real waiting build defers for another editing window, preserves old lazy bytes and committed IDB, then safely updates with enlarged navigation
- Location: tests\e2e\task7-update-browser.spec.ts:41:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false

Call Log:
- Timeout 8000ms exceeded while waiting on the predicate
```

# Test source

```ts
  27  | test.afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())) })
  28  | async function buildId(page: Page) {
  29  |   return page.evaluate(() => new Promise<string>((resolve, reject) => {
  30  |     const worker = navigator.serviceWorker.controller
  31  |     const timer = setTimeout(() => { navigator.serviceWorker.removeEventListener('message', listener); reject(new Error('Native worker did not identify build')) }, 5000)
  32  |     function listener(event: MessageEvent) {
  33  |       if (event.source === worker && event.data?.type === 'BUILD_ID') {
  34  |         clearTimeout(timer); navigator.serviceWorker.removeEventListener('message', listener); resolve(event.data.buildId)
  35  |       }
  36  |     }
  37  |     navigator.serviceWorker.addEventListener('message', listener)
  38  |     worker!.postMessage({ type: 'GET_BUILD_ID' })
  39  |   }))
  40  | }
  41  | test('SW: real waiting build defers for another editing window, preserves old lazy bytes and committed IDB, then safely updates with enlarged navigation', async ({ page, context, baseURL }, info) => {
  42  |   test.setTimeout(180000)
  43  |   const finishNetwork = await protect(context, baseURL!)
  44  |   const oldManifestSource = await readFile('.superpowers/sdd/2026-09-09-speakmate-3/qa/build-o3l7/public/offline-build.js', 'utf8')
  45  |   const sandbox = { self: {} as { SPEAKMATE_OFFLINE?: { buildId: string; assets: {url: string; sha256: string}[] } } }
  46  |   vm.runInNewContext(oldManifestSource, sandbox)
  47  |   const old = sandbox.self.SPEAKMATE_OFFLINE!
  48  |   const latest = (await readFile('.next/BUILD_ID', 'utf8')).trim()
  49  |   expect(latest).not.toBe(old.buildId)
  50  |   upstream = 3133
  51  |   await onboard(page)
  52  |   expect(await buildId(page)).toBe(old.buildId)
  53  |   await enterScene(page, 'coffee-order', 'A2')
  54  |   const note = await capture(page, 'black', 'word')
  55  |   await page.getByRole('link', { name: '退出本次练习' }).click()
  56  |   await page.goto(`/notebook/note?id=${note.id}`)
  57  |   const saved = await localState(page)
  58  |   const editing = await context.newPage()
  59  |   await editing.goto(page.url())
  60  |   await editing.getByRole('button', { name: '编辑词句' }).click()
  61  |   const draft = editing.getByRole('textbox', { name: '个人备注', exact: true })
  62  |   await draft.fill('Synthetic unsubmitted note stays in this old window.')
  63  |   upstream = 3130
  64  |   await page.goto('/me')
  65  |   await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())!.update() })
  66  |   await expect(page.getByText('新版本已准备好', { exact: true })).toBeVisible({ timeout: 30000 })
  67  |   await expect(editing.getByRole('button', { name: '立即更新', exact: true })).toHaveCount(0)
  68  |   await page.getByRole('button', { name: '立即更新', exact: true }).click()
  69  |   await expect(page.getByText(/请先完成并关闭其他 SpeakMate 窗口，再重试更新；/)).toBeVisible()
  70  |   expect(await buildId(page)).toBe(old.buildId)
  71  |   await expect(draft).toHaveValue('Synthetic unsubmitted note stays in this old window.')
  72  |   // Request every actual old CSS/font/image/script URL after upstream changed.
  73  |   // Hashes must remain those of the old build, not just return status200.
  74  |   const lazy = await editing.evaluate(async assets => Promise.all(assets.map(async entry => {
  75  |     const response = await fetch(entry.url), bytes = await response.arrayBuffer()
  76  |     const sha256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('')
  77  |     return { url: entry.url, status: response.status, sha256, expected: entry.sha256 }
  78  |   })), old.assets)
  79  |   for (const entry of lazy) { expect(entry.status).toBe(200); expect(entry.sha256).toBe(entry.expected) }
  80  |   await expect(draft).toHaveValue('Synthetic unsubmitted note stays in this old window.')
  81  |   await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  82  |   const layout = await page.evaluate(() => {
  83  |     const rect = (element: Element) => { const r = element.getBoundingClientRect(); return { top:r.top, bottom:r.bottom, left:r.left, right:r.right, height:r.height, width:r.width } }
  84  |     const nav = document.querySelector('nav[aria-label="主要导航"]')!
  85  |     return { width: innerWidth, height: innerHeight, nav: rect(nav), notice: rect(document.querySelector('aside[role="status"]')!), links: Array.from(nav.querySelectorAll('a')).map(link => ({ link: rect(link), text: rect(link.querySelector('span')!) })) }
  86  |   })
  87  |   expect(layout.notice.bottom).toBeLessThanOrEqual(layout.nav.top)
  88  |   for (const {link, text} of layout.links) {
  89  |     expect(link.height).toBeGreaterThanOrEqual(44)
  90  |     expect(text.top).toBeGreaterThanOrEqual(link.top - 1)
  91  |     expect(text.bottom).toBeLessThanOrEqual(Math.min(link.bottom, layout.height) + 1)
  92  |     expect(text.left).toBeGreaterThanOrEqual(link.left - 1)
  93  |     expect(text.right).toBeLessThanOrEqual(link.right + 1)
  94  |   }
  95  |   await page.screenshot({ path: info.outputPath('waiting-update-text200.png') })
  96  |   await page.goto('/scenes')
  97  |   await expect(page.getByRole('link',{name:/^准备练习：/})).toHaveCount(42)
  98  |   await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  99  |   await page.getByRole('link',{name:/^准备练习：/}).last().scrollIntoViewIfNeeded()
  100 |   await expect(page.getByRole('button', {name:'返回顶部', exact:true})).toBeVisible()
  101 |   const combined = await page.evaluate(() => {
  102 |     const rect = (element:Element) => {const r=element.getBoundingClientRect(); return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}}
  103 |     return {top:rect(document.querySelector('button[aria-label="返回顶部"]')!),notice:rect(document.querySelector('aside[role="status"]')!),nav:rect(document.querySelector('nav[aria-label="主要导航"]')!)}
  104 |   })
  105 |   expect(combined.top.bottom).toBeLessThanOrEqual(combined.notice.top)
  106 |   expect(combined.notice.bottom).toBeLessThanOrEqual(combined.nav.top)
  107 |   await page.screenshot({path:info.outputPath('update-top-text200.png')})
  108 |   await page.getByRole('button', {name:'返回顶部', exact:true}).click()
  109 |   await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
  110 |   await editing.getByRole('button', { name: '取消修改' }).click()
  111 |   expect((await localState(editing)).notebook).toEqual(saved.notebook)
  112 |   await editing.getByRole('button', {name:'用所选来源模拟练习'}).click()
  113 |   await editing.getByRole('button', {name:'开始这次定向练习'}).click()
  114 |   await editing.getByRole('textbox', {name:'我回忆的表达'}).fill('Unsaved simulation recall remains protected.')
  115 |   await expect(editing.getByRole('button', {name:'立即更新'})).toHaveCount(0)
  116 |   await page.getByRole('button', {name:'立即更新'}).click()
  117 |   await expect(page.getByText(/请先完成并关闭其他 SpeakMate 窗口，再重试更新；/)).toBeVisible()
  118 |   await expect(editing.getByRole('textbox', {name:'我回忆的表达'})).toHaveValue('Unsaved simulation recall remains protected.')
  119 |   await editing.getByRole('link', {name:'退出本次练习'}).click()
  120 |   await editing.getByRole('button', {name:'继续练习',exact:true}).click()
  121 |   await expect(editing.getByRole('textbox', {name:'我回忆的表达'})).toHaveValue('Unsaved simulation recall remains protected.')
  122 |   await editing.getByRole('button', {name:'取消本次输入'}).click()
  123 |   const simulationId = new URL(editing.url()).searchParams.get('id')!
  124 |   await editing.close()
  125 |   // Closing the actual simulation legitimately flushes its foreground segment;
  126 |   // wait for that owned transaction before taking the update checkpoint.
> 127 |   await expect.poll(async () => (await localState(page)).learningEvents.some(event => event.type === 'foreground-time-recorded' && event.runId === simulationId)).toBe(true)
      |                                                                                                                                                                   ^ Error: expect(received).toBe(expected) // Object.is equality
  128 |   const committedBeforeUpdate = await localState(page)
  129 |   await page.goto('/me')
  130 |   const reload = page.waitForEvent('load')
  131 |   const newcomer = await context.newPage()
  132 |   // Race a real newly arriving in-scope document against explicit activation.
  133 |   const arriving = newcomer.goto('/notebook')
  134 |   await page.getByRole('button', { name: '立即更新', exact: true }).click()
  135 |   await arriving
  136 |   const racedBuild = await buildId(page)
  137 |   if (racedBuild === old.buildId) {
  138 |     await expect(page.getByText(/请先完成并关闭其他 SpeakMate 窗口，再重试更新；/)).toBeVisible()
  139 |     await newcomer.close()
  140 |     await page.getByRole('button', {name:'立即更新',exact:true}).click()
  141 |   } else {
  142 |     expect(racedBuild).toBe(latest)
  143 |     await expect(newcomer.getByRole('heading',{name:'记录簿',exact:true})).toBeVisible()
  144 |     await newcomer.close()
  145 |   }
  146 |   await reload
  147 |   await expect(page.getByRole('region', { name: '本机个人成绩' })).toBeVisible()
  148 |   expect(await buildId(page)).toBe(latest)
  149 |   const after = await localState(page)
  150 |   expect(after).toEqual(committedBeforeUpdate)
  151 |   const cachesKept = await page.evaluate(() => caches.keys())
  152 |   expect(cachesKept).toContain(`speakmate-build-v1-${old.buildId}`)
  153 |   expect(cachesKept).toContain(`speakmate-build-v1-${latest}`)
  154 |   await writeFile(info.outputPath('real-update.json'), JSON.stringify({ old: old.buildId, latest, lazy, layout, combined, racedBuild, cachesKept, after, transport, oldManifestHash: createHash('sha256').update(oldManifestSource).digest('hex') }, null, 2))
  155 |   await finishNetwork(info)
  156 | })
  157 | 
```