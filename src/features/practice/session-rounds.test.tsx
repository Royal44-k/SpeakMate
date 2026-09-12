import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { localContentProvider } from '@/content/dialogues/graded/provider'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import { SessionResolver } from './session-resolver'
import { deleteDatabase } from '@/infrastructure/persistence/db'
import { createDialogue } from '@/domain/ai/graded-dialogue'
import {
  goalFixture,
  sceneCandidate,
  simulationCandidate,
  exhaust,
  goalAt,
} from '@/infrastructure/persistence/goal-fixtures'
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }))
vi.mock('@/content/public-category', async (original) => ({
  ...(await original<typeof import('@/content/public-category')>()),
  publicContentProvider: () => localContentProvider,
}))
afterEach(deleteDatabase)

it.each(['scene-stop', 'scene-finish', 'simulation-stop'])(
  'consumes the actual fixed %s next link as unbound free practice',
  async (entry) => {
    const repo = createMemoryRepositories()
    const { plan } = await goalFixture(repo)
    const candidate = entry.startsWith('simulation')
      ? await simulationCandidate(repo, plan)
      : { session: await sceneCandidate(plan), material: undefined }
    let saved = (
      await repo.practice.commit({
        kind: 'create',
        session: candidate.session,
        ...(candidate.material
          ? { simulationMaterial: candidate.material }
          : {}),
        taskLaunch: {
          planId: plan.id,
          taskId: plan.tasks[candidate.material ? 2 : 1].id,
        },
      })
    ).record.session
    if (candidate.material) {
      for (const kind of ['recall', 'compose'] as const)
        saved = (
          await repo.practice.commit({
            kind,
            expected: saved,
            text: 'My actual saved expression',
            at: goalAt(kind === 'recall' ? 20 : 21),
          })
        ).record.session
    }
    if (entry === 'scene-finish') saved = await exhaust(repo, saved, 30)
    saved = (
      await repo.practice.commit({
        kind: entry === 'scene-finish' ? 'finish' : 'stop',
        expected: saved,
        at: goalAt(100),
      })
    ).record.session
    const beforePlan = await repo.learning.getDailyPlan(
      plan.profileId,
      plan.dateKey,
    )
    const stage = render(
      <SessionResolver requestedId={saved.id} repositories={repo} />,
    )
    const link = await screen.findByRole('link', {
      name: entry === 'scene-finish' ? '再练一轮新对话' : '开启新一轮',
    })
    const url = new URL(link.getAttribute('href')!, 'http://localhost')
    stage.unmount()
    render(
      <SessionResolver
        requestedId={url.searchParams.get('id')!}
        queryRound={url.searchParams.get('round') ?? undefined}
        queryScene={url.searchParams.get('scene') ?? undefined}
        queryLevel={url.searchParams.get('level') ?? undefined}
        queryMode={url.searchParams.get('mode') ?? undefined}
        repositories={repo}
      />,
    )
    await screen.findByRole('button', { name: '停止本次练习' })
    const next = (await repo.sessions.list()).find(
      (session) => session.id !== saved.id,
    )!
    expect(next.provenance).toBeUndefined()
    expect(next.simulation).toBeUndefined()
    expect(next.gradedDialogue!.state.variantId).toBe(
      next.gradedDialogue!.pack.variants[0].id,
    )
    expect(await repo.sessions.get(saved.id)).toEqual(saved)
    expect(
      await repo.learning.getDailyPlan(plan.profileId, plan.dateKey),
    ).toEqual(beforePlan)
  },
)

it.each(['scene', 'simulation'])(
  'restores fixed %s material and source despite conflicting new-round options',
  async (kind) => {
    const repo = createMemoryRepositories()
    const { plan } = await goalFixture(repo)
    const candidate =
      kind === 'simulation'
        ? await simulationCandidate(repo, plan)
        : { session: await sceneCandidate(plan), material: undefined }
    const saved = (
      await repo.practice.commit({
        kind: 'create',
        session: candidate.session,
        ...(candidate.material
          ? { simulationMaterial: candidate.material }
          : {}),
        taskLaunch: {
          planId: plan.id,
          taskId: plan.tasks[kind === 'scene' ? 1 : 2].id,
        },
      })
    ).record.session
    const beforePlan = await repo.learning.getDailyPlan(
      plan.profileId,
      plan.dateKey,
    )
    window.history.replaceState(null, '', `/session?id=${saved.id}`)
    render(
      <SessionResolver
        requestedId={saved.id}
        queryRound="missing-predecessor"
        queryScene="coffee-order"
        queryLevel="C1"
        queryMode="extended"
        repositories={repo}
        simulationOnly={kind === 'simulation'}
      />,
    )
    if (kind === 'scene')
      await screen.findByRole('button', { name: '停止本次练习' })
    else await screen.findByLabelText('我回忆的表达')
    expect(await repo.sessions.get(saved.id)).toEqual(saved)
    expect(
      await repo.learning.getDailyPlan(plan.profileId, plan.dateKey),
    ).toEqual(beforePlan)
    expect(screen.getByRole('link', { name: '退出本次练习' })).toHaveAttribute(
      'href',
      saved.provenance!.returnTo,
    )
  },
)

it.each([
  'missing',
  'foreign-profile',
  'other-scene',
  'other-level',
  'other-mode',
  'invalid-state',
])(
  'rejects a %s predecessor without creating or mutating a session',
  async (reason) => {
    const repo = createMemoryRepositories()
    const profile = await repo.profiles.ensureGuestProfile()
    const result = await localContentProvider.load({
      sceneId: 'dining-01',
      level: 'C1',
    })
    if (result.status !== 'available') throw new Error('fixture')
    const start = createDialogue(result.pack, {
      mode: 'short',
      variantId: 'counter',
    })
    if (reason !== 'missing') {
      const session = {
        id: 'prior',
        profileId: profile.id,
        sceneId: 'dining-01',
        sceneVersion: 1,
        level: 'C1' as const,
        status: 'active' as const,
        startedAt: '2026-09-10T00:00:00.000Z',
        updatedAt: '2026-09-10T00:00:00.000Z',
        completedGoals: [],
        openingText: start.reply,
        gradedDialogue: start.snapshot,
      }
      await repo.practice.commit({ kind: 'create', session })
      if (reason === 'foreign-profile')
        await repo.profiles.save({ ...profile, id: 'other-profile' })
      if (reason === 'invalid-state') {
        // Shape-valid retained backup with a progressed snapshot but absent turns is read-only recovery.
        const next = (
          await import('@/domain/ai/graded-dialogue')
        ).advanceDialogue(start.snapshot, { text: 'unlisted' })
        const backup = await repo.exportLearnerData()
        backup.sessions[0].gradedDialogue = next.snapshot
        await repo.clearLearnerData()
        await repo.restoreLearnerData(
          await repo.previewRestore(JSON.stringify(backup)),
        )
      }
    }
    const before = await repo.sessions.list()
    render(
      <SessionResolver
        requestedId="new"
        queryRound="prior"
        queryScene={
          reason === 'other-scene' ? 'hotel-check-in' : 'coffee-order'
        }
        queryLevel={reason === 'other-level' ? 'B1' : 'C1'}
        queryMode={reason === 'other-mode' ? 'standard' : 'short'}
        repositories={repo}
      />,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('上一轮')
    expect(await repo.sessions.list()).toEqual(before)
  },
)

it('pins real consecutive stage rounds to counter, planned, counter without rewriting predecessors', async () => {
  const repo = createMemoryRepositories()
  let predecessor: string | undefined
  const saved: Awaited<ReturnType<typeof repo.sessions.list>> = []
  for (const variant of ['counter', 'planned', 'counter']) {
    window.history.replaceState(
      null,
      '',
      '/session?id=new&scene=coffee-order&level=C1&mode=short',
    )
    const rendered = render(
      <SessionResolver
        requestedId="new"
        queryScene="coffee-order"
        queryLevel="C1"
        queryMode="short"
        queryRound={predecessor}
        repositories={repo}
      />,
    )
    await screen.findByRole('button', { name: '停止本次练习' })
    fireEvent.click(screen.getByRole('button', { name: '停止本次练习' }))
    await screen.findByRole('link', { name: '开启新一轮' })
    const sessions = await repo.sessions.list()
    const current = sessions.find(
      (session) => !saved.some((old) => old.id === session.id),
    )!
    expect(current.gradedDialogue?.state.variantId).toBe(variant)
    expect(
      screen.getByText(
        current.gradedDialogue!.pack.variants.find(
          (item) => item.id === variant,
        )!.situationZh,
      ),
    ).toBeVisible()
    expect(screen.getAllByText(current.openingText!).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: '开启新一轮' })).toHaveAttribute(
      'href',
      `/session?id=new&scene=coffee-order&level=C1&mode=short&round=${current.id}`,
    )
    for (const old of saved)
      expect(await repo.sessions.get(old.id)).toEqual(old)
    saved.push(current)
    predecessor = current.id
    rendered.unmount()
  }
  const before = await repo.sessions.get(predecessor!)
  render(
    <SessionResolver
      requestedId={predecessor!}
      queryRound={saved[0].id}
      queryScene="hotel-check-in"
      queryLevel="A1"
      repositories={repo}
    />,
  )
  await screen.findByRole('link', { name: '开启新一轮' })
  await waitFor(async () =>
    expect(await repo.sessions.get(predecessor!)).toEqual(before),
  )
})
