import { expect, test } from '@playwright/test'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { newSimulation } from '../../src/features/notebook/simulation-material'
import { publicCategorySchema } from '../../src/content/public-category-schema'
import { localState, protect, answer } from './task7-browser-helpers'

test('F: imported v1 micro snapshot reopens offline with its original target rather than the current v2 replacement', async ({
  page,
  context,
  baseURL,
}, info) => {
  test.setTimeout(90000)
  const finishNetwork = await protect(context, baseURL!)
  // Named historical-version fixture only. Build with the original domain
  // projection, then exercise actual file restore and pinned browser resumption.
  const base = JSON.parse(
    await readFile(
      'outputs/qa/task7/core-online-green/synthetic-completed-backup.json',
      'utf8',
    ),
  )
  const folder = (await readdir('outputs/qa/task7/in2-fh')).find((name) =>
    name.startsWith('task7-micro'),
  )!
  const live = JSON.parse(
    await readFile(
      `outputs/qa/task7/in2-fh/${folder}/v2-five-real-simulations.json`,
      'utf8',
    ),
  )[0].session
  const data = publicCategorySchema.parse(
    await (await fetch(`${baseURL}/content/v1/dining`)).json(),
  )
  const sourcePack = data.packs.find(
    (pack) => pack.sceneId === 'dining-02' && pack.level === 'A1',
  )!
  const descriptor = { ...live.simulation.descriptor, version: 1 }
  delete descriptor.targetQuestionOverride
  const source = {
    ...live.simulation.source.snapshot,
    id: 'legacy-micro-source',
  }
  const note = {
    ...base.notebook[0],
    id: 'legacy-micro-note',
    profileId: base.profile.id,
    text: 'on the side',
    normalizedText: 'on the side',
    kind: 'phrase' as const,
    sources: [source],
    favoriteIds: [],
    notes: 'Historical v1 pinned fixture',
    tags: [],
  }
  const session = newSimulation(note, source, {
    sourcePack,
    descriptor,
    target: live.simulation.target,
    analysis: data.analyses.find(
      (item) => item.id === 'restaurant.phrase.on-the-side',
    )!,
  })
  session.simulation!.recall = {
    text: 'Historical saved recall.',
    completedAt: session.startedAt,
  }
  session.simulation!.composition = {
    text: 'Historical saved composition.',
    completedAt: session.startedAt,
  }
  const fixture = {
    ...base,
    sessions: [session],
    turns: [],
    favorites: [],
    notebook: [note],
    reviews: [],
    dailyPlans: [],
    learningEvents: [],
    pointsLedger: [],
    rewardUnlocks: [],
    outbox: [],
  }
  await page.goto('/privacy')
  await page.waitForFunction(
    () => !!navigator.serviceWorker.controller,
    undefined,
    { timeout: 30000 },
  )
  await page
    .locator('input[type=file]')
    .setInputFiles({
      name: 'historical-v1-micro.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(fixture)),
    })
  await page.getByRole('button', { name: '确认合并恢复' }).click()
  await expect(page.getByText(/恢复完成/)).toBeVisible()
  expect((await localState(page)).sessions).toEqual([session])
  await context.setOffline(true)
  await page.goto(`/notebook/simulation?id=${session.id}`)
  await expect(page.getByRole('group', { name: '当前应答问题' })).toBeVisible()
  const oldAnswer = await answer(page)
  expect(oldAnswer).toBe('Tomato pasta, please.')
  await answer(page)
  await expect(page.getByRole('group', { name: '当前应答问题' })).toContainText(
    'Would you like chilli on your pasta?',
  )
  await expect(
    page.getByRole('group', { name: '当前应答问题' }),
  ).not.toContainText('Chilli mixed into the pasta, or on the side?')
  await page.reload()
  const restored = (await localState(page)).sessions[0]
  expect(restored.simulation!.descriptor.version).toBe(1)
  expect(restored.gradedDialogue!.pack).toEqual(session.gradedDialogue!.pack)
  expect(await answer(page)).toBe('Yes, a little chilli, please.')
  await page.getByRole('button', { name: '确认结束并保存复盘' }).click()
  await expect(
    page.getByRole('heading', { name: '这轮已保存。' }),
  ).toBeVisible()
  const completed = (await localState(page)).sessions[0]
  expect(completed.status).toBe('completed')
  expect(
    completed.gradedDialogue!.state.facts.find((fact) => fact.key === 'chilli')
      ?.value,
  ).toBe('yes')
  await page.goto('/privacy')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出学习数据' }).click()
  await (await download).saveAs(info.outputPath('actual-v1-reexport.json'))
  await writeFile(
    info.outputPath('legacy-micro.json'),
    JSON.stringify({ original: session, completed }, null, 2),
  )
  await finishNetwork(info)
})
