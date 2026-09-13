# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-native-scroll.spec.ts >> H: actual captured scrollable notebook restores nonzero source focus after delayed native document read and remains safe with denied session storage
- Location: tests\e2e\task7-native-scroll.spec.ts:5:1

# Error details

```
TimeoutError: page.waitForFunction: Timeout 10000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=f11e1]:
  - generic [ref=f11e2]:
    - main [ref=f11e4]:
      - generic [ref=f11e5]:
        - text: MY PHRASEBOOK
        - heading "记录簿" [active] [level=1] [ref=f11e6]
        - paragraph [ref=f11e7]: 把遇到的表达，变成自己会用的话。
      - tablist "记录簿板块" [ref=f11e8]:
        - tab "词句" [selected] [ref=f11e9] [cursor=pointer]
        - tab "待复习" [ref=f11e10] [cursor=pointer]
        - tab "模拟练习" [ref=f11e11] [cursor=pointer]
      - generic [ref=f11e12]:
        - text: 搜索词句与备注
        - textbox "搜索词句与备注" [ref=f11e13]
      - generic [ref=f11e14]:
        - text: 筛选类型
        - combobox "筛选类型" [ref=f11e15]:
          - option "全部词句" [selected]
          - option "单词"
          - option "短语"
          - option "整句"
      - article [ref=f11e16]:
        - heading "synthetic example number 5" [level=2] [ref=f11e17]
        - paragraph
        - link "查看词句" [ref=f11e19] [cursor=pointer]:
          - /url: /notebook/note?id=231576f3-ba0b-49fc-895a-5ad3f1e60d98
      - article [ref=f11e20]:
        - heading "synthetic example number 3" [level=2] [ref=f11e21]
        - paragraph
        - link "查看词句" [ref=f11e23] [cursor=pointer]:
          - /url: /notebook/note?id=2940b777-a466-4362-afa3-92d54d752a0e
      - article [ref=f11e24]:
        - heading "synthetic example number 7" [level=2] [ref=f11e25]
        - paragraph
        - link "查看词句" [ref=f11e27] [cursor=pointer]:
          - /url: /notebook/note?id=2b920eab-fdb5-4e84-84bf-d2b17569503b
      - article [ref=f11e28]:
        - heading "synthetic example number 2" [level=2] [ref=f11e29]
        - paragraph
        - link "查看词句" [ref=f11e31] [cursor=pointer]:
          - /url: /notebook/note?id=2d3ca52d-0d14-49d4-acec-9a32a9d27f37
      - article [ref=f11e32]:
        - heading "synthetic example number 6" [level=2] [ref=f11e33]
        - paragraph
        - link "查看词句" [ref=f11e35] [cursor=pointer]:
          - /url: /notebook/note?id=544fddac-eb99-4a6e-ae6d-f1e0ee4f58b5
      - article [ref=f11e36]:
        - heading "synthetic example number 4" [level=2] [ref=f11e37]
        - paragraph
        - link "查看词句" [ref=f11e39] [cursor=pointer]:
          - /url: /notebook/note?id=894aa960-c10c-4fdc-aaf7-98228e761071
      - article [ref=f11e40]:
        - heading "synthetic example number 1" [level=2] [ref=f11e41]
        - paragraph
        - link "查看词句" [ref=f11e43] [cursor=pointer]:
          - /url: /notebook/note?id=e2126a84-fe5c-4993-a246-6dd21d13480f
      - article [ref=f11e44]:
        - heading "for example" [level=2] [ref=f11e45]
        - paragraph
        - link "查看词句" [ref=f11e47] [cursor=pointer]:
          - /url: /notebook/note?id=e37523e6-5f65-4f38-993d-d9fa98f86bf4
      - article [ref=f11e48]:
        - heading "synthetic example number 0" [level=2] [ref=f11e49]
        - paragraph
        - link "查看词句" [ref=f11e51] [cursor=pointer]:
          - /url: /notebook/note?id=eb660c4d-d2de-4d4c-905d-940f0d671bbb
      - generic [ref=f11e52]:
        - link "返回练习" [ref=f11e53] [cursor=pointer]:
          - /url: /practice
        - link "管理与导出本机数据" [ref=f11e54] [cursor=pointer]:
          - /url: /privacy
    - navigation "主要导航" [ref=f11e55]:
      - link "目标" [ref=f11e56] [cursor=pointer]:
        - /url: /
      - link "练习" [ref=f11e60] [cursor=pointer]:
        - /url: /practice
      - link "场景" [ref=f11e64] [cursor=pointer]:
        - /url: /scenes
      - link "记录簿" [ref=f11e68] [cursor=pointer]:
        - /url: /notebook
      - link "我的" [ref=f11e72] [cursor=pointer]:
        - /url: /me
  - alert [ref=f11e76]
  - status [ref=f11e77]: 记录簿
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
  10 |   await capture(page, 'for example', 'phrase')
  11 |   for (let index = 0; index < 8; index++) await capture(page, `synthetic example number ${index}`, 'phrase')
  12 |   await page.getByRole('link', {name:'退出本次练习'}).click()
  13 |   await page.goto('/notebook')
  14 |   await page.getByRole('textbox', {name:'搜索词句与备注'}).fill('example')
  15 |   await expect(page.getByRole('article')).toHaveCount(9)
  16 |   const selectedText = await page.getByRole('article').last().getByRole('heading').innerText()
  17 |   const link = page.getByRole('article').last().getByRole('link', {name:'查看词句', exact:true})
  18 |   const selectedId = new URL((await link.getAttribute('href'))!, baseURL).searchParams.get('id')!
  19 |   await link.scrollIntoViewIfNeeded()
  20 |   await link.focus()
  21 |   const position = await page.evaluate(() => scrollY)
  22 |   expect(position).toBeGreaterThan(300)
  23 |   await link.click()
  24 |   await expect(page.getByRole('heading', {name:selectedText, exact:true})).toBeVisible()
  25 |   const noteUrl = page.url()
  26 |   // Hold only the native notebook getAll delivery in the next document. The
  27 |   // actual IDB operation/transaction executes; no fixture rows replace it.
  28 |   await page.addInitScript(() => {
  29 |     if (location.pathname !== '/notebook') return
  30 |     const pending: (() => void)[] = []
  31 |     let released = false
  32 |     const getAll = IDBObjectStore.prototype.getAll
  33 |     IDBObjectStore.prototype.getAll = function (...args) {
  34 |       const request = Reflect.apply(getAll, this, args) as IDBRequest
  35 |       if (this.name === 'notebook') {
  36 |         const descriptor = Object.getOwnPropertyDescriptor(IDBRequest.prototype, 'onsuccess')!
  37 |         Object.defineProperty(request, 'onsuccess', {set(handler) { descriptor.set!.call(request, (event: Event) => released ? handler.call(request, event) : pending.push(() => handler.call(request, event))) }, get() { return descriptor.get!.call(request) }})
  38 |       }
  39 |       return request
  40 |     }
  41 |     Object.assign(window, {__heldNotebook: pending, __releaseNotebook: () => { released = true; while (pending.length) pending.shift()!() }})
  42 |   })
  43 |   await page.getByRole('link', {name:'返回记录簿', exact:true}).click()
  44 |   await expect(page).toHaveURL(/\/notebook$/)
  45 |   await page.waitForFunction(() => !!document.querySelector('article') || (window as unknown as {__heldNotebook?: unknown[]}).__heldNotebook?.length)
  46 |   const delayed = await page.evaluate(() => !!(window as unknown as {__heldNotebook?: unknown[]}).__heldNotebook?.length)
  47 |   const pendingPosition = await page.evaluate(() => scrollY)
  48 |   await page.evaluate(() => (window as unknown as {__releaseNotebook?: () => void}).__releaseNotebook?.())
  49 |   await expect(link).toBeFocused()
  50 |   await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(300)
  51 |   expect(Math.abs(await page.evaluate(() => scrollY) - position)).toBeLessThan(3)
  52 |   await expect(page.getByRole('textbox', {name:'搜索词句与备注'})).toHaveValue('example')
  53 |   const returnedPosition = await page.evaluate(() => scrollY)
  54 |   await page.screenshot({path:info.outputPath('nonzero-restored.png')})
  55 |   await page.goBack()
  56 |   await expect(page).toHaveURL(noteUrl)
  57 |   await page.goForward()
  58 |   await expect(page).toHaveURL(/\/notebook$/)
  59 |   // BFCache may preserve the already released document; a fresh document has
  60 |   // another real delivery to release. Both are native navigation outcomes.
  61 |   await page.waitForFunction(() => !!document.querySelector('article') || (window as unknown as {__heldNotebook?: unknown[]}).__heldNotebook?.length)
  62 |   await page.evaluate(() => (window as unknown as {__releaseNotebook?: () => void}).__releaseNotebook?.())
  63 |   await expect(link).toBeVisible()
  64 |   const intact = await localState(page)
  65 |   expect(intact.notebook).toHaveLength(9)
  66 |   expect(intact.sessions).toHaveLength(1)
  67 |   await page.addInitScript(() => {
  68 |     const set = Storage.prototype.setItem, get = Storage.prototype.getItem
  69 |     Storage.prototype.setItem = function (...args) { if (this === window.sessionStorage) throw new DOMException('Synthetic denied session storage', 'SecurityError'); return Reflect.apply(set, this, args) }
  70 |     Storage.prototype.getItem = function (...args) { if (this === window.sessionStorage) throw new DOMException('Synthetic denied session storage', 'SecurityError'); return Reflect.apply(get, this, args) }
  71 |   })
  72 |   await page.goto(`/notebook/note?id=${selectedId}`)
  73 |   await expect(page.getByRole('heading', {name:selectedText, exact:true})).toBeVisible()
  74 |   await page.getByRole('link', {name:'返回记录簿', exact:true}).click()
> 75 |   await page.waitForFunction(() => (window as unknown as {__heldNotebook: unknown[]}).__heldNotebook.length > 0)
     |              ^ TimeoutError: page.waitForFunction: Timeout 10000ms exceeded.
  76 |   await page.evaluate(() => (window as unknown as {__releaseNotebook: () => void}).__releaseNotebook())
  77 |   await expect(page.getByRole('heading', {name:'记录簿', exact:true})).toBeVisible()
  78 |   expect((await localState(page)).notebook).toEqual(intact.notebook)
  79 |   await writeFile(info.outputPath('native-scroll.json'), JSON.stringify({position, delayed, pendingPosition, returnedPosition, noteUrl, state:intact, deniedStorage:'explicit safe return; no precise position claimed'}, null, 2))
  80 |   await finishNetwork(info)
  81 | })
  82 | 
```