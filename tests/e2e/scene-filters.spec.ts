import { expect, test } from '@playwright/test'

const viewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 844, height: 390 },
]

test('restores URL-backed scene filters after opening a complete card link', async ({
  page,
}) => {
  await page.goto('/scenes?category=social&level=B1&duration=5')

  await expect(page.getByRole('button', { name: '社交' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('link', { name: '准备练习：活动社交' }).click()
  await expect(page.getByText('SCENE BRIEF')).toBeVisible()
  await page.getByRole('link', { name: /返回/ }).click()

  await expect(page).toHaveURL(/category=social.*level=B1.*duration=5/)
  await expect(page.getByRole('button', { name: '社交' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByRole('button', { name: '5 分钟' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('keeps horizontal filters inside the page at supported mobile widths', async ({
  page,
}) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto('/scenes?category=emergency&level=B1&duration=10')

    await expect(page.getByRole('button', { name: '应急' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    )
    expect(overflow, `${viewport.width}×${viewport.height}`).toBeLessThanOrEqual(
      1,
    )
  }
})
