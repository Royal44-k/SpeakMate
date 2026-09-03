import { describe, expect, it } from 'vitest'

import { SCENE_CATALOG } from '@/content/scenes/catalog'
import type { LearnerProfile } from '@/domain/learning/types'
import type { PracticeSession } from '@/domain/practice/types'

import { recommendScene } from './recommendation'

const profile: LearnerProfile = {
  id: 'guest_01',
  level: 'B1',
  goals: ['travel'],
  dailyMinutes: 5,
  onboardingCompleted: true,
  createdAt: '2026-09-03T08:00:00.000Z',
  updatedAt: '2026-09-03T08:00:00.000Z',
}

describe('recommendScene', () => {
  it('starts a new learner with a scene matching their primary goal', () => {
    expect(recommendScene(profile, SCENE_CATALOG, [])?.category).toBe('travel')
  })

  it('returns the scene from an unfinished session before proposing something new', () => {
    const session = sessionFixture({ sceneId: 'work-03', status: 'active' })

    expect(recommendScene(profile, SCENE_CATALOG, [session])?.id).toBe('work-03')
  })

  it('avoids the most recently completed scene when alternatives exist', () => {
    const latest = sessionFixture({
      sceneId: 'travel-01',
      status: 'completed',
      completedAt: '2026-09-03T09:10:00.000Z',
      updatedAt: '2026-09-03T09:10:00.000Z',
    })

    expect(recommendScene(profile, SCENE_CATALOG, [latest])?.id).not.toBe(
      'travel-01',
    )
  })
})

function sessionFixture(overrides: Partial<PracticeSession>): PracticeSession {
  return {
    id: 'session_01',
    profileId: 'guest_01',
    sceneId: 'travel-01',
    sceneVersion: 1,
    level: 'B1',
    status: 'active',
    startedAt: '2026-09-03T09:00:00.000Z',
    updatedAt: '2026-09-03T09:00:00.000Z',
    completedGoals: [],
    ...overrides,
  }
}
