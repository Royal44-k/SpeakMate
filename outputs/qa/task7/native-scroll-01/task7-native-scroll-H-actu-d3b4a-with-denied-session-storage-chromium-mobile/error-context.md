# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-native-scroll.spec.ts >> H: actual captured scrollable notebook restores nonzero source focus after delayed native document read and remains safe with denied session storage
- Location: tests\e2e\task7-native-scroll.spec.ts:5:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('正在读取记录簿…', { exact: true })
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for getByText('正在读取记录簿…', { exact: true })

```

```yaml
- main:
  - text: MY PHRASEBOOK
  - heading "记录簿" [level=1]
  - paragraph: 把遇到的表达，变成自己会用的话。
  - tablist "记录簿板块":
    - tab "词句" [selected]
    - tab "待复习"
    - tab "模拟练习"
  - text: 搜索词句与备注
  - textbox "搜索词句与备注": example
  - text: 筛选类型
  - combobox "筛选类型":
    - option "全部词句" [selected]
    - option "单词"
    - option "短语"
    - option "整句"
  - article:
    - heading "synthetic example number 7" [level=2]
    - paragraph
    - link "查看词句":
      - /url: /notebook/note?id=107aaf6d-de55-48cc-8b38-717524cc9c7d
  - article:
    - heading "synthetic example number 6" [level=2]
    - paragraph
    - link "查看词句":
      - /url: /notebook/note?id=17c6a131-2b80-4800-b9e8-b8533e01e273
  - article:
    - heading "synthetic example number 5" [level=2]
    - paragraph
    - link "查看词句":
      - /url: /notebook/note?id=2a8ff7e0-6381-441a-8481-d5abf24ba791
  - article:
    - heading "synthetic example number 1" [level=2]
    - paragraph
    - link "查看词句":
      - /url: /notebook/note?id=49e66bec-b0f1-45ac-b92a-13fc6ab7bea3
  - article:
    - heading "synthetic example number 3" [level=2]
    - paragraph
    - link "查看词句":
      - /url: /notebook/note?id=4c6d4770-8c1e-479c-8b57-adb116febb8b
  - article:
    - heading "synthetic example number 4" [level=2]
    - paragraph
    - link "查看词句":
      - /url: /notebook/note?id=af4d0788-b616-459c-a5f4-d46285d53706
  - article:
    - heading "synthetic example number 0" [level=2]
    - paragraph
    - link "查看词句":
      - /url: /notebook/note?id=b51d0ac5-4f29-4f81-aa94-83f253a52356
  - article:
    - heading "synthetic example number 2" [level=2]
    - paragraph
    - link "查看词句":
      - /url: /notebook/note?id=d9bae6d9-e180-458b-b00f-4a05ae388a48
  - article:
    - heading "for example" [level=2]
    - paragraph
    - link "查看词句":
      - /url: /notebook/note?id=db9fa8cd-36d1-4f7b-9782-c7dfeaa30274
  - link "返回练习":
    - /url: /practice
  - link "管理与导出本机数据":
    - /url: /privacy
- navigation "主要导航":
  - link "目标":
    - /url: /
  - link "练习":
    - /url: /practice
  - link "场景":
    - /url: /scenes
  - link "记录簿":
    - /url: /notebook
  - link "我的":
    - /url: /me
- alert
- status
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
  19 |   expect(position).toBeGreaterThan(300)
  20 |   await link.click()
  21 |   await expect(page.getByRole('heading', {name:'for example', exact:true})).toBeVisible()
  22 |   const noteUrl = page.url()
  23 |   // Hold only the native notebook getAll delivery in the next document. The
  24 |   // actual IDB operation/transaction executes; no fixture rows replace it.
  25 |   await page.addInitScript(() => {
  26 |     if (location.pathname !== '/notebook') return
  27 |     const pending: (() => void)[] = []
  28 |     const getAll = IDBObjectStore.prototype.getAll
  29 |     IDBObjectStore.prototype.getAll = function (...args) {
  30 |       const request = Reflect.apply(getAll, this, args) as IDBRequest
  31 |       if (this.name === 'notebook') {
  32 |         const descriptor = Object.getOwnPropertyDescriptor(IDBRequest.prototype, 'onsuccess')!
  33 |         Object.defineProperty(request, 'onsuccess', {set(handler) { descriptor.set!.call(request, (event: Event) => pending.push(() => handler.call(request, event))) }, get() { return descriptor.get!.call(request) }})
  34 |       }
  35 |       return request
  36 |     }
  37 |     Object.assign(window, {__heldNotebook: pending, __releaseNotebook: () => { while (pending.length) pending.shift()!() }})
  38 |   })
  39 |   await page.getByRole('link', {name:'返回记录簿', exact:true}).click()
  40 |   await expect(page).toHaveURL(/\/notebook$/)
> 41 |   await expect(page.getByText('正在读取记录簿…', {exact:true})).toBeVisible()
     |                                                          ^ Error: expect(locator).toBeVisible() failed
  42 |   await page.waitForFunction(() => (window as unknown as {__heldNotebook: unknown[]}).__heldNotebook.length > 0)
  43 |   const pendingPosition = await page.evaluate(() => scrollY)
  44 |   await page.evaluate(() => (window as unknown as {__releaseNotebook: () => void}).__releaseNotebook())
  45 |   await expect(link).toBeFocused()
  46 |   await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(300)
  47 |   expect(Math.abs(await page.evaluate(() => scrollY) - position)).toBeLessThan(3)
  48 |   await expect(page.getByRole('textbox', {name:'搜索词句与备注'})).toHaveValue('example')
  49 |   const returnedPosition = await page.evaluate(() => scrollY)
  50 |   await page.screenshot({path:info.outputPath('nonzero-restored.png')})
  51 |   await page.goBack()
  52 |   await expect(page).toHaveURL(noteUrl)
  53 |   await page.goForward()
  54 |   await expect(page).toHaveURL(/\/notebook$/)
  55 |   // BFCache may preserve the already released document; a fresh document has
  56 |   // another real delivery to release. Both are native navigation outcomes.
  57 |   await page.waitForFunction(() => !!document.querySelector('article') || (window as unknown as {__heldNotebook?: unknown[]}).__heldNotebook?.length)
  58 |   await page.evaluate(() => (window as unknown as {__releaseNotebook?: () => void}).__releaseNotebook?.())
  59 |   await expect(link).toBeVisible()
  60 |   const intact = await localState(page)
  61 |   expect(intact.notebook).toHaveLength(9)
  62 |   expect(intact.sessions).toHaveLength(1)
  63 |   await page.addInitScript(() => {
  64 |     const set = Storage.prototype.setItem, get = Storage.prototype.getItem
  65 |     Storage.prototype.setItem = function (...args) { if (this === window.sessionStorage) throw new DOMException('Synthetic denied session storage', 'SecurityError'); return Reflect.apply(set, this, args) }
  66 |     Storage.prototype.getItem = function (...args) { if (this === window.sessionStorage) throw new DOMException('Synthetic denied session storage', 'SecurityError'); return Reflect.apply(get, this, args) }
  67 |   })
  68 |   await page.goto(`/notebook/note?id=${selected.id}`)
  69 |   await expect(page.getByRole('heading', {name:'for example', exact:true})).toBeVisible()
  70 |   await page.getByRole('link', {name:'返回记录簿', exact:true}).click()
  71 |   await page.waitForFunction(() => (window as unknown as {__heldNotebook: unknown[]}).__heldNotebook.length > 0)
  72 |   await page.evaluate(() => (window as unknown as {__releaseNotebook: () => void}).__releaseNotebook())
  73 |   await expect(page.getByRole('heading', {name:'记录簿', exact:true})).toBeVisible()
  74 |   expect((await localState(page)).notebook).toEqual(intact.notebook)
  75 |   await writeFile(info.outputPath('native-scroll.json'), JSON.stringify({position, pendingPosition, returnedPosition, noteUrl, state:intact, deniedStorage:'explicit safe return; no precise position claimed'}, null, 2))
  76 |   await finishNetwork(info)
  77 | })
  78 | 
```