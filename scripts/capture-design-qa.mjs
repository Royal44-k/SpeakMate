import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { chromium } from '@playwright/test'

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3100'
const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const outputDir = `${projectRoot}tests/visual/`
const referencePath = `${projectRoot}docs/design/speakmate-dialogue-stage-reference.png`
const implementationPath = `${outputDir}implementation-390x844.png`
const comparisonPath = `${outputDir}comparison-reference-vs-implementation.png`

const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined })

try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    colorScheme: 'light',
  })
  const page = await context.newPage()

  await page.goto(`${baseUrl}/session/new?scene=hotel-check-in&level=B1`, { waitUntil: 'networkidle' })
  await page.getByText('正在准备对话舞台…').waitFor({ state: 'hidden' })

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
          const active = request.result.find((session) => session.status === 'active')
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
          learnerText: 'Hello, I have a reservation under the name Chen.',
          aiText: 'Welcome to Harbor House. May I see your passport and booking confirmation?',
          createdAt: new Date().toISOString(),
        })
      }
    })
  })

  await page.reload({ waitUntil: 'networkidle' })
  await page.getByText('正在准备对话舞台…').waitFor({ state: 'hidden' })
  await page.screenshot({ path: implementationPath })

  const [reference, implementation] = await Promise.all([
    readFile(referencePath),
    readFile(implementationPath),
  ])
  const compare = await context.newPage()
  await compare.setViewportSize({ width: 840, height: 910 })
  await compare.setContent(`<!doctype html>
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 18px; background: #eef2f4; color: #0b2a43; font: 700 13px/1.4 Arial, sans-serif; }
          main { display: grid; grid-template-columns: repeat(2, 390px); gap: 24px; align-items: start; }
          figure { margin: 0; }
          figcaption { height: 28px; letter-spacing: .08em; text-transform: uppercase; }
          img { display: block; width: 390px; height: 844px; object-fit: cover; object-position: top; border: 1px solid #ccd6dc; background: white; box-shadow: 0 8px 24px rgb(11 42 67 / 12%); }
        </style>
      </head>
      <body>
        <main>
          <figure><figcaption>Reference · 390 × 844 normalized</figcaption><img alt="reference" src="data:image/png;base64,${reference.toString('base64')}"></figure>
          <figure><figcaption>Implementation · 390 × 844</figcaption><img alt="implementation" src="data:image/png;base64,${implementation.toString('base64')}"></figure>
        </main>
      </body>
    </html>`)
  await compare.screenshot({ path: comparisonPath })
} finally {
  await browser.close()
}

console.log(`Captured ${comparisonPath}`)
