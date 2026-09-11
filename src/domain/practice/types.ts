import type { AdaptedScene, CefrLevel } from '@/domain/scenes/types'
import type { ConversationResult } from '@/domain/ai/contracts'
import type { TaskProvenance } from '@/domain/goals/types'
import type { DialogueSnapshot } from '@/domain/ai/graded-dialogue'
import type {
  NotebookKind,
  NotebookSourceSnapshot,
} from '@/domain/notebook/types'
import type { MicroPracticeDescriptor } from '@/content/micro-practice'
import type {
  PracticePresentation,
  PracticeCompletionEvidence,
} from './graded-evidence'

export type PracticeSessionStatus = 'active' | 'completed' | 'abandoned'
export interface PracticeSimulation {
  schemaVersion: 1
  noteIds: [string]
  source: {
    noteId: string
    sourceId: string
    snapshot: NotebookSourceSnapshot
    noteText: string
    noteKind: NotebookKind
  }
  returnTo: string
  descriptor: MicroPracticeDescriptor
  target: {
    coverage: 'exact' | 'partial'
    text: string
    kind: NotebookKind
    meaningZh: string
    example: string
    substitution: string
  }
  recall?: { text: string; completedAt: string }
  composition?: { text: string; completedAt: string }
}

export interface PracticeSession {
  id: string
  profileId: string
  sceneId: string
  sceneVersion: number
  sceneSnapshot?: AdaptedScene
  level: CefrLevel
  status: PracticeSessionStatus
  startedAt: string
  updatedAt: string
  completedAt?: string
  completedGoals: string[]
  openingText?: string
  provenance?: TaskProvenance
  gradedDialogue?: DialogueSnapshot
  presentation?: PracticePresentation
  completionEvidence?: PracticeCompletionEvidence
  simulation?: PracticeSimulation
}

export interface TurnFeedback {
  corrected: string
  natural: string
  explanationZh: string
  tags: string[]
}

export interface PracticeTurn {
  id: string
  sessionId: string
  index: number
  learnerText: string
  aiText: string
  feedback?: TurnFeedback
  degraded?: boolean
  result?: ConversationResult
  createdAt: string
}
