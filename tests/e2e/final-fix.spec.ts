import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import {
  answer,
  enterScene,
  localState,
  onboard,
  protect,
} from './task7-browser-helpers'

test('consecutive reviewed round, contextual bookmark preview/undo, and notebook source', async ({
  page,
  context,
  baseURL,
}, info) => {
  test.setTimeout(150000)
  const finishNetwork = await protect(context, baseURL!)
  try {
    await onboard(page, 'C1')
    const first = await enterScene(page, 'coffee-order', 'C1')
    const expression = await answer(page)
    await expect(page.getByText('1 / 3', { exact: true })).toBeVisible()
    await answer(page)
    await expect(page.getByText('2 / 3', { exact: true })).toBeVisible()
    await answer(page)
    await page.getByRole('button', { name: '确认结束并保存复盘' }).click()
    await page.getByRole('link', { name: '查看本次复盘' }).click()
    await page.waitForURL(/\/session\/report/)
    const firstState = await localState(page)
    const original = firstState.sessions.find(
      (session) => session.id === first,
    )!
    expect(original.gradedDialogue!.state.variantId).toBe('counter')
    const bookmark = page.getByRole('button', {
      name: `收藏表达：${expression}`,
    })
    const layout = []
    for (const [width, scale] of [
      [320, 1],
      [390, 2],
    ]) {
      await page.setViewportSize({ width, height: 844 })
      await page.evaluate((scale) => {
        document.documentElement.style.fontSize = `${16 * scale}px`
      }, scale)
      await bookmark.scrollIntoViewIfNeeded()
      layout.push(
        await bookmark.evaluate((node) => ({
          rect: node.getBoundingClientRect().toJSON(),
          text: getComputedStyle(document.body).fontSize,
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        })),
      )
      await page.screenshot({
        path: info.outputPath(`bookmark-${width}-${scale * 100}.png`),
      })
    }
    await bookmark.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('dialog')).toContainText('coffee.C1.drink')
    await page.screenshot({ path: info.outputPath('preview-390-200.png') })
    const save = page.getByRole('button', { name: '保存词句', exact: true })
    await save.scrollIntoViewIfNeeded()
    await expect(save).toBeInViewport()
    await page.screenshot({ path: info.outputPath('preview-save-390-200.png') })
    await page.setViewportSize({ width: 320, height: 844 })
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '16px'
    })
    await page.screenshot({ path: info.outputPath('preview-320-100.png') })
    await page.getByRole('button', { name: '保存词句', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    const captured = (await localState(page)).notebook[0]
    expect(captured.sources[0]).toMatchObject({
      sessionId: first,
      level: 'C1',
      sceneId: 'dining-01',
      questionId: 'coffee.C1.drink',
      originalText: expression,
    })
    await bookmark.click()
    await page.getByRole('button', { name: '保存词句', exact: true }).click()
    await page.getByRole('button', { name: '撤销记录' }).click()
    await expect(page.getByText('已撤销本次记录。')).toBeVisible()
    expect((await localState(page)).notebook).toEqual([captured])
    await bookmark.click()
    await page.getByRole('button', { name: '保存词句', exact: true }).click()
    await page.getByRole('link', { name: '查看词句', exact: true }).click()
    await expect(
      page.getByRole('heading', { name: expression, exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText('coffee.C1.drink', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: '返回来源练习', exact: true }),
    ).toHaveAttribute('href', `/session?id=${first}`)
    await page.setViewportSize({ width: 320, height: 844 })
    await page.screenshot({ path: info.outputPath('note-320-100.png') })
    await page.getByRole('link', { name: '返回记录簿', exact: true }).click()
    await expect(
      page.getByRole('heading', { name: expression, exact: true }),
    ).toBeVisible()
    await page.goto(`/session?id=${first}`)
    await page.getByRole('link', { name: '再练一轮新对话' }).click()
    await expect(
      page.getByRole('button', { name: '停止本次练习' }),
    ).toBeVisible()
    await expect
      .poll(() => new URL(page.url()).searchParams.get('id'))
      .not.toBe('new')
    const second = new URL(page.url()).searchParams.get('id')!
    const finalState = await localState(page)
    const next = finalState.sessions.find((session) => session.id === second)!
    expect(next.gradedDialogue!.state.variantId).toBe('planned')
    expect(finalState.sessions.find((session) => session.id === first)).toEqual(
      original,
    )
    await expect(
      page.getByText(
        '安排取餐：同一在售菜单及默认热黑咖啡；先确认饮品、堂食/外带、杯型。拓展练安排现在/稍后出杯和杯具方案，替代现场版的降温及点心，并非随机拼接。',
      ),
    ).toBeVisible()
    await writeFile(
      info.outputPath('state-and-layout.json'),
      JSON.stringify(
        { original, next, notebook: finalState.notebook, layout },
        null,
        2,
      ),
    )
    for (const row of layout) {
      expect(row.rect.width).toBeGreaterThanOrEqual(44)
      expect(row.rect.height).toBeGreaterThanOrEqual(44)
      expect(row.scrollWidth).toBe(row.clientWidth)
    }
  } finally {
    await finishNetwork(info)
  }
})
