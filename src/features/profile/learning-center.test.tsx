import type { ReactNode } from 'react'

import { render, screen, fireEvent, within } from '@testing-library/react'
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
  it('shows every history row, confirms deletion, preserves saved notes and offers real undo', async () => {
    const repo = createMemoryRepositories()
    repositoryState.value = repo
    const backup = historicalIdBackup('old-history')
    await repo.restoreLearnerData(
      await repo.previewRestore(JSON.stringify(backup)),
    )
    const restored = (await repo.sessions.get('old-history'))!
    for (let index = 1; index <= 7; index++)
      await repo.sessions.save({ ...restored, id: `extra-${index}` })
    const notes = await repo.notebook.list()
    render(<LearningCenter />)
    const history = await screen.findByRole('region', { name: '完整练习历史' })
    expect(
      within(history).getAllByRole('button', { name: /删除此练习/ }),
    ).toHaveLength(8)
    fireEvent.click(
      within(history).getAllByRole('button', { name: /删除此练习/ })[0],
    )
    expect(
      screen.getByRole('heading', { name: '删除这条历史？' }),
    ).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: '取消删除' }))
    expect(
      within(history).getAllByRole('button', { name: /删除此练习/ })[0],
    ).toHaveFocus()
    expect(await repo.sessions.list()).toHaveLength(8)
    fireEvent.click(
      within(history).getAllByRole('button', { name: /删除此练习/ })[0],
    )
    fireEvent.click(screen.getByRole('button', { name: '确认删除这条历史' }))
    expect(
      await screen.findByRole('button', { name: '撤销本次删除' }),
    ).toBeVisible()
    expect(await repo.sessions.list()).toHaveLength(7)
    expect(await repo.notebook.list()).toEqual(notes)
    fireEvent.click(screen.getByRole('button', { name: '撤销本次删除' }))
    expect(await screen.findByText(/本次历史已恢复/)).toBeVisible()
    expect(await repo.sessions.list()).toHaveLength(8)
    expect(await repo.notebook.list()).toEqual(notes)
  })
  it('rejects a stale active confirmation without success or losing newer progress', async () => {
    const repo = createMemoryRepositories()
    repositoryState.value = repo
    const backup = historicalIdBackup('active-history')
    await repo.restoreLearnerData(
      await repo.previewRestore(JSON.stringify(backup)),
    )
    render(<LearningCenter />)
    fireEvent.click(await screen.findByRole('button', { name: /删除此练习/ }))
    expect(screen.getByText(/这条练习尚未结束/)).toBeVisible()
    await repo.sessions.save({
      ...(await repo.sessions.get('active-history'))!,
      updatedAt: '2026-09-12T00:00:00.000Z',
    })
    fireEvent.click(screen.getByRole('button', { name: '确认删除这条历史' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('操作未完成')
    expect(
      screen.queryByRole('button', { name: '撤销本次删除' }),
    ).not.toBeInTheDocument()
    expect((await repo.sessions.get('active-history'))?.updatedAt).toBe(
      '2026-09-12T00:00:00.000Z',
    )
  })
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
    ).toHaveAttribute('href', '/session?id=active-session&from=%2Fme')
    expect(
      screen.getByRole('link', { name: /旧版已结束记录/ }),
    ).toHaveAttribute('href', '/session/report?id=completed-session&from=%2Fme')
  })
})
