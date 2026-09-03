import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { OnboardingFlow } from './onboarding-flow'

describe('OnboardingFlow', () => {
  it('collects level, learning goal and daily time without requesting login', () => {
    const onComplete = vi.fn()
    render(<OnboardingFlow onComplete={onComplete} />)

    expect(screen.getByRole('heading', { name: '今天想练什么？' })).toBeVisible()
    expect(screen.queryByLabelText(/邮箱/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'B1 中级' }))
    fireEvent.click(screen.getByRole('button', { name: '旅行' }))
    fireEvent.click(screen.getByRole('button', { name: '每天 5 分钟' }))
    fireEvent.click(screen.getByRole('button', { name: '开始第一次练习' }))

    expect(onComplete).toHaveBeenCalledWith({
      level: 'B1',
      goals: ['travel'],
      dailyMinutes: 5,
    })
  })

  it('offers a deterministic five-question level recommendation', () => {
    render(<OnboardingFlow />)

    fireEvent.click(screen.getByRole('button', { name: '帮我推荐水平' }))
    expect(screen.getByText('1 / 5')).toBeVisible()
    expect(screen.getByRole('button', { name: '这很像我' })).toBeVisible()
  })
})
