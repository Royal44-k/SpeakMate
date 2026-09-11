import type { ReactNode } from 'react'

import { render, screen, fireEvent } from '@testing-library/react'
import { historicalIdBackup } from '../../../tests/fixtures/historical-id'
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
  it.each(['a'.repeat(121), '会话-旧记录'])(
    'keeps imported non-route ID %s visible with full readonly transcript and export',
    async (id) => {
      const repositories = createMemoryRepositories()
      repositoryState.value = repositories
      const backup = historicalIdBackup(id)
      await repositories.restoreLearnerData(
        await repositories.previewRestore(JSON.stringify(backup)),
      )
      render(<LearningCenter />)
      fireEvent.click(
        await screen.findByRole('button', { name: /在此查看保留记录/ }),
      )
      expect(
        screen.getByRole('heading', { name: '保留的练习记录（只读）' }),
      ).toBeVisible()
      expect(screen.getByText(/编号不能直接链接或从此路由续练/)).toBeVisible()
      expect(screen.getByText(backup.sessions[0].openingText)).toBeVisible()
      expect(
        screen.getByText(backup.turns[0].learnerText, {
          selector: 'p[lang="en"]',
        }),
      ).toBeVisible()
      expect(screen.getByText(backup.turns[0].aiText)).toBeVisible()
      expect(
        screen.getByRole('link', { name: '导出本机备份' }),
      ).toHaveAttribute('href', '/privacy')
      const exported = await repositories.exportLearnerData()
      expect(exported.sessions).toEqual(backup.sessions)
      expect(exported.turns).toEqual(backup.turns)
      expect(exported.favorites).toEqual(backup.favorites)
      fireEvent.click(screen.getByRole('button', { name: '返回本页列表' }))
      expect(
        screen.getByRole('button', { name: /在此查看保留记录/ }),
      ).toBeVisible()
    },
  )
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
