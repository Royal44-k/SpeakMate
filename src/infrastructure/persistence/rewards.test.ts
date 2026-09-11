import { afterEach, describe, expect, it } from 'vitest'
import {
  createMemoryRepositories,
  createIndexedDbRepositories,
  type Repositories,
} from './repositories'
import { deleteDatabase } from './db'
import { createDailyPlan } from '@/domain/goals/planner'
import { settleTaskCompletion } from '@/domain/goals/task-policy'
import { summarizePoints } from '@/domain/goals/statistics'
import type { LearningEvent } from '@/domain/goals/types'
import { REWARDS } from '@/domain/goals/rewards'
afterEach(deleteDatabase)
async function earn100(repos: Repositories) {
  const profile = await repos.profiles.ensureGuestProfile()
  for (let n = 1; n <= 10; n++) {
    const date = `2026-08-${String(n).padStart(2, '0')}`,
      at = date + 'T01:00:00Z'
    const plan = createDailyPlan({
        profile,
        at,
        notes: [],
        reviews: [],
        sessions: [],
      }),
      task = plan.tasks[0]
    await repos.learning.ensureDailyPlan(plan)
    await repos.learning.updateDailyPlan(plan.id, (p) => ({
      ...p,
      tasks: p.tasks.map((t) =>
        t.id === task.id ? { ...t, status: 'started', startedAt: at } : t,
      ),
    }))
    const event: LearningEvent = {
      id: `earn-${n}`,
      type: 'warmup-completed',
      runId: `run-${n}`,
      profileId: profile.id,
      occurredAt: at,
      dateKey: date,
      provenance: {
        planId: plan.id,
        sourceTaskId: task.id,
        planDate: date,
        returnTo: '/',
      },
      recalledNoteIds: [],
      recalledStarterExpressionIds:
        task.target.kind === 'warmup' ? task.target.starterExpressionIds : [],
    }
    await repos.learning.recordEvent(event, (state) =>
      settleTaskCompletion(state, event),
    )
  }
  return profile
}
describe.each([
  ['memory', createMemoryRepositories],
  ['indexeddb', createIndexedDbRepositories],
] as const)('%s actual reward policy', (_, make) => {
  it('atomically changes profile minutes and the existing today plan without changing its level or started extension', async () => {
    const repos = make(),
      profile = await repos.profiles.ensureGuestProfile()
    const at = '2026-09-11T00:00:00Z'
    const { plan } = await repos.learning.changeDailyMinutes(profile.id, 15, at)
    await repos.learning.updateDailyPlan(plan.id, (p) => ({
      ...p,
      tasks: p.tasks.map((t) =>
        t.optional ? { ...t, status: 'started', startedAt: at } : t,
      ),
    }))
    await repos.profiles.save({ ...profile, level: 'B2', dailyMinutes: 15 })
    const result = await repos.learning.changeDailyMinutes(profile.id, 5, at)
    expect(result.profile.dailyMinutes).toBe(5)
    expect(result.plan.snapshot.dailyMinutes).toBe(5)
    expect(result.plan.snapshot.level).toBe(profile.level)
    expect(result.plan.tasks[3]).toMatchObject({
      status: 'started',
      enabled: true,
    })
  })
  it('redeems concurrent distinct attempts once, applies real ownership and restores selection', async () => {
    const repos = make(),
      profile = await earn100(repos)
    const results = await Promise.all([
      repos.learning.redeemReward(
        profile.id,
        'profile-atlantic',
        '2026-09-11T00:00:00Z',
      ),
      repos.learning.redeemReward(
        profile.id,
        'profile-atlantic',
        '2026-09-11T00:00:01Z',
      ),
    ])
    expect(results.map((r) => r.status).sort()).toEqual([
      'already-owned',
      'redeemed',
    ])
    expect(
      summarizePoints((await repos.learning.getState(profile.id)).pointsLedger),
    ).toEqual({ earned: 100, available: 0 })
    await repos.learning.applyReward(
      profile.id,
      'profile-atlantic',
      '2026-09-11T00:00:02Z',
    )
    expect((await repos.learning.getSettings()).appliedProfileStyle).toBe(
      'profile-atlantic',
    )
    await expect(
      repos.learning.applyReward(
        profile.id,
        'cover-horizon',
        '2026-09-11T00:00:03Z',
      ),
    ).rejects.toThrow('REWARD_NOT_OWNED')
    const data = await repos.exportLearnerData(),
      cold = createMemoryRepositories()
    await cold.restoreLearnerData(
      await cold.previewRestore(JSON.stringify(data)),
    )
    expect((await cold.learning.getSettings()).appliedProfileStyle).toBe(
      'profile-atlantic',
    )
    expect(await cold.learning.balance(profile.id)).toBe(0)
  })
  it('never overdraws two different 100-point rewards and rejects unknown catalog entries', async () => {
    const repos = make(),
      profile = await earn100(repos)
    const results = await Promise.allSettled(
      ['profile-atlantic', 'profile-paper'].map((id) =>
        repos.learning.redeemReward(profile.id, id, '2026-09-11T00:00:00Z'),
      ),
    )
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    expect(await repos.learning.balance(profile.id)).toBe(0)
    await expect(
      repos.learning.redeemReward(
        profile.id,
        'invented',
        '2026-09-11T00:00:00Z',
      ),
    ).rejects.toThrow('UNKNOWN_REWARD')
  })
})
it('offers precisely two styles, two covers and two usable original sheets at their approved prices', () => {
  expect(REWARDS.map((r) => [r.kind, r.price])).toEqual([
    ['profile', 100],
    ['profile', 100],
    ['cover', 200],
    ['cover', 200],
    ['sheet', 300],
    ['sheet', 300],
  ])
  for (const reward of REWARDS.filter((r) => r.kind === 'sheet'))
    expect(reward.content?.length).toBeGreaterThan(100)
})
