export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const

export type CefrLevel = (typeof CEFR_LEVELS)[number]

export const SCENE_CATEGORIES = [
  'travel',
  'dining',
  'daily',
  'work',
  'social',
  'study',
  'emergency',
] as const

export type SceneCategory = (typeof SCENE_CATEGORIES)[number]

export type LevelContent<T> = Record<CefrLevel, T>

export interface SceneGoal {
  id: string
  labelZh: string
  completionSignal: string
  completionKeywords: string[]
}

export interface LevelConstraint {
  minAiWords: number
  maxAiWords: number
  followUpStyle: string
  feedbackFocus: string
  strategy: string
  speechRate: number
}

export interface SceneImage {
  key: string
  altZh: string
  focalPoint: `${number}% ${number}%`
}

export interface SceneDefinition {
  id: string
  slug: string
  version: number
  category: SceneCategory
  titleZh: string
  titleEn: string
  summaryZh: string
  learnerRole: string
  aiRole: string
  estimatedMinutes: 3 | 5 | 8 | 10
  recommendedTurns: number
  goals: SceneGoal[]
  keywords: LevelContent<string[]>
  exampleExpressions: LevelContent<string[]>
  openingLines: LevelContent<string[]>
  constraints: LevelContent<LevelConstraint>
  safetyNote?: string
  image: SceneImage
  status: 'published' | 'archived'
}

export interface AdaptedScene extends Omit<
  SceneDefinition,
  'keywords' | 'exampleExpressions' | 'openingLines' | 'constraints'
> {
  level: CefrLevel
  keywords: string[]
  exampleExpressions: string[]
  openingLines: string[]
  constraints: LevelConstraint
}
