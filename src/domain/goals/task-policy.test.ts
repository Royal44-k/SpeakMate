import { expect, it } from 'vitest'
import { createDailyPlan } from './planner'
import { qualifiesTaskCompletion, settleTaskCompletion } from './task-policy'
import { createGuestProfile } from '@/infrastructure/persistence/identity'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import { createGoalService } from '@/features/goals/goal-service'
it('rejects a mismatched or empty warmup instead of granting by a completion flag', async () => {
  const repo = createMemoryRepositories(),
    service = createGoalService(repo, fetch, () => '2026-09-11T01:00:00Z'),
    { plan } = await service.load()
  await service.startWarmup(plan, plan.tasks[0])
  const state = await repo.learning.getState(plan.profileId),
    task = state.dailyPlans[0].tasks[0]
  const event = service.warmupEvent(plan, task, 'policy', [
    { id: 'coffee.word.black', kind: 'starter', text: 'black' },
  ])
  if (event.type !== 'warmup-completed') throw new Error('fixture event')
  expect(qualifiesTaskCompletion(task, event)).toBe(true)
  const historical = { ...event, recallResponses: undefined }
  expect(qualifiesTaskCompletion(task, historical)).toBe(true)
  expect(() => settleTaskCompletion(state, historical)).toThrow(
    'WARMUP_RECALL_REQUIRED',
  )
  expect(
    qualifiesTaskCompletion(task, {
      ...event,
      type: 'warmup-completed',
      recalledNoteIds: [],
      recalledStarterExpressionIds: ['wrong'],
    }),
  ).toBe(false)
  expect(
    qualifiesTaskCompletion({ ...task, status: 'not-started' }, event),
  ).toBe(false)
  expect(
    settleTaskCompletion(state, { ...event, provenance: undefined }),
  ).toEqual({})
})
it('keeps pending consolidation noncompletable and old history unawarded', () => {
  const plan = createDailyPlan({
    profile: createGuestProfile(),
    at: '2026-09-11T01:00:00Z',
    notes: [],
    reviews: [],
    sessions: [],
  })
  expect(
    qualifiesTaskCompletion(plan.tasks[2], {
      id: 'open',
      profileId: plan.profileId,
      type: 'notebook-added',
      noteId: 'note',
      occurredAt: plan.createdAt,
      dateKey: plan.dateKey,
    }),
  ).toBe(false)
})
