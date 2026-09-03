import { expect, test } from '@playwright/test'

const viewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
]

test('scene library stays usable without horizontal overflow', async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto('/scenes')
    await expect(page.getByRole('heading', { name: '把英语练进生活里' })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, `${viewport.width}×${viewport.height}`).toBeLessThanOrEqual(1)
    await expect(page.getByRole('navigation', { name: '主要导航' })).toBeVisible()
  }
})

test('practice controls remain visible at phone and tablet sizes', async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto('/session/new?scene=hotel-check-in&level=B1')
    await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
    await expect(page.getByRole('button', { name: '开始录音' })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, `${viewport.width}×${viewport.height}`).toBeLessThanOrEqual(1)
  }
})

test('practice remains operable in phone landscape orientation', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await page.goto('/session/new?scene=hotel-check-in&level=B1')
  await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  await expect(page.getByRole('button', { name: '开始录音' })).toBeVisible()
  await expect(page.getByRole('button', { name: '改用键盘输入' })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})

test('scene discovery tolerates 200 percent text sizing and forced dark preference', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/scenes')
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })

  await expect(page.getByRole('heading', { name: '把英语练进生活里' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: '主要导航' })).toBeVisible()
  const result = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    colorScheme: getComputedStyle(document.documentElement).colorScheme,
  }))
  expect(result.overflow).toBeLessThanOrEqual(1)
  expect(result.colorScheme).toBe('light')
})
