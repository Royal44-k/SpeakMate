import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import { adaptScene } from '@/domain/scenes/adapt-scene'
import { getSceneBySlug } from '@/content/scenes/catalog'

import { PracticeHome } from './practice-home'

describe('PracticeHome', () => {
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
