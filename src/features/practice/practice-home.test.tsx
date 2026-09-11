import { render, screen, fireEvent } from '@testing-library/react'
import { historicalIdBackup } from '../../../tests/fixtures/historical-id'
import { describe, expect, it } from 'vitest'

import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import { adaptScene } from '@/domain/scenes/adapt-scene'
import { getSceneBySlug } from '@/content/scenes/catalog'

import { PracticeHome } from './practice-home'

describe('PracticeHome', () => {
  it.each(['a'.repeat(121), '会话-旧记录'])(
    'retains imported non-route ID %s with in-place full readonly access and export',
    async (id) => {
      const repositories = createMemoryRepositories()
      const backup = historicalIdBackup(id)
      await repositories.restoreLearnerData(
        await repositories.previewRestore(JSON.stringify(backup)),
      )
      render(<PracticeHome repositories={repositories} />)
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
      fireEvent.click(screen.getByText('当时的规则反馈（非新版评估）'))
      expect(
        screen.getByText(backup.turns[0].feedback.explanationZh),
      ).toBeVisible()
      expect(
        screen.getByRole('link', { name: '导出本机备份' }),
      ).toHaveAttribute('href', '/privacy')
      expect(
        screen.getByRole('link', { name: '开始新版练习' }),
      ).toHaveAttribute('href', '/scenes/prepare?scene=coffee-order&level=C1')
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
  it('exposes its asynchronous failure as the focusable page title', async () => {
    const repositories = createMemoryRepositories()
    repositories.profiles.ensureGuestProfile = async () => {
      throw new Error('IndexedDB unavailable')
    }

    render(<PracticeHome repositories={repositories} />)

    const title = await screen.findByRole('heading', {
      level: 1,
      name: '暂时无法读取练习记录',
    })
    expect(title).toHaveAttribute('data-page-title')
    expect(title).toHaveAttribute('tabindex', '-1')
  })

  it('uses the saved profile and preserves old active practice as readonly history', async () => {
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
    expect(screen.getByRole('link', { name: /查看旧版记录/ })).toHaveAttribute(
      'href',
      '/session?id=session_resume',
    )
  })

  it('does not force a new launch to an old snapshot level', async () => {
    const repositories = createMemoryRepositories()
    const profile = await repositories.profiles.ensureGuestProfile()
    const snapshot = {
      ...adaptScene(getSceneBySlug('hotel-check-in')!, 'B2'),
      version: 7,
    }
    await repositories.profiles.save({
      ...profile,
      level: 'A1',
      goals: ['study'],
      onboardingCompleted: true,
    })
    await repositories.sessions.save({
      id: 'older-version-session',
      profileId: profile.id,
      sceneId: snapshot.id,
      sceneVersion: snapshot.version,
      sceneSnapshot: snapshot,
      level: snapshot.level,
      status: 'active',
      startedAt: '2026-09-04T09:00:00.000Z',
      updatedAt: '2026-09-04T09:05:00.000Z',
      completedGoals: [],
    })

    render(<PracticeHome repositories={repositories} />)

    expect(
      await screen.findByRole('heading', { name: '酒店入住' }),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: /查看旧版记录/ })).toHaveAttribute(
      'href',
      '/session?id=older-version-session',
    )
    expect(screen.getByRole('link', { name: /准备开始/ })).toHaveAttribute(
      'href',
      '/scenes/prepare?scene=hotel-check-in&level=A1',
    )
    expect(
      screen.queryByRole('link', { name: /继续本次对话/ }),
    ).not.toBeInTheDocument()
  })
})
