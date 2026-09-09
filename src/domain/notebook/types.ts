import type { CefrLevel } from '@/domain/scenes/types'

export type NotebookKind = 'word' | 'phrase' | 'sentence'
export type ReviewRating = 'remember' | 'vague' | 'forgot'

export interface NotebookSourceSnapshot {
  id: string
  kind: 'manual' | 'favorite' | 'turn' | 'scene'
  originalText: string
  translationZh?: string
  sceneId?: string
  sceneTitleZh?: string
  level?: CefrLevel
  sessionId?: string
  turnId?: string
  learnerText?: string
  correctedText?: string
  naturalText?: string
  explanationZh?: string
  createdAt: string
}

export interface NotebookEntry {
  id: string
  aliasIds?: string[]
  profileId: string
  kind: NotebookKind
  text: string
  normalizedText: string
  translationZh?: string
  notes: string
  tags: string[]
  sources: NotebookSourceSnapshot[]
  favoriteIds: string[]
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface ReviewRecord {
  id: string
  profileId: string
  noteId: string
  eventId: string
  rating: ReviewRating
  reviewedAt: string
  dateKey: string
  previousReviewId?: string
  scheduleStep: 0 | 1 | 2 | 3 | 4
  intervalDays: 1 | 3 | 7 | 14 | 30
  nextReviewAt: string
  nextReviewDateKey: string
}
