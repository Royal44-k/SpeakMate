import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import {
  localState,
  protect,
  onboard,
  enterScene,
  capture,
  answer,
} from './task7-browser-helpers'

test('F/H: canonical two-source note, source A2 vs current B2, five-question real simulation and phase-owned stale recall; native source return', async ({
  page,
  context,
  baseURL,
}, info) => {
  test.setTimeout(180000)
  const finishNetwork = await protect(context, baseURL!)
  await onboard(page)
  const studyId = await enterScene(page, 'ask-teacher', 'A2')
  const original = await capture(page, 'for example', 'phrase')
  const originalSource = original.sources[0]
  await page.getByRole('link', { name: '退出本次练习' }).click()
  await enterScene(page, 'coffee-order', 'B2')
  const merged = await capture(page, 'for example', 'phrase')
  expect(merged.id).toBe(original.id)
  expect(merged.sources).toHaveLength(2)
  expect((await localState(page)).notebook).toHaveLength(1)
  await page.getByRole('link', { name: '退出本次练习' }).click()
  await onboard(page, 'B2')
  // A real long personal note makes the only matching list card genuinely
  // scrollable; no seeded note or synthetic scroll-restoration state.
  await page.goto(`/notebook/note?id=${original.id}`)
  await page.getByRole('button', { name: '编辑词句' }).click()
  await page
    .getByRole('textbox', { name: '个人备注', exact: true })
    .fill('Synthetic for example learning context. '.repeat(80))
  await page.getByRole('button', { name: '保存修改' }).click()
  await expect(
    page.getByRole('textbox', { name: '个人备注', exact: true }),
  ).toHaveCount(0)
  await page.goto('/notebook')
  await page
    .getByRole('textbox', { name: '搜索词句与备注' })
    .fill('for example')
  const listLink = page.getByRole('link', { name: '查看词句' })
  await listLink.scrollIntoViewIfNeeded()
  await listLink.focus()
  const listPosition = await page.evaluate(() => scrollY)
  expect(listPosition).toBeGreaterThan(300)
  const navigationSnapshots = []
  const navigationSnapshot = () =>
    page.evaluate(() => ({
      url: location.href,
      position: scrollY,
      focus: document.activeElement?.outerHTML,
      stack: sessionStorage.getItem('speakmate-route-stack'),
      scrolls: sessionStorage.getItem('speakmate-route-scroll-v1'),
    }))
  navigationSnapshots.push(await navigationSnapshot())
  await listLink.click()
  navigationSnapshots.push(await navigationSnapshot())
  const noteUrl = page.url()
  const sourceSelect = page.getByLabel('解析所用来源')
  await sourceSelect.selectOption(merged.sources[1].id)
  await expect(
    page.getByText('当前本地资料未收录', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: '用所选来源模拟练习' }),
  ).toHaveCount(0)
  await sourceSelect.selectOption(originalSource.id)
  await expect(page.getByText('本语境完整匹配', { exact: true })).toBeVisible()
  await page.reload()
  await expect(sourceSelect).toHaveValue(originalSource.id)
  await expect(page.getByText('本语境完整匹配', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '用所选来源模拟练习' }).click()
  await expect(
    page.getByText(/来源等级 A2；先回忆、自己造句，再完成 5 轮应用/),
  ).toBeVisible()
  await page.getByRole('button', { name: '开始这次定向练习' }).click()
  await expect(
    page.getByRole('heading', { name: '先回忆，再查看原文' }),
  ).toBeVisible()
  const simulationUrl = page.url(),
    id = new URL(simulationUrl).searchParams.get('id')!
  let state = await localState(page)
  let simulation = state.sessions.find((session) => session.id === id)!
  expect(state.profile[0].level).toBe('B2')
  expect(simulation.level).toBe('A2')
  expect(simulation.simulation!.source).toMatchObject({
    noteId: original.id,
    sourceId: originalSource.id,
    snapshot: originalSource,
  })
  expect(simulation.simulation!.descriptor.questionIds).toEqual([
    'ask-teacher.A2.focus',
    'ask-teacher.A2.instruction',
    'ask-teacher.A2.example',
    'ask-teacher.A2.contrast',
    'ask-teacher.A2.apply',
  ])
  expect(simulation.simulation!.recall).toBeUndefined()
  await expect(page.getByRole('button', { name: '提交这一轮' })).toHaveCount(0)
  const oldDraft = page.getByRole('textbox', { name: '我回忆的表达' })
  await oldDraft.fill('My original recall remains mine.')
  // Second real consumer advances the same stored phase. First tab must not
  // convert its older recall draft into a composition when its save loses.
  const other = await context.newPage()
  await other.goto(simulationUrl)
  await other
    .getByRole('textbox', { name: '我回忆的表达' })
    .fill('For example, a park.')
  await other.getByRole('button', { name: '保存回忆并查看' }).click()
  await expect(
    other.getByRole('textbox', { name: '我的替换或造句' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '保存回忆并查看' }).click()
  await expect(page.getByRole('button', { name: '读取最新进度' })).toBeVisible()
  await page.getByRole('button', { name: '读取最新进度' }).click()
  await expect(page.getByText(/这份输入仍保留为原来的回忆草稿/)).toBeVisible()
  await expect(oldDraft).toHaveValue('My original recall remains mine.')
  await expect(
    page.getByRole('button', { name: '保存回忆并查看' }),
  ).toBeDisabled()
  await page.getByRole('link', { name: '退出本次练习' }).click()
  await page.getByRole('button', { name: '继续练习', exact: true }).click()
  expect(page.url()).toBe(simulationUrl)
  await expect(oldDraft).toHaveValue('My original recall remains mine.')
  await page.getByRole('button', { name: '取消本次输入' }).click()
  await expect(
    page.getByRole('textbox', { name: '我的替换或造句' }),
  ).toHaveValue('')
  await other.close()
  await page
    .getByRole('textbox', { name: '我的替换或造句' })
    .fill('For example, we can describe a friend.')
  await page.getByRole('button', { name: '保存造句并应用' }).click()
  await expect(
    page.getByRole('region', { name: '当前问题', exact: true }),
  ).toBeVisible()
  await page.reload()
  const actualAnswers: string[] = []
  for (let n = 0; n < 5; n++) actualAnswers.push(await answer(page))
  await expect(
    page.getByRole('button', { name: '确认结束并保存复盘' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '确认结束并保存复盘' }).click()
  await expect(
    page.getByRole('heading', { name: '这轮已保存。' }),
  ).toBeVisible()
  state = await localState(page)
  simulation = state.sessions.find((session) => session.id === id)!
  expect(simulation.status).toBe('completed')
  expect(simulation.simulation!.recall!.text).toBe('For example, a park.')
  expect(simulation.simulation!.composition!.text).toBe(
    'For example, we can describe a friend.',
  )
  expect(state.turns.filter((turn) => turn.sessionId === id)).toHaveLength(5)
  expect(state.pointsLedger).toEqual([])
  await page.getByRole('link', { name: '查看本次复盘' }).click()
  const reportUrl = page.url()
  navigationSnapshots.push(await navigationSnapshot())
  const originalViewport = page.viewportSize()!
  const typography = []
  const outcomeHeading = page.getByRole('heading', {
    name: '所选目标已确认 · 已确认结束并保存',
    exact: true,
  })
  for (const [width, height, textScale] of [
    [320, 568, 100],
    [390, 844, 100],
    [390, 844, 200],
  ]) {
    await page.setViewportSize({ width, height })
    await page.evaluate(
      (percent) => (document.documentElement.style.fontSize = `${percent}%`),
      textScale,
    )
    await outcomeHeading.scrollIntoViewIfNeeded()
    const measurement = await outcomeHeading.evaluate((heading) => {
      const style = getComputedStyle(heading)
      const range = document.createRange()
      range.selectNodeContents(heading)
      const box = heading.getBoundingClientRect()
      return {
        text: heading.textContent,
        fontSize: Number.parseFloat(style.fontSize),
        lineHeight: Number.parseFloat(style.lineHeight),
        overflow: style.overflow,
        box: {
          left: box.left,
          right: box.right,
          top: box.top,
          bottom: box.bottom,
        },
        rects: Array.from(range.getClientRects()).map((rect) => ({
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
        })),
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }
    })
    typography.push({ width, height, textScale, ...measurement })
    await page.screenshot({
      path: info.outputPath(`report-outcome-${width}-${textScale}.png`),
    })
  }
  await writeFile(
    info.outputPath('report-typography.json'),
    JSON.stringify(typography, null, 2),
  )
  for (const measurement of typography) {
    expect(measurement.lineHeight).toBeGreaterThanOrEqual(
      measurement.fontSize * 1.2,
    )
    expect(measurement.scrollWidth).toBeLessThanOrEqual(measurement.clientWidth)
    expect(measurement.overflow).toBe('visible')
    for (const rect of measurement.rects) {
      expect(rect.left).toBeGreaterThanOrEqual(measurement.box.left - 1)
      expect(rect.right).toBeLessThanOrEqual(measurement.box.right + 1)
      expect(rect.top).toBeGreaterThanOrEqual(measurement.box.top - 1)
      expect(rect.bottom).toBeLessThanOrEqual(measurement.box.bottom + 1)
    }
    const lines = Array.from(
      new Set(measurement.rects.map((rect) => rect.top)),
    ).sort((a, b) => a - b)
    for (let line = 1; line < lines.length; line++) {
      const previousBottom = Math.max(
        ...measurement.rects
          .filter((rect) => rect.top === lines[line - 1])
          .map((rect) => rect.bottom),
      )
      expect(lines[line]).toBeGreaterThanOrEqual(previousBottom - 0.5)
    }
  }
  await page.evaluate(() =>
    document.documentElement.style.removeProperty('font-size'),
  )
  await page.setViewportSize(originalViewport)
  const listReturn = page.getByRole('link', { name: '返回记录簿', exact: true })
  await listReturn.scrollIntoViewIfNeeded()
  await listReturn.focus()
  await expect(listReturn).toBeFocused()
  const reportAppearance = await listReturn.evaluate((link) => {
    const rect = link.getBoundingClientRect()
    const section = link.closest('section')!
    const heading = section.querySelector('h2')!
    return {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      bottom: rect.bottom,
      viewportHeight: innerHeight,
      linkColor: getComputedStyle(link).color,
      headingColor: getComputedStyle(heading).color,
      background: getComputedStyle(section.closest('header')!).backgroundColor,
      outline: getComputedStyle(link).outlineStyle,
    }
  })
  expect(reportAppearance.height).toBeGreaterThanOrEqual(44)
  expect(reportAppearance.width).toBeGreaterThanOrEqual(44)
  expect(reportAppearance.top).toBeGreaterThanOrEqual(0)
  expect(reportAppearance.bottom).toBeLessThanOrEqual(
    reportAppearance.viewportHeight,
  )
  expect(reportAppearance.linkColor).toBe('rgb(255, 255, 255)')
  expect(reportAppearance.headingColor).toBe(reportAppearance.linkColor)
  expect(reportAppearance.outline).toBe('solid')
  const luminance = (color: string) =>
    color
      .match(/\d+/g)!
      .slice(0, 3)
      .map(Number)
      .map((part) => part / 255)
      .map((part) =>
        part <= 0.04045 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4,
      )
      .reduce(
        (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
        0,
      )
  const contrast =
    (luminance(reportAppearance.linkColor) + 0.05) /
    (luminance(reportAppearance.background) + 0.05)
  expect(contrast).toBeGreaterThanOrEqual(4.5)
  await page.screenshot({ path: info.outputPath('report-direct-return.png') })
  await expect(
    page.getByRole('link', { name: '返回词句或记录簿' }).last(),
  ).toHaveAttribute('href', new URL(noteUrl).pathname + new URL(noteUrl).search)
  await page.getByRole('link', { name: '返回记录簿', exact: true }).click()
  await expect(
    page.getByRole('textbox', { name: '搜索词句与备注' }),
  ).toHaveValue('for example')
  navigationSnapshots.push(await navigationSnapshot())
  await writeFile(
    info.outputPath('navigation-stages.json'),
    JSON.stringify(navigationSnapshots, null, 2),
  )
  await expect(listLink).toBeFocused()
  expect(
    Math.abs((await page.evaluate(() => scrollY)) - listPosition),
  ).toBeLessThan(3)
  const returnedUrl = page.url()
  await page.goBack()
  const backUrl = page.url()
  await info.attach('actual-back-url', {
    body: JSON.stringify({ reportUrl, returnedUrl, backUrl }),
    contentType: 'application/json',
  })
  await expect(page).toHaveURL(reportUrl)
  await page.goForward()
  await expect(page).toHaveURL(returnedUrl)
  await expect(
    page.getByRole('textbox', { name: '搜索词句与备注' }),
  ).toHaveValue('for example')
  await expect(listLink).toBeFocused()
  const forwardPosition = await page.evaluate(() => scrollY)
  expect(Math.abs(forwardPosition - listPosition)).toBeLessThan(3)
  expect(
    (await localState(page)).sessions.filter((session) => session.simulation),
  ).toHaveLength(1)
  await writeFile(
    info.outputPath('source-phase-history.json'),
    JSON.stringify(
      {
        state,
        studyId,
        noteUrl,
        simulationUrl,
        reportUrl,
        backUrl,
        forwardPosition,
        returnedUrl,
        listPosition,
        actualAnswers,
        reportAppearance,
        contrast,
        typography,
      },
      null,
      2,
    ),
  )
  await finishNetwork(info)
})
