import { afterEach, expect, it, vi } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GoalHome } from './goal-home'
import {
  createMemoryRepositories,
  createIndexedDbRepositories,
} from '@/infrastructure/persistence/repositories'
import { deleteDatabase } from '@/infrastructure/persistence/db'
import { createGoalService } from './goal-service'
import { GET } from '@/app/content/v1/[category]/route'
import { GoalHomeRoute } from './goal-home-route'
import { SessionReportView } from '@/features/practice/session-report'
import {
  goalFixture,
  sceneCandidate,
  simulationCandidate,
  exhaust,
  goalAt,
} from '@/infrastructure/persistence/goal-fixtures'
const { query } = vi.hoisted(() => ({ query: { value: '' } }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(query.value),
}))
const clock = () => '2026-09-11T01:00:00Z'
afterEach(async () => {
  vi.restoreAllMocks()
  query.value = ''
  await deleteDatabase()
})
const fetcher: typeof fetch = async (input) =>
  GET(new Request('https://local.test' + String(input)), {
    params: Promise.resolve({ category: String(input).split('/').at(-1)! }),
  })
it.each([
  ['memory', 'scene'],
  ['memory', 'consolidation'],
  ['indexeddb', 'scene'],
  ['indexeddb', 'consolidation'],
] as const)(
  'reopens an explicitly stopped %s %s task as a new fixed run and genuinely settles once',
  async (adapter, slot) => {
    const repo =
      adapter === 'memory'
        ? createMemoryRepositories()
        : createIndexedDbRepositories()
    const { plan } = await goalFixture(repo),
      index = slot === 'scene' ? 1 : 2
    const service = createGoalService(repo, fetcher, () => goalAt(20))
    if (slot === 'scene') await service.launchScene(plan, plan.tasks[index])
    else {
      const { session, material } = await simulationCandidate(repo, plan)
      await repo.practice.commit({
        kind: 'create',
        session,
        simulationMaterial: material,
        taskLaunch: { planId: plan.id, taskId: plan.tasks[index].id },
      })
    }
    const first = (await repo.sessions.list())[0]
    await repo.practice.commit({
      kind: 'stop',
      expected: first,
      at: goalAt(21),
    })
    const fixed = (await repo.learning.getDailyPlan(
      plan.profileId,
      plan.dateKey,
    ))!.tasks[index]
    const user = userEvent.setup(),
      urls: string[] = []
    render(
      <GoalHome
        repositories={repo}
        fetcher={fetcher}
        clock={() => goalAt(22)}
        date={plan.dateKey}
        navigate={(href) => {
          urls.push(href)
        }}
      />,
    )
    const retry = await screen.findByRole('button', {
      name: '重新开始固定任务',
    })
    expect(await repo.learning.balance(plan.profileId)).toBe(0)
    await user.click(retry)
    await waitFor(() => expect(urls).toHaveLength(1))
    let next = (await repo.sessions.list()).find((s) => s.id !== first.id)!
    expect(next).toBeDefined()
    expect(next.provenance).toEqual(first.provenance)
    expect(next.level).toBe(first.level)
    expect((await repo.practice.read(first.id))!.session.status).toBe(
      'abandoned',
    )
    expect(
      (await repo.learning.getDailyPlan(plan.profileId, plan.dateKey))!.tasks[
        index
      ],
    ).toEqual(fixed)
    if (slot === 'consolidation') {
      expect(next.simulation!.source).toEqual(first.simulation!.source)
      expect(next.simulation!.descriptor).toEqual(first.simulation!.descriptor)
      expect(urls[0]).toMatch(/^\/notebook\/simulation\?id=/)
      next = (
        await repo.practice.commit({
          kind: 'recall',
          expected: next,
          text: 'for example',
          at: goalAt(23),
        })
      ).record.session
      next = (
        await repo.practice.commit({
          kind: 'compose',
          expected: next,
          text: 'For example, I read every day.',
          at: goalAt(24),
        })
      ).record.session
    }
    const terminal = await exhaust(repo, next, 25)
    const finish = {
      kind: 'finish' as const,
      expected: terminal,
      at: goalAt(35),
    }
    await repo.practice.commit(finish)
    await repo.practice.commit(finish)
    expect(await repo.learning.balance(plan.profileId)).toBe(10)
    const state = await repo.learning.getState(plan.profileId)
    expect(state.pointsLedger).toHaveLength(1)
    expect(state.dailyPlans[0].tasks[index]).toMatchObject({
      target: fixed.target,
      source: fixed.source,
      status: 'completed',
      swapUsed: false,
    })
  },
)
it('rejects malformed root goal parameters without creating a plan', () => {
  query.value = 'date=2026-02-30&task=scene'
  render(<GoalHomeRoute />)
  expect(
    screen.getByText('目标入口参数无效，本机记录未修改。'),
  ).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '返回今天' })).toHaveAttribute(
    'href',
    '/',
  )
})
it('returns from an actual completed task report to its original date/card without awarding on report open', async () => {
  const repo = createMemoryRepositories(),
    { plan } = await goalFixture(repo),
    candidate = await sceneCandidate(plan)
  candidate.provenance!.returnTo = '/?date=2026-09-10&task=scene'
  await repo.practice.commit({
    kind: 'create',
    session: candidate,
    taskLaunch: { planId: plan.id, taskId: plan.tasks[1].id },
  })
  const terminal = await exhaust(repo, candidate, 4)
  await repo.practice.commit({
    kind: 'finish',
    expected: terminal,
    at: goalAt(10),
  })
  render(<SessionReportView repositories={repo} sessionId={candidate.id} />)
  const link = await screen.findByRole('link', {
    name: '返回 2026-09-10 的原任务',
  })
  expect(link).toHaveAttribute('href', '/?date=2026-09-10&task=scene')
  expect(await repo.learning.balance(plan.profileId)).toBe(10)
})
it('renders the actual zero-point plan and completes a real hidden-reference warmup only after a nonempty recall', async () => {
  const repo = createMemoryRepositories(),
    user = userEvent.setup()
  render(
    <GoalHome
      repositories={repo}
      fetcher={fetcher}
      clock={clock}
      navigate={() => {}}
    />,
  )
  await screen.findByRole('heading', { name: '今日目标' })
  expect(
    (await repo.learning.getState((await repo.profiles.get())!.id)).events,
  ).toEqual([])
  await user.click(screen.getByRole('button', { name: '准备表达热身' }))
  await screen.findByText('black', { exact: true })
  await user.click(screen.getByRole('button', { name: '隐藏参考，开始回忆' }))
  expect(screen.queryByText('black', { exact: true })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: '确认完成热身' })).toBeDisabled()
  await user.type(
    screen.getByRole('textbox', { name: '我的回忆' }),
    'I remember black coffee',
  )
  expect(screen.getByRole('button', { name: '选择巩固材料' })).toBeDisabled()
  expect(screen.getByRole('button', { name: '开始场景应用' })).toBeDisabled()
  await user.click(screen.getByRole('button', { name: '确认完成热身' }))
  await waitFor(async () =>
    expect(await repo.learning.balance((await repo.profiles.get())!.id)).toBe(
      10,
    ),
  )
  expect(screen.getByText('热身已完成，已保存这次回忆。')).toBeInTheDocument()
})
it('commits the selected real session and task start before its direct safe URL is navigated', async () => {
  const repo = createMemoryRepositories(),
    user = userEvent.setup(),
    observed: { href: string; started: boolean }[] = []
  const navigate = async (href: string) => {
    const profile = (await repo.profiles.get())!
    const plan = (await repo.learning.getDailyPlan(profile.id, '2026-09-11'))!
    observed.push({ href, started: plan.tasks[1].status === 'started' })
  }
  render(
    <GoalHome
      repositories={repo}
      fetcher={fetcher}
      clock={clock}
      navigate={navigate}
    />,
  )
  await screen.findByRole('heading', { name: '今日目标' })
  await user.click(screen.getByRole('button', { name: '开始场景应用' }))
  await waitFor(() => expect(observed).toHaveLength(1))
  expect(observed[0].started).toBe(true)
  expect(observed[0].href).toMatch(/^\/session\?id=goal-session_/)
  const session = (await repo.sessions.list())[0]
  expect(session.provenance).toMatchObject({
    planDate: '2026-09-11',
    returnTo: '/?date=2026-09-11&task=scene',
  })
})
it('keeps unavailable public material distinct from starting/completing and exposes an explicit retry', async () => {
  const repo = createMemoryRepositories(),
    user = userEvent.setup()
  render(
    <GoalHome
      repositories={repo}
      fetcher={async () => new Response('offline', { status: 503 })}
      clock={clock}
      navigate={() => {}}
    />,
  )
  await screen.findByRole('heading', { name: '今日目标' })
  await user.click(screen.getByRole('button', { name: '准备表达热身' }))
  await screen.findByRole('alert')
  expect(
    within(screen.getByRole('alert')).getByText(/资料/),
  ).toBeInTheDocument()
  const state = await repo.learning.getState((await repo.profiles.get())!.id)
  expect(state.dailyPlans[0].tasks[0].status).toBe('not-started')
  expect(state.events).toEqual([])
})
it('shows the supported fallback before recording, preserves the real note after failed launch, and retries the original task', async () => {
  const repo = createMemoryRepositories(),
    user = userEvent.setup(),
    navigated: string[] = []
  render(
    <GoalHome
      repositories={repo}
      fetcher={fetcher}
      clock={clock}
      navigate={(href) => {
        navigated.push(href)
      }}
    />,
  )
  await screen.findByRole('heading', { name: '今日目标' })
  await user.click(screen.getByRole('button', { name: '选择巩固材料' }))
  await user.click(screen.getByRole('button', { name: '查看校审备用词句' }))
  await screen.findByText('black', { exact: true })
  expect(await repo.notebook.list()).toEqual([])
  await user.click(
    screen.getByRole('button', { name: '记录这条校审词句并用于任务' }),
  )
  await screen.findByRole('button', { name: '开始这次定向练习' })
  const commit = vi
    .spyOn(repo.practice, 'commit')
    .mockRejectedValueOnce(new Error('quota'))
  await user.click(screen.getByRole('button', { name: '开始这次定向练习' }))
  await screen.findByText(/词句已保存，练习尚未开始/)
  expect(await repo.notebook.list()).toHaveLength(1)
  expect(await repo.sessions.list()).toEqual([])
  const profile = (await repo.profiles.get())!
  expect(
    (await repo.learning.getDailyPlan(profile.id, '2026-09-11'))!.tasks[2]
      .status,
  ).toBe('not-started')
  await user.click(screen.getByRole('button', { name: '重试' }))
  await waitFor(() => expect(navigated).toHaveLength(1))
  expect(commit.mock.calls[0][0]).toEqual(commit.mock.calls[1][0])
  expect(
    (await repo.learning.getDailyPlan(profile.id, '2026-09-11'))!.tasks[2],
  ).toMatchObject({ status: 'started', swapUsed: false })
})
