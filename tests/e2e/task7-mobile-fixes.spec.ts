import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'

test('C1 first question is entered above the dock; typing and capture retain focus; me exposes isolated results with large-text touch targets', async ({
  page,
  context,
  baseURL,
}, info) => {
  test.setTimeout(120000)
  const requests: { url: string; method: string }[] = []
  const errors: string[] = []
  context.on('request', (request) =>
    requests.push({ url: request.url(), method: request.method() }),
  )
  page.on('pageerror', (error) => errors.push(error.message))
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === baseURL
      ? route.continue()
      : route.abort(),
  )
  await page.goto('/welcome')
  await page.getByRole('button', { name: /C1/ }).click()
  await page.getByRole('button', { name: '旅行', exact: true }).click()
  await page.getByRole('button', { name: '每天 5 分钟' }).click()
  await page
    .getByRole('button', { name: '开始第一次练习', exact: true })
    .click()
  await expect(page.getByRole('heading', { name: '今日目标' })).toBeVisible()
  const measurements: unknown[] = []
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 390, height: 430 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/scenes/prepare?scene=coffee-order&level=C1&mode=short')
    await expect(
      page.getByRole('link', { name: '返回场景库' }),
    ).toHaveAttribute('href', '/scenes?level=C1')
    await page.getByRole('link', { name: '进入对话舞台', exact: true }).click()
    const question = page.getByRole('group', { name: '当前应答问题' })
    await expect(question).toBeFocused()
    // Reads only: no auto-scrolling locator interaction before the entry proof.
    const entry = await question.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      const dock = document
        .querySelector('[data-practice-dock]')!
        .getBoundingClientRect()
      return {
        innerWidth,
        innerHeight,
        top: rect.top,
        bottom: rect.bottom,
        dockTop: dock.top,
        scrollY,
        overflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
        text: element.textContent,
      }
    })
    expect(entry.innerWidth).toBe(viewport.width)
    expect(entry.top).toBeGreaterThanOrEqual(-1)
    expect(entry.top).toBeLessThan(entry.dockTop - 24)
    expect(entry.overflow).toBe(false)
    measurements.push(entry)
    await page.screenshot({
      path: info.outputPath(
        `question-${viewport.width}-${viewport.height}.png`,
      ),
    })
    await page.getByRole('button', { name: /键盘/ }).click()
    const text = page.getByRole('textbox', { name: '英文内容' })
    await text.fill('Synthetic text retained while I check the question.')
    await expect(text).toBeFocused()
    const scrollBefore = await page.evaluate(() => scrollY)
    await text.press('End')
    await text.press('!')
    expect(await page.evaluate(() => scrollY)).toBe(scrollBefore)
    await expect(text).toBeFocused()
    await page.screenshot({
      path: info.outputPath(`typing-${viewport.width}-${viewport.height}.png`),
    })
    await page.getByRole('button', { name: '取消', exact: true }).click()
    const source = page.url()
    await page
      .getByRole('region', { name: '当前问题' })
      .getByRole('button', { name: '记录词句', exact: true })
      .last()
      .click()
    await expect(page.getByRole('dialog')).toBeVisible()
    expect(
      await page
        .getByRole('dialog')
        .evaluate((element) => element.contains(document.activeElement)),
    ).toBe(true)
    await page
      .getByRole('dialog')
      .getByRole('button', { name: '取消', exact: true })
      .click()
    expect(page.url()).toBe(source)
    await page
      .getByRole('region', { name: '当前问题', exact: true })
      .getByRole('button', { name: '记录词句', exact: true })
      .last()
      .click()
    await page.getByRole('textbox', { name: '待存原文' }).fill('black')
    await page.getByRole('combobox', { name: /词句类型/ }).selectOption('word')
    await page.getByRole('button', { name: '保存词句', exact: true }).click()
    // Ordinary click must be reachable without force or manual scroll masking
    // the fixed-dock overlap found in the actual pre-fix consumer.
    await page.getByRole('link', { name: '查看词句', exact: true }).click()
    await expect(page).toHaveURL(/\/notebook\/note\?/)
    expect(
      await page.evaluate(() =>
        document.documentElement.style.getPropertyValue(
          '--practice-dock-space',
        ),
      ),
    ).toBe('')
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/me')
  await expect(
    page.getByRole('region', { name: '本机个人成绩' }),
  ).toContainText('累计获得 0 · 可兑换余额 0')
  await expect(page.getByText('示例数据，非真实好友排名')).toBeVisible()
  const notebook = page.getByRole('link', { name: '在记录簿查看与复习' })
  expect((await notebook.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  await page.screenshot({ path: info.outputPath('me-390.png'), fullPage: true })
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'))
  await notebook.scrollIntoViewIfNeeded()
  const large = await page.evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
    fontSize: getComputedStyle(document.documentElement).fontSize,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    footerHeight: document
      .querySelector('nav[aria-label="主要导航"]')!
      .getBoundingClientRect().height,
  }))
  expect(large.scrollWidth).toBeLessThanOrEqual(large.clientWidth)
  for (const link of await page
    .getByRole('navigation', { name: '主要导航' })
    .getByRole('link')
    .all()) {
    const box = (await link.boundingBox())!
    expect(box.height).toBeGreaterThanOrEqual(44)
    expect(box.width).toBeGreaterThanOrEqual(44)
    const spans = await link.locator('span').evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect()
        return {
          text: element.textContent,
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
        }
      }),
    )
    measurements.push({ box, spans })
    for (const span of spans) {
      expect(span.top).toBeGreaterThanOrEqual(box.y - 1)
      expect(span.bottom).toBeLessThanOrEqual(
        Math.min(box.y + box.height, large.height) + 1,
      )
      expect(span.left).toBeGreaterThanOrEqual(box.x - 1)
      expect(span.right).toBeLessThanOrEqual(box.x + box.width + 1)
    }
  }
  measurements.push(large)
  const settingBounds = await page.locator('a').evaluateAll((links) =>
    links
      .filter((link) => link.querySelector('small'))
      .map((link) => {
        const outer = link.getBoundingClientRect()
        const texts = Array.from(link.querySelectorAll('strong,small')).map(
          (element) => ({
            text: element.textContent,
            top: element.getBoundingClientRect().top,
            bottom: element.getBoundingClientRect().bottom,
          }),
        )
        return {
          href: link.getAttribute('href'),
          top: outer.top,
          bottom: outer.bottom,
          texts,
        }
      }),
  )
  measurements.push(settingBounds)
  for (const bound of settingBounds)
    for (const text of bound.texts) {
      expect(text.top).toBeGreaterThanOrEqual(bound.top - 1)
      expect(text.bottom).toBeLessThanOrEqual(bound.bottom + 1)
    }
  await page.screenshot({ path: info.outputPath('me-text-200.png') })
  await page.goto('/rewards')
  await expect(page.getByRole('article', { name: '深海个人卡' })).toBeVisible()
  await expect(page.getByRole('link', { name: '退出本次练习' })).toHaveCount(0)
  await expect(
    page.getByRole('link', { name: '返回今日目标' }).first(),
  ).toHaveAttribute('href', '/')
  expect(errors).toEqual([])
  expect(
    requests.filter(
      (request) =>
        !['GET', 'HEAD'].includes(request.method) ||
        new URL(request.url).origin !== baseURL,
    ),
  ).toEqual([])
  await writeFile(
    info.outputPath('measurements.json'),
    JSON.stringify({ measurements, errors, requests }, null, 2),
  )
})
