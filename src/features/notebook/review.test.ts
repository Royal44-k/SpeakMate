import { describe, expect, it } from 'vitest'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import { reviewCompletion } from './review'
describe('self-assessed review scheduling', () => {
  it('advances remember through1/3/7/14/30days, keeps vague, resets forgot and retries the same event', async () => {
    const repo = createMemoryRepositories()
    const profile = await repo.profiles.ensureGuestProfile()
    const note = await repo.notebook.save({
      id: 'review-note',
      profileId: profile.id,
      kind: 'word',
      text: 'blocker',
      normalizedText: '',
      notes: '',
      tags: [],
      sources: [],
      favoriteIds: [],
      createdAt: '2026-09-11T00:00:00.000Z',
      updatedAt: '2026-09-11T00:00:00.000Z',
    })
    for (const [i, days] of [1, 3, 7, 14, 30, 30].entries()) {
      const head = await repo.learning.getReviewSchedule(note.id)
      const completion = reviewCompletion(
        note,
        'remember',
        head,
        `review-${i}`,
        `2026-09-${11 + i}T00:00:00.000Z`,
      )
      expect(completion.review.intervalDays).toBe(days)
      await repo.learning.recordEvent(completion.event, () => ({
        review: completion.review,
      }))
      expect(
        (
          await repo.learning.recordEvent(completion.event, () => {
            throw Error('must not rerun')
          })
        ).applied,
      ).toBe(false)
    }
    const head = await repo.learning.getReviewSchedule(note.id)
    expect(
      reviewCompletion(note, 'vague', head, 'vague', '2026-09-18T00:00:00.000Z')
        .review.intervalDays,
    ).toBe(30)
    const forgot = reviewCompletion(
      note,
      'forgot',
      head,
      'forgot',
      '2026-09-18T00:00:00.000Z',
    )
    expect(forgot.review).toMatchObject({
      scheduleStep: 0,
      intervalDays: 1,
      nextReviewAt: '2026-09-19T00:00:00.000Z',
      previousReviewId: 'review-5',
    })
    expect((await repo.learning.getState(profile.id)).pointsLedger).toEqual([])
  })
})
