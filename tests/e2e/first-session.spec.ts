import { expect, test, type Page } from '@playwright/test'

async function submitTextTurn(page: Page, text: string) {
  await page.getByRole('button', { name: '改用键盘输入' }).click()
  await page.getByLabel('英文内容').fill(text)
  await page.getByRole('button', { name: '提交这一轮' }).click()
  await expect(
    page
      .getByRole('button', { name: '改用键盘输入' })
      .or(page.getByRole('button', { name: '完成场景并查看复盘' })),
  ).toBeEnabled()
}

test('guest completes a first text-assisted session and leaves the report through either destination', async ({
  page,
  browser,
}) => {
  await page.goto('/welcome')
  await page.getByRole('button', { name: 'B1 中级' }).click()
  await page.getByRole('button', { name: '旅行' }).click()
  await page.getByRole('button', { name: '每天 5 分钟' }).click()
  await page.getByRole('button', { name: '开始第一次练习' }).click()

  await expect(page).toHaveURL(/\/practice/)
  await page.getByRole('link', { name: /准备开始/ }).click()
  await page.getByRole('link', { name: /进入对话舞台/ }).click()
  await expect(page.getByText('正在准备对话舞台…')).toBeHidden()

  await submitTextTurn(
    page,
    'Here is my passport for my flight to my destination. I have one bag and one suitcase. Could I have an aisle seat and my boarding pass for the gate?',
  )

  await expect(page.getByText('基础反馈模式')).toBeVisible()
  await expect(page.getByText('这句话表达得很清楚')).toBeVisible()

  await page.getByRole('button', { name: '完成场景并查看复盘' }).click()
  await expect(
    page.getByRole('heading', { name: '这次真的开口了。' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: '查看本次复盘' })).toBeVisible()
  await expect(page.getByRole('button', { name: '开始录音' })).toHaveCount(0)

  await page.getByRole('link', { name: '查看本次复盘' }).click()
  await expect(page).toHaveURL(/\/session\/[^/]+\/report/)
  await expect(page.getByRole('heading', { name: '本次复盘' })).toBeVisible()

  const storageState = await page.context().storageState({ indexedDB: true })
  const reportUrl = page.url()
  async function followReportExit(linkName: string, destination: RegExp) {
    const context = await browser.newContext({ storageState })
    const reportPage = await context.newPage()

    await reportPage.goto(reportUrl)
    await expect(
      reportPage.getByRole('heading', { name: '本次复盘' }),
    ).toBeVisible()
    await reportPage.getByRole('link', { name: linkName }).click()
    await expect(reportPage).toHaveURL(destination)

    await context.close()
  }

  await followReportExit('回到今日练习', /\/practice/)
  await followReportExit('换个场景', /\/scenes/)
})
