import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { vi } from 'vitest'

import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'

import { SessionReportView } from './session-report'
import { localContentProvider } from '@/content/dialogues/graded/provider'
import { createDialogue } from '@/domain/ai/graded-dialogue'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn() }),
}))

describe('SessionReportView', () => {
  it('reports partial coverage truthfully and never finishes on report open or reload', async () => {
    const repositories = createMemoryRepositories()
    const profile = await repositories.profiles.ensureGuestProfile()
    const content = await localContentProvider.load({
      sceneId: 'dining-01',
      level: 'C1',
    })
    if (content.status !== 'available') throw new Error('fixture')
    const start = createDialogue(content.pack, {
      mode: 'short',
      variantId: 'counter',
    })
    let record = (
      await repositories.practice.commit({
        kind: 'create',
        session: {
          id: 'partial-session',
          profileId: profile.id,
          sceneId: 'dining-01',
          sceneVersion: 1,
          level: 'C1',
          status: 'active',
          startedAt: '2026-09-10T00:00:00.000Z',
          updatedAt: '2026-09-10T00:00:00.000Z',
          completedGoals: [],
          openingText: start.reply,
          gradedDialogue: start.snapshot,
        },
      })
    ).record
    for (let index = 0; index < 3; index++)
      record = (
        await repositories.practice.commit({
          kind: 'advance',
          expected: record.session,
          turnId: `partial-${index}`,
          input:
            index === 0
              ? { action: 'answer', text: 'Uncollected words.' }
              : { action: 'clarify', text: '' },
          at: `2026-09-10T00:0${index + 1}:00.000Z`,
        })
      ).record
    const commit = vi.spyOn(repositories.practice, 'commit')
    const rendered = render(
      <SessionReportView
        sessionId="partial-session"
        repositories={repositories}
      />,
    )
    expect(await screen.findByText('部分结束 · 等待你确认结束')).toBeVisible()
    expect(screen.getByText('未匹配表达：1 轮')).toBeVisible()
    expect(screen.getByText('帮助或停止操作：2 轮')).toBeVisible()
    expect(screen.queryByText(/这次没有明显错误/)).not.toBeInTheDocument()
    expect(screen.queryByText('/4')).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: '返回练习并确认结束' }),
    ).toHaveAttribute('href', '/session?id=partial-session')
    rendered.unmount()
    render(
      <SessionReportView
        sessionId="partial-session"
        repositories={repositories}
      />,
    )
    await screen.findByText('部分结束 · 等待你确认结束')
    expect(commit).not.toHaveBeenCalled()
    expect(
      (await repositories.practice.read('partial-session'))?.session.status,
    ).toBe('active')
  })
  it('exposes a missing report as the focusable page title', async () => {
    render(
      <SessionReportView
        sessionId="missing-session"
        repositories={createMemoryRepositories()}
      />,
    )

    const title = await screen.findByRole('heading', {
      level: 1,
      name: '找不到这次练习',
    })
    expect(title).toHaveAttribute('data-page-title')
    expect(title).toHaveAttribute('tabindex', '-1')
  })

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

    expect(
      await screen.findByText('当时的规则反馈（非新版评估）'),
    ).toBeInTheDocument()

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
