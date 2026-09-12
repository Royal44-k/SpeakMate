# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-native-scroll.spec.ts >> H: actual captured scrollable notebook restores nonzero source focus after delayed native document read and remains safe with denied session storage
- Location: tests\e2e\task7-native-scroll.spec.ts:5:1

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 300
Received:   0
```

# Page snapshot

```yaml
- generic [ref=f5e1]:
  - generic [ref=f5e2]:
    - main [ref=f5e4]:
      - generic [ref=f5e5]:
        - text: MY PHRASEBOOK
        - heading "记录簿" [level=1] [ref=f5e6]
        - paragraph [ref=f5e7]: 把遇到的表达，变成自己会用的话。
      - tablist "记录簿板块" [ref=f5e8]:
        - tab "词句" [selected] [ref=f5e9] [cursor=pointer]
        - tab "待复习" [ref=f5e10] [cursor=pointer]
        - tab "模拟练习" [ref=f5e11] [cursor=pointer]
      - generic [ref=f5e12]:
        - text: 搜索词句与备注
        - textbox "搜索词句与备注" [ref=f5e13]: example
      - generic [ref=f5e14]:
        - text: 筛选类型
        - combobox "筛选类型" [ref=f5e15]:
          - option "全部词句" [selected]
          - option "单词"
          - option "短语"
          - option "整句"
      - article [ref=f5e16]:
        - heading "for example" [level=2] [ref=f5e17]
        - paragraph
        - link "查看词句" [active] [ref=f5e19] [cursor=pointer]:
          - /url: /notebook/note?id=179434e3-dd39-4201-bda7-25bea4ddd621
      - article [ref=f5e20]:
        - heading "synthetic example number 1" [level=2] [ref=f5e21]
        - paragraph
        - link "查看词句" [ref=f5e23] [cursor=pointer]:
          - /url: /notebook/note?id=2b829e0f-1570-44ef-9480-bbf712d62900
      - article [ref=f5e24]:
        - heading "synthetic example number 0" [level=2] [ref=f5e25]
        - paragraph
        - link "查看词句" [ref=f5e27] [cursor=pointer]:
          - /url: /notebook/note?id=47eab226-9bfe-4db7-8a8f-9a23bd7c4a3d
      - article [ref=f5e28]:
        - heading "synthetic example number 6" [level=2] [ref=f5e29]
        - paragraph
        - link "查看词句" [ref=f5e31] [cursor=pointer]:
          - /url: /notebook/note?id=6cde1b90-db7a-4672-ab8d-177e64676466
      - article [ref=f5e32]:
        - heading "synthetic example number 3" [level=2] [ref=f5e33]
        - paragraph
        - link "查看词句" [ref=f5e35] [cursor=pointer]:
          - /url: /notebook/note?id=7ff9a3a8-cf37-4cce-9ec4-db97b9acecd2
      - article [ref=f5e36]:
        - heading "synthetic example number 7" [level=2] [ref=f5e37]
        - paragraph
        - link "查看词句" [ref=f5e39] [cursor=pointer]:
          - /url: /notebook/note?id=8b5ea58c-527f-4926-b6a1-771903943cb0
      - article [ref=f5e40]:
        - heading "synthetic example number 4" [level=2] [ref=f5e41]
        - paragraph
        - link "查看词句" [ref=f5e43] [cursor=pointer]:
          - /url: /notebook/note?id=9e07e663-a6f9-495d-8fbd-6b9c25b0cc39
      - article [ref=f5e44]:
        - heading "synthetic example number 5" [level=2] [ref=f5e45]
        - paragraph
        - link "查看词句" [ref=f5e47] [cursor=pointer]:
          - /url: /notebook/note?id=a010dc9e-3849-4b52-9e7b-0752c5a0abe4
      - article [ref=f5e48]:
        - heading "synthetic example number 2" [level=2] [ref=f5e49]
        - paragraph
        - link "查看词句" [ref=f5e51] [cursor=pointer]:
          - /url: /notebook/note?id=b3cf4bfa-2872-4db6-8d57-eb9eb4127993
      - generic [ref=f5e52]:
        - link "返回练习" [ref=f5e53] [cursor=pointer]:
          - /url: /practice
        - link "管理与导出本机数据" [ref=f5e54] [cursor=pointer]:
          - /url: /privacy
    - navigation "主要导航" [ref=f5e55]:
      - link "目标" [ref=f5e56] [cursor=pointer]:
        - /url: /
      - link "练习" [ref=f5e60] [cursor=pointer]:
        - /url: /practice
      - link "场景" [ref=f5e64] [cursor=pointer]:
        - /url: /scenes
      - link "记录簿" [ref=f5e68] [cursor=pointer]:
        - /url: /notebook
      - link "我的" [ref=f5e72] [cursor=pointer]:
        - /url: /me
  - alert [ref=f5e76]
  - status [ref=f5e77]: 记录簿
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test'
  2  | import { writeFile } from 'node:fs/promises'
  3  | import { onboard, enterScene, capture, localState, protect } from './task7-browser-helpers'
  4  | 
  5  | test('H: actual captured scrollable notebook restores nonzero source focus after delayed native document read and remains safe with denied session storage', async ({page, context, baseURL}, info) => {
  6  |   test.setTimeout(180000)
  7  |   const finishNetwork = await protect(context, baseURL!)
  8  |   await onboard(page)
  9  |   await enterScene(page, 'ask-teacher', 'A2')
  10 |   const selected = await capture(page, 'for example', 'phrase')
  11 |   for (let index = 0; index < 8; index++) await capture(page, `synthetic example number ${index}`, 'phrase')
  12 |   await page.getByRole('link', {name:'退出本次练习'}).click()
  13 |   await page.goto('/notebook')
  14 |   await page.getByRole('textbox', {name:'搜索词句与备注'}).fill('example')
  15 |   const link = page.getByRole('article').filter({has:page.getByRole('heading', {name:'for example', exact:true})}).getByRole('link', {name:'查看词句', exact:true})
  16 |   await link.scrollIntoViewIfNeeded()
  17 |   await link.focus()
  18 |   const position = await page.evaluate(() => scrollY)
> 19 |   expect(position).toBeGreaterThan(300)
     |                    ^ Error: expect(received).toBeGreaterThan(expected)
  20 |   await link.click()
  21 |   await expect(page.getByRole('heading', {name:'for example', exact:true})).toBeVisible()
  22 |   const noteUrl = page.url()
  23 |   // Hold only the native notebook getAll delivery in the next document. The
  24 |   // actual IDB operation/transaction executes; no fixture rows replace it.
  25 |   await page.addInitScript(() => {
  26 |     if (location.pathname !== '/notebook') return
  27 |     const pending: (() => void)[] = []
  28 |     let released = false
  29 |     const getAll = IDBObjectStore.prototype.getAll
  30 |     IDBObjectStore.prototype.getAll = function (...args) {
  31 |       const request = Reflect.apply(getAll, this, args) as IDBRequest
  32 |       if (this.name === 'notebook') {
  33 |         const descriptor = Object.getOwnPropertyDescriptor(IDBRequest.prototype, 'onsuccess')!
  34 |         Object.defineProperty(request, 'onsuccess', {set(handler) { descriptor.set!.call(request, (event: Event) => released ? handler.call(request, event) : pending.push(() => handler.call(request, event))) }, get() { return descriptor.get!.call(request) }})
  35 |       }
  36 |       return request
  37 |     }
  38 |     Object.assign(window, {__heldNotebook: pending, __releaseNotebook: () => { released = true; while (pending.length) pending.shift()!() }})
  39 |   })
  40 |   await page.getByRole('link', {name:'返回记录簿', exact:true}).click()
  41 |   await expect(page).toHaveURL(/\/notebook$/)
  42 |   await page.waitForFunction(() => !!document.querySelector('article') || (window as unknown as {__heldNotebook?: unknown[]}).__heldNotebook?.length)
  43 |   const delayed = await page.evaluate(() => !!(window as unknown as {__heldNotebook?: unknown[]}).__heldNotebook?.length)
  44 |   const pendingPosition = await page.evaluate(() => scrollY)
  45 |   await page.evaluate(() => (window as unknown as {__releaseNotebook?: () => void}).__releaseNotebook?.())
  46 |   await expect(link).toBeFocused()
  47 |   await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(300)
  48 |   expect(Math.abs(await page.evaluate(() => scrollY) - position)).toBeLessThan(3)
  49 |   await expect(page.getByRole('textbox', {name:'搜索词句与备注'})).toHaveValue('example')
  50 |   const returnedPosition = await page.evaluate(() => scrollY)
  51 |   await page.screenshot({path:info.outputPath('nonzero-restored.png')})
  52 |   await page.goBack()
  53 |   await expect(page).toHaveURL(noteUrl)
  54 |   await page.goForward()
  55 |   await expect(page).toHaveURL(/\/notebook$/)
  56 |   // BFCache may preserve the already released document; a fresh document has
  57 |   // another real delivery to release. Both are native navigation outcomes.
  58 |   await page.waitForFunction(() => !!document.querySelector('article') || (window as unknown as {__heldNotebook?: unknown[]}).__heldNotebook?.length)
  59 |   await page.evaluate(() => (window as unknown as {__releaseNotebook?: () => void}).__releaseNotebook?.())
  60 |   await expect(link).toBeVisible()
  61 |   const intact = await localState(page)
  62 |   expect(intact.notebook).toHaveLength(9)
  63 |   expect(intact.sessions).toHaveLength(1)
  64 |   await page.addInitScript(() => {
  65 |     const set = Storage.prototype.setItem, get = Storage.prototype.getItem
  66 |     Storage.prototype.setItem = function (...args) { if (this === window.sessionStorage) throw new DOMException('Synthetic denied session storage', 'SecurityError'); return Reflect.apply(set, this, args) }
  67 |     Storage.prototype.getItem = function (...args) { if (this === window.sessionStorage) throw new DOMException('Synthetic denied session storage', 'SecurityError'); return Reflect.apply(get, this, args) }
  68 |   })
  69 |   await page.goto(`/notebook/note?id=${selected.id}`)
  70 |   await expect(page.getByRole('heading', {name:'for example', exact:true})).toBeVisible()
  71 |   await page.getByRole('link', {name:'返回记录簿', exact:true}).click()
  72 |   await page.waitForFunction(() => (window as unknown as {__heldNotebook: unknown[]}).__heldNotebook.length > 0)
  73 |   await page.evaluate(() => (window as unknown as {__releaseNotebook: () => void}).__releaseNotebook())
  74 |   await expect(page.getByRole('heading', {name:'记录簿', exact:true})).toBeVisible()
  75 |   expect((await localState(page)).notebook).toEqual(intact.notebook)
  76 |   await writeFile(info.outputPath('native-scroll.json'), JSON.stringify({position, delayed, pendingPosition, returnedPosition, noteUrl, state:intact, deniedStorage:'explicit safe return; no precise position claimed'}, null, 2))
  77 |   await finishNetwork(info)
  78 | })
  79 | 
```