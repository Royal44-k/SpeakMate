import { beforeEach, describe, expect, it } from 'vitest'

import type { PracticeSession, PracticeTurn } from '@/domain/practice/types'

import { createIndexedDbRepositories, createMemoryRepositories } from './repositories'

describe('guest-first repository contracts', () => {
  let repositories: ReturnType<typeof createMemoryRepositories>

  beforeEach(() => {
    repositories = createMemoryRepositories()
  })

  it('creates one durable guest profile without requesting personal information', async () => {
    const first = await repositories.profiles.ensureGuestProfile()
    const second = await repositories.profiles.ensureGuestProfile()

    expect(first.id).toMatch(/^guest_/)
    expect(second).toEqual(first)
    expect(first.email).toBeUndefined()
    expect(first.onboardingCompleted).toBe(false)
  })

  it('recovers only the most recently updated active session', async () => {
    const older = sessionFixture({ id: 'session_old', updatedAt: '2026-09-03T08:00:00.000Z' })
    const active = sessionFixture({ id: 'session_new', updatedAt: '2026-09-03T09:00:00.000Z' })

    await repositories.sessions.save(older)
    await repositories.sessions.save(active)

    expect(await repositories.sessions.findRecoverable()).toEqual(active)

    await repositories.sessions.save({
      ...active,
      status: 'completed',
      completedAt: '2026-09-03T09:05:00.000Z',
    })

    expect(await repositories.sessions.findRecoverable()).toEqual(older)
  })

  it('stores transcripts and feedback but exposes no audio persistence surface', async () => {
    const turn: PracticeTurn = {
      id: 'turn_01',
      sessionId: 'session_01',
      index: 0,
      learnerText: 'I have a reservation under Li.',
      aiText: 'Welcome, Mr Li. May I see your passport?',
      feedback: {
        corrected: 'I have a reservation under the name Li.',
        natural: 'I have a booking under Li.',
        explanationZh: 'under the name 是酒店场景中更完整的说法。',
        tags: ['collocation'],
      },
      createdAt: '2026-09-03T09:01:00.000Z',
    }

    await repositories.turns.save(turn)

    expect(await repositories.turns.listBySession('session_01')).toEqual([turn])
    expect('audio' in repositories).toBe(false)
  })

  it('atomically saves an idempotent turn with its session progress', async () => {
    const session = sessionFixture()
    const turn: PracticeTurn = {
      id: `${session.id}:turn:0`,
      sessionId: session.id,
      index: 0,
      learnerText: 'I have a reservation.',
      aiText: 'May I see your passport?',
      createdAt: session.updatedAt,
    }

    await repositories.saveTurnAndSession(turn, session)
    await repositories.saveTurnAndSession(
      { ...turn, aiText: 'Could I see your passport?' },
      { ...session, completedGoals: ['hotel-check-in-goal-1'] },
    )

    expect(await repositories.turns.listBySession(session.id)).toEqual([
      { ...turn, aiText: 'Could I see your passport?' },
    ])
    expect(await repositories.sessions.get(session.id)).toMatchObject({
      completedGoals: ['hotel-check-in-goal-1'],
    })
  })

  it('exports versioned learner data and clears every local collection', async () => {
    await repositories.profiles.ensureGuestProfile()
    await repositories.sessions.save(sessionFixture())

    const exported = await repositories.exportLearnerData()

    expect(exported.schemaVersion).toBe(1)
    expect(exported.sessions).toHaveLength(1)
    expect(JSON.stringify(exported)).not.toContain('audio')

    await repositories.clearLearnerData()
    expect((await repositories.exportLearnerData()).sessions).toHaveLength(0)
    expect(await repositories.profiles.get()).toBeUndefined()
  })
})

describe('IndexedDB repository transactions', () => {
  it('clears data without deleting the database or waiting on other open tabs', async () => {
    const repositories = createIndexedDbRepositories()
    await repositories.clearLearnerData()
    const profile = await repositories.profiles.ensureGuestProfile()
    const session = sessionFixture({ profileId: profile.id })
    const turn: PracticeTurn = {
      id: `${session.id}:turn:0`,
      sessionId: session.id,
      index: 0,
      learnerText: 'Hello.',
      aiText: 'Welcome.',
      createdAt: session.updatedAt,
    }
    await repositories.saveTurnAndSession(turn, session)

    await repositories.clearLearnerData()

    expect(await repositories.profiles.get()).toBeUndefined()
    expect(await repositories.sessions.list()).toEqual([])
    expect(await repositories.turns.list()).toEqual([])
  })
})

function sessionFixture(
  overrides: Partial<PracticeSession> = {},
): PracticeSession {
  return {
    id: 'session_01',
    profileId: 'guest_01',
    sceneId: 'travel-05',
    sceneVersion: 1,
    level: 'B1',
    status: 'active',
    startedAt: '2026-09-03T09:00:00.000Z',
    updatedAt: '2026-09-03T09:00:00.000Z',
    completedGoals: [],
    ...overrides,
  }
}
