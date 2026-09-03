import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'

import { AppShell } from './app-shell'

describe('AppShell', () => {
  it('keeps three primary destinations reachable with the current page announced', () => {
    render(<AppShell activeDestination="practice">content</AppShell>)

    expect(screen.getByRole('navigation', { name: '主要导航' })).toBeVisible()
    expect(screen.getByRole('link', { name: '练习' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getAllByRole('link')).toHaveLength(3)
  })

  it('has no detectable accessibility violations in the shared shell', async () => {
    const { container } = render(
      <AppShell activeDestination="scenes">
        <h1>场景库</h1>
      </AppShell>,
    )

    expect((await axe(container)).violations).toEqual([])
  })
})
