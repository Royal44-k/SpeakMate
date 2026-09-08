import { fileURLToPath } from 'node:url'

import { chromium } from '@playwright/test'

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3100'
const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const outputDir = `${projectRoot}tests/visual/`
const captures = [
  {
    name: 'portrait',
    viewport: { width: 390, height: 844 },
    path: `${outputDir}mobile-ux-390x844.png`,
  },
  {
    name: 'landscape',
    viewport: { width: 844, height: 390 },
    path: `${outputDir}mobile-ux-844x390.png`,
  },
]

const browser = await chromium.launch({
  channel: process.platform === 'win32' ? 'msedge' : undefined,
})

async function seedCompletedTurn(page) {
  await page.evaluate(async () => {
    const sessionId = await new Promise((resolve, reject) => {
      const open = indexedDB.open('speakmate-v1', 1)
      open.onerror = () => reject(open.error)
      open.onsuccess = () => {
        const database = open.result
        const transaction = database.transaction('sessions', 'readonly')
        const request = transaction.objectStore('sessions').getAll()
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const active = request.result.find(
            (session) => session.status === 'active',
          )
          database.close()
          if (!active) reject(new Error('No active practice session'))
          else resolve(active.id)
        }
      }
    })

    await new Promise((resolve, reject) => {
      const open = indexedDB.open('speakmate-v1', 1)
      open.onerror = () => reject(open.error)
      open.onsuccess = () => {
        const database = open.result
        const transaction = database.transaction('turns', 'readwrite')
        transaction.onerror = () => reject(transaction.error)
        transaction.oncomplete = () => {
          database.close()
          resolve()
        }
        transaction.objectStore('turns').put({
          id: 'turn_design_qa',
          sessionId,
          index: 0,
          learnerText:
            'Hello, I have a reservation under the name Chen.',
          aiText:
            'Welcome to Harbor House. May I see your passport and booking confirmation?',
          createdAt: new Date().toISOString(),
        })
      }
    })
  })
}

async function assertCaptureReady(page, capture) {
  await page.getByText('正在准备对话舞台…').waitFor({ state: 'hidden' })
  await page.getByRole('heading', { name: 'Dialogue Stage' }).waitFor()
  await page
    .getByText(
      'Welcome to Harbor House. May I see your passport and booking confirmation?',
    )
    .waitFor()
  await page.getByText('2 / 6', { exact: false }).waitFor()

  for (const name of ['开始录音', '改用键盘输入']) {
    const control = page.getByRole('button', { name })
    await control.waitFor()
    const bounds = await control.boundingBox()
    if (
      !bounds ||
      bounds.x < 0 ||
      bounds.y < 0 ||
      bounds.x + bounds.width > capture.viewport.width + 1 ||
      bounds.y + bounds.height > capture.viewport.height + 1
    ) {
      throw new Error(`${capture.name} ${name} is outside the viewport`)
    }
  }

  if (capture.name === 'landscape') {
    const prompt = page.locator('blockquote').filter({ hasText: 'Welcome' })
    const dock = page.getByRole('region', { name: '语音输入' })
    const [promptBounds, dockBounds] = await Promise.all([
      prompt.boundingBox(),
      dock.boundingBox(),
    ])
    if (
      !promptBounds ||
      !dockBounds ||
      promptBounds.y < 0 ||
      promptBounds.y + promptBounds.height > dockBounds.y
    ) {
      throw new Error('landscape AI prompt is not fully visible above the speech dock')
    }
  }

  const layout = await page.evaluate(() => ({
    rootOverflow:
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
    scrollY: window.scrollY,
  }))
  if (layout.rootOverflow > 1) {
    throw new Error(
      `${capture.name} has ${layout.rootOverflow}px root horizontal overflow`,
    )
  }
  if (Math.abs(layout.scrollY) > 1) {
    throw new Error(`${capture.name} did not capture the initial stage position`)
  }
}

try {
  for (const capture of captures) {
    const context = await browser.newContext({
      viewport: capture.viewport,
      deviceScaleFactor: 1,
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
      colorScheme: 'light',
    })
    const page = await context.newPage()

    await page.goto(
      `${baseUrl}/session/new?scene=hotel-check-in&level=B1`,
      { waitUntil: 'networkidle' },
    )
    await page.getByText('正在准备对话舞台…').waitFor({ state: 'hidden' })
    await seedCompletedTurn(page)
    await page.reload({ waitUntil: 'networkidle' })
    await assertCaptureReady(page, capture)
    await page.screenshot({ path: capture.path })
    await context.close()
    console.log(
      `Captured ${capture.path} at ${capture.viewport.width}x${capture.viewport.height} @1x`,
    )
  }
} finally {
  await browser.close()
}
