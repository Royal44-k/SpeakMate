import { act, render, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouteCoordinator } from './route-coordinator'
import {
  visitRoute,
  prepareRouteNavigation,
  commitPendingNavigation,
  readRouteHistory,
} from './navigation-history'
function returningFrom(...routes: string[]) {
  for (const href of routes) {
    history.replaceState(null, '')
    visitRoute(href)
  }
  prepareRouteNavigation(routes[0], 'return', false)
  commitPendingNavigation()
  history.replaceState(null, '')
}
beforeEach(() => history.replaceState(null, ''))
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
  it('commits an explicit slow document return only on pagehide and clears canceled or unrelated intent', async () => {
    route.pathname = '/session/report'
    route.query = 'id=B'
    const view = render(
      <>
        <h1 data-page-title tabIndex={-1}>
          报告
        </h1>
        <a data-return-to-source href="/notebook">
          返回来源
        </a>
        <a href="/notebook">普通入口</a>
        <RouteCoordinator />
      </>,
    )
    // After the production document listener: prevent jsdom's unsupported document navigation only.
    const prevent = (event: MouseEvent) => event.preventDefault()
    window.addEventListener('click', prevent)
    try {
      fireEvent.click(view.getByText('返回来源'))
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5))
      })
      expect(readRouteHistory().pending).toBeUndefined()
      fireEvent(window, new Event('pagehide'))
      expect(readRouteHistory().pending?.target).toBe('/notebook')
      fireEvent(
        window,
        new PageTransitionEvent('pageshow', { persisted: true }),
      )
      expect(readRouteHistory().pending).toBeUndefined()
      fireEvent.click(view.getByText('返回来源'))
      const blocked = new Event('beforeunload', { cancelable: true })
      blocked.preventDefault()
      await act(async () => {
        window.dispatchEvent(blocked)
      })
      fireEvent(window, new Event('pagehide'))
      expect(readRouteHistory().pending).toBeUndefined()
      fireEvent.click(view.getByText('返回来源'))
      fireEvent.click(view.getByText('普通入口'))
      fireEvent(window, new Event('pagehide'))
      expect(readRouteHistory().pending).toBeUndefined()
    } finally {
      window.removeEventListener('click', prevent)
    }
  })
  it('restores the original source control after async list loading without moving saved scroll', async () => {
    route.pathname = '/notebook'
    route.query = ''
    sessionStorage.setItem(
      'speakmate-route-stack',
      JSON.stringify(['/notebook', '/notebook/note?id=A']),
    )
    sessionStorage.setItem(
      'speakmate-route-scroll-v1',
      JSON.stringify([['/notebook', 430, '/notebook/note?id=A']]),
    )
    returningFrom('/notebook', '/notebook/note?id=A')
    const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        value: 430,
      })
    })
    const view = render(
      <>
        <div />
        <RouteCoordinator />
      </>,
    )
    await act(async () =>
      view.rerender(
        <>
          <div>
            <a href="/notebook/note?id=A">原词句</a>
          </div>
          <RouteCoordinator />
        </>,
      ),
    )
    expect(document.activeElement?.textContent).toBe('原词句')
    expect(scroll).toHaveBeenCalledWith({ top: 430, behavior: 'instant' })
  })
  it('stops delayed page-title focus when the learner interacts first', async () => {
    route.pathname = '/scenes'
    route.query = ''
    const view = render(
      <>
        <div>
          <button>筛选</button>
        </div>
        <RouteCoordinator />
      </>,
    )
    const button = document.querySelector('button')!
    act(() => {
      button.focus()
      window.dispatchEvent(new Event('keydown'))
    })
    await act(async () =>
      view.rerender(
        <>
          <div>
            <button>筛选</button>
            <h1 data-page-title tabIndex={-1}>
              场景
            </h1>
          </div>
          <RouteCoordinator />
        </>,
      ),
    )
    expect(document.activeElement).toBe(button)
  })
  it.each(['getItem', 'setItem'] as const)(
    'does not abort rendering or scrolling when sessionStorage.%s is denied',
    (method) => {
      vi.spyOn(Storage.prototype, method).mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError')
      })
      expect(() => render(<RouteCoordinator />)).not.toThrow()
      expect(() =>
        act(() => window.dispatchEvent(new Event('scroll'))),
      ).not.toThrow()
    },
  )
  it('restores an explicit return across multiple detail records instead of treating it as forward', () => {
    route.pathname = '/notebook'
    route.query = ''
    sessionStorage.setItem(
      'speakmate-route-stack',
      JSON.stringify([
        '/notebook',
        '/notebook/note?id=A',
        '/notebook/simulation?id=B',
        '/session/report?id=B',
      ]),
    )
    sessionStorage.setItem(
      'speakmate-route-scroll-v1',
      JSON.stringify([['/notebook', 650]]),
    )
    returningFrom(
      '/notebook',
      '/notebook/note?id=A',
      '/notebook/simulation?id=B',
      '/session/report?id=B',
    )
    const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')
    render(
      <>
        <h1 data-page-title tabIndex={-1}>
          记录簿
        </h1>
        <RouteCoordinator />
      </>,
    )
    expect(scroll).toHaveBeenCalledWith({ top: 650, behavior: 'instant' })
    expect(focus).not.toHaveBeenCalled()
  })
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
      JSON.stringify([
        ['/notebook', 50],
        ['/scenes?level=C1', 430],
      ]),
    )
    returningFrom(
      '/scenes?level=C1',
      '/scenes/prepare?scene=coffee-order&level=C1',
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
    expect(
      JSON.parse(sessionStorage.getItem('speakmate-route-scroll-v1')!)[0],
    ).toEqual(['/notebook', 50])
  })
  it('restores explicit source then native Back and Forward without collapsing real entries or stale forward focus', () => {
    const scroll = vi
      .spyOn(window, 'scrollTo')
      .mockImplementation((options: number | ScrollToOptions) => {
        if (typeof options === 'object')
          Object.defineProperty(window, 'scrollY', {
            configurable: true,
            value: options.top,
          })
      })
    const show = () => (
      <>
        <h1 data-page-title tabIndex={-1}>
          {route.pathname}
        </h1>
        <a href="/notebook/note?id=A">source control</a>
        <RouteCoordinator />
      </>
    )
    route.pathname = '/notebook'
    route.query = ''
    const view = render(show())
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 650 })
    document.querySelector('a')!.focus()
    act(() => window.dispatchEvent(new Event('pagehide')))
    for (const [pathname, query] of [
      ['/notebook/note', 'id=A'],
      ['/notebook/simulation', 'id=B'],
      ['/session/report', 'id=B'],
    ]) {
      history.replaceState(null, '')
      route.pathname = pathname
      route.query = query
      view.rerender(show())
    }
    const reportState = history.state
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 280 })
    act(() => window.dispatchEvent(new Event('pagehide')))
    prepareRouteNavigation('/notebook', 'return', false)
    act(() => window.dispatchEvent(new Event('pagehide')))
    history.replaceState(null, '')
    route.pathname = '/notebook'
    route.query = ''
    view.rerender(show())
    const sourceState = history.state
    expect(readRouteHistory().entries).toHaveLength(5)
    expect(scroll).toHaveBeenLastCalledWith({ top: 650, behavior: 'instant' })
    expect(document.activeElement?.textContent).toBe('source control')
    history.replaceState(reportState, '')
    route.pathname = '/session/report'
    route.query = 'id=B'
    act(() =>
      window.dispatchEvent(
        new PopStateEvent('popstate', { state: reportState }),
      ),
    )
    view.rerender(show())
    expect(readRouteHistory().cursor).toBe(3)
    expect(scroll).toHaveBeenLastCalledWith({ top: 280, behavior: 'instant' })
    history.replaceState(sourceState, '')
    route.pathname = '/notebook'
    route.query = ''
    act(() =>
      window.dispatchEvent(
        new PopStateEvent('popstate', { state: sourceState }),
      ),
    )
    view.rerender(show())
    expect(readRouteHistory().cursor).toBe(4)
    // A fresh ordinary visit to the earlier report URL must focus its new title.
    history.replaceState(null, '')
    route.pathname = '/session/report'
    route.query = 'id=B'
    view.rerender(show())
    expect(document.activeElement?.tagName).toBe('H1')
    expect(readRouteHistory().entries).toHaveLength(6)
  })
})
