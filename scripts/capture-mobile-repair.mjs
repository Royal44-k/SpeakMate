import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const origin = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3114'
const output = new URL('../artifacts/2.3.0/', import.meta.url)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({
  channel: process.platform === 'win32' ? 'msedge' : undefined,
})
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  locale: 'zh-CN',
})
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
try {
  await page.goto(`${origin}/scenes?level=C1`)
  await page.getByRole('button', { name: 'A1', exact: true }).click()
  await page.waitForURL(/level=A1/)
  await page.goto(`${origin}/session/new?scene=coffee-order&level=C1`)
  await page.waitForURL(/\/session\/session_/)
  const sessionUrl = page.url()
  await page.goto(`${origin}/practice`)
  await page.getByRole('link', { name: '开启新一轮对话' }).waitFor()
  await page.screenshot({
    path: fileURLToPath(new URL('home-390.png', output)),
    fullPage: false,
  })
  await page
    .getByRole('link', { name: /继续本次对话/ })
    .scrollIntoViewIfNeeded()
  await page.screenshot({
    path: fileURLToPath(new URL('home-resume-390.png', output)),
    fullPage: false,
  })
  await page.goto(`${origin}/scenes?level=C1`)
  await page.getByLabel('搜索场景').fill('拿铁')
  await page.getByRole('button', { name: '搜索', exact: true }).click()
  await page.getByRole('link', { name: '准备练习：咖啡点单' }).waitFor()
  await page.screenshot({
    path: fileURLToPath(new URL('search-390.png', output)),
    fullPage: false,
  })
  await page.goto(sessionUrl)
  await page.getByRole('button', { name: '改用键盘输入' }).click()
  await page.getByLabel('英文内容').fill('A small latte, please.')
  await page.getByRole('button', { name: '提交这一轮' }).click()
  await page.getByRole('button', { name: '改用键盘输入' }).waitFor()
  await page.getByText('下一句怎么说？', { exact: true }).click()
  await page.locator('details').scrollIntoViewIfNeeded()
  await page.screenshot({
    path: fileURLToPath(new URL('next-reply-390.png', output)),
    fullPage: false,
  })
  for (const suggestion of await page.locator('details > div').all()) {
    await suggestion.scrollIntoViewIfNeeded()
    const bounds = await suggestion.boundingBox()
    const dock = await page
      .getByRole('region', { name: '语音输入' })
      .boundingBox()
    if (bounds.y + bounds.height > dock.y - 12)
      await page.evaluate(
        (amount) => window.scrollBy(0, amount),
        bounds.y + bounds.height - dock.y + 12,
      )
    const visible = await suggestion.boundingBox()
    if (visible.y < 0 || visible.y + visible.height > dock.y)
      throw new Error(
        'A reply suggestion is not fully reachable above the speech dock',
      )
  }
  await page.screenshot({
    path: fileURLToPath(new URL('next-reply-scrolled-390.png', output)),
    fullPage: false,
  })
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.getByRole('link', { name: '退出本次练习' }).click()
  await page.waitForURL(/\/scenes\/coffee-order/)
  await page.screenshot({
    path: fileURLToPath(new URL('exit-detail-1280.png', output)),
    fullPage: false,
  })
  console.log(
    JSON.stringify({
      output: output.pathname,
      pageErrors: errors,
      detailWidth: (await page.locator('article').boundingBox()).width,
    }),
  )
  if (errors.length) process.exitCode = 1
} finally {
  await browser.close()
}
