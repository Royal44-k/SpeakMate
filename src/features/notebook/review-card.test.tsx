import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import { ReviewCard } from './review-card'
import { reviewCompletion } from './review'
it('requires reveal and explicit self-rating, retries same event, and never awards for viewing', async () => {
  const repo = createMemoryRepositories()
  const profile = await repo.profiles.ensureGuestProfile()
  const note = await repo.notebook.save({
    id: 'review',
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
  render(<ReviewCard note={note} repositories={repo} />)
  expect(screen.queryByText('blocker')).not.toBeInTheDocument()
  expect((await repo.learning.getState(profile.id)).events).toHaveLength(0)
  fireEvent.click(screen.getByRole('button', { name: '已尝试回忆，查看原文' }))
  expect(screen.getByText('blocker')).toBeInTheDocument()
  const original = repo.learning.recordEvent
  const record = vi
    .spyOn(repo.learning, 'recordEvent')
    .mockRejectedValueOnce(new Error('storage failed'))
    .mockImplementation(original)
  fireEvent.click(screen.getByRole('button', { name: '记得' }))
  await screen.findByRole('alert')
  const first = record.mock.calls[0][0]
  fireEvent.click(screen.getByRole('button', { name: '重试保存本次自评' }))
  await screen.findByText(/本次自评已保存/)
  expect(record.mock.calls[1][0]).toEqual(first)
  await waitFor(async () =>
    expect((await repo.learning.getState(profile.id)).reviews).toHaveLength(1),
  )
  expect((await repo.learning.getState(profile.id)).pointsLedger).toHaveLength(
    0,
  )
})
it('reloads a stale review head before a fresh recall instead of overwriting a concurrent chain', async () => {
  const repo = createMemoryRepositories()
  const profile = await repo.profiles.ensureGuestProfile()
  const note = await repo.notebook.save({
    id: 'review-stale',
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
  const real = repo.learning.recordEvent
  vi.spyOn(repo.learning, 'recordEvent')
    .mockImplementationOnce(async (event, derive) => {
      const other = reviewCompletion(
        note,
        'remember',
        undefined,
        'other-window',
        event.occurredAt,
      )
      await real(other.event, () => ({ review: other.review }))
      return real(event, derive)
    })
    .mockImplementation(real)
  render(<ReviewCard note={note} repositories={repo} />)
  fireEvent.click(screen.getByRole('button', { name: '已尝试回忆，查看原文' }))
  fireEvent.click(screen.getByRole('button', { name: '记得' }))
  await screen.findByText(/另一窗口已提交复习/)
  expect(screen.queryByText('blocker')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '已尝试回忆，查看原文' }))
  fireEvent.click(screen.getByRole('button', { name: '记得' }))
  await screen.findByText(/本次自评已保存/)
  expect((await repo.learning.getReviewSchedule(note.id))?.intervalDays).toBe(3)
  expect((await repo.learning.getState(profile.id)).reviews).toHaveLength(2)
})
