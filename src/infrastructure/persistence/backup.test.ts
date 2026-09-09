import { afterEach, describe, expect, it, vi } from 'vitest'
import golden from '../../../tests/fixtures/learner-export-v1.json'
import { deleteDatabase, getDatabase } from './db'
import type { ReviewRecord } from '@/domain/notebook/types'
import type { LearningEvent } from '@/domain/goals/types'
import {
  createIndexedDbRepositories,
  createMemoryRepositories,
} from './repositories'

afterEach(async () => {
  vi.restoreAllMocks()
  await deleteDatabase()
})

describe.each([
  ['memory', createMemoryRepositories],
  ['indexeddb', createIndexedDbRepositories],
] as const)('%s safe backup', (_name, create) => {
  it('merges independently saved duplicate notes without rewriting immutable event note references', async () => {
    const repository = create()
    await repository.profiles.save({
      ...golden.profile,
      level: 'C1',
      goals: ['dining', 'work'],
      dailyMinutes: 15,
    })
    await repository.favorites.save({
      ...golden.favorites[0],
      id: 'source_a',
      turnId: undefined,
    })
    const first = (await repository.notebook.list())[0]
    await repository.learning.recordEvent({
      id: 'note_event_a',
      type: 'notebook-added',
      noteId: first.id,
      profileId: golden.profile.id,
      occurredAt: '2026-09-09T00:00:00.000Z',
      dateKey: '2026-09-09',
    })
    const other = createMemoryRepositories()
    await other.profiles.save({
      ...golden.profile,
      level: 'C1',
      goals: ['dining', 'work'],
      dailyMinutes: 15,
    })
    await other.favorites.save({
      ...golden.favorites[0],
      id: 'source_b',
      turnId: undefined,
    })
    const second = (await other.notebook.list())[0]
    await other.learning.recordEvent({
      id: 'note_event_b',
      type: 'notebook-added',
      noteId: second.id,
      profileId: golden.profile.id,
      occurredAt: '2026-09-09T00:00:00.000Z',
      dateKey: '2026-09-09',
    })
    const reviewPair = (
      noteId: string,
      suffix: string,
      day: number,
      previousReviewId?: string,
    ): { event: LearningEvent; review: ReviewRecord } => ({
      event: {
        id: `review_event_${suffix}`,
        type: 'review-completed',
        profileId: golden.profile.id,
        noteId,
        reviewId: `review_${suffix}`,
        occurredAt: `2026-09-${day}T00:00:00.000Z`,
        dateKey: `2026-09-${day}`,
      },
      review: {
        id: `review_${suffix}`,
        profileId: golden.profile.id,
        noteId,
        eventId: `review_event_${suffix}`,
        rating: 'remember',
        reviewedAt: `2026-09-${day}T00:00:00.000Z`,
        dateKey: `2026-09-${day}`,
        previousReviewId,
        scheduleStep: 0,
        intervalDays: 1,
        nextReviewAt: `2026-09-${day + 1}T00:00:00.000Z`,
        nextReviewDateKey: `2026-09-${day + 1}`,
      },
    })
    const a = reviewPair(first.id, 'a', 10)
    const b = reviewPair(second.id, 'b', 11)
    await repository.learning.recordEvent(a.event, () => ({ review: a.review }))
    await other.learning.recordEvent(b.event, () => ({ review: b.review }))
    const incoming = JSON.stringify(await other.exportLearnerData())
    await repository.restoreLearnerData(
      await repository.previewRestore(incoming),
    )
    expect(await repository.notebook.list()).toHaveLength(1)
    expect((await repository.notebook.get(second.id))?.id).toBe(first.id)
    const exported = await repository.exportLearnerData()
    expect(
      exported.learningEvents.find((event) => event.id === 'note_event_b'),
    ).toMatchObject({ noteId: second.id })
    expect(exported.notebook[0].sources).toHaveLength(2)
    await repository.restoreLearnerData(
      await repository.previewRestore(incoming),
    )
    expect((await repository.exportLearnerData()).learningEvents).toHaveLength(
      4,
    )
    expect(await repository.learning.listReviews(first.id)).toEqual(
      await repository.learning.listReviews(second.id),
    )
    expect(
      (await repository.learning.listReviews(first.id)).map(
        (review) => review.id,
      ),
    ).toEqual(['review_a', 'review_b'])
    expect((await repository.learning.getReviewSchedule(second.id))?.id).toBe(
      'review_b',
    )
    const stale = reviewPair(first.id, 'stale', 12, 'review_a')
    await expect(
      repository.learning.recordEvent(stale.event, () => ({
        review: stale.review,
      })),
    ).rejects.toThrow('REVIEW_SCHEDULE_STALE')
    const next = reviewPair(
      first.id,
      'next',
      12,
      (await repository.learning.getReviewSchedule(first.id))!.id,
    )
    await repository.learning.recordEvent(next.event, () => ({
      review: next.review,
    }))
    const immutable = (await repository.exportLearnerData()).learningEvents
    await repository.notebook.remove(second.id, '2026-09-13T00:00:00.000Z')
    await repository.notebook.restore(second.id, '2026-09-14T00:00:00.000Z')
    expect((await repository.exportLearnerData()).learningEvents).toEqual(
      immutable,
    )
    const roundTrip = createMemoryRepositories()
    await roundTrip.restoreLearnerData(
      await roundTrip.previewRestore(
        JSON.stringify(await repository.exportLearnerData()),
      ),
    )
    expect(await roundTrip.learning.listReviews(second.id)).toHaveLength(3)
    expect(
      (await roundTrip.learning.getReviewSchedule(first.id))?.previousReviewId,
    ).toBe('review_b')
  })

  it.each(['canonical', 'shared'] as const)(
    'rejects %s notebook alias collisions without writes',
    async (collision) => {
      const repository = create()
      await repository.restoreLearnerData(
        await repository.previewRestore(JSON.stringify(golden)),
      )
      const data = await repository.exportLearnerData()
      const first = data.notebook[0]
      const second = {
        ...first,
        id: 'different_note',
        text: 'Different sentence',
        normalizedText: 'different sentence',
        favoriteIds: [],
        sources: [],
        aliasIds: [collision === 'canonical' ? first.id : 'shared_alias'],
      }
      if (collision === 'shared') first.aliasIds = ['shared_alias']
      await expect(
        repository.previewRestore(
          JSON.stringify({ ...data, notebook: [first, second] }),
        ),
      ).rejects.toThrow('NOTE_ALIAS_CONFLICT')
      expect(await repository.notebook.list()).toHaveLength(1)
    },
  )

  it('previews golden v1 without writes, restores exact settings and notes, and repeats idempotently as v2', async () => {
    const repository = create()
    expect(repository.previewRestore).toBeTypeOf('function')
    const preview = await repository.previewRestore(JSON.stringify(golden))
    expect(preview.canImport).toBe(true)
    expect(preview.counts.sessions.added).toBe(1)
    expect(await repository.profiles.get()).toBeUndefined()
    await repository.restoreLearnerData(preview)
    const data = await repository.exportLearnerData()
    expect(data.schemaVersion).toBe(2)
    expect(data.profile).toMatchObject({
      level: 'C1',
      dailyMinutes: 15,
      goals: ['dining', 'work'],
    })
    expect(data.settings).toMatchObject({
      speechRate: 0.85,
      autoPlayAi: false,
      feedbackExpanded: true,
    })
    expect(data.notebook).toHaveLength(1)
    await repository.restoreLearnerData(
      await repository.previewRestore(JSON.stringify(data)),
    )
    expect((await repository.exportLearnerData()).notebook).toHaveLength(1)
    await repository.notebook.remove(
      data.notebook[0].id,
      '2026-09-09T00:00:00.000Z',
    )
    const oldRestore = await repository.restoreLearnerData(
      await repository.previewRestore(JSON.stringify(golden)),
    )
    expect(oldRestore.counts.favorites.added).toBe(0)
    expect(await repository.notebook.list()).toEqual([])
    expect(await repository.favorites.list()).toEqual([])
  })

  it.each([
    ['malformed JSON', '{'],
    [
      'invalid level',
      JSON.stringify({
        ...golden,
        profile: { ...golden.profile, level: 'C2' },
      }),
    ],
    [
      'invalid date',
      JSON.stringify({ ...golden, exportedAt: '2026-02-30T00:00:00.000Z' }),
    ],
    [
      'blank ID',
      JSON.stringify({
        ...golden,
        sessions: [{ ...golden.sessions[0], id: '' }],
      }),
    ],
    [
      'duplicate IDs',
      JSON.stringify({
        ...golden,
        sessions: [golden.sessions[0], golden.sessions[0]],
      }),
    ],
    [
      'broken session',
      JSON.stringify({
        ...golden,
        turns: [{ ...golden.turns[0], sessionId: 'absent' }],
      }),
    ],
    ['audio extra', JSON.stringify({ ...golden, audio: 'private recording' })],
    [
      'long text',
      JSON.stringify({
        ...golden,
        favorites: [{ ...golden.favorites[0], expression: 'x'.repeat(20_001) }],
      }),
    ],
    [
      'too many records',
      JSON.stringify({
        ...golden,
        turns: Array.from({ length: 50_001 }, () => ({})),
      }),
    ],
  ])('rejects %s without changing existing data', async (_label, text) => {
    const repository = create()
    expect(repository.previewRestore).toBeTypeOf('function')
    const profile = await repository.profiles.ensureGuestProfile()
    await expect(repository.previewRestore(text)).rejects.toThrow()
    expect(await repository.profiles.get()).toEqual(profile)
  })

  it('requires refreshing a stale preview and does not trust a forged preview', async () => {
    const repository = create()
    expect(repository.previewRestore).toBeTypeOf('function')
    const preview = await repository.previewRestore(JSON.stringify(golden))
    await repository.profiles.ensureGuestProfile()
    await expect(repository.restoreLearnerData(preview)).rejects.toThrow(
      'PREVIEW_STALE',
    )
    await expect(repository.restoreLearnerData({ ...preview })).rejects.toThrow(
      'PREVIEW_INVALID',
    )
    expect(await repository.sessions.list()).toEqual([])
  })

  it('discloses missing-profile recovery, preserves HTML as text, and rejects oversized input/invalid writes', async () => {
    const repository = create()
    const withoutProfile = {
      ...golden,
      profile: undefined,
      favorites: [
        { ...golden.favorites[0], expression: '<img src=x onerror=alert(1)>' },
      ],
    }
    const preview = await repository.previewRestore(
      JSON.stringify(withoutProfile),
    )
    expect(preview.warnings.join(' ')).toContain('缺少')
    await repository.restoreLearnerData(preview)
    expect((await repository.profiles.get())?.id).toBe(
      'guest_migration_fixture',
    )
    expect((await repository.notebook.list())[0].text).toBe(
      '<img src=x onerror=alert(1)>',
    )
    await expect(
      repository.previewRestore(' '.repeat(10 * 1024 * 1024 + 1)),
    ).rejects.toThrow('BACKUP_TOO_LARGE')
    await expect(
      repository.sessions.save({
        ...golden.sessions[0],
        level: 'C1',
        status: 'active',
        openingText: 'x'.repeat(20_001),
      }),
    ).rejects.toThrow()
  })

  it('round-trips archived historical snapshots and source notes after history deletion', async () => {
    const repository = create()
    await repository.restoreLearnerData(
      await repository.previewRestore(JSON.stringify(golden)),
    )
    const data = await repository.exportLearnerData()
    const session = data.sessions[0]
    session.sceneVersion = 17
    session.sceneSnapshot = {
      id: session.sceneId,
      slug: 'historical-coffee',
      version: 17,
      level: 'C1',
      category: 'dining',
      titleZh: '旧版点单',
      titleEn: 'Historical coffee',
      summaryZh: '保留历史',
      learnerRole: 'Customer',
      aiRole: 'Barista',
      estimatedMinutes: 5,
      recommendedTurns: 20,
      goals: [
        {
          id: 'historical-goal',
          labelZh: '说明要求',
          completionSignal: 'request',
          completionKeywords: ['coffee'],
        },
      ],
      keywords: ['coffee'],
      exampleExpressions: ['Could I order?'],
      openingLines: ['What can I get you?'],
      constraints: {
        minAiWords: 12,
        maxAiWords: 120,
        followUpStyle: 'historic',
        feedbackFocus: 'register',
        strategy: 'historic',
        speechRate: 1.06,
      },
      image: { key: 'old-image', altZh: '咖啡', focalPoint: '50% 45%' },
      status: 'archived',
    }
    session.updatedAt = '2026-09-09T00:00:00.000Z'
    data.turns[0].feedback!.tags = ['collocation']
    // Fresh adapter avoids a same-timestamp conflicting historical edit.
    const target = createMemoryRepositories()
    await target.restoreLearnerData(
      await target.previewRestore(JSON.stringify(data)),
    )
    expect(
      (await target.exportLearnerData()).sessions[0].sceneSnapshot?.constraints
        .maxAiWords,
    ).toBe(120)
    const noHistory = {
      ...data,
      sessions: [],
      turns: [],
      learningEvents: [
        {
          id: 'historical_completion',
          type: 'session-completed',
          profileId: data.profile!.id,
          sessionId: session.id,
          occurredAt: '2026-09-09T00:00:00.000Z',
          dateKey: '2026-09-09',
        },
      ],
    }
    const recovered = createMemoryRepositories()
    await recovered.restoreLearnerData(
      await recovered.previewRestore(JSON.stringify(noHistory)),
    )
    expect(
      (await recovered.exportLearnerData()).notebook[0].sources[0].learnerText,
    ).toContain('oat-milk latte')
    expect((await recovered.exportLearnerData()).learningEvents).toHaveLength(1)
  })
})

it('rolls back every restore store after a mid-write storage failure and can retry', async () => {
  const repository = createIndexedDbRepositories()
  const preview = await repository.previewRestore(JSON.stringify(golden))
  const original = IDBObjectStore.prototype.put
  const failing = vi
    .spyOn(IDBObjectStore.prototype, 'put')
    .mockImplementation(function (this: IDBObjectStore, value, key) {
      if (this.name === 'notebook')
        throw new DOMException('no space', 'QuotaExceededError')
      return original.call(this, value, key)
    })
  await expect(repository.restoreLearnerData(preview)).rejects.toThrow(
    'no space',
  )
  expect(await repository.profiles.get()).toBeUndefined()
  expect(await repository.sessions.list()).toEqual([])
  expect(await (await getDatabase()).getAll('favorites')).toEqual([])
  failing.mockRestore()
  await repository.restoreLearnerData(preview)
  expect(await repository.notebook.list()).toHaveLength(1)
})

it('visibly refuses an unusable export when legacy raw storage contains oversized data', async () => {
  const repository = createIndexedDbRepositories()
  await repository.restoreLearnerData(
    await repository.previewRestore(JSON.stringify(golden)),
  )
  await (
    await getDatabase()
  ).put('sessions', {
    ...golden.sessions[0],
    level: 'C1',
    status: 'active',
    openingText: 'x'.repeat(20_001),
  })
  await expect(repository.exportLearnerData()).rejects.toThrow()
})
