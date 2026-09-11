import type { CefrLevel, SceneCategory } from '@/domain/scenes/types'

export interface LearnerProfile {
  id: string
  email?: string
  level: CefrLevel
  goals: SceneCategory[]
  dailyMinutes: 5 | 10 | 15
  onboardingCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface FavoriteExpression {
  id: string
  expression: string
  translationZh?: string
  sceneId?: string
  turnId?: string
  createdAt: string
  updatedAt: string
}

export interface LearnerSettings {
  id: 'settings'
  speechRate: number
  autoPlayAi: boolean
  feedbackExpanded: boolean
  appliedProfileStyle?: string
  appliedGoalCover?: string
  updatedAt: string
}
