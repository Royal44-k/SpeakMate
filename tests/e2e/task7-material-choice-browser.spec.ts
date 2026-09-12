import { expect, test, type Page } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { registerOwnedLocalServer } from './task7-owned-local-server'
import type { DataState } from '../../src/infrastructure/persistence/storage'
import {
  capture,
  enterScene,
  localState,
  onboard,
  protect,
} from './task7-browser-helpers'

// G only: actual native controller readiness is a prerequisite, not a stub.
const localServer = registerOwnedLocalServer()
const origin = localServer.origin
const anchor = '2026-09-10T02:00:00Z'
test.beforeEach(() => {
  buildId = localServer.buildId()
})
let buildId = ''

function consolidation(data: DataState) {
  const plan = data.dailyPlans.find((row) => row.dateKey === '2026-09-10')!
  return { plan, task: plan.tasks.find((row) => row.slot === 'consolidation')! }
}

async function chooseTask(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: '选择巩固材料', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: '选择巩固材料' }),
  ).toBeVisible()
}

async function captureFallback(page: Page) {
  await page.getByRole('button', { name: '查看校审备用词句' }).click()
  await page.getByRole('button', { name: '记录这条校审词句并用于任务' }).click()
  await expect(page.getByText(/词句已保存。请确认来源等级/)).toBeVisible()
  const source = page.getByRole('combobox', { name: '本次使用的来源' })
  await expect(source).toBeVisible()
  const first = await source.locator('option').nth(1).getAttribute('value')
  await source.selectOption(first!)
  await expect(
    page.getByRole('button', { name: '开始这次定向练习' }),
  ).toBeVisible()
}

// If creation is split into separate writes, a bound task or new session leaks.
test('G: creation abort keeps captured note and unbound task; same occurrence retry binds atomically', async ({
  page,
  context,
}, info) => {
  test.setTimeout(90000)
  const audit = await protect(context, origin)
  await page.clock.setFixedTime(new Date(anchor))
  await onboard(page)
  const initial = await localState(page)
  expect(initial.notebook).toEqual([])
  expect(initial.sessions).toEqual([])
  expect(consolidation(initial).task.target).toEqual({
    kind: 'simulation-choice',
  })
  expect(consolidation(initial).task.swapUsed).toBe(false)
  await chooseTask(page)
  await page.reload()
  await expect(page.getByRole('heading', { name: '今日目标' })).toBeVisible()
  expect((await localState(page)).dailyPlans).toEqual(initial.dailyPlans)
  await chooseTask(page)
  await captureFallback(page)
  const captured = await localState(page)
  expect(captured.notebook).toHaveLength(1)
  expect(captured.notebook[0].text).toBe('black')
  expect(captured.dailyPlans).toEqual(initial.dailyPlans)
  expect(captured.sessions).toEqual([])
  expect(captured.pointsLedger).toEqual([])

  // Explicitly save the same fallback again through the UI, exercising canonical
  // deduplication without seeding a bound target or fabricating a source ID.
  await chooseTask(page)
  await captureFallback(page)
  const before = await localState(page)
  expect(before.notebook).toHaveLength(1)
  expect(before.notebook[0].id).toBe(captured.notebook[0].id)
  const sourceId = await page
    .getByRole('combobox', { name: '本次使用的来源' })
    .inputValue()
  if (!sourceId) {
    await page
      .getByRole('combobox', { name: '本次使用的来源' })
      .selectOption(before.notebook[0].sources[0].id)
    await expect(
      page.getByRole('button', { name: '开始这次定向练习' }),
    ).toBeVisible()
  }
  const selectedSource = await page
    .getByRole('combobox', { name: '本次使用的来源' })
    .inputValue()
  await page.evaluate(() => {
    const fault = {
      armed: true,
      aborted: false,
      attemptedSessionId: '',
      attemptedPlanId: '',
    }
    Object.assign(window, { __materialFault: fault })
    const original = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (value, key) {
      const request = original.call(this, value, key)
      if (
        fault.armed &&
        this.name === 'sessions' &&
        value.provenance &&
        value.simulation
      )
        fault.attemptedSessionId = value.id
      if (
        fault.armed &&
        this.name === 'dailyPlans' &&
        value.tasks.some(
          (task: { slot: string; status: string }) =>
            task.slot === 'consolidation' && task.status === 'started',
        )
      ) {
        fault.armed = false
        fault.aborted = true
        fault.attemptedPlanId = value.id
        this.transaction.abort()
      }
      return request
    }
  })
  await page.getByRole('button', { name: '开始这次定向练习' }).click()
  await expect(
    page.getByRole('alert').filter({ hasText: '词句已保存，练习尚未开始' }),
  ).toBeVisible()
  const fault = await page.evaluate(
    () =>
      (
        window as unknown as {
          __materialFault: {
            aborted: boolean
            attemptedSessionId: string
            attemptedPlanId: string
          }
        }
      ).__materialFault,
  )
  expect(fault.aborted).toBe(true)
  expect(fault.attemptedSessionId).not.toBe('')
  expect(fault.attemptedPlanId).toBe(consolidation(before).plan.id)
  const failed = await localState(page)
  for (const name of [
    'notebook',
    'dailyPlans',
    'sessions',
    'turns',
    'learningEvents',
    'pointsLedger',
  ] as const)
    expect(failed[name]).toEqual(before[name])
  await writeFile(
    info.outputPath('creation-abort.json'),
    JSON.stringify({ buildId, fault, before, failed }, null, 2),
  )

  await page.getByRole('button', { name: '重试', exact: true }).click()
  await expect(
    page.getByRole('textbox', { name: '我回忆的表达' }),
  ).toBeVisible()
  const saved = await localState(page)
  const { plan, task } = consolidation(saved)
  expect(saved.sessions).toHaveLength(1)
  const session = saved.sessions[0]
  expect(session.id).toBe(fault.attemptedSessionId)
  expect(new URL(page.url()).searchParams.get('id')).toBe(session.id)
  expect(task.status).toBe('started')
  expect(task.swapUsed).toBe(false)
  if (task.target.kind !== 'simulation')
    throw new Error('Expected real bound target')
  expect(task.target.selection).toEqual({
    schemaVersion: 1,
    noteId: before.notebook[0].id,
    sourceId: selectedSource,
    sourceLevel: session.level,
    descriptorId: session.simulation!.descriptor.id,
    descriptorVersion: session.simulation!.descriptor.version,
    sourceContentVersion: session.simulation!.descriptor.sourceContentVersion,
  })
  expect(task.target.requiredUserTurns).toBe(
    session.simulation!.descriptor.questionIds.length,
  )
  expect(session.provenance).toMatchObject({
    planId: plan.id,
    sourceTaskId: task.id,
    planDate: plan.dateKey,
    sourceNoteId: before.notebook[0].id,
  })
  expect(saved.pointsLedger).toEqual([])
  await page.reload()
  await expect(
    page.getByRole('textbox', { name: '我回忆的表达' }),
  ).toBeVisible()
  const reopened = await localState(page)
  expect(reopened.dailyPlans).toEqual(saved.dailyPlans)
  expect(reopened.sessions).toEqual(saved.sessions)
  await writeFile(
    info.outputPath('creation-retried.json'),
    JSON.stringify(reopened, null, 2),
  )
  await audit(info)
})

// Both candidates come from separately captured A2/B2 sources of a real note.
// The late start must not replace the winner or its subsequently saved drafts.
test('G: two real source choices race; late creation preserves winner, recall and composition', async ({
  page,
  context,
}, info) => {
  test.setTimeout(90000)
  const audit = await protect(context, origin)
  await page.clock.setFixedTime(new Date(anchor))
  await onboard(page)
  const initial = await localState(page)
  expect(consolidation(initial).task.target).toEqual({
    kind: 'simulation-choice',
  })
  await enterScene(page, 'coffee-order', 'A2')
  await capture(page, 'black', 'word')
  await enterScene(page, 'coffee-order', 'B2')
  const note = await capture(page, 'black', 'word')
  expect((await localState(page)).notebook).toHaveLength(1)
  const aSource = note.sources.find((source) => source.level === 'A2')!
  const bSource = note.sources.find((source) => source.level === 'B2')!
  expect(aSource.id).not.toBe(bSource.id)
  expect((await localState(page)).dailyPlans).toEqual(initial.dailyPlans)
  const other = await context.newPage()
  await other.clock.setFixedTime(new Date(anchor))
  for (const [candidate, source] of [
    [page, aSource],
    [other, bSource],
  ] as const) {
    await chooseTask(candidate)
    await candidate.getByRole('button', { name: 'black', exact: true }).click()
    await candidate
      .getByRole('combobox', { name: '本次使用的来源' })
      .selectOption(source.id)
    await expect(
      candidate.getByRole('button', { name: '开始这次定向练习' }),
    ).toBeVisible()
  }
  await Promise.all(
    [page, other].map((candidate) =>
      candidate.getByRole('button', { name: '开始这次定向练习' }).click(),
    ),
  )
  await expect
    .poll(
      async () =>
        (await localState(page)).sessions.filter(
          (session) =>
            session.provenance?.sourceTaskId === consolidation(initial).task.id,
        ).length,
    )
    .toBe(1)
  const settled = await localState(page)
  const { task } = consolidation(settled)
  if (task.target.kind !== 'simulation')
    throw new Error('Expected one fixed simulation selection')
  const winner = task.target.selection!.sourceId === aSource.id ? page : other
  const loser = winner === page ? other : page
  const session = settled.sessions.find(
    (item) => item.provenance?.sourceTaskId === task.id,
  )!
  expect(task.target.selection!.sourceId).toBe(
    session.simulation!.source.sourceId,
  )
  expect(task.target.selection!.sourceLevel).toBe(session.level)
  expect(task.swapUsed).toBe(false)
  await expect(
    winner.getByRole('textbox', { name: '我回忆的表达' }),
  ).toBeVisible()
  await expect(
    loser.getByRole('alert').filter({ hasText: '未能确认本机保存' }),
  ).toBeVisible()
  await winner.getByRole('textbox', { name: '我回忆的表达' }).fill('black')
  await winner.getByRole('button', { name: '保存回忆并查看' }).click()
  await expect(
    winner.getByRole('textbox', { name: '我的替换或造句' }),
  ).toBeVisible()
  await winner
    .getByRole('textbox', { name: '我的替换或造句' })
    .fill('I would like my coffee black, please.')
  await winner.getByRole('button', { name: '保存造句并应用' }).click()
  await expect(
    winner.getByRole('heading', { name: 'Dialogue Stage' }),
  ).toBeVisible()
  const composed = await localState(winner)
  const written = composed.sessions.find((item) => item.id === session.id)!
  expect(written.simulation!.recall!.text).toBe('black')
  expect(written.simulation!.composition!.text).toBe(
    'I would like my coffee black, please.',
  )
  await loser.getByRole('button', { name: '重试', exact: true }).click()
  await expect(
    loser.getByRole('alert').filter({ hasText: '未能确认本机保存' }),
  ).toBeVisible()
  const afterLate = await localState(loser)
  expect(afterLate.dailyPlans).toEqual(composed.dailyPlans)
  expect(afterLate.sessions).toEqual(composed.sessions)
  expect(afterLate.notebook).toEqual(composed.notebook)
  expect(afterLate.pointsLedger).toEqual([])
  await winner.reload()
  await expect(
    winner.getByRole('heading', { name: 'Dialogue Stage' }),
  ).toBeVisible()
  expect(
    (await localState(winner)).sessions.filter(
      (item) => item.provenance?.sourceTaskId === task.id,
    ),
  ).toEqual([written])
  await writeFile(
    info.outputPath('source-race.json'),
    JSON.stringify(
      {
        buildId,
        aSource,
        bSource,
        winningSource: task.target.selection!.sourceId,
        winnerUrl: winner.url(),
        composed,
        afterLate,
      },
      null,
      2,
    ),
  )
  await audit(info)
})
