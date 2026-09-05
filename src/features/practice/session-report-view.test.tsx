import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('announces a saved expression after its favorite is persisted', async () => {
    const repositories = createMemoryRepositories()
    const profile = await repositories.profiles.ensureGuestProfile()
    const expression = 'Could you tell me when breakfast starts?'
    await repositories.sessions.save({
      id: 'favorite-session',
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
    await repositories.turns.save({
      id: 'favorite-turn',
      sessionId: 'favorite-session',
      index: 0,
      learnerText: expression,
      aiText: 'Breakfast starts at seven.',
      feedback: {
        corrected: expression,
        natural: expression,
        explanationZh: '表达清楚。',
        tags: [],
      },
      createdAt: '2026-09-05T09:01:00.000Z',
    })

    const user = userEvent.setup()
    render(
      <SessionReportView
        sessionId="favorite-session"
        repositories={repositories}
      />,
    )

    await user.click(
      await screen.findByRole('button', { name: `收藏表达：${expression}` }),
    )

    await waitFor(async () => {
      expect(
        screen.getByRole('button', { name: `已收藏表达：${expression}` }),
      ).toBeDisabled()
      expect(await repositories.favorites.list()).toEqual([
        expect.objectContaining({ expression }),
      ])
    })
  })
})
