import type { ReactNode } from 'react'

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'

import { LearningCenter } from './learning-center'

const repositoryState = vi.hoisted(() => ({ value: undefined as unknown }))

vi.mock('@/components/app-shell/app-shell', () => ({
  AppShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock(
  '@/infrastructure/persistence/repositories',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('@/infrastructure/persistence/repositories')
    >()),
    createIndexedDbRepositories: () => repositoryState.value,
  }),
)

describe('LearningCenter session routes', () => {
  it('labels old active records readonly and uses canonical completed reports', async () => {
    const repositories = createMemoryRepositories()
    repositoryState.value = repositories
    const profile = await repositories.profiles.ensureGuestProfile()
    await repositories.sessions.save({
      id: 'active-session',
      profileId: profile.id,
      sceneId: 'travel-01',
      sceneVersion: 1,
      level: 'B1',
      status: 'active',
      startedAt: '2026-09-05T09:00:00.000Z',
      updatedAt: '2026-09-05T09:05:00.000Z',
      completedGoals: [],
    })
    await repositories.sessions.save({
      id: 'completed-session',
      profileId: profile.id,
      sceneId: 'travel-01',
      sceneVersion: 1,
      level: 'B1',
      status: 'completed',
      startedAt: '2026-09-05T08:00:00.000Z',
      updatedAt: '2026-09-05T08:05:00.000Z',
      completedAt: '2026-09-05T08:05:00.000Z',
      completedGoals: [],
    })

    render(<LearningCenter />)

    expect(
      await screen.findByRole('link', { name: /旧版未结束记录/ }),
    ).toHaveAttribute('href', '/session?id=active-session')
    expect(
      screen.getByRole('link', { name: /旧版已结束记录/ }),
    ).toHaveAttribute('href', '/session/report?id=completed-session')
  })
})
