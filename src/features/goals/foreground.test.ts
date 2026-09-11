import { expect, it } from 'vitest'
import { createForegroundRecorder } from './foreground'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
it('records only visible active intervals, splits midnight, retries identical events and never checks in or awards', async () => {
  const repo = createMemoryRepositories(),
    profile = await repo.profiles.ensureGuestProfile()
  let wall = Date.parse('2026-09-11T15:59:58Z'),
    mono = 0,
    fail = true
  const recorder = createForegroundRecorder({
    profileId: profile.id,
    runId: 'visible',
    clock: () => new Date(wall).toISOString(),
    monotonic: () => mono,
    save: async (event) => {
      if (fail) throw Error('quota')
      await repo.learning.recordEvent(event)
    },
  })
  recorder.setVisible(true)
  wall += 4000
  mono += 4000
  recorder.setVisible(false)
  await expect(recorder.flush()).rejects.toThrow('quota')
  fail = false
  await recorder.flush()
  await recorder.flush()
  wall += 60000
  mono += 60000
  recorder.setVisible(true)
  wall += 2000
  mono += 2000
  recorder.setVisible(false)
  await recorder.flush()
  const state = await repo.learning.getState(profile.id)
  expect(
    state.events.map((e) => [
      e.type,
      e.dateKey,
      e.type === 'foreground-time-recorded' && e.durationMs,
    ]),
  ).toEqual([
    ['foreground-time-recorded', '2026-09-11', 2000],
    ['foreground-time-recorded', '2026-09-12', 2000],
    ['foreground-time-recorded', '2026-09-12', 2000],
  ])
  expect(state.pointsLedger).toEqual([])
})
