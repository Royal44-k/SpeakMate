// Test-only hand-authored inputs shared by transaction/backup regression tests.
import type { DailyPlan, LearningEvent } from '@/domain/goals/types'
import { stableId } from './identity'

export function planFixture(profileId: string): DailyPlan {
  return {
    id: 'plan_2026-09-08',
    profileId,
    dateKey: '2026-09-08',
    snapshot: { level: 'C1', interests: ['dining'], dailyMinutes: 15 },
    createdAt: '2026-09-08T00:00:00.000Z',
    updatedAt: '2026-09-08T00:00:00.000Z',
    tasks: [
      {
        id: 'slot_warmup',
        slot: 'warmup',
        optional: false,
        enabled: true,
        status: 'not-started',
        swapUsed: false,
        purposeZh: '回忆表达',
        estimatedMinutes: 1,
        completionConditionZh: '回忆一条表达',
        target: {
          kind: 'warmup',
          noteIds: [],
          starterExpressionIds: ['starter_1'],
          requiredRecallCount: 1,
        },
        source: { reason: 'starter', noteIds: [] },
        progress: 0,
      },
      {
        id: 'slot_scene',
        slot: 'scene',
        optional: false,
        enabled: true,
        status: 'not-started',
        swapUsed: false,
        purposeZh: '点单应用',
        estimatedMinutes: 3,
        completionConditionZh: '完成三轮',
        target: {
          kind: 'scene',
          sceneId: 'dining-01',
          sceneVersion: 1,
          requiredUserTurns: 3,
        },
        source: { reason: 'interests', noteIds: [] },
        progress: 0,
      },
      {
        id: 'slot_consolidation',
        slot: 'consolidation',
        optional: false,
        enabled: true,
        status: 'not-started',
        swapUsed: false,
        purposeZh: '巩固',
        estimatedMinutes: 3,
        completionConditionZh: '回忆造句应用',
        target: { kind: 'simulation', noteIds: [], requiredUserTurns: 3 },
        source: { reason: 'today-expressions', noteIds: [] },
        progress: 0,
      },
      {
        id: 'slot_extension',
        slot: 'extension',
        optional: true,
        enabled: true,
        status: 'not-started',
        swapUsed: false,
        purposeZh: '拓展',
        estimatedMinutes: 3,
        completionConditionZh: '完成三轮',
        target: {
          kind: 'scene',
          sceneId: 'dining-02',
          sceneVersion: 1,
          requiredUserTurns: 3,
        },
        source: { reason: 'interests', noteIds: [] },
        progress: 0,
      },
    ],
  }
}
export function completionFixture(
  profileId: string,
): Extract<LearningEvent, { type: 'warmup-completed' }> {
  return {
    id: stableId('warmup-completed', 'run_warmup'),
    profileId,
    type: 'warmup-completed',
    runId: 'run_warmup',
    recalledNoteIds: [],
    recalledStarterExpressionIds: ['starter_1'],
    occurredAt: '2026-09-08T16:01:00.000Z',
    dateKey: '2026-09-09',
    provenance: {
      planId: 'plan_2026-09-08',
      sourceTaskId: 'slot_warmup',
      planDate: '2026-09-08',
      returnTo: '/',
    },
  }
}
