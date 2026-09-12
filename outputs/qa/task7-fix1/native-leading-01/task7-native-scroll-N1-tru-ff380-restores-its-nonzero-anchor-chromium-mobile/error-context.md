# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-native-scroll.spec.ts >> N1: trusted native Back leads rendered Next route; delayed destination IDB preserves the unconsumed entry and restores its nonzero anchor
- Location: tests\e2e\task7-native-scroll.spec.ts:200:1

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  getByRole('article').last().getByRole('link', { name: '查看词句', exact: true })
Expected: focused
Received: inactive
Timeout:  8000ms

Call log:
  - Expect "toBeFocused" with timeout 8000ms
  - waiting for getByRole('article').last().getByRole('link', { name: '查看词句', exact: true })
    19 × locator resolved to <a href="/notebook/note?id=f7bd6a0e-bd77-4931-8c6c-c06a4adcb616">查看词句</a>
       - unexpected value "inactive"

```

```yaml
- link "查看词句":
  - /url: /notebook/note?id=f7bd6a0e-bd77-4931-8c6c-c06a4adcb616
```

# Test source

```ts
  203 |   await page.addInitScript(() => {
  204 |     const qa = {
  205 |       armed: false, holdReads: false, nextHandlers: 0,
  206 |       native: [] as { trusted: boolean; url: string; entry: unknown; title: string | null; stack: string | null }[],
  207 |       pop: [] as (() => void)[], reads: [] as (() => void)[],
  208 |       nextSources: [] as string[],
  209 |     }
  210 |     Object.assign(window, { __nativeBoundary: qa })
  211 |     const add = window.addEventListener.bind(window)
  212 |     const remove = window.removeEventListener.bind(window)
  213 |     const replacements = new Map<EventListenerOrEventListenerObject, EventListener>()
  214 |     // Pinned installed Next handler is identified by its actual tree-state read.
  215 |     // Only its delivery is held; the original trusted event reaches our route owner.
  216 |     window.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
  217 |       if (type === 'popstate' && String(listener).includes('__PRIVATE_NEXTJS_INTERNALS_TREE')) {
  218 |         qa.nextHandlers++
  219 |         qa.nextSources.push(String(listener))
  220 |         const wrapped: EventListener = (event) => {
  221 |           const deliver = () => typeof listener === 'function' ? listener.call(window, event) : listener.handleEvent(event)
  222 |           if (qa.armed) {
  223 |             qa.native.push({ trusted: event.isTrusted, url: location.href, entry: history.state?.__speakmateRouteEntry, title: document.querySelector('[data-page-title]')?.textContent ?? null, stack: sessionStorage.getItem('speakmate-route-stack') })
  224 |             qa.pop.push(deliver)
  225 |           } else deliver()
  226 |         }
  227 |         replacements.set(listener, wrapped)
  228 |         return add(type, wrapped, options)
  229 |       }
  230 |       return add(type, listener, options)
  231 |     }) as typeof window.addEventListener
  232 |     window.removeEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) => remove(type, replacements.get(listener) ?? listener, options)) as typeof window.removeEventListener
  233 |     const getAll = IDBObjectStore.prototype.getAll
  234 |     IDBObjectStore.prototype.getAll = function (...args) {
  235 |       const request = Reflect.apply(getAll, this, args) as IDBRequest
  236 |       if (qa.holdReads && this.name === 'notebook' && this.transaction.mode === 'readonly') {
  237 |         const on = request.addEventListener.bind(request)
  238 |         Object.defineProperty(request, 'addEventListener', { value(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
  239 |           if (type !== 'success') return on(type, listener, options)
  240 |           return on(type, (event) => {
  241 |             const deliver = () => typeof listener === 'function' ? listener.call(request, event) : listener.handleEvent(event)
  242 |             if (qa.holdReads) qa.reads.push(deliver)
  243 |             else deliver()
  244 |           }, options)
  245 |         } })
  246 |       }
  247 |       return request
  248 |     }
  249 |   })
  250 |   await onboard(page)
  251 |   await enterScene(page, 'ask-teacher', 'A2')
  252 |   await capture(page, 'for example', 'phrase')
  253 |   for (let index = 0; index < 8; index++) await capture(page, `synthetic example number ${index}`, 'phrase')
  254 |   await page.getByRole('link', { name: '退出本次练习' }).click()
  255 |   await page.goto('/notebook')
  256 |   await page.getByRole('textbox', { name: '搜索词句与备注' }).fill('example')
  257 |   await expect(page.getByRole('article')).toHaveCount(9)
  258 |   const link = page.getByRole('article').last().getByRole('link', { name: '查看词句', exact: true })
  259 |   const noteHref = (await link.getAttribute('href'))!
  260 |   const noteTitle = await page.getByRole('article').last().getByRole('heading').innerText()
  261 |   await link.scrollIntoViewIfNeeded()
  262 |   await link.focus()
  263 |   await page.evaluate(() => scrollBy(0, -1))
  264 |   await page.waitForFunction((href) => JSON.parse(sessionStorage.getItem('speakmate-route-scroll-v1') ?? '[]').some((row: unknown[]) => row[2] === href && Number(row[1]) > 300), noteHref)
  265 |   const original = await page.evaluate(() => ({ url: location.href, state: history.state, position: scrollY, stack: sessionStorage.getItem('speakmate-route-stack'), scrolls: sessionStorage.getItem('speakmate-route-scroll-v1') }))
  266 |   // Installed Next exposes the real public router for debugging. This isolated
  267 |   // compatibility test uses it, not a product link or a second router.
  268 |   await page.evaluate((href) => (window as unknown as { next: { router: { push: (href: string) => void } } }).next.router.push(href), noteHref)
  269 |   await expect(page).toHaveURL(new URL(noteHref, baseURL).href)
  270 |   await expect(page.getByRole('heading', { name: noteTitle, exact: true })).toBeVisible()
  271 |   const before = await page.evaluate(() => ({ url: location.href, stack: sessionStorage.getItem('speakmate-route-stack') }))
  272 |   await page.evaluate(() => {
  273 |     const qa = (window as unknown as { __nativeBoundary: { armed: boolean; holdReads: boolean } }).__nativeBoundary
  274 |     qa.armed = true
  275 |     qa.holdReads = true
  276 |   })
  277 |   await page.goBack({ waitUntil: 'commit' })
  278 |   await page.waitForFunction(() => (window as unknown as { __nativeBoundary: { pop: unknown[] } }).__nativeBoundary.pop.length > 0)
  279 |   await page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))))
  280 |   const leading = await page.evaluate(() => {
  281 |     const qa = (window as unknown as { __nativeBoundary: { native: unknown[]; nextHandlers: number; nextSources: string[] } }).__nativeBoundary
  282 |     return { url: location.href, entry: history.state.__speakmateRouteEntry, title: document.querySelector('[data-page-title]')?.textContent, stack: sessionStorage.getItem('speakmate-route-stack'), scrolls: sessionStorage.getItem('speakmate-route-scroll-v1'), native: qa.native, nextHandlers: qa.nextHandlers, nextSources: qa.nextSources }
  283 |   })
  284 |   await info.attach('native-leading', { body: JSON.stringify({ original, before, leading }, null, 2), contentType: 'application/json' })
  285 |   expect(leading.url).toBe(original.url)
  286 |   expect(leading.entry).toBe(original.state.__speakmateRouteEntry)
  287 |   expect(leading.title).toBe(noteTitle)
  288 |   expect(leading.stack).toBe(before.stack)
  289 |   expect(leading.native).toEqual([expect.objectContaining({ trusted: true, url: original.url })])
  290 |   await page.evaluate(() => {
  291 |     const qa = (window as unknown as { __nativeBoundary: { armed: boolean; pop: (() => void)[] } }).__nativeBoundary
  292 |     qa.armed = false
  293 |     while (qa.pop.length) qa.pop.shift()!()
  294 |   })
  295 |   await page.waitForFunction(() => (window as unknown as { __nativeBoundary: { reads: unknown[] } }).__nativeBoundary.reads.length > 0)
  296 |   await expect(page.getByText('正在读取记录簿…', { exact: true })).toBeVisible()
  297 |   const pending = await page.evaluate(() => ({ position: scrollY, entry: history.state.__speakmateRouteEntry, scrolls: sessionStorage.getItem('speakmate-route-scroll-v1') }))
  298 |   await page.evaluate(() => {
  299 |     const qa = (window as unknown as { __nativeBoundary: { holdReads: boolean; reads: (() => void)[] } }).__nativeBoundary
  300 |     qa.holdReads = false
  301 |     while (qa.reads.length) qa.reads.shift()!()
  302 |   })
> 303 |   await expect(link).toBeFocused()
      |                      ^ Error: expect(locator).toBeFocused() failed
  304 |   await expect.poll(() => page.evaluate(() => scrollY)).toBe(original.position)
  305 |   await expect(page.getByRole('textbox', { name: '搜索词句与备注' })).toHaveValue('example')
  306 |   const final = await page.evaluate(() => ({ url: location.href, position: scrollY, entry: history.state.__speakmateRouteEntry, focus: document.activeElement?.getAttribute('href'), stack: sessionStorage.getItem('speakmate-route-stack') }))
  307 |   expect(final.entry).toBe(original.state.__speakmateRouteEntry)
  308 |   expect((await localState(page)).notebook).toHaveLength(9)
  309 |   await writeFile(info.outputPath('native-leading-complete.json'), JSON.stringify({ original, before, leading, pending, final }, null, 2))
  310 |   await page.screenshot({ path: info.outputPath('native-leading-restored.png') })
  311 |   await finishNetwork(info)
  312 | })
  313 | 
```