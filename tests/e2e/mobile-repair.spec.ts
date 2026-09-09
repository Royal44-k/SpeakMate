import { expect, test } from '@playwright/test'

test.describe('controlled API failure', () => {
  // Only this injected failure disables SW; real PWA recovery stays enabled below.
  // Otherwise WebKit can send the request outside Playwright's route handler.
  test.use({ serviceWorkers: 'block' })
  test('a rate-limited text turn keeps an editable draft and can be submitted again', async ({
    page,
  }) => {
    let blocked = false
    await page.route('**/api/v1/turns', async (route) => {
      if (!blocked) {
        blocked = true
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'RATE_LIMITED',
            message: '请求较频繁，请稍后重试。',
            retryable: true,
          }),
        })
      } else await route.continue()
    })
    await page.goto('/session/new?scene=coffee-order&level=A2')
    await expect(page).toHaveURL(/\/session\/session_/)
    await page.getByRole('button', { name: '改用键盘输入' }).click()
    await page.getByLabel('英文内容').fill('Hello.')
    const rejected = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/v1/turns') && response.status() === 429,
    )
    await page.getByRole('button', { name: '提交这一轮' }).click()
    await rejected
    await expect(page.getByText('请求较频繁，请稍后重试。')).toBeVisible()
    await page.getByLabel('英文内容').fill('A latte, please.')
    await page.getByRole('button', { name: '提交这一轮' }).click()
    await expect(page.getByText('2 / 6')).toBeVisible()
  })
})

test('completing directly from a fresh round can immediately start another without reload', async ({
  page,
}) => {
  await page.goto('/session/new?scene=coffee-order&level=A1')
  await expect(page).toHaveURL(/\/session\/session_/)
  const first = page.url()
  await page.getByRole('button', { name: '改用键盘输入' }).click()
  await page
    .getByLabel('英文内容')
    .fill('A small latte with oat milk, no sugar, to go. What is the price?')
  await page.getByRole('button', { name: '提交这一轮' }).click()
  await page.getByRole('button', { name: '完成场景并查看复盘' }).click()
  await page.getByRole('link', { name: '再练一轮新对话' }).click()
  await expect(page).not.toHaveURL(first)
  await expect(page).toHaveURL(/\/session\/session_/)
  await expect(page.getByText('1 / 6')).toBeVisible()
})

test('six real text turns use fresh prompts and end with a report instead of a seventh input', async ({
  page,
}) => {
  await page.goto('/session/new?scene=coffee-order&level=C1')
  await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  const seen = new Set([await page.locator('blockquote').innerText()])
  for (let index = 0; index < 6; index++) {
    await page.getByRole('button', { name: '改用键盘输入' }).click()
    await page.getByLabel('英文内容').fill('Hmm.')
    const response = page.waitForResponse(
      (item) =>
        item.url().endsWith('/api/v1/turns') &&
        item.request().method() === 'POST',
    )
    await page.getByRole('button', { name: '提交这一轮' }).click()
    expect((await response).status()).toBe(200)
    await expect(
      page
        .getByRole('button', { name: '改用键盘输入' })
        .or(page.getByRole('button', { name: '完成场景并查看复盘' })),
    ).toBeEnabled()
    const reply = await page.locator('blockquote').innerText()
    expect(seen.has(reply)).toBe(false)
    seen.add(reply)
  }
  await expect(page.getByRole('button', { name: '改用键盘输入' })).toHaveCount(
    0,
  )
  await page.reload()
  await expect(
    page.getByRole('button', { name: '完成场景并查看复盘' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '完成场景并查看复盘' }).click()
  await expect(page.getByRole('link', { name: '再练一轮新对话' })).toBeVisible()
  const completedUrl = page.url()
  await page.getByRole('link', { name: '再练一轮新对话' }).click()
  await expect(page).not.toHaveURL(completedUrl)
  await expect(page).toHaveURL(/\/session\/session_/)
  await expect(page.getByText('1 / 6')).toBeVisible()
})

test('selected library level persists on home while the old conversation keeps its own level', async ({
  page,
}) => {
  await page.goto('/session/new?scene=coffee-order&level=C1')
  await expect(page).toHaveURL(/\/session\/session_/)
  await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  await page.goto('/scenes?level=C1')
  await page.getByRole('button', { name: 'A1', exact: true }).click()
  await expect(page).toHaveURL(/level=A1/)
  await page.getByRole('link', { name: '练习', exact: true }).click()
  await expect(page.getByLabel('当前练习水平')).toHaveValue('A1')
  await expect(
    page.getByRole('link', { name: '开启新一轮对话' }),
  ).toHaveAttribute('href', '/session/new?scene=coffee-order&level=A1')
  await expect(
    page.getByRole('link', { name: /继续本次对话/ }),
  ).toHaveAttribute('href', /level=C1/)
  const newButton = await page
    .getByRole('link', { name: '开启新一轮对话' })
    .boundingBox()
  const resumeButton = await page
    .getByRole('link', { name: /继续本次对话/ })
    .boundingBox()
  expect(newButton!.y + newButton!.height).toBeLessThan(resumeButton!.y)
})

test('a new dialogue keeps the old session and restores its own URL, feedback and next prompt', async ({
  page,
}) => {
  await page.goto('/session/new?scene=coffee-order&level=C1')
  await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  await expect(page).toHaveURL(/\/session\/session_/)
  const firstUrl = page.url()
  const opening = await page.locator('blockquote').innerText()
  await page.getByRole('button', { name: '改用键盘输入' }).click()
  await page.getByRole('textbox').fill('A small latte, please.')
  await page.getByRole('button', { name: '提交这一轮' }).click()
  await expect(page.locator('blockquote')).not.toHaveText(opening)
  const nextReply = await page.locator('blockquote').innerText()
  await page.reload()
  await expect(page.locator('blockquote')).toHaveText(nextReply)
  await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  await expect(
    page.getByRole('button', { name: /本轮反馈|表达得很清楚/ }),
  ).toBeVisible()
  await page.goto('/practice')
  await page.getByRole('link', { name: '开启新一轮对话' }).click()
  await expect(page).toHaveURL(/\/session\/session_/)
  expect(page.url()).not.toBe(firstUrl)
  await expect(page.getByText('1 / 6')).toBeVisible()
  await page.goto(firstUrl)
  await expect(page.locator('blockquote')).toHaveText(nextReply)
})

test('scene exit preserves the mobile canvas at phone, intermediate and desktop widths', async ({
  page,
}) => {
  for (const width of [390, 510, 844, 1280]) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/scenes/coffee-order?level=C1')
    await page.getByRole('link', { name: '进入对话舞台' }).click()
    await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
    await page.getByRole('link', { name: '退出本次练习' }).click()
    await expect(page).toHaveURL(/\/scenes\/coffee-order\?level=C1/)
    const bounds = await page.locator('article').boundingBox()
    expect(
      bounds!.width,
      `detail width after exit at ${width}`,
    ).toBeLessThanOrEqual(480)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(1)
  }
})

test('home image reserves its height and the resume badge never overlaps the title', async ({
  page,
}) => {
  await page.goto('/session/new?scene=coffee-order&level=C1')
  await expect(page).toHaveURL(/\/session\/session_/)
  await expect(page.getByText('正在准备对话舞台…')).toBeHidden()
  await page.goto('/practice')
  await expect(page.getByRole('link', { name: /继续本次对话/ })).toBeVisible()
  const card = page
    .locator('section')
    .filter({ has: page.getByRole('link', { name: /继续本次对话/ }) })
  const frame = card.locator('img').locator('..')
  expect((await frame.boundingBox())!.height).toBeGreaterThan(120)
  const badge = await card.getByText('继续练习', { exact: true }).boundingBox()
  const title = await card.getByRole('heading', { level: 2 }).boundingBox()
  expect(badge!.y + badge!.height).toBeLessThanOrEqual(title!.y)
})

test('search button and clear work with synonyms and preserve the selected level', async ({
  page,
}) => {
  await page.goto('/scenes?level=C1')
  await page.getByLabel('搜索场景').fill('拿铁')
  await page.getByRole('button', { name: '搜索', exact: true }).click()
  await expect(
    page.getByRole('link', { name: '准备练习：咖啡点单' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '清空搜索' }).click()
  await expect(page.getByLabel('搜索场景')).toHaveValue('')
  await expect(page.getByTestId('scene-card')).toHaveCount(42)
  await expect(
    page.getByRole('button', { name: 'C1', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
})
