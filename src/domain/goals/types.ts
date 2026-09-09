import type { CefrLevel, SceneCategory } from '@/domain/scenes/types'

export type TaskSlot = 'warmup' | 'scene' | 'consolidation' | 'extension'
export interface TaskProvenance {
  planId: string
  sourceTaskId: string
  planDate: string
  sourceNoteId?: string
  returnTo: string
}
export type TaskTarget =
  | {
      kind: 'warmup'
      noteIds: string[]
      starterExpressionIds: string[]
      requiredRecallCount: number
    }
  | {
      kind: 'scene'
      sceneId: string
      sceneVersion: number
      requiredUserTurns: number
    }
  | { kind: 'simulation'; noteIds: string[]; requiredUserTurns: 3 | 4 | 5 }

export interface DailyPlanTask {
  id: string
  slot: TaskSlot
  optional: boolean
  enabled: boolean
  status: 'not-started' | 'started' | 'completed'
  swapUsed: boolean
  purposeZh: string
  estimatedMinutes: number
  completionConditionZh: string
  target: TaskTarget
  source: {
    reason:
      'due-notes' | 'favorites' | 'starter' | 'interests' | 'today-expressions'
    noteIds: string[]
    sceneId?: string
  }
  progress: number
  startedAt?: string
  completedAt?: string
  completionEventId?: string
}
export interface DailyPlan {
  id: string
  profileId: string
  dateKey: string
  snapshot: {
    level: CefrLevel
    interests: SceneCategory[]
    dailyMinutes: 5 | 10 | 15
  }
  tasks: DailyPlanTask[]
  createdAt: string
  updatedAt: string
}
export type LearningEvent = {
  id: string
  profileId: string
  occurredAt: string
  dateKey: string
  provenance?: TaskProvenance
} & (
  | { type: 'turn-completed'; sessionId: string; turnId: string }
  | { type: 'session-completed'; sessionId: string }
  | {
      type: 'warmup-completed'
      runId: string
      recalledNoteIds: string[]
      recalledStarterExpressionIds: string[]
    }
  | {
      type: 'simulation-completed'
      runId: string
      noteIds: string[]
      sessionId: string
      recallCompleted: boolean
      compositionText: string
      completedUserTurns: number
    }
  | { type: 'review-completed'; noteId: string; reviewId: string }
  | { type: 'notebook-added'; noteId: string }
  | { type: 'daily-plan-completed'; planId: string }
  | {
      type: 'foreground-time-recorded'
      runId: string
      segmentId: string
      startedAt: string
      endedAt: string
      durationMs: number
    }
  | { type: 'reward-redeemed'; rewardId: string }
)
export interface PointsLedgerEntry {
  id: string
  profileId: string
  eventId: string
  ruleId: string
  ruleVersion: number
  delta: number
  createdAt: string
}
export interface RewardUnlock {
  id: string
  profileId: string
  rewardId: string
  eventId: string
  unlockedAt: string
}
