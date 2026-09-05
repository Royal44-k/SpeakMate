import { expect, test } from '@playwright/test'

test('restores the latest active scene after refresh', async ({ page }) => {
  await page.goto('/session/new?scene=hotel-check-in&level=B1')
  await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  await page.getByRole('button', { name: '改用键盘输入' }).click()
  await page.getByLabel('英文内容').fill('Hello, I have a reservation under the name Li.')
  await page.getByRole('button', { name: '提交这一轮' }).click()
  await expect(page.getByText('这句话表达得很清楚')).toBeVisible()

  await page.reload()
  await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  await expect(page.getByText(/room|nights|stay/i)).toBeVisible()
})

test('falls back to keyboard when microphone permission is denied', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.reject(new DOMException('Denied', 'NotAllowedError')) },
    })
  })
  await page.goto('/session/new?scene=hotel-check-in&level=A2')
  await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  await page.getByRole('button', { name: '开始录音' }).click()
  await expect(page.getByText('无法使用麦克风，你仍可输入英文继续练习。')).toBeVisible()
  await expect(page.getByRole('button', { name: '改用键盘输入' })).toBeEnabled()
})
