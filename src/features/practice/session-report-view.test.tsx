import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { vi } from 'vitest'

import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'

import { SessionReportView } from './session-report'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn() }),
}))

describe('SessionReportView', () => {
  it('offers a named return control and both explicit terminal destinations', async () => {
    const repositories = createMemoryRepositories()
    const profile = await repositories.profiles.ensureGuestProfile()
    await repositories.sessions.save({
      id: 'completed-session',
      profileId: profile.id,
      sceneId: 'travel-01',
      sceneVersion: 1,
      level: 'B1',
      status: 'completed',
      startedAt: '2026-09-05T09:00:00.000Z',
      updatedAt: '2026-09-05T09:05:00.000Z',
      completedAt: '2026-09-05T09:05:00.000Z',
      completedGoals: [],
    })

    render(
      <SessionReportView
        sessionId="completed-session"
        repositories={repositories}
      />,
    )

    expect(
      await screen.findByRole('link', { name: '返回我的练习' }),
    ).toHaveAttribute('href', '/me')
    expect(screen.getByRole('navigation', { name: '复盘后操作' })).toBeVisible()
    expect(screen.getByRole('link', { name: '回到今日练习' })).toHaveAttribute(
      'href',
      '/practice',
    )
    expect(screen.getByRole('link', { name: /换个场景/ })).toHaveAttribute(
      'href',
      '/scenes',
    )
  })
})
