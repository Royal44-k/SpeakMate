import type { AdaptedScene } from '@/domain/scenes/types'

export type FeedbackIssueTag =
  | 'grammar'
  | 'vocabulary'
  | 'register'
  | 'clarity'
  | 'strategy'

export interface ConversationHistoryItem {
  speaker: 'ai' | 'learner'
  text: string
}

export interface ConversationInput {
  scene: AdaptedScene
  learnerText: string
  history: ConversationHistoryItem[]
  completedGoalIds: string[]
  turnIndex: number
}

export interface ConversationResult {
  reply: {
    text: string
    hintZh: string
    emotion: 'neutral' | 'warm' | 'firm' | 'curious'
  }
  feedback: {
    heard: string
    corrected: string | null
    naturalAlternative: string | null
    explanationZh: string
    issueTags: FeedbackIssueTag[]
  }
  progress: {
    completedGoalIds: string[]
    shouldOfferCompletion: boolean
  }
  provider: 'cloudflare' | 'local'
  degraded: boolean
}

export interface ConversationProvider {
  readonly kind: 'cloudflare' | 'local'
  nextTurn(input: ConversationInput, signal?: AbortSignal): Promise<ConversationResult>
}
