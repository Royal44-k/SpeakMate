import { expect, test } from '@playwright/test'

test('core mobile journey exposes semantic names and keyboard alternatives', async ({ page }) => {
  await page.goto('/session/new?scene=hotel-check-in&level=B1')
  await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByRole('button', { name: '播放 AI 回复' })).toBeVisible()
  await expect(page.getByRole('button', { name: '开始录音' })).toBeVisible()
  await expect(page.getByRole('button', { name: '改用键盘输入' })).toBeVisible()

  await page.keyboard.press('Tab')
  const focused = await page.evaluate(() => document.activeElement?.tagName)
  expect(focused).not.toBe('BODY')
})
