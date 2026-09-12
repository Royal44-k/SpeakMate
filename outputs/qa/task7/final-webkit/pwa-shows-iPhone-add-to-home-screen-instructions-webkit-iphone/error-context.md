# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pwa.spec.ts >> shows iPhone add-to-home-screen instructions
- Location: tests\e2e\pwa.spec.ts:64:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('打开 Safari 的分享菜单')
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for getByText('打开 Safari 的分享菜单')

```

```yaml
- main:
  - link "返回我的练习":
    - /url: /me
  - paragraph: 像 APP 一样使用
  - heading "安装到手机" [level=1]
  - region "把练习放到主屏幕":
    - heading "把练习放到主屏幕" [level=2]
    - paragraph: 安装后可像应用一样打开。公开资料与页面需先联网准备；准备完成的文字练习可在本机继续。麦克风、朗读与跟读取决于浏览器支持，不影响文字练习。
    - paragraph: 安装不保证数据永久保留，也不保证 Safari、主屏幕应用或不同设备自动迁移记录。先导出备份，并在文件 App 确认保存。
    - region "添加 SpeakMate 到主屏幕":
      - heading "添加 SpeakMate 到主屏幕" [level=2]
      - tablist "选择设备":
        - tab "iPhone" [selected]
        - tab "Android"
      - tabpanel "iPhone":
        - list:
          - listitem: 打开 Safari 的共享菜单：紧凑布局先点“更多”再点“共享”；顶部或底部布局可直接点共享按钮。
          - listitem: 选择“添加到主屏幕”；缺少时在“编辑操作”中添加。
          - listitem: 若有“作为网页 App 打开”，请开启，再确认名称并点“添加”。较早 iOS 按实际菜单操作。
    - link "先继续练习":
      - /url: /practice
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
- status: 安装到手机
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test'
  2  | import vm from 'node:vm'
  3  | 
  4  | test('publishes an installable manifest and service worker', async ({
  5  |   page,
  6  |   request,
  7  | }) => {
  8  |   await page.goto('/')
  9  |   const manifestHref = await page
  10 |     .locator('link[rel="manifest"]')
  11 |     .getAttribute('href')
  12 |   expect(manifestHref).toBe('/manifest.webmanifest')
  13 | 
  14 |   const manifest = await request.get('/manifest.webmanifest')
  15 |   expect(manifest.ok()).toBe(true)
  16 |   const installed = await manifest.json()
  17 |   expect(installed).toMatchObject({
  18 |     display: 'standalone',
  19 |     start_url: '/',
  20 |     scope: '/',
  21 |   })
  22 |   expect(installed.shortcuts.map((item: { url: string }) => item.url)).toEqual([
  23 |     '/practice/today',
  24 |     '/scenes',
  25 |   ])
  26 |   const health = await request.get('/api/v1/health')
  27 |   expect(await health.json()).toMatchObject({
  28 |     version: '3.0.0',
  29 |     mode: 'local-learning',
  30 |   })
  31 | 
  32 |   const serviceWorker = await request.get('/sw.js')
  33 |   expect(serviceWorker.ok()).toBe(true)
  34 |   const build = await request.get('/offline-build.js')
  35 |   const sandbox = { self: {} as { SPEAKMATE_OFFLINE?: { buildId: string } } }
  36 |   vm.runInNewContext(await build.text(), sandbox)
  37 |   await page.waitForFunction(
  38 |     () => !!navigator.serviceWorker.controller,
  39 |     undefined,
  40 |     { timeout: 20000 },
  41 |   )
  42 |   const nativeBuild = await page.evaluate(
  43 |     () =>
  44 |       new Promise<string>((resolve, reject) => {
  45 |         const worker = navigator.serviceWorker.controller!
  46 |         const timeout = setTimeout(
  47 |           () => reject(new Error('Actual controller did not identify build')),
  48 |           5000,
  49 |         )
  50 |         const receive = (event: MessageEvent) => {
  51 |           if (event.source === worker && event.data?.type === 'BUILD_ID') {
  52 |             clearTimeout(timeout)
  53 |             navigator.serviceWorker.removeEventListener('message', receive)
  54 |             resolve(event.data.buildId)
  55 |           }
  56 |         }
  57 |         navigator.serviceWorker.addEventListener('message', receive)
  58 |         worker.postMessage({ type: 'GET_BUILD_ID' })
  59 |       }),
  60 |   )
  61 |   expect(nativeBuild).toBe(sandbox.self.SPEAKMATE_OFFLINE!.buildId)
  62 | })
  63 | 
  64 | test('shows iPhone add-to-home-screen instructions', async ({
  65 |   page,
  66 |   browserName,
  67 | }) => {
  68 |   test.skip(browserName !== 'webkit', 'iPhone guidance is validated in WebKit')
  69 |   await page.goto('/install')
> 70 |   await expect(page.getByText('打开 Safari 的分享菜单')).toBeVisible()
     |                                                   ^ Error: expect(locator).toBeVisible() failed
  71 |   await expect(page.getByText('选择“添加到主屏幕”')).toBeVisible()
  72 | })
  73 | 
```