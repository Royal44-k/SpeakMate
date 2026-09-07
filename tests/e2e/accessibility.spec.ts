import { createRequire } from 'node:module'
import { dirname } from 'node:path'

import { expect, test, type Page } from '@playwright/test'

const require = createRequire(import.meta.url)
const axePath = require.resolve('axe-core/axe.min.js', {
  paths: [dirname(require.resolve('jest-axe'))],
})

async function expectFirstTabLeavesBody(page: Page, path: string) {
  await page.goto(path)
  if (path.startsWith('/session/')) {
    await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  }
  await expect(page.locator('h1:visible')).toHaveCount(1)
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  })
  await page.keyboard.press('Tab')
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe(
    'BODY',
  )
}

test('the first Tab reaches a control throughout the core mobile journey', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName === 'webkit',
    'Playwright iPhone WebKit does not expose Safari Full Keyboard Access for sequential link focus',
  )

  for (const path of [
    '/practice',
    '/scenes',
    '/scenes/daily-standup?level=B2',
    '/session/new?scene=hotel-check-in&level=B1',
    '/me',
    '/privacy',
    '/install',
  ]) {
    await expectFirstTabLeavesBody(page, path)
  }
})

test('forward route changes focus the announced page title', async ({ page }) => {
  await page.goto('/scenes')
  await expect(
    page.getByRole('heading', { level: 1, name: '把英语练进生活里' }),
  ).toBeVisible()
  await page.getByRole('link', { name: '我的' }).click()

  const title = page.getByRole('heading', { level: 1, name: '我的练习' })
  await expect(title).toHaveAttribute('data-page-title')
  await expect(title).toBeFocused()
})

test('filters and feedback disclose their state and controlled content', async ({
  page,
}) => {
  await page.goto('/scenes?category=work&level=B2&duration=5')
  await expect(page.getByRole('button', { name: '职场' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByRole('button', { name: 'B2' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByRole('button', { name: '5 分钟' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.goto('/session/new?scene=hotel-check-in&level=B1')
  await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  await page.getByRole('button', { name: '改用键盘输入' }).click()
  await page
    .getByLabel('英文内容')
    .fill(
      'Hello, I have a reservation for two nights and would like to ask about breakfast.',
    )
  await page.getByRole('button', { name: '提交这一轮' }).click()

  const toggle = page.getByRole('button', { name: /表达得很清楚|值得优化/ })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  const controls = await toggle.getAttribute('aria-controls')
  expect(controls).toBeTruthy()
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator(`#${controls}`)).toBeVisible()
})

test('exit confirmation is a named alertdialog and contains keyboard focus', async ({
  page,
}) => {
  await page.goto('/session/new?scene=hotel-check-in&level=B1')
  await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  await page.getByRole('button', { name: '改用键盘输入' }).click()
  await page.getByLabel('英文内容').fill('Hello, I have a reservation.')
  await page.getByRole('link', { name: '退出本次练习' }).click()

  const dialog = page.getByRole('alertdialog', { name: '退出本次练习？' })
  await expect(dialog).toBeVisible()
  await expect(page.getByRole('button', { name: '继续练习' })).toBeFocused()

  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('button', { name: '退出' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: '继续练习' })).toBeFocused()
  expect(
    await dialog.evaluate((node) => node.contains(document.activeElement)),
  ).toBe(true)
})

test('200 percent text keeps core actions present without root overflow', async ({
  page,
}) => {
  const cases = [
    {
      path: '/practice',
      action: page.getByRole('link', { name: /准备开始|继续本次对话/ }),
    },
    {
      path: '/scenes',
      action: page.getByRole('link', { name: /准备练习：/ }).first(),
    },
    {
      path: '/session/new?scene=hotel-check-in&level=B1',
      action: page.getByRole('button', { name: '开始录音' }),
    },
    {
      path: '/me',
      action: page.getByRole('link', { name: /隐私与数据/ }),
    },
    {
      path: '/install',
      action: page.getByRole('tab', { name: 'iPhone' }),
    },
  ]

  for (const item of cases) {
    await page.goto(item.path)
    if (item.path.startsWith('/session/')) {
      await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
    }
    await expect(page.locator('h1:visible')).toHaveCount(1)
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })

    await expect(item.action).toBeVisible()
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    )
    expect(overflow, item.path).toBeLessThanOrEqual(1)
  }
})

test('forced dark preference keeps the explicit light theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/scenes')
  await expect(
    page.getByRole('heading', { level: 1, name: '把英语练进生活里' }),
  ).toBeVisible()

  expect(
    await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme),
  ).toBe('light')
})

test('representative routes introduce no serious or critical Axe violations', async ({
  page,
}) => {
  test.setTimeout(60_000)

  for (const path of [
    '/practice',
    '/scenes',
    '/scenes/daily-standup?level=B2',
    '/session/new?scene=hotel-check-in&level=B1',
    '/me',
    '/privacy',
    '/install',
  ]) {
    await page.goto(path)
    if (path.startsWith('/session/')) {
      await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
    }
    await expect(page.locator('h1:visible')).toHaveCount(1)
    await page.addScriptTag({ path: axePath })
    const violations = await page.evaluate(async () => {
      const axe = (
        window as typeof window & {
          axe: {
            run(
              root: Document,
              options: Record<string, unknown>,
            ): Promise<{
              violations: Array<{
                id: string
                impact: string | null
                nodes: Array<{ target: string[] }>
              }>
            }>
          }
        }
      ).axe
      const result = await axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
        resultTypes: ['violations'],
      })
      return result.violations
        .filter(({ impact }) => impact === 'serious' || impact === 'critical')
        .map(({ id, impact, nodes }) => ({
          id,
          impact,
          targets: nodes.map(({ target }) => target.join(' ')),
        }))
    })

    expect(violations, path).toEqual([])
  }
})
