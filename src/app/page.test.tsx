import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import HomePage from './page'

describe('HomePage', () => {
  it('routes a new visitor toward the guest onboarding flow', () => {
    render(<HomePage />)

    const title = screen.getByRole('heading', {
      name: '随时开口，练真实英语',
    })
    expect(title).toBeVisible()
    expect(title).toHaveAttribute('data-page-title')
    expect(title).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('link', { name: '开始免费练习' })).toHaveAttribute(
      'href',
      '/welcome',
    )
  })
})
