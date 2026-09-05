import { expect, test, type Locator, type Page } from '@playwright/test'

const viewports = [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
]

async function expectControlInFront(
  page: Page,
  control: Locator,
  viewport: { width: number; height: number },
) {
  const box = await control.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x + box!.width).toBeGreaterThan(0)
  expect(box!.x).toBeLessThan(viewport.width)
  expect(box!.y + box!.height).toBeGreaterThan(0)
  expect(box!.y).toBeLessThan(viewport.height)

  const ownsCenterPoint = await control.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const centerX = Math.max(0, Math.min(innerWidth - 1, rect.left + rect.width / 2))
    const centerY = Math.max(0, Math.min(innerHeight - 1, rect.top + rect.height / 2))
    const front = document.elementFromPoint(centerX, centerY)
    return front === element || element.contains(front)
  })
  expect(ownsCenterPoint).toBe(true)
}

for (const viewport of viewports) {
  test(`keeps keyboard review controls above fixed layers at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto('/session/new?scene=hotel-check-in&level=B1')
    await expect(page.getByText('正在准备对话舞台…')).toBeHidden()

    const exit = page.getByRole('link', { name: '退出本次练习' })
    const exitBox = await exit.boundingBox()
    expect(exitBox).not.toBeNull()
    expect(exitBox!.width).toBeGreaterThanOrEqual(44)
    expect(exitBox!.height).toBeGreaterThanOrEqual(44)

    const playbackBox = await page
      .getByRole('button', { name: '播放 AI 回复' })
      .boundingBox()
    expect(playbackBox).not.toBeNull()
    expect(playbackBox!.width).toBeGreaterThanOrEqual(44)
    expect(playbackBox!.height).toBeGreaterThanOrEqual(44)

    if (viewport.height === 390) {
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%'
      })
    }

    await page.getByRole('button', { name: '改用键盘输入' }).click()
    const textarea = page.getByLabel('英文内容')
    const submit = page.getByRole('button', { name: '提交这一轮' })

    await expect(textarea).toBeVisible()
    await expect(submit).toBeVisible()
    await expect(page.getByRole('button', { name: '开始录音' })).toBeHidden()
    await expectControlInFront(page, textarea, viewport)
    await expectControlInFront(page, submit, viewport)

    await page.getByRole('button', { name: '取消' }).click()
    await expect(page.getByRole('button', { name: '开始录音' })).toBeVisible()
  })
}

test('guards a draft from browser back until the learner confirms exit', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/session/new?scene=hotel-check-in&level=B1')
  await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  await page.getByRole('button', { name: '改用键盘输入' }).click()
  await page.getByLabel('英文内容').fill('Hello, I have a reservation.')

  await page.goBack()

  const dialog = page.getByRole('alertdialog', { name: '退出本次练习？' })
  await expect(dialog).toBeVisible()
  await page.getByRole('button', { name: '继续练习' }).click()
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/\/session\/new/)
  await expect(page.getByLabel('英文内容')).toHaveValue(
    'Hello, I have a reservation.',
  )

  await page.goBack()
  await expect(dialog).toBeVisible()
  await page.getByRole('button', { name: '退出' }).click()

  await expect(page).toHaveURL(/\/scenes\/hotel-check-in\?level=B1/)
})
