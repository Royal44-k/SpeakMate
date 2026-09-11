import type {
  NotebookEntry,
  ReviewRating,
  ReviewRecord,
} from '@/domain/notebook/types'
import type { LearningEvent } from '@/domain/goals/types'
import {
  beijingDateKey,
  learningEventId,
} from '@/infrastructure/persistence/learning-repository'
export function reviewCompletion(
  note: NotebookEntry,
  rating: ReviewRating,
  previous: ReviewRecord | undefined,
  id: string,
  at: string,
): { event: LearningEvent; review: ReviewRecord } {
  const scheduleStep = (
    rating === 'forgot'
      ? 0
      : rating === 'vague'
        ? (previous?.scheduleStep ?? 0)
        : Math.min(4, (previous?.scheduleStep ?? -1) + 1)
  ) as ReviewRecord['scheduleStep']
  const intervalDays = ([1, 3, 7, 14, 30] as const)[scheduleStep]
  const nextReviewAt = new Date(
    Date.parse(at) + intervalDays * 86400000,
  ).toISOString()
  const event: LearningEvent = {
    id: '',
    type: 'review-completed',
    profileId: note.profileId,
    noteId: note.id,
    reviewId: id,
    occurredAt: at,
    dateKey: beijingDateKey(at),
  }
  event.id = learningEventId(event)
  return {
    event,
    review: {
      id,
      profileId: note.profileId,
      noteId: note.id,
      eventId: event.id,
      rating,
      reviewedAt: at,
      dateKey: event.dateKey,
      previousReviewId: previous?.id,
      scheduleStep,
      intervalDays,
      nextReviewAt,
      nextReviewDateKey: beijingDateKey(nextReviewAt),
    },
  }
}
