import { act, render, fireEvent } from '@testing-library/react'
import {
  createContext,
  useContext,
  useState,
  startTransition,
  Suspense,
} from 'react'
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
const HookRoute = createContext<{ pathname: string; query: string } | null>(
  null,
)
vi.mock('next/navigation', () => ({
  usePathname: () => useContext(HookRoute)?.pathname ?? route.pathname,
  useSearchParams: () =>
    new URLSearchParams(useContext(HookRoute)?.query ?? route.query),
}))
afterEach(() => {
  sessionStorage.clear()
  vi.restoreAllMocks()
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
})
describe('minimum local route restoration', () => {
  it.each([
    'external',
    'target',
    'download',
    'modifier',
    'prevented',
    'entry-change',
    'traversal',
    'pageshow',
  ] as const)(
    'does not capture an ineligible or invalidated unfocused source: %s',
    (boundary) => {
      route.pathname = '/notebook'
      route.query = ''
      history.replaceState(null, '', '/notebook')
      const view = render(
        <>
          <RouteCoordinator />
          <a href="/notebook/note?id=A">A</a>
        </>,
      )
      const link = view.getByText('A')
      const entryId = history.state.__speakmateRouteEntry
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        value: 650,
      })
      if (boundary === 'external')
        link.setAttribute('href', 'https://example.invalid/')
      if (boundary === 'target') link.setAttribute('target', 'another-window')
      if (boundary === 'download') link.setAttribute('download', '')
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        metaKey: boundary === 'modifier',
      })
      Object.defineProperty(event, 'target', { value: link })
      if (boundary === 'prevented') event.preventDefault()
      fireEvent(document, event)
      if (boundary === 'entry-change')
        history.replaceState(
          { ...history.state, __speakmateRouteEntry: 'different-entry' },
          '',
        )
      if (boundary === 'traversal')
        fireEvent(
          window,
          new PopStateEvent('popstate', { state: history.state }),
        )
      if (boundary === 'pageshow')
        fireEvent(
          window,
          new PageTransitionEvent('pageshow', { persisted: true }),
        )
      fireEvent(window, new Event('pagehide'))
      expect(
        JSON.parse(sessionStorage.getItem('speakmate-route-scroll-v1')!),
      ).toContainEqual(['/notebook', 650, '', entryId])
    },
  )
  it.each([
    'pagehide',
    'late-cancel',
    'pointer',
    'key',
    'wheel',
    'next-click',
  ] as const)(
    'captures an unfocused clicked source only for its allowed current-entry navigation: %s',
    (boundary) => {
      route.pathname = '/notebook'
      route.query = ''
      history.replaceState(null, '', '/notebook')
      const view = render(
        <>
          <RouteCoordinator />
          <a href="/notebook/note?id=A">A</a>
          <a href="/notebook/note?id=B">B</a>
        </>,
      )
      const entryId = history.state.__speakmateRouteEntry
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        value: 650,
      })
      // Deliver a unit event at the document listener with the actual anchor
      // target, without jsdom's unsupported document activation/default focus.
      const clicked = (link: HTMLElement) => {
        const event = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        })
        Object.defineProperty(event, 'target', { value: link })
        fireEvent(document, event)
        return event
      }
      const event = clicked(view.getByText('A'))
      expect(document.activeElement).toBe(document.body)
      if (boundary === 'late-cancel') event.preventDefault()
      if (boundary === 'pointer') fireEvent.pointerDown(window)
      if (boundary === 'key') fireEvent.keyDown(window)
      if (boundary === 'wheel') fireEvent.wheel(window)
      if (boundary === 'next-click') clicked(view.getByText('B'))
      fireEvent(window, new Event('pagehide'))
      const source =
        boundary === 'pagehide'
          ? '/notebook/note?id=A'
          : boundary === 'next-click'
            ? '/notebook/note?id=B'
            : ''
      expect(
        JSON.parse(sessionStorage.getItem('speakmate-route-scroll-v1')!),
      ).toContainEqual(['/notebook', 650, source, entryId])
      // A canceled/consumed candidate cannot poison the next legitimate click.
      clicked(view.getByText('B'))
      fireEvent(window, new Event('pagehide'))
      expect(
        JSON.parse(sessionStorage.getItem('speakmate-route-scroll-v1')!),
      ).toContainEqual(['/notebook', 650, '/notebook/note?id=B', entryId])
    },
  )
  it('waits for the native destination hook transition and late source DOM before consuming traversal restoration', async () => {
    history.replaceState(null, '', '/notebook')
    visitRoute('/notebook')
    const destinationState = history.state
    const destinationId = destinationState.__speakmateRouteEntry
    history.pushState(null, '', '/session/report?id=B')
    visitRoute('/session/report?id=B')
    const before = readRouteHistory()
    sessionStorage.setItem(
      'speakmate-route-scroll-v1',
      JSON.stringify([
        ['/notebook', 650, '/notebook/note?id=A', destinationId],
      ]),
    )
    let releaseRoute!: () => void
    let routeReady = false
    const waiting = new Promise<void>((resolve) => {
      releaseRoute = () => {
        routeReady = true
        resolve()
      }
    })
    let setPage!: (page: { pathname: string; query: string }) => void
    let showSource!: (ready: boolean) => void
    let sourceReady = false
    const scroll = vi
      .spyOn(window, 'scrollTo')
      .mockImplementation((options: number | ScrollToOptions) => {
        if (typeof options === 'object')
          Object.defineProperty(window, 'scrollY', {
            configurable: true,
            value: Math.min(options.top ?? 0, sourceReady ? 1000 : 100),
          })
      })
    function Page({ pathname }: { pathname: string }) {
      const [ready, update] = useState(false)
      showSource = (value) => {
        sourceReady = value
        update(value)
      }
      if (pathname === '/notebook' && !routeReady) throw waiting
      return (
        <main>
          <h1 data-page-title tabIndex={-1}>
            {pathname}
          </h1>
          {pathname === '/notebook' && ready ? (
            <a href="/notebook/note?id=A">Destination-only source</a>
          ) : null}
        </main>
      )
    }
    function Host() {
      const [page, update] = useState({
        pathname: '/session/report',
        query: 'id=B',
      })
      setPage = update
      return (
        <Suspense fallback={<p>Loading destination</p>}>
          <HookRoute.Provider value={page}>
            <Page pathname={page.pathname} />
            <RouteCoordinator />
          </HookRoute.Provider>
        </Suspense>
      )
    }
    const view = render(<Host />)
    scroll.mockClear()
    await act(async () => {
      // Native identity/address changes BEFORE Next's deferred hook/DOM commit.
      history.replaceState(destinationState, '', '/notebook')
      startTransition(() => setPage({ pathname: '/notebook', query: '' }))
      window.dispatchEvent(
        new PopStateEvent('popstate', { state: destinationState }),
      )
    })
    expect(view.getByRole('heading').textContent).toBe('/session/report')
    expect(readRouteHistory()).toEqual(before)
    expect(scroll).not.toHaveBeenCalled()
    await act(async () => releaseRoute())
    expect(readRouteHistory().cursor).toBe(0)
    expect(readRouteHistory().entries[0]).toEqual({
      entryId: destinationId,
      route: '/notebook',
    })
    expect(history.state.__speakmateRouteEntry).toBe(destinationId)
    expect(window.scrollY).toBe(100)
    await act(async () => showSource(true))
    expect(window.scrollY).toBe(650)
    expect(view.getByText('Destination-only source')).toHaveFocus()
    expect(readRouteHistory().entries).toEqual(before.entries)
  })
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
    history.replaceState(reportState, '', '/session/report?id=B')
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
    history.replaceState(sourceState, '', '/notebook')
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
