import type { CefrLevel, SceneCategory } from '@/domain/scenes/types'
import type { PracticeCompletionEvidence } from '@/domain/practice/graded-evidence'

export type TaskSlot = 'warmup' | 'scene' | 'consolidation' | 'extension'
export interface TaskProvenance {
  planId: string
  sourceTaskId: string
  planDate: string
  sourceNoteId?: string
  returnTo: string
}
export type TaskTarget =
  | { kind: 'simulation-choice' }
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
      selection?: {
        schemaVersion: 1
        level: CefrLevel
        mode: 'short' | 'standard' | 'extended'
        variantId: string
        contentVersion: number
      }
    }
  | {
      kind: 'simulation'
      noteIds: string[]
      requiredUserTurns: 3 | 4 | 5
      selection?: SimulationSelection
    }

export interface SimulationSelection {
  schemaVersion: 1
  noteId: string
  sourceId: string
  sourceLevel: CefrLevel
  descriptorId: string
  descriptorVersion: 1 | 2
  sourceContentVersion: number
}

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
  | {
      type: 'session-completed'
      sessionId: string
      evidence?: PracticeCompletionEvidence
    }
  | {
      type: 'warmup-completed'
      runId: string
      recalledNoteIds: string[]
      recalledStarterExpressionIds: string[]
      recallResponses?: { id: string; kind: 'note' | 'starter'; text: string }[]
    }
  | {
      type: 'simulation-completed'
      runId: string
      noteIds: string[]
      sessionId: string
      recallCompleted: boolean
      compositionText: string
      completedUserTurns: number
      evidence?: PracticeCompletionEvidence
      selection?: SimulationSelection
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
