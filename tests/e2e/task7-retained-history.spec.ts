import { expect, test } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import { localState, protect } from './task7-browser-helpers'

test('H/D: 121 pinned historical sessions including long ASCII and Unicode IDs remain completely readable, undoable and exportable', async ({
  page,
  context,
  baseURL,
}, info) => {
  test.setTimeout(120000)
  const finishNetwork = await protect(context, baseURL!)
  // Explicit historical-ID fixture: derives pinned complete content from an
  // actual earlier UI download, never a replacement for the live learning story.
  const fixture = JSON.parse(
    await readFile(
      'outputs/qa/task7/core-online-green/synthetic-completed-backup.json',
      'utf8',
    ),
  )
  const original = fixture.sessions.find(
    (session: { simulation?: unknown }) => !session.simulation,
  )
  const originalTurns = fixture.turns.filter(
    (turn: { sessionId: string }) => turn.sessionId === original.id,
  )
  const ids = [
    'a'.repeat(121),
    '旧的完整记录',
    ...Array.from(
      { length: 117 },
      (_, index) => `retained-${String(index).padStart(3, '0')}`,
    ),
  ]
  for (const [index, id] of ids.entries()) {
    const session = structuredClone(original)
    delete session.provenance
    session.id = id
    session.startedAt = '2026-07-01T01:00:00.000Z'
    session.updatedAt = new Date(
      Date.parse('2026-07-01T01:00:00Z') + index * 1000,
    ).toISOString()
    session.status = 'active'
    delete session.completedAt
    // Historical terminal-pending imports may have IDs the modern command
    // boundary cannot address. They remain readable here, never executed.
    delete session.completionEvidence
    fixture.sessions.push(session)
    for (const [turnIndex, turn] of originalTurns.entries())
      fixture.turns.push({
        ...turn,
        id: `${id}:turn:${turnIndex}`,
        sessionId: id,
        createdAt: session.updatedAt,
      })
  }
  expect(fixture.sessions).toHaveLength(121)
  await page.goto('/privacy')
  await page
    .locator('input[type=file]')
    .setInputFiles({
      name: 'historical-ids-121.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(fixture)),
    })
  await page.getByRole('button', { name: '确认合并恢复' }).click()
  await expect(page.getByText(/恢复完成/)).toBeVisible()
  const restored = await localState(page)
  expect(restored.sessions).toHaveLength(121)
  await page.addInitScript(() => {
    const audit = { transactions: [] as string[] }
    Object.assign(window, { __historyAudit: audit })
    const original = IDBDatabase.prototype.transaction
    IDBDatabase.prototype.transaction = function (...args) {
      audit.transactions.push(String(args[1] ?? 'readonly'))
      return Reflect.apply(original, this, args)
    }
  })
  await page.goto('/me')
  const history = page.getByRole('region', { name: '完整练习历史' })
  await expect(
    history.getByRole('button', { name: /^删除此练习/ }),
  ).toHaveCount(121)
  const eagerTransactions = await page.evaluate(
    () =>
      (window as unknown as { __historyAudit: { transactions: string[] } })
        .__historyAudit.transactions.length,
  )
  expect(eagerTransactions).toBeLessThan(20)
  const oldLinks = history.getByRole('button', { name: /在此查看保留记录/ })
  await expect(oldLinks).toHaveCount(2)
  const rendered: string[] = []
  for (let index = 0; index < 2; index++) {
    await oldLinks.nth(index).click()
    await expect(
      page.getByRole('heading', { name: '保留的练习记录（只读）' }),
    ).toBeVisible()
    const content = await page.locator('main').innerText()
    for (const turn of originalTurns)
      if (turn.learnerText) expect(content).toContain(turn.learnerText)
    await expect(page.getByRole('button', { name: '提交这一轮' })).toHaveCount(
      0,
    )
    rendered.push(content)
    await page.getByRole('button', { name: '返回本页列表' }).click()
  }
  await history
    .getByRole('button', { name: /^删除此练习/ })
    .last()
    .click()
  await page.getByRole('button', { name: '确认删除这条历史' }).click()
  await page.getByRole('button', { name: '撤销本次删除' }).click()
  await expect(page.getByText(/本次历史已恢复/)).toBeVisible()
  const afterUndo = await localState(page)
  expect(afterUndo.sessions).toEqual(restored.sessions)
  expect(afterUndo.turns).toEqual(restored.turns)
  expect(afterUndo.pointsLedger).toEqual(restored.pointsLedger)
  await page.goto('/privacy')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出学习数据' }).click()
  const download = await downloadPromise,
    path = info.outputPath('actual-121-session-backup.json')
  await download.saveAs(path)
  const bytes = await readFile(path),
    exported = JSON.parse(bytes.toString())
  expect(exported.sessions).toEqual(restored.sessions)
  expect(exported.turns).toEqual(restored.turns)
  await writeFile(
    info.outputPath('retained-readability.json'),
    JSON.stringify(
      {
        eagerTransactions,
        sessions: restored.sessions.length,
        bytes: bytes.byteLength,
        specialIds: ids.slice(0, 2),
        rendered,
      },
      null,
      2,
    ),
  )
  await finishNetwork(info)
})
