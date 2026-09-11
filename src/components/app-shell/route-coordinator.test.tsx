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
})
