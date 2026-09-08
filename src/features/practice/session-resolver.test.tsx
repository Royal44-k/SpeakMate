import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import { adaptScene } from '@/domain/scenes/adapt-scene'
import { getSceneBySlug } from '@/content/scenes/catalog'

import { SessionResolver } from './session-resolver'

vi.mock('./practice-stage', () => ({
  PracticeStage: ({
    scene,
    sessionId,
    completed = false,
    exitHref,
  }: {
    scene: { slug: string; level: string }
    sessionId: string
    completed?: boolean
    exitHref?: string
  }) => (
    <div>{`${sessionId}:${scene.slug}:${scene.level}:${completed ? 'completed' : 'active'}:${exitHref ?? ''}`}</div>
  ),
}))

describe('SessionResolver', () => {
  it('restores the stored scene version and level instead of trusting the URL', async () => {
    const repositories = createMemoryRepositories()
    const profile = await repositories.profiles.ensureGuestProfile()
    await repositories.sessions.save({
      id: 'saved-session',
      profileId: profile.id,
      sceneId: 'work-06',
      sceneVersion: 1,
      level: 'C1',
      status: 'active',
      startedAt: '2026-09-03T09:00:00.000Z',
      updatedAt: '2026-09-03T09:05:00.000Z',
      completedGoals: [],
    })

    render(
      <SessionResolver
        requestedId="saved-session"
        queryScene="hotel-check-in"
        queryLevel="A1"
        repositories={repositories}
      />,
    )

    expect(
      await screen.findByText(
        'saved-session:job-interview:C1:active:/scenes/job-interview?level=C1',
      ),
    ).toBeVisible()
  })

  it('rejects a saved session whose exact scene version is unavailable', async () => {
    const repositories = createMemoryRepositories()
    const profile = await repositories.profiles.ensureGuestProfile()
    await repositories.sessions.save({
      id: 'future-session',
      profileId: profile.id,
      sceneId: 'work-06',
      sceneVersion: 99,
      level: 'B2',
      status: 'active',
      startedAt: '2026-09-03T09:00:00.000Z',
      updatedAt: '2026-09-03T09:05:00.000Z',
      completedGoals: [],
    })

    render(
      <SessionResolver
        requestedId="future-session"
        repositories={repositories}
      />,
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '暂时无法恢复这次练习',
    )
    const title = screen.getByRole('heading', {
      level: 1,
      name: '暂时无法恢复这次练习',
    })
    expect(title).toHaveAttribute('data-page-title')
    expect(title).toHaveAttribute('tabindex', '-1')
  })

  it('restores an immutable scene snapshot when the catalog version is no longer present', async () => {
    const repositories = createMemoryRepositories()
    const profile = await repositories.profiles.ensureGuestProfile()
    const snapshot = {
      ...adaptScene(getSceneBySlug('hotel-check-in')!, 'B2'),
      version: 99,
    }
    await repositories.sessions.save({
      id: 'snapshot-session',
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

    render(
      <SessionResolver
        requestedId="snapshot-session"
        repositories={repositories}
      />,
    )

    expect(
      await screen.findByText(
        'snapshot-session:hotel-check-in:B2:active:/scenes/hotel-check-in?level=B2',
      ),
    ).toBeVisible()
  })

  it('removes the old stage immediately while a different session is resolving', async () => {
    const repositories = createMemoryRepositories()
    const profile = await repositories.profiles.ensureGuestProfile()
    await repositories.sessions.save({
      id: 'first-session',
      profileId: profile.id,
      sceneId: 'travel-01',
      sceneVersion: 1,
      level: 'B1',
      status: 'active',
      startedAt: '2026-09-05T09:00:00.000Z',
      updatedAt: '2026-09-05T09:05:00.000Z',
      completedGoals: [],
    })

    let releaseSecond: (() => void) | undefined
    const originalGet = repositories.sessions.get
    repositories.sessions.get = async (id) => {
      if (id === 'second-session') {
        await new Promise<void>((resolve) => {
          releaseSecond = resolve
        })
      }
      return originalGet(id)
    }

    const view = render(
      <SessionResolver
        requestedId="first-session"
        repositories={repositories}
      />,
    )
    expect(
      await screen.findByText(
        'first-session:airport-check-in:B1:active:/scenes/airport-check-in?level=B1',
      ),
    ).toBeVisible()

    view.rerender(
      <SessionResolver
        requestedId="second-session"
        repositories={repositories}
      />,
    )

    expect(screen.queryByText(/first-session:/)).not.toBeInTheDocument()
    expect(screen.getByText('正在恢复练习…')).toBeVisible()
    releaseSecond?.()
  })

  it('keeps a persisted completed session in its report-only stage on browser forward', async () => {
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
      completedGoals: ['travel-01-goal-1'],
    })

    render(
      <SessionResolver requestedId="completed-session" repositories={repositories} />,
    )

    expect(
      await screen.findByText(
        'completed-session:airport-check-in:B1:completed:/scenes/airport-check-in?level=B1',
      ),
    ).toBeVisible()
  })

  it('carries a validated filtered-library source into the session exit route', async () => {
    render(
      <SessionResolver
        requestedId="new"
        queryScene="hotel-check-in"
        queryLevel="B1"
        queryFrom="/scenes?q=hotel&category=travel&level=B1&duration=5"
        repositories={createMemoryRepositories()}
      />,
    )

    expect(
      await screen.findByText(
        'new:hotel-check-in:B1:active:/scenes/hotel-check-in?level=B1&from=%2Fscenes%3Fq%3Dhotel%26category%3Dtravel%26level%3DB1%26duration%3D5',
      ),
    ).toBeVisible()
  })

  it('rejects a lookalike scene source when building the session exit route', async () => {
    render(
      <SessionResolver
        requestedId="new"
        queryScene="hotel-check-in"
        queryLevel="B1"
        queryFrom="/scenes-bogus?level=B1"
        repositories={createMemoryRepositories()}
      />,
    )

    expect(
      await screen.findByText(
        'new:hotel-check-in:B1:active:/scenes/hotel-check-in?level=B1',
      ),
    ).toBeVisible()
  })
})
