import { describe, expect, it } from 'vitest'
import {
  createDailyPlan,
  reconfigureDailyPlan,
  swapUnstartedTask,
} from './planner'
import { createGuestProfile } from '@/infrastructure/persistence/identity'
import type { NotebookEntry } from '@/domain/notebook/types'

const profile = {
  ...createGuestProfile(),
  id: 'planner-user',
  level: 'A2' as const,
  goals: ['study' as const],
}
const at = '2026-09-10T15:59:59Z'
describe('stable Beijing daily plan policy', () => {
  it('swaps an unstarted note warmup explicitly to the truthful starter and refuses stale started swaps', () => {
    const note: NotebookEntry = {
      id: 'known',
      profileId: profile.id,
      kind: 'word',
      text: 'hello',
      normalizedText: 'hello',
      notes: '',
      tags: [],
      sources: [],
      favoriteIds: [],
      createdAt: at,
      updatedAt: at,
    }
    const plan = createDailyPlan({
      profile,
      at,
      notes: [note],
      reviews: [],
      sessions: [],
    })
    const swapped = swapUnstartedTask(plan, plan.tasks[0].id, at)
    expect(swapped.tasks[0]).toMatchObject({
      swapUsed: true,
      target: { noteIds: [], starterExpressionIds: ['coffee.word.black'] },
    })
  })
  it.each([5, 10, 15] as const)(
    'makes %i minute real path tasks without fabricated notebook targets',
    (minutes) => {
      const plan = createDailyPlan({
        profile: { ...profile, dailyMinutes: minutes },
        at,
        notes: [],
        reviews: [],
        sessions: [],
      })
      expect(plan.dateKey).toBe('2026-09-10')
      expect(plan.tasks.map((t) => t.slot)).toEqual(
        minutes === 15
          ? ['warmup', 'scene', 'consolidation', 'extension']
          : ['warmup', 'scene', 'consolidation'],
      )
      expect(plan.tasks.reduce((n, t) => n + t.estimatedMinutes, 0)).toBe(
        minutes,
      )
      expect(plan.tasks[2].target).toEqual({ kind: 'simulation-choice' })
      expect(plan.tasks[1].target).toMatchObject({
        kind: 'scene',
        selection: { level: 'A2', schemaVersion: 1 },
      })
      expect(plan.tasks[1].source.sceneId).toMatch(/^study-/)
      expect(
        createDailyPlan({
          profile: { ...profile, dailyMinutes: minutes },
          at,
          notes: [],
          reviews: [],
          sessions: [],
        }),
      ).toEqual(plan)
    },
  )
  it('crosses Beijing midnight, prefers due notes then favorite, and avoids the last scene', () => {
    const note = (id: string, favorite = false): NotebookEntry => ({
      id,
      profileId: profile.id,
      kind: 'word',
      text: id,
      normalizedText: id,
      notes: '',
      tags: [],
      sources: [],
      favoriteIds: favorite ? ['fav'] : [],
      createdAt: at,
      updatedAt: at,
    })
    const input = {
      profile,
      at,
      notes: [note('favorite', true), note('due')],
      reviews: [
        {
          noteId: 'due',
          nextReviewDateKey: '2026-09-09',
          reviewedAt: '2026-09-08T00:00:00Z',
        },
      ],
      sessions: [],
    }
    const first = createDailyPlan(input)
    expect(first.tasks[0].target).toMatchObject({
      noteIds: ['due'],
      starterExpressionIds: [],
    })
    expect(
      createDailyPlan({ ...input, notes: [...input.notes].reverse() }),
    ).toEqual(first)
    const tomorrow = createDailyPlan({
      ...input,
      at: '2026-09-10T16:00:00Z',
      sessions: [{ sceneId: first.tasks[1].source.sceneId!, startedAt: at }],
    })
    expect(tomorrow.dateKey).toBe('2026-09-11')
    expect(tomorrow.tasks[1].source.sceneId).not.toBe(
      first.tasks[1].source.sceneId,
    )
    expect(tomorrow.id).not.toBe(first.id)
  })
  it('changes only unstarted duration-owned work, preserving a started extension and one swap budget', () => {
    const first = createDailyPlan({
      profile: { ...profile, dailyMinutes: 5 },
      at,
      notes: [],
      reviews: [],
      sessions: [],
    })
    const longer = reconfigureDailyPlan(first, 15, at)
    const extension = longer.tasks[3]
    longer.tasks[3] = { ...extension, status: 'started', startedAt: at }
    expect(reconfigureDailyPlan(longer, 5, at).tasks[3]).toEqual(
      longer.tasks[3],
    )
    const swapped = swapUnstartedTask(first, first.tasks[1].id, at)
    expect(swapped.tasks[1].id).toBe(first.tasks[1].id)
    expect(swapped.tasks[1].target).not.toEqual(first.tasks[1].target)
    expect(() => swapUnstartedTask(swapped, first.tasks[1].id, at)).toThrow(
      'SWAP_NOT_ALLOWED',
    )
    expect(first.tasks[1].swapUsed).toBe(false)
  })
})
