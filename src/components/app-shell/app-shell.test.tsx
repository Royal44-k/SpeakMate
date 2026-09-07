import { readFileSync } from 'node:fs'

import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'

import { AppShell } from './app-shell'
import { MobilePageHeader } from './mobile-page-header'
import { RouteCoordinator } from './route-coordinator'
import { SmartBackLink } from './smart-back-link'

const { navigation, routerBack } = vi.hoisted(() => ({
  navigation: { pathname: '/scenes', search: 'level=B1' },
  routerBack: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ back: routerBack }),
  useSearchParams: () => new URLSearchParams(navigation.search),
}))

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

  it('keeps three 44px navigation targets separated by an 8px gap', () => {
    const navigationStyles = readFileSync(
      'src/components/app-shell/app-shell.module.css',
      'utf8',
    )
    const tokens = readFileSync('src/styles/tokens.css', 'utf8')

    expect(navigationStyles).toMatch(
      /\.navigation\s*{[^}]*grid-template-columns:\s*repeat\(3, 1fr\);[^}]*gap:\s*8px;/s,
    )
    expect(navigationStyles).toMatch(
      /\.navigationLink,\s*\.navigationLinkActive\s*{[^}]*min-width:\s*var\(--tap-target\);[^}]*min-height:\s*52px;/s,
    )
    expect(tokens).toMatch(/--tap-target:\s*44px;/)
  })

  it('has no detectable accessibility violations in the shared shell', async () => {
    const { container } = render(
      <AppShell activeDestination="scenes">
        <h1>场景库</h1>
      </AppShell>,
    )

    expect((await axe(container)).violations).toEqual([])
  })

  it('names the mobile back link after its page heading without accessibility violations', async () => {
    const { container } = render(
      <MobilePageHeader title="隐私与数据" fallbackHref="/me" />,
    )

    expect(screen.getByRole('link', { name: '返回隐私与数据' })).toHaveAttribute(
      'href',
      '/me',
    )
    expect(screen.getByRole('heading', { name: '隐私与数据' })).toHaveAttribute(
      'data-page-title',
    )
    expect((await axe(container)).violations).toEqual([])
  })

  it('allows a long page title to wrap instead of truncating at large text sizes', () => {
    const headerStyles = readFileSync(
      'src/components/app-shell/mobile-page-header.module.css',
      'utf8',
    )

    expect(headerStyles).toMatch(
      /\.header h1\s*{[^}]*overflow-wrap:\s*anywhere;[^}]*white-space:\s*normal;/s,
    )
    expect(headerStyles).not.toMatch(/\.header h1\s*{[^}]*overflow:\s*hidden;/s)
    expect(headerStyles).not.toMatch(/\.header h1\s*{[^}]*text-overflow:/s)
  })

  it('uses browser back only when the current session has an in-app route', () => {
    window.sessionStorage.setItem(
      'speakmate-route-stack',
      JSON.stringify(['/scenes', '/scenes/hotel-check-in']),
    )
    render(<MobilePageHeader title="酒店入住" fallbackHref="/scenes" />)

    fireEvent.click(screen.getByRole('link', { name: '返回酒店入住' }))

    expect(routerBack).toHaveBeenCalledTimes(1)
  })

  it('hands an uncommitted back action to its guard callback', () => {
    const onGuardedBack = vi.fn()
    render(
      <SmartBackLink
        fallbackHref="/scenes"
        ariaLabel="返回场景"
        guardState="recording"
        onGuardedBack={onGuardedBack}
      />,
    )

    fireEvent.click(screen.getByRole('link', { name: '返回场景' }))

    expect(onGuardedBack).toHaveBeenCalledTimes(1)
  })

  it('preserves fallback navigation when a guarded state has no callback', () => {
    render(
      <SmartBackLink
        fallbackHref="/scenes"
        ariaLabel="返回场景"
        guardState="recording"
      />,
    )

    const click = new MouseEvent('click', {
      bubbles: true,
      button: 0,
      cancelable: true,
    })
    const link = screen.getByRole('link', { name: '返回场景' })
    expect(link).toHaveAttribute('href', '/scenes')
    link.removeAttribute('href')
    link.dispatchEvent(click)

    expect(click.defaultPrevented).toBe(false)
  })

  it('stores the current route and announces its new page title', () => {
    render(
      <>
        <h1 data-page-title tabIndex={-1}>
          场景库
        </h1>
        <RouteCoordinator />
      </>,
    )

    expect(window.sessionStorage.getItem('speakmate-route-stack')).toBe(
      JSON.stringify(['/scenes?level=B1']),
    )
    expect(screen.getByRole('heading', { name: '场景库' })).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('场景库')
  })

  it('moves forward-navigation focus to the page title even from a persistent control', () => {
    const { rerender } = render(
      <>
        <button type="button">持久操作</button>
        <h1 data-page-title tabIndex={-1}>
          场景库
        </h1>
        <RouteCoordinator />
      </>,
    )
    screen.getByRole('button', { name: '持久操作' }).focus()
    navigation.pathname = '/scenes/hotel-check-in'
    navigation.search = ''

    rerender(
      <>
        <button type="button">持久操作</button>
        <h1 data-page-title tabIndex={-1}>
          酒店入住
        </h1>
        <RouteCoordinator />
      </>,
    )

    expect(screen.getByRole('heading', { name: '酒店入住' })).toHaveFocus()
  })
})
