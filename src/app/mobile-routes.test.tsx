import { render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import NotebookPage from './notebook/page'
import GuidePage from './guide/page'
import PrivacyPage from './privacy/page'
import InstallPage from './install/page'
import AuthPage from './auth/page'
import { deleteDatabase } from '@/infrastructure/persistence/db'
vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn() }) }))
afterEach(deleteDatabase)
it('explains actual local-only privacy, recording review retention and selective history deletion', () => {
  render(<PrivacyPage />)
  expect(screen.getByText(/本版不连接云端智能、账号或自动同步/)).toBeVisible()
  expect(screen.getByText(/重试.*临时录音/)).toBeVisible()
  expect(screen.getByText(/完成凭据.*学习文字/)).toBeVisible()
  expect(screen.queryByText('同步始终可选')).not.toBeInTheDocument()
})
it('gives conditional offline installation guidance without implying cloud AI or permanent storage', () => {
  render(<InstallPage />)
  expect(screen.getByText(/公开资料.*准备/)).toBeVisible()
  expect(screen.getByText(/不保证.*永久/)).toBeVisible()
  expect(screen.queryByText(/AI 练习仍需网络/)).not.toBeInTheDocument()
})
it.each([
  ['记录簿', NotebookPage],
  ['目标', GuidePage],
  ['我的', PrivacyPage],
  ['我的', InstallPage],
  ['我的', AuthPage],
] as const)(
  'keeps its real destination functional inside the %s tab without nested main',
  async (active, Page) => {
    render(<Page />)
    const nav = screen.getByRole('navigation', { name: '主要导航' })
    expect(within(nav).getAllByRole('link')).toHaveLength(5)
    expect(within(nav).getByRole('link', { name: active })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getAllByRole('main')).toHaveLength(1)
  },
)
