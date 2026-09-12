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
  await listLink.click()
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
  await page.getByRole('link', { name: '返回词句或记录簿' }).last().click()
  await expect(page).toHaveURL(noteUrl)
  await page.getByRole('link', { name: '返回记录簿', exact: true }).click()
  await expect(
    page.getByRole('textbox', { name: '搜索词句与备注' }),
  ).toHaveValue('for example')
  await expect(listLink).toBeFocused()
  expect(
    Math.abs((await page.evaluate(() => scrollY)) - listPosition),
  ).toBeLessThan(3)
  const returnedUrl = page.url()
  await page.goBack()
  await expect(page).not.toHaveURL(returnedUrl)
  await page.goForward()
  await expect(page).toHaveURL(returnedUrl)
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
        returnedUrl,
        listPosition,
        actualAnswers,
      },
      null,
      2,
    ),
  )
  await finishNetwork(info)
})
