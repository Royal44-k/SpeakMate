import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { OnboardingFlow } from './onboarding-flow'

describe('OnboardingFlow', () => {
  it('keeps displayed choices fixed while an asynchronous save is pending', () => {
    render(<OnboardingFlow onComplete={() => new Promise(() => {})} />)
    fireEvent.click(screen.getByRole('button', { name: 'C1 高级' }))
    fireEvent.click(screen.getByRole('button', { name: '职场' }))
    fireEvent.click(screen.getByRole('button', { name: '开始第一次练习' }))
    expect(screen.getByRole('button', { name: '每天 10 分钟' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: '返回选择首要目标' }),
    ).toBeDisabled()
  })
  it('saves edited settings with an honest failure and keeps the chosen level for retry', async () => {
    const save = vi
      .fn()
      .mockRejectedValueOnce(new Error('quota'))
      .mockResolvedValue(undefined)
    render(
      <OnboardingFlow
        returnHref="/me"
        onComplete={save}
        initialChoices={{ level: 'A2', goals: ['work'], dailyMinutes: 10 }}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'C1 高级' }))
    fireEvent.click(screen.getByRole('button', { name: '职场' }))
    fireEvent.click(screen.getByRole('button', { name: '保存设置' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('未保存')
    fireEvent.click(screen.getByRole('button', { name: '保存设置' }))
    expect(save).toHaveBeenLastCalledWith({
      level: 'C1',
      goals: ['work'],
      dailyMinutes: 10,
    })
  })
  it('collects level, learning goal and daily time without requesting login', () => {
    const onComplete = vi.fn()
    render(<OnboardingFlow onComplete={onComplete} />)

    expect(
      screen.getByRole('heading', { name: '今天想练什么？' }),
    ).toBeVisible()
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

  it('keeps step back inside the flow and exposes selected choices semantically', () => {
    render(<OnboardingFlow />)

    fireEvent.click(screen.getByRole('button', { name: 'B1 中级' }))

    expect(
      screen.getByRole('button', { name: '返回选择英语水平' }),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: '旅行' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    fireEvent.click(screen.getByRole('button', { name: '返回选择英语水平' }))

    expect(screen.getByRole('heading', { name: '选择英语水平' })).toBeVisible()
  })

  it('shows the app-level return link only on the first step when editing settings', () => {
    render(<OnboardingFlow returnHref="/me" />)

    expect(screen.getByRole('link', { name: '返回我的练习' })).toHaveAttribute(
      'href',
      '/me',
    )

    fireEvent.click(screen.getByRole('button', { name: 'B1 中级' }))

    expect(
      screen.queryByRole('link', { name: '返回我的练习' }),
    ).not.toBeInTheDocument()
  })

  it('omits an app back action on the first step for first-run onboarding', () => {
    render(<OnboardingFlow />)

    expect(
      screen.queryByRole('link', { name: '返回我的练习' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /返回/ }),
    ).not.toBeInTheDocument()
  })

  it('prefills every settings choice and exposes each selection with aria-pressed', () => {
    render(
      <OnboardingFlow
        returnHref="/me"
        initialChoices={{
          level: 'B2',
          goals: ['work'],
          dailyMinutes: 15,
        }}
      />,
    )

    expect(screen.getByRole('button', { name: 'B2 中高级' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    fireEvent.click(screen.getByRole('button', { name: 'B2 中高级' }))
    expect(screen.getByRole('button', { name: '职场' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    fireEvent.click(screen.getByRole('button', { name: '职场' }))
    expect(
      screen.getByRole('button', { name: '每天 15 分钟' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('does not advance again when a confirmed goal is tapped after stepping back', () => {
    render(<OnboardingFlow />)

    fireEvent.click(screen.getByRole('button', { name: 'B1 中级' }))
    fireEvent.click(screen.getByRole('button', { name: '旅行' }))
    fireEvent.click(screen.getByRole('button', { name: '返回选择首要目标' }))
    fireEvent.click(screen.getByRole('button', { name: '旅行' }))

    expect(screen.getByRole('heading', { name: '选择首要目标' })).toBeVisible()
  })

  it('allows a new learner to confirm the default level once', () => {
    render(<OnboardingFlow />)

    fireEvent.click(screen.getByRole('button', { name: 'A2 基础' }))

    expect(screen.getByRole('heading', { name: '选择首要目标' })).toBeVisible()
  })

  it('allows a saved level to be confirmed once without advancing after a step back', () => {
    render(
      <OnboardingFlow
        initialChoices={{ level: 'B1', goals: ['work'], dailyMinutes: 10 }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'B1 中级' }))
    expect(screen.getByRole('heading', { name: '选择首要目标' })).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: '返回选择英语水平' }))
    fireEvent.click(screen.getByRole('button', { name: 'B1 中级' }))

    expect(screen.getByRole('heading', { name: '选择英语水平' })).toBeVisible()
  })
})
