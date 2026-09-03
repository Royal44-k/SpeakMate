import { expect, test } from '@playwright/test'

test('guest completes a first text-assisted speaking turn without cloud credentials', async ({ page }) => {
  await page.goto('/welcome')
  await page.getByRole('button', { name: 'B1 中级' }).click()
  await page.getByRole('button', { name: '旅行' }).click()
  await page.getByRole('button', { name: '每天 5 分钟' }).click()
  await page.getByRole('button', { name: '开始第一次练习' }).click()

  await expect(page).toHaveURL(/\/practice/)
  await page.getByRole('link', { name: /准备开始/ }).click()
  await page.getByRole('link', { name: /进入对话舞台/ }).click()
  await expect(page.getByText('正在准备对话舞台…')).toBeHidden()

  await page.getByRole('button', { name: '改用键盘输入' }).click()
  await page.getByLabel('英文内容').fill('Hello, I have a reservation under the name Chen.')
  await page.getByRole('button', { name: '提交这一轮' }).click()

  await expect(page.getByText('基础反馈模式')).toBeVisible()
  await expect(page.getByText('这句话表达得很清楚')).toBeVisible()
})
