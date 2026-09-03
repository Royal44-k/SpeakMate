import { describe, expect, it } from 'vitest'

import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'

import { createProfileStore } from './profile-store'

describe('profile store', () => {
  it('boots directly into a reusable guest profile', async () => {
    const store = createProfileStore(createMemoryRepositories().profiles)

    expect(store.getState().status).toBe('idle')
    await store.getState().bootstrap()

    expect(store.getState().status).toBe('ready')
    expect(store.getState().profile?.id).toMatch(/^guest_/)
  })

  it('persists onboarding choices without adding an authentication requirement', async () => {
    const repositories = createMemoryRepositories()
    const store = createProfileStore(repositories.profiles)
    await store.getState().bootstrap()

    await store.getState().completeOnboarding({
      level: 'B2',
      goals: ['travel', 'work'],
      dailyMinutes: 10,
    })

    expect(await repositories.profiles.get()).toEqual(
      expect.objectContaining({
        level: 'B2',
        goals: ['travel', 'work'],
        dailyMinutes: 10,
        onboardingCompleted: true,
      }),
    )
  })
})
