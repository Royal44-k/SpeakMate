import type { AdaptedScene, CefrLevel } from '@/domain/scenes/types'

export type PracticeSessionStatus = 'active' | 'completed' | 'abandoned'

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
  createdAt: string
}
