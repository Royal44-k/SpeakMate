import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RouteCoordinator } from './route-coordinator'
const route = vi.hoisted(() => ({
  pathname: '/scenes',
  query: 'level=C1&q=private',
}))
vi.mock('next/navigation', () => ({
  usePathname: () => route.pathname,
  useSearchParams: () => new URLSearchParams(route.query),
}))
afterEach(() => {
  sessionStorage.clear()
  vi.restoreAllMocks()
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
})
describe('minimum local route restoration', () => {
  it('never puts personal queries in its route stack', () => {
    render(<RouteCoordinator />)
    expect(sessionStorage.getItem('speakmate-route-stack')).not.toContain(
      'private',
    )
  })
  it('saves and restores bounded scroll on explicit back without title focus stealing it', () => {
    route.pathname = '/scenes'
    route.query = 'level=C1'
    sessionStorage.setItem(
      'speakmate-route-stack',
      JSON.stringify([
        '/scenes?level=C1',
        '/scenes/prepare?scene=coffee-order&level=C1',
      ]),
    )
    sessionStorage.setItem(
      'speakmate-route-scroll-v1',
      JSON.stringify([['/scenes?level=C1', 430]]),
    )
    const scroll = vi
      .spyOn(window, 'scrollTo')
      .mockImplementation((options: number | ScrollToOptions) => {
        if (typeof options === 'object')
          Object.defineProperty(window, 'scrollY', {
            configurable: true,
            value: options.top,
          })
      })
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')
    render(
      <>
        <h1 data-page-title tabIndex={-1}>
          场景库
        </h1>
        <RouteCoordinator />
      </>,
    )
    expect(scroll).toHaveBeenCalledWith({ top: 430, behavior: 'instant' })
    expect(focus).not.toHaveBeenCalled()
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 650 })
    act(() => window.dispatchEvent(new Event('pagehide')))
    expect(sessionStorage.getItem('speakmate-route-scroll-v1')).toContain('650')
  })
})
