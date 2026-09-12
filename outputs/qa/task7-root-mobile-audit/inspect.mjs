// Local-only QA harness. Isolated synthetic context; never uses a saved profile.
import { chromium } from '@playwright/test'
import { createInterface } from 'node:readline'
import { mkdir, appendFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const origin = 'http://127.0.0.1:3130'
const folder = path.dirname(fileURLToPath(import.meta.url))
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: 'zh-CN', timezoneId: 'Asia/Shanghai' })
const page = await context.newPage()
const errors = []
const requests = []
page.on('pageerror', error => errors.push(error.message))
context.on('request', request => requests.push({ url: request.url(), method: request.method() }))
await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort('blockedbyclient'))
await mkdir(folder, { recursive: true })
const emit = async result => {
  const line = JSON.stringify(result)
  console.log(line)
  await appendFile(path.join(folder, 'observations.jsonl'), line + '\n')
}
const measure = () => page.evaluate(() => ({
  url: location.href, viewport: { width: innerWidth, height: innerHeight },
  clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth,
  scrollY, visualViewport: window.visualViewport ? { width: visualViewport.width, height: visualViewport.height, scale: visualViewport.scale } : null,
  overlay: !!document.querySelector('[data-nextjs-dialog],.vite-error-overlay'),
  focused: { tag: document.activeElement?.tagName, text: document.activeElement?.textContent?.slice(0, 120) },
  targets: [...document.querySelectorAll('button,a,input,textarea,select')].filter(element => element.getClientRects().length).map(element => {
    const rect = element.getBoundingClientRect()
    return { tag: element.tagName, name: element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 100), x: rect.x, y: rect.y, width: rect.width, height: rect.height, disabled: element.matches(':disabled') }
  }),
}))

await page.goto(origin, { waitUntil: 'networkidle' })
await emit({ type: 'ready', browser: browser.version(), synthetic: true, snapshot: await page.locator('body').ariaSnapshot(), metrics: await measure() })
const lines = createInterface({ input: process.stdin })
try {
  for await (const line of lines) {
    try {
      const cmd = JSON.parse(line)
      if (cmd.op === 'close') break
      if (cmd.op === 'snapshot') await emit({ type: 'snapshot', snapshot: await page.locator('body').ariaSnapshot(), metrics: await measure(), errors })
      else if (cmd.op === 'click') await page.getByRole(cmd.role, { name: cmd.name, exact: true }).click()
      else if (cmd.op === 'fill') await page.getByRole(cmd.role, { name: cmd.name, exact: true }).fill(cmd.value)
      else if (cmd.op === 'press') await page.keyboard.press(cmd.key)
      else if (cmd.op === 'resize') await page.setViewportSize({ width: cmd.width, height: cmd.height })
      else if (cmd.op === 'scroll') await page.evaluate(value => window.scrollTo({ top: value, behavior: 'instant' }), cmd.y)
      else if (cmd.op === 'capture') {
        if (!/^[a-z0-9-]+$/.test(cmd.name)) throw new Error('Invalid artifact name')
        await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))) })
        const filename = path.join(folder, cmd.name + '.png')
        await page.screenshot({ path: filename, fullPage: false })
        await emit({ type: 'capture', file: filename, metrics: await measure(), errors })
      } else throw new Error('Unsupported QA operation')
      if (!['snapshot', 'capture'].includes(cmd.op)) await emit({ type: 'action', command: cmd, snapshot: await page.locator('body').ariaSnapshot(), metrics: await measure() })
    } catch (error) { await emit({ type: 'error', message: error.message }) }
  }
} finally {
  lines.close()
  process.stdin.pause()
  await emit({ type: 'closed', errors, nonReadRequests: requests.filter(request => !['GET', 'HEAD'].includes(request.method)), outsideOrigin: requests.filter(request => !request.url.startsWith(origin + '/')) })
  await context.close()
  await browser.close()
}
