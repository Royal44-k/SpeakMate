import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
const current = vi.hoisted(() => ({ repo: undefined as unknown }))
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))
vi.mock('@/infrastructure/persistence/repositories', async (original) => ({
  ...(await original<
    typeof import('@/infrastructure/persistence/repositories')
  >()),
  createIndexedDbRepositories: () => current.repo,
}))

import HomePage from './page'

describe('HomePage', () => {
  it('routes a new visitor toward guest onboarding with complete phrase units', async () => {
    current.repo = createMemoryRepositories()
    render(<HomePage />)

    const title = await screen.findByRole('heading', {
      name: /随时开口，\s*练真实英语/,
    })
    expect(title).toBeVisible()
    expect(title).toHaveAttribute('data-page-title')
    expect(title).toHaveAttribute('tabindex', '-1')
    expect(screen.getByText('随时开口，').parentElement).toBe(title)
    expect(screen.getByText('练真实英语').parentElement).toBe(title)
    expect(screen.getByText(/随时随地自在说英语！/)).toBeVisible()
    expect(screen.getByRole('link', { name: '开始练习' })).toHaveAttribute(
      'href',
      '/welcome',
    )
  })

  it('waits for local profile then shows real today tasks without replaying welcome or nesting main', async () => {
    const repo = createMemoryRepositories()
    current.repo = repo
    const profile = await repo.profiles.ensureGuestProfile()
    await repo.profiles.save({
      ...profile,
      onboardingCompleted: true,
      level: 'C1',
    })
    render(<HomePage />)
    expect(
      screen.queryByRole('link', { name: '开始练习' }),
    ).not.toBeInTheDocument()
    expect(await screen.findByText('表达热身')).toBeVisible()
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.queryByText('随时开口，')).not.toBeInTheDocument()
    expect((await repo.learning.getState(profile.id)).dailyPlans).toHaveLength(
      1,
    )
  })
})
