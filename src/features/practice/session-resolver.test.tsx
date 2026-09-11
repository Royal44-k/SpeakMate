import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import { localContentProvider } from '@/content/dialogues/graded/provider'
import { createDialogue } from '@/domain/ai/graded-dialogue'
import { adaptScene } from '@/domain/scenes/adapt-scene'
import { getSceneBySlug } from '@/content/scenes/catalog'
import { SessionResolver } from './session-resolver'
vi.mock('./practice-stage', () => ({
  PracticeStage: ({
    scene,
    sessionId,
    completed,
    exitHref,
  }: {
    scene: { slug: string; level: string; mode: string }
    sessionId: string
    completed?: boolean
    exitHref?: string
  }) => (
    <div>{`${sessionId}:${scene.slug}:${scene.level}:${scene.mode}:${completed ? 'completed' : 'active'}:${exitHref}`}</div>
  ),
}))
const loader = vi.hoisted(() => vi.fn())
vi.mock('@/content/public-category', () => ({
  publicContentProvider: () => ({ load: loader }),
}))
afterEach(() => {
  vi.restoreAllMocks()
  loader.mockReset()
})
async function graded(id: string, repositories = createMemoryRepositories()) {
  const profile = await repositories.profiles.ensureGuestProfile()
  const result = await localContentProvider.load({
    sceneId: 'dining-01',
    level: 'C1',
  })
  if (result.status !== 'available') throw new Error('fixture')
  const start = createDialogue(result.pack, {
    mode: 'short',
    variantId: 'counter',
  })
  const record = await repositories.practice.commit({
    kind: 'create',
    session: {
      id,
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
  return { repositories, record: record.record, pack: result.pack }
}
describe('SessionResolver pinned and historical resolution', () => {
  it('restores pinned level/mode without catalog substitution or category fetch', async () => {
    const { repositories } = await graded('saved')
    render(
      <SessionResolver
        requestedId="saved"
        queryScene="hotel-check-in"
        queryLevel="A1"
        queryMode="extended"
        repositories={repositories}
      />,
    )
    expect(
      await screen.findByText(
        'saved:coffee-order:C1:short:active:/scenes/prepare?scene=coffee-order&level=C1&mode=short',
      ),
    ).toBeVisible()
    expect(loader).not.toHaveBeenCalled()
  })
  it('preserves an old unknown-version transcript read-only and offers explicit new practice', async () => {
    const repositories = createMemoryRepositories()
    const profile = await repositories.profiles.ensureGuestProfile()
    const snapshot = {
      ...adaptScene(getSceneBySlug('hotel-check-in')!, 'B2'),
      version: 99,
      titleZh: '当时的酒店标题',
    }
    await repositories.sessions.save({
      id: 'old',
      profileId: profile.id,
      sceneId: snapshot.id,
      sceneVersion: 99,
      sceneSnapshot: snapshot,
      level: 'B2',
      status: 'active',
      startedAt: '2026-09-10T00:00:00.000Z',
      updatedAt: '2026-09-10T00:01:00.000Z',
      completedGoals: [],
      openingText: 'Old opening.',
    })
    await repositories.turns.save({
      id: 'old-turn',
      sessionId: 'old',
      index: 0,
      learnerText: 'My old words.',
      aiText: 'Saved reply.',
      createdAt: '2026-09-10T00:01:00.000Z',
    })
    render(<SessionResolver requestedId="old" repositories={repositories} />)
    expect(await screen.findByText('旧版练习记录（只读）')).toBeVisible()
    expect(screen.getByText('当时的酒店标题')).toBeVisible()
    expect(screen.getByText('My old words.')).toBeVisible()
    expect(screen.getByText('Saved reply.')).toBeVisible()
    expect(screen.getByRole('link', { name: '开始新版练习' })).toHaveAttribute(
      'href',
      '/scenes/prepare?scene=hotel-check-in&level=B2',
    )
    expect(loader).not.toHaveBeenCalled()
    expect((await repositories.sessions.get('old'))?.status).toBe('active')
  })
  it('removes A immediately while B resolves and does not create a missing B', async () => {
    const { repositories } = await graded('first')
    const original = repositories.practice.read
    let release!: () => void
    repositories.practice.read = async (id) => {
      if (id === 'second')
        await new Promise<void>((resolve) => {
          release = resolve
        })
      return original(id)
    }
    const rendered = render(
      <SessionResolver requestedId="first" repositories={repositories} />,
    )
    await screen.findByText(/^first:coffee/)
    rendered.rerender(
      <SessionResolver requestedId="second" repositories={repositories} />,
    )
    expect(screen.queryByText(/^first:/)).not.toBeInTheDocument()
    expect(screen.getByText('正在恢复练习…')).toBeVisible()
    release()
    expect(await screen.findByRole('alert')).toHaveTextContent('记录不存在')
    expect(await repositories.sessions.list()).toHaveLength(1)
  })
  it('loads the explicit new selection and removes personal q from return source', async () => {
    const { pack } = await graded('fixture')
    loader.mockResolvedValue({ status: 'available', pack })
    render(
      <SessionResolver
        requestedId="new"
        queryScene="coffee-order"
        queryLevel="C1"
        queryMode="extended"
        queryFrom="/scenes?q=private&category=dining&level=C1"
        repositories={createMemoryRepositories()}
      />,
    )
    expect(
      await screen.findByText(
        'new:coffee-order:C1:extended:active:/scenes/prepare?scene=coffee-order&level=C1&mode=extended&from=%2Fscenes%3Flevel%3DC1%26category%3Ddining',
      ),
    ).toBeVisible()
    expect(loader).toHaveBeenCalledWith({ sceneId: 'dining-01', level: 'C1' })
  })
  it('fails unavailable packs visibly and retries without substituting another pack', async () => {
    loader.mockRejectedValue(new Error('download unavailable'))
    const repositories = createMemoryRepositories()
    render(
      <SessionResolver
        requestedId="new"
        queryScene="coffee-order"
        queryLevel="C1"
        repositories={repositories}
      />,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('下载')
    expect(screen.getByRole('button', { name: '重试读取' })).toBeEnabled()
    await waitFor(async () =>
      expect(await repositories.sessions.list()).toHaveLength(0),
    )
  })
})
