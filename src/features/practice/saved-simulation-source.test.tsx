import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import {
  goalFixture,
  simulationCandidate,
  goalAt,
} from '@/infrastructure/persistence/goal-fixtures'
import { StaticLearningShell } from './static-learning-shell'

const host = vi.hoisted(() => ({ repo: undefined as unknown, query: '' }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(host.query),
}))
vi.mock('@/infrastructure/persistence/repositories', async (original) => ({
  ...(await original<
    typeof import('@/infrastructure/persistence/repositories')
  >()),
  createIndexedDbRepositories: () => host.repo,
}))
afterEach(() => vi.restoreAllMocks())

it.each(['recall', 'compose', 'apply'] as const)(
  'returns a real saved simulation %s phase to the current history source while cancel preserves its draft',
  async (phase) => {
    const repo = createMemoryRepositories()
    host.repo = repo
    const { plan } = await goalFixture(repo)
    const { session, material } = await simulationCandidate(repo, plan)
    const free: Omit<typeof session, 'provenance'> & {
      provenance?: typeof session.provenance
    } = { ...session }
    delete free.provenance
    let record = (
      await repo.practice.commit({
        kind: 'create',
        session: free,
        simulationMaterial: material,
      })
    ).record
    if (phase !== 'recall')
      record = (
        await repo.practice.commit({
          kind: 'recall',
          expected: record.session,
          text: 'My saved recall',
          at: goalAt(20),
        })
      ).record
    if (phase === 'apply')
      record = (
        await repo.practice.commit({
          kind: 'compose',
          expected: record.session,
          text: 'My saved composition',
          at: goalAt(21),
        })
      ).record
    host.query = `id=${session.id}&from=%2Fme`
    window.history.replaceState(null, '', '/notebook/simulation?' + host.query)
    render(<StaticLearningShell kind="simulation" />)
    const label =
      phase === 'recall'
        ? '我回忆的表达'
        : phase === 'compose'
          ? '我的替换或造句'
          : '英文内容'
    if (phase === 'apply')
      fireEvent.click(await screen.findByRole('button', { name: /键盘/ }))
    fireEvent.change(await screen.findByLabelText(label), {
      target: { value: 'Keep my unsubmitted draft' },
    })
    expect(screen.getByRole('link', { name: '退出本次练习' })).toHaveAttribute(
      'href',
      '/me',
    )
    fireEvent.click(screen.getByRole('link', { name: '退出本次练习' }))
    expect(await screen.findByRole('alertdialog')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '继续练习' }))
    expect(screen.getByLabelText(label)).toHaveValue(
      'Keep my unsubmitted draft',
    )
    expect((await repo.practice.read(session.id))!.session).toEqual(
      record.session,
    )
    expect(
      screen.getByRole('link', { name: '返回词句或记录簿' }),
    ).toHaveAttribute('href', '/notebook/note?id=chosen-note')
  },
)

it('keeps original dated goal provenance ahead of current source in the real saved simulation recall exit', async () => {
  const repo = createMemoryRepositories()
  host.repo = repo
  const { plan } = await goalFixture(repo)
  const { session, material } = await simulationCandidate(repo, plan)
  session.provenance!.returnTo = '/?date=2026-09-10&task=consolidation'
  await repo.practice.commit({
    kind: 'create',
    session,
    simulationMaterial: material,
    taskLaunch: { planId: plan.id, taskId: plan.tasks[2].id },
  })
  host.query = `id=${session.id}&from=%2Fme`
  window.history.replaceState(null, '', '/notebook/simulation?' + host.query)
  render(<StaticLearningShell kind="simulation" />)
  await screen.findByLabelText('我回忆的表达')
  expect(screen.getByRole('link', { name: '退出本次练习' })).toHaveAttribute(
    'href',
    '/?date=2026-09-10&task=consolidation',
  )
  expect(
    screen.getByRole('link', { name: '返回词句或记录簿' }),
  ).toHaveAttribute('href', '/notebook/note?id=chosen-note')
})
