# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-update-browser.spec.ts >> SW: native category controller-change rejects without late learning writes
- Location: tests\e2e\task7-update-browser.spec.ts:159:3

# Error details

```
TimeoutError: page.waitForFunction: Timeout 10000ms exceeded.
```

# Test source

```ts
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
  127 |   await expect.poll(async () => (await localState(page)).learningEvents.some(event => event.type === 'foreground-time-recorded' && event.runId.startsWith(`${simulationId}_`))).toBe(true)
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
  158 | for (const fault of ['body-deadline', 'controller-change'] as const) {
  159 |   test(`SW: native category ${fault} rejects without late learning writes`, async ({page, context, baseURL}, info) => {
  160 |     test.setTimeout(90000)
  161 |     const audit = await protect(context, baseURL!)
  162 |     upstream = 3133
  163 |     await onboard(page)
  164 |     const oldBuild = await buildId(page)
  165 |     const before = await localState(page)
  166 |     // Keep native fetch/status/headers/body. Only document-side delivery of the
  167 |     // real clone's arrayBuffer is held; this is not a server streaming test.
  168 |     await page.evaluate(() => {
  169 |       const nativeFetch = window.fetch.bind(window)
  170 |       const state = {armed:true, held:false, released:false, url:'', headers:{} as Record<string,string>, bytes:0, sha256:'', started:0}
  171 |       Object.assign(window, {__bodyFault:state})
  172 |       window.fetch = async (...args) => {
  173 |         const response = await nativeFetch(...args)
  174 |         if (!state.armed || !response.url.includes('/content/v1/')) return response
  175 |         state.armed=false
  176 |         const clone = response.clone.bind(response)
  177 |         Object.defineProperty(response, 'clone', {value:() => {
  178 |           const copy = clone()
  179 |           const read = copy.arrayBuffer.bind(copy)
  180 |           Object.defineProperty(copy, 'arrayBuffer', {value:async () => {
  181 |             const bytes = await read()
  182 |             state.url=response.url; state.headers=Object.fromEntries(response.headers)
  183 |             state.bytes=bytes.byteLength
  184 |             state.sha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),byte=>byte.toString(16).padStart(2,'0')).join('')
  185 |             state.started=performance.now(); state.held=true
  186 |             await new Promise<void>(resolve => Object.assign(window,{__releaseBody:() => {state.released=true;resolve()}}))
  187 |             return bytes
  188 |           }})
  189 |           return copy
  190 |         }})
  191 |         return response
  192 |       }
  193 |     })
  194 |     await page.getByRole('button',{name:'准备表达热身'}).click()
> 195 |     await page.waitForFunction(() => (window as unknown as {__bodyFault:{held:boolean}}).__bodyFault.held)
      |                ^ TimeoutError: page.waitForFunction: Timeout 10000ms exceeded.
  196 |     expect(await localState(page)).toEqual(before)
  197 |     if (fault === 'controller-change') {
  198 |       upstream=3130
  199 |       await page.evaluate(async () => {await (await navigator.serviceWorker.getRegistration())!.update()})
  200 |       await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration())?.waiting)
  201 |       // Protocol fault injection: deliberately bypass UI's busy-update guard.
  202 |       // The real waiting worker itself verifies this single-window request.
  203 |       await page.evaluate(async () => {
  204 |         const old=navigator.serviceWorker.controller
  205 |         await new Promise<void>(async resolve => {
  206 |           navigator.serviceWorker.addEventListener('controllerchange',()=>{if(navigator.serviceWorker.controller!==old)resolve()},{once:true})
  207 |           ;(await navigator.serviceWorker.getRegistration())!.waiting!.postMessage({type:'SKIP_WAITING'})
  208 |         })
  209 |       })
  210 |       expect(await buildId(page)).not.toBe(oldBuild)
  211 |     }
  212 |     await expect(page.getByRole('alert').filter({hasText:'所选任务保持原样'})).toBeVisible({timeout:35000})
  213 |     const evidence = await page.evaluate(() => {
  214 |       const state=(window as unknown as {__bodyFault:{started:number}}).__bodyFault
  215 |       return {...state,elapsedMs:performance.now()-state.started}
  216 |     })
  217 |     if(fault==='body-deadline') {expect(evidence.elapsedMs).toBeGreaterThan(29000);expect(evidence.elapsedMs).toBeLessThan(35000)}
  218 |     expect(await localState(page)).toEqual(before)
  219 |     await page.evaluate(() => (window as unknown as {__releaseBody:()=>void}).__releaseBody())
  220 |     // Native microtasks and a paint after released bytes; the rejected request
  221 |     // must not secretly become a prepared workflow or write any learning row.
  222 |     await page.evaluate(() => new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))))
  223 |     await expect(page.getByRole('region',{name:'表达热身流程'})).toHaveCount(0)
  224 |     expect(await localState(page)).toEqual(before)
  225 |     await expect(page.getByRole('button',{name:'准备表达热身'})).toBeEnabled()
  226 |     await page.screenshot({path:info.outputPath('native-category-fault.png')})
  227 |     await writeFile(info.outputPath('native-category-fault.json'),JSON.stringify({fault,oldBuild,evidence,before,after:await localState(page)},null,2))
  228 |     await audit(info)
  229 |   })
  230 | }
  231 | 
```