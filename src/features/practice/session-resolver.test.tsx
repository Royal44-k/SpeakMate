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
  }: {
    scene: { slug: string; level: string }
    sessionId: string
  }) => <div>{`${sessionId}:${scene.slug}:${scene.level}`}</div>,
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
      await screen.findByText('saved-session:job-interview:C1'),
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
      await screen.findByText('snapshot-session:hotel-check-in:B2'),
    ).toBeVisible()
  })
})
