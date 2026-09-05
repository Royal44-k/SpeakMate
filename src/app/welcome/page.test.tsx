import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { LearnerProfile } from '@/domain/learning/types'

import WelcomePage from './page'

const { ensureGuestProfile, routerPush } = vi.hoisted(() => ({
  ensureGuestProfile: vi.fn(),
  routerPush: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush }),
}))

vi.mock('@/infrastructure/persistence/repositories', () => ({
  createIndexedDbRepositories: () => ({
    profiles: {
      ensureGuestProfile,
      save: vi.fn(),
    },
  }),
}))

function completedProfile(): LearnerProfile {
  return {
    id: 'guest_welcome',
    level: 'B1',
    goals: ['work'],
    dailyMinutes: 10,
    onboardingCompleted: true,
    createdAt: '2026-09-05T00:00:00.000Z',
    updatedAt: '2026-09-05T00:00:00.000Z',
  }
}

describe('WelcomePage', () => {
  it('keeps a labelled busy loading state while the guest profile is loading', () => {
    ensureGuestProfile.mockReturnValue(new Promise(() => undefined))

    render(<WelcomePage />)

    expect(screen.getByRole('main', { name: '正在准备你的练习' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('正在读取你的练习设置…')
  })

  it('prefills a completed profile and offers the return-to-practice link', async () => {
    ensureGuestProfile.mockResolvedValue(completedProfile())

    render(<WelcomePage />)

    expect(await screen.findByRole('link', { name: '返回我的练习' })).toHaveAttribute('href', '/me')
    expect(screen.getByRole('button', { name: 'B1 中级' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('explains a loading failure and retries the guest profile read', async () => {
    ensureGuestProfile.mockRejectedValueOnce(new Error('IndexedDB unavailable')).mockResolvedValueOnce(completedProfile())

    render(<WelcomePage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('无法读取本地练习设置，请重试。')
    fireEvent.click(screen.getByRole('button', { name: '重试' }))

    expect(screen.getByRole('main', { name: '正在准备你的练习' })).toHaveAttribute('aria-busy', 'true')
    expect(await screen.findByRole('link', { name: '返回我的练习' })).toBeVisible()
  })
})
