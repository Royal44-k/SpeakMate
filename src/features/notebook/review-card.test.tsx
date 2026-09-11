import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import { ReviewCard } from './review-card'
import { reviewCompletion } from './review'
import { localLearningAssistant } from '@/content/analysis/provider'
it('distinguishes same-scene meanings locally without revealing either answer', async () => {
  const repo = createMemoryRepositories()
  const profile = await repo.profiles.ensureGuestProfile()
  for (const [id, text] of [
    ['one', 'black'],
    ['two', 'receipt'],
  ]) {
    const note = await repo.notebook.save({
      id,
      text,
      profileId: profile.id,
      kind: 'word',
      normalizedText: '',
      notes: '',
      tags: [],
      favoriteIds: [],
      sources: [
        {
          id: `source-${id}`,
          kind: 'scene',
          sceneId: 'dining-01',
          sceneTitleZh: '咖啡点单',
          level: 'A1',
          originalText: text,
          createdAt: '2026-09-11T00:00:00.000Z',
        },
      ],
      createdAt: '2026-09-11T00:00:00.000Z',
      updatedAt: '2026-09-11T00:00:00.000Z',
    })
    render(
      <ReviewCard
        note={note}
        repositories={repo}
        assistant={localLearningAssistant}
      />,
    )
  }
  expect(await screen.findByText(/不加奶/)).toBeVisible()
  expect(await screen.findByText(/收据/)).toBeVisible()
  expect(screen.queryByText(/black/)).not.toBeInTheDocument()
  expect(screen.queryByText(/receipt/)).not.toBeInTheDocument()
  expect((await repo.learning.getState(profile.id)).events).toHaveLength(0)
})
it('uses safely masked saved context or an honest unknown cue, never an invented definition', async () => {
  const repo = createMemoryRepositories()
  const profile = await repo.profiles.ensureGuestProfile()
  const note = await repo.notebook.save({
    id: 'unknown-cue',
    text: 'purple comet',
    profileId: profile.id,
    kind: 'phrase',
    normalizedText: '',
    notes: '',
    tags: [],
    favoriteIds: [],
    sources: [
      {
        id: 'context',
        kind: 'manual',
        originalText: 'I saw a purple comet today.',
        createdAt: '2026-09-11T00:00:00.000Z',
      },
    ],
    createdAt: '2026-09-11T00:00:00.000Z',
    updatedAt: '2026-09-11T00:00:00.000Z',
  })
  const { rerender } = render(
    <ReviewCard
      note={note}
      repositories={repo}
      assistant={localLearningAssistant}
    />,
  )
  expect(await screen.findByText(/I saw a ____ today\./)).toBeVisible()
  expect(screen.queryByText(/purple comet/)).not.toBeInTheDocument()
  rerender(
    <ReviewCard
      key="no-context"
      note={{ ...note, sources: [] }}
      repositories={repo}
      assistant={localLearningAssistant}
    />,
  )
  expect(await screen.findByText(/暂无可用的非答案提示/)).toBeVisible()
})
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
