import { afterEach, describe, expect, it } from 'vitest'
import { deleteDatabase } from './db'
import { stableId } from './identity'
import {
  createIndexedDbRepositories,
  createMemoryRepositories,
} from './repositories'
import type { LearningEvent } from '@/domain/goals/types'
import { planFixture, completionFixture } from './learning-fixtures'

afterEach(async () => {
  await deleteDatabase()
})

describe.each([
  ['memory', createMemoryRepositories],
  ['indexeddb', createIndexedDbRepositories],
] as const)('%s learning transactions', (_name, create) => {
  it('keeps stable slots, one swap and started optional work across time changes', async () => {
    const repository = create()
    const profile = await repository.profiles.ensureGuestProfile()
    const plan = planFixture(profile.id)
    const candidates = await Promise.all([
      repository.learning.ensureDailyPlan(plan),
      repository.learning.ensureDailyPlan({ ...plan, id: 'another_id' }),
    ])
    expect(candidates[0].id).toBe(candidates[1].id)
    await repository.learning.updateDailyPlan(plan.id, (current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.slot === 'scene'
          ? {
              ...task,
              swapUsed: true,
              target: {
                kind: 'scene',
                sceneId: 'work-01',
                sceneVersion: 1,
                requiredUserTurns: 3,
              },
            }
          : task,
      ),
    }))
    await expect(
      repository.learning.updateDailyPlan(plan.id, (current) => ({
        ...current,
        tasks: current.tasks.map((task) =>
          task.slot === 'scene'
            ? {
                ...task,
                target: {
                  kind: 'scene',
                  sceneId: 'work-02',
                  sceneVersion: 1,
                  requiredUserTurns: 3,
                },
              }
            : task,
        ),
      })),
    ).rejects.toThrow('SWAP_NOT_ALLOWED')
    await repository.learning.updateDailyPlan(plan.id, (current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.optional
          ? {
              ...task,
              status: 'started',
              startedAt: '2026-09-08T00:01:00.000Z',
            }
          : task,
      ),
    }))
    await repository.learning.updateDailyPlan(plan.id, (current) => ({
      ...current,
      snapshot: { ...current.snapshot, dailyMinutes: 5 },
    }))
    expect(
      (await repository.learning.getDailyPlan(profile.id, '2026-09-08'))
        ?.tasks[3].status,
    ).toBe('started')
    await expect(
      repository.learning.updateDailyPlan(plan.id, (current) => ({
        ...current,
        tasks: current.tasks.slice(0, 3),
      })),
    ).rejects.toThrow('PLAN_SLOT_REMOVED')
  })

  it('atomically settles a cross-day original slot once, exports valid ledger facts, and never replays a restore', async () => {
    const repository = create()
    const profile = await repository.profiles.ensureGuestProfile()
    await repository.learning.ensureDailyPlan(planFixture(profile.id))
    const event = completionFixture(profile.id)
    const derive = (
      state: Awaited<ReturnType<typeof repository.learning.getState>>,
    ) => ({
      dailyPlan: {
        ...state.dailyPlans[0],
        updatedAt: event.occurredAt,
        tasks: state.dailyPlans[0].tasks.map((task) =>
          task.id === 'slot_warmup'
            ? {
                ...task,
                status: 'completed' as const,
                startedAt: '2026-09-08T15:59:00.000Z',
                completedAt: event.occurredAt,
                completionEventId: event.id,
                progress: 1,
              }
            : task,
        ),
      },
      pointsLedger: [
        {
          id: 'grant_warmup',
          profileId: profile.id,
          eventId: event.id,
          ruleId: 'core-task',
          ruleVersion: 1,
          delta: 10,
          createdAt: event.occurredAt,
        },
      ],
    })
    const results = await Promise.all([
      repository.learning.recordEvent(event, derive),
      repository.learning.recordEvent(event, derive),
    ])
    expect(results.filter((result) => result.applied)).toHaveLength(1)
    expect(await repository.learning.balance(profile.id)).toBe(10)
    const data = await repository.exportLearnerData()
    expect(data.learningEvents[0]).toMatchObject({
      dateKey: '2026-09-09',
      provenance: { planDate: '2026-09-08' },
    })
    await repository.restoreLearnerData(
      await repository.previewRestore(JSON.stringify(data)),
    )
    expect(await repository.learning.balance(profile.id)).toBe(10)
    const broken = { ...data, learningEvents: [] }
    await expect(
      createMemoryRepositories().previewRestore(JSON.stringify(broken)),
    ).rejects.toThrow()
    const conflict = await repository.previewRestore(
      JSON.stringify({
        ...data,
        pointsLedger: [{ ...data.pointsLedger[0], delta: 100 }],
      }),
    )
    expect(conflict.canImport).toBe(false)
    expect(conflict.conflicts.join(' ')).toContain('IMMUTABLE_CONFLICT')
    await expect(
      repository.previewRestore(JSON.stringify({ ...data, balance: 999999 })),
    ).rejects.toThrow()
    const later: LearningEvent = {
      ...event,
      id: 'another_real_run',
      runId: 'run_warmup_2',
    }
    await repository.learning.recordEvent(later)
    expect(
      (await repository.learning.getState(profile.id)).events,
    ).toHaveLength(2)
    expect(await repository.learning.balance(profile.id)).toBe(10)
    const third: LearningEvent = {
      ...event,
      id: 'third_real_run',
      runId: 'run_warmup_3',
    }
    await expect(
      repository.learning.recordEvent(third, () => ({
        pointsLedger: [
          {
            ...data.pointsLedger[0],
            id: 'second_grant_same_slot',
            eventId: third.id,
          },
        ],
      })),
    ).rejects.toThrow('DUPLICATE_LEDGER_GRANT')
  })

  it('rejects same event settlement effects that try to attach a grant to a different event', async () => {
    const repository = create()
    const profile = await repository.profiles.ensureGuestProfile()
    await repository.learning.ensureDailyPlan(planFixture(profile.id))
    const first = completionFixture(profile.id)
    await repository.learning.recordEvent(first)
    const second: LearningEvent = {
      ...first,
      id: stableId('warmup-completed', 'direct_2'),
      provenance: undefined,
      runId: 'direct_2',
    }
    await expect(
      repository.learning.recordEvent(second, () => ({
        pointsLedger: [
          {
            id: 'wrong_event_grant',
            profileId: profile.id,
            eventId: first.id,
            ruleId: 'core-task',
            ruleVersion: 1,
            delta: 10,
            createdAt: second.occurredAt,
          },
        ],
      })),
    ).rejects.toThrow('EFFECT_EVENT_MISMATCH')
    expect(await repository.learning.balance(profile.id)).toBe(0)
  })

  it('requires task-state settlement with a grant and rejects wrong-slot completion evidence', async () => {
    const repository = create()
    const profile = await repository.profiles.ensureGuestProfile()
    await repository.learning.ensureDailyPlan(planFixture(profile.id))
    const event = completionFixture(profile.id)
    await expect(
      repository.learning.recordEvent(event, () => ({
        pointsLedger: [
          {
            id: 'grant_without_plan',
            profileId: profile.id,
            eventId: event.id,
            ruleId: 'core-task',
            ruleVersion: 1,
            delta: 10,
            createdAt: event.occurredAt,
          },
        ],
      })),
    ).rejects.toThrow('UNSETTLED_TASK_GRANT')
    await expect(
      repository.learning.recordEvent({
        ...event,
        provenance: { ...event.provenance!, sourceTaskId: 'slot_scene' },
      }),
    ).rejects.toThrow('TASK_EVIDENCE_MISMATCH')
    expect((await repository.learning.getState(profile.id)).events).toEqual([])
  })

  it('keeps redemption and unlock atomic, refuses overdraft, and retains only one owned reward', async () => {
    const repository = create()
    const profile = await repository.profiles.ensureGuestProfile()
    await repository.learning.ensureDailyPlan(planFixture(profile.id))
    const earn = completionFixture(profile.id)
    await repository.learning.recordEvent(earn, (current) => ({
      dailyPlan: {
        ...current.dailyPlans[0],
        tasks: current.dailyPlans[0].tasks.map((task) =>
          task.id === 'slot_warmup'
            ? {
                ...task,
                status: 'completed',
                startedAt: earn.occurredAt,
                completedAt: earn.occurredAt,
                completionEventId: earn.id,
              }
            : task,
        ),
      },
      pointsLedger: [
        {
          id: 'earn_for_redemption',
          profileId: profile.id,
          eventId: earn.id,
          ruleId: 'core-task',
          ruleVersion: 1,
          delta: 10,
          createdAt: earn.occurredAt,
        },
      ],
    }))
    const redeem: LearningEvent = {
      id: 'redeem_1',
      type: 'reward-redeemed',
      rewardId: 'test_local_reward',
      profileId: profile.id,
      occurredAt: '2026-09-09T00:00:00.000Z',
      dateKey: '2026-09-09',
    }
    // Test-only prices exercise persistence atomicity; Task5 supplies actual catalogue policy.
    const effects = {
      pointsLedger: [
        {
          id: 'spend_1',
          profileId: profile.id,
          eventId: redeem.id,
          ruleId: 'redeem',
          ruleVersion: 1,
          delta: -10,
          createdAt: redeem.occurredAt,
        },
      ],
      rewardUnlocks: [
        {
          id: 'unlock_1',
          profileId: profile.id,
          eventId: redeem.id,
          rewardId: 'test_local_reward',
          unlockedAt: redeem.occurredAt,
        },
      ],
    }
    await Promise.all([
      repository.learning.recordEvent(redeem, () => effects),
      repository.learning.recordEvent(redeem, () => effects),
    ])
    expect(await repository.learning.balance(profile.id)).toBe(0)
    expect(
      (await repository.learning.getState(profile.id)).rewardUnlocks,
    ).toHaveLength(1)
    const second: LearningEvent = {
      ...redeem,
      id: 'redeem_2',
      rewardId: 'another_local_reward',
    }
    await expect(
      repository.learning.recordEvent(second, () => ({
        pointsLedger: [
          { ...effects.pointsLedger[0], id: 'spend_2', eventId: second.id },
        ],
        rewardUnlocks: [
          {
            ...effects.rewardUnlocks[0],
            id: 'unlock_2',
            eventId: second.id,
            rewardId: 'another_local_reward',
          },
        ],
      })),
    ).rejects.toThrow('INSUFFICIENT_POINTS')
    const data = await repository.exportLearnerData()
    const fresh = createMemoryRepositories()
    await fresh.restoreLearnerData(
      await fresh.previewRestore(JSON.stringify(data)),
    )
    expect(
      (await fresh.learning.getState(profile.id)).rewardUnlocks,
    ).toHaveLength(1)
    expect(await fresh.learning.balance(profile.id)).toBe(0)
    await repository.clearLearnerData()
    expect(
      Object.values(await repository.learning.getState(profile.id)).every(
        (rows) => rows.length === 0,
      ),
    ).toBe(true)
  })

  it('accumulates unique foreground segments separately and rejects hidden-gap or cross-date inflated time', async () => {
    const repository = create()
    const profile = await repository.profiles.ensureGuestProfile()
    const event: LearningEvent = {
      id: 'foreground_1',
      type: 'foreground-time-recorded',
      profileId: profile.id,
      runId: 'run_1',
      segmentId: 'segment_1',
      occurredAt: '2026-09-09T00:00:10.000Z',
      dateKey: '2026-09-09',
      startedAt: '2026-09-09T00:00:00.000Z',
      endedAt: '2026-09-09T00:00:10.000Z',
      durationMs: 10000,
    }
    await repository.learning.recordEvent(event)
    await repository.learning.recordEvent(event)
    const state = await repository.learning.getState(profile.id)
    expect(
      state.events.reduce(
        (sum, item) =>
          sum +
          (item.type === 'foreground-time-recorded' ? item.durationMs : 0),
        0,
      ),
    ).toBe(10000)
    expect(state.dailyPlans).toEqual([])
    expect(state.pointsLedger).toEqual([])
    await expect(
      repository.learning.recordEvent({
        ...event,
        id: 'bad_segment',
        segmentId: 'segment_2',
        durationMs: 60000,
      }),
    ).rejects.toThrow('INVALID_FOREGROUND_SEGMENT')
  })

  it.each(['remember', 'vague', 'forgot'] as const)(
    'stores %s self-rating with a durable due date and rejects a forked review schedule',
    async (rating) => {
      const repository = create()
      const profile = await repository.profiles.ensureGuestProfile()
      await repository.favorites.save({
        id: 'favorite_review',
        expression: 'Hello.',
        createdAt: '2026-09-08T00:00:00.000Z',
        updatedAt: '2026-09-08T00:00:00.000Z',
      })
      const note = (await repository.notebook.list())[0]
      const event: LearningEvent = {
        id: 'review_event_1',
        type: 'review-completed',
        profileId: profile.id,
        noteId: note.id,
        reviewId: 'review_1',
        occurredAt: '2026-09-09T00:00:00.000Z',
        dateKey: '2026-09-09',
      }
      await repository.learning.recordEvent(event, () => ({
        review: {
          id: 'review_1',
          profileId: profile.id,
          noteId: note.id,
          eventId: event.id,
          rating,
          reviewedAt: event.occurredAt,
          dateKey: event.dateKey,
          scheduleStep: 0,
          intervalDays: 1,
          nextReviewAt: '2026-09-10T00:00:00.000Z',
          nextReviewDateKey: '2026-09-10',
        },
      }))
      expect(
        await repository.learning.getReviewSchedule(note.id),
      ).toMatchObject({ rating, nextReviewDateKey: '2026-09-10' })
      const previous = (await repository.learning.listReviews(note.id))[0]
      await expect(
        repository.learning.recordEvent(
          { ...event, id: 'review_event_2', reviewId: 'review_2' },
          () => ({
            review: { ...previous, id: 'review_2', eventId: 'review_event_2' },
          }),
        ),
      ).rejects.toThrow('REVIEW_SCHEDULE_STALE')
      expect(await repository.learning.listReviews(note.id)).toHaveLength(1)
      const data = await repository.exportLearnerData()
      const orphan = {
        ...previous,
        id: 'review_without_own_event',
        previousReviewId: previous.id,
        reviewedAt: '2026-09-10T00:00:00.000Z',
        dateKey: '2026-09-10',
        nextReviewAt: '2026-09-11T00:00:00.000Z',
        nextReviewDateKey: '2026-09-11',
      }
      await expect(
        createMemoryRepositories().previewRestore(
          JSON.stringify({ ...data, reviews: [...data.reviews, orphan] }),
        ),
      ).rejects.toThrow('BROKEN_REVIEW_REFERENCE')
    },
  )
  it('records immutable completion once and rolls back invalid synchronous effects', async () => {
    const repository = create()
    const profile = await repository.profiles.ensureGuestProfile()
    expect(repository.learning).toBeDefined()
    const event: LearningEvent = {
      id: stableId('warmup-completed', 'run_1'),
      profileId: profile.id,
      type: 'warmup-completed',
      runId: 'run_1',
      recalledNoteIds: [],
      recalledStarterExpressionIds: ['starter_1'],
      occurredAt: '2026-09-09T00:00:00.000Z',
      dateKey: '2026-09-09',
    }
    let derived = 0
    const derive = () => {
      derived++
      return {}
    }
    const results = await Promise.all([
      repository.learning.recordEvent(event, derive),
      repository.learning.recordEvent(event, derive),
    ])
    expect(results.map((result) => result.applied).sort()).toEqual([
      false,
      true,
    ])
    expect(derived).toBe(1)
    await expect(
      repository.learning.recordEvent({
        ...event,
        recalledStarterExpressionIds: ['different'],
      }),
    ).rejects.toThrow('IMMUTABLE_CONFLICT')
    await expect(
      repository.learning.recordEvent(
        { ...event, id: stableId('warmup-completed', 'run_2'), runId: 'run_2' },
        () => {
          throw new Error('settlement failed')
        },
      ),
    ).rejects.toThrow('settlement failed')
    expect(
      (await repository.learning.getState(profile.id)).events,
    ).toHaveLength(1)
    expect(await repository.learning.balance(profile.id)).toBe(0)
  })
})
