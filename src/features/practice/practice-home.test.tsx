import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'

import { PracticeHome } from './practice-home'

describe('PracticeHome', () => {
  it('uses the saved level, duration, goal and recoverable session', async () => {
    const repositories = createMemoryRepositories()
    const profile = await repositories.profiles.ensureGuestProfile()
    await repositories.profiles.save({
      ...profile,
      level: 'C1',
      goals: ['work'],
      dailyMinutes: 15,
      onboardingCompleted: true,
    })
    await repositories.sessions.save({
      id: 'session_resume',
      profileId: profile.id,
      sceneId: 'work-06',
      sceneVersion: 1,
      level: 'C1',
      status: 'active',
      startedAt: '2026-09-03T09:00:00.000Z',
      updatedAt: '2026-09-03T09:05:00.000Z',
      completedGoals: [],
    })

    render(<PracticeHome repositories={repositories} />)

    expect(await screen.findByText('今天，开口说 15 分钟')).toBeVisible()
    expect(screen.getByText('C1')).toBeVisible()
    expect(screen.getByRole('heading', { name: '求职面试' })).toBeVisible()
    expect(screen.getByRole('link', { name: /继续本次对话/ })).toHaveAttribute(
      'href',
      '/session/session_resume?scene=job-interview&level=C1',
    )
  })
})
