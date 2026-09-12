import { expect, it, vi } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RewardsPage from '@/app/rewards/page'
import GuidePage from '@/app/guide/page'
import { RewardHome } from './reward-home'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import { createGoalService } from './goal-service'
import { LearningCenter } from '@/features/profile/learning-center'
import { GoalHome } from './goal-home'
vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn() }),
  usePathname: () => '/rewards',
}))
it('uses real ownership, requires explicit confirmation, applies persistently, and keeps earned total after debit', async () => {
  const repo = createMemoryRepositories(),
    user = userEvent.setup()
  for (let n = 1; n <= 10; n++) {
    const clock = () => `2026-08-${String(n).padStart(2, '0')}T01:00:00Z`,
      service = createGoalService(repo, fetch, clock),
      { plan } = await service.load()
    await service.startWarmup(plan, plan.tasks[0])
    await service.finishWarmup(
      service.warmupEvent(plan, plan.tasks[0], `reward-ui-${n}`, [
        { id: 'coffee.word.black', kind: 'starter', text: 'black coffee' },
      ]),
    )
  }
  const rendered = render(<RewardHome repositories={repo} />)
  const card = await screen.findByRole('article', { name: '深海个人卡' })
  await user.click(
    within(card).getByRole('button', { name: '兑换 · 100 积分' }),
  )
  expect(await repo.learning.balance((await repo.profiles.get())!.id)).toBe(100)
  await user.click(screen.getByRole('button', { name: '确认兑换' }))
  await screen.findByText('兑换成功，已保存到本机。')
  expect(screen.getByText('累计获得 100 · 可兑换余额 0')).toBeInTheDocument()
  await user.click(within(card).getByRole('button', { name: '应用' }))
  await waitFor(async () =>
    expect((await repo.learning.getSettings()).appliedProfileStyle).toBe(
      'profile-atlantic',
    ),
  )
  expect(within(card).getByText('正在使用')).toBeInTheDocument()
  expect(screen.getByText('示例数据，非真实好友排名')).toBeInTheDocument()
  expect(
    (await repo.exportLearnerData()).learningEvents.some(
      (e) => e.type === 'reward-redeemed',
    ),
  ).toBe(true)
  rendered.unmount()
  const profileView = render(<LearningCenter repositories={repo} />)
  await waitFor(() =>
    expect(
      profileView.container.querySelector('header[data-profile-style]'),
    ).toHaveAttribute('data-profile-style', 'profile-atlantic'),
  )
})
it('renders an actually owned complete original sheet and applies the owned cover to the real goal header', async () => {
  const repo = createMemoryRepositories(),
    user = userEvent.setup()
  for (let n = 0; n < 50; n++) {
    const at = new Date(
        Date.parse('2026-07-01T01:00:00Z') + n * 86400000,
      ).toISOString(),
      service = createGoalService(repo, fetch, () => at),
      { plan } = await service.load()
    await service.startWarmup(plan, plan.tasks[0])
    await service.finishWarmup(
      service.warmupEvent(plan, plan.tasks[0], `sheet-${n}`, [
        { id: 'coffee.word.black', kind: 'starter', text: 'black coffee' },
      ]),
    )
  }
  const profile = (await repo.profiles.get())!
  await repo.learning.redeemReward(
    profile.id,
    'cover-sky',
    '2026-09-11T01:00:00Z',
  )
  await repo.learning.applyReward(
    profile.id,
    'cover-sky',
    '2026-09-11T01:00:01Z',
  )
  await repo.learning.redeemReward(
    profile.id,
    'sheet-clarify',
    '2026-09-11T01:00:02Z',
  )
  const rendered = render(<RewardHome repositories={repo} />)
  const card = await screen.findByRole('article', { name: '把话问清楚' })
  await user.click(within(card).getByRole('button', { name: '阅读练习资料' }))
  expect(
    screen.getByText('Could you say that again, please?'),
  ).toBeInTheDocument()
  expect(
    screen.getByText('Do you mean we should meet at three?'),
  ).toBeInTheDocument()
  expect(screen.getByText(/想象朋友说了一个/)).toBeInTheDocument()
  expect(await repo.learning.balance(profile.id)).toBe(0)
  rendered.unmount()
  const goalView = render(
    <GoalHome
      repositories={repo}
      clock={() => '2026-09-11T01:00:03Z'}
      navigate={() => {}}
    />,
  )
  await waitFor(() =>
    expect(
      goalView.container.querySelector('header[data-cover]'),
    ).toHaveAttribute('data-cover', 'cover-sky'),
  )
})
it('provides actual reward and guide static route consumers', async () => {
  const rewards = render(<RewardsPage />)
  expect(
    await screen.findByRole('heading', { name: '数字奖励' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '目标' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  expect(screen.getAllByRole('main')).toHaveLength(1)
  await screen.findByRole('article', { name: '深海个人卡' })
  expect(screen.queryByRole('link', { name: '退出本次练习' })).toBeNull()
  expect(
    screen.getAllByRole('link', { name: '返回今日目标' })[0],
  ).toHaveAttribute('href', '/')
  rewards.unmount()
  render(<GuidePage />)
  expect(
    screen.getByRole('heading', { name: '本机练习指南' }),
  ).toBeInTheDocument()
  expect(screen.getByText(/每项核心任务/)).toBeInTheDocument()
})
