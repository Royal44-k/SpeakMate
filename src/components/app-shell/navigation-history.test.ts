import { describe, expect, it } from 'vitest'

import { trackRoute, type RouteHistory } from './navigation-history'
const state = (...routes: string[]): RouteHistory => ({
  version: 1,
  entries: routes.map((route, index) => ({ entryId: String(index), route })),
  cursor: routes.length - 1,
})

describe('navigation history', () => {
  it('treats record A to B as forward and restores A on back within the same shell', () => {
    const forward = trackRoute(
      state('/practice', '/session?id=A'),
      '/session?id=B',
      '2',
    )
    expect(forward.kind).toBe('forward')
    expect(forward.state.entries.map((e) => e.route)).toEqual([
      '/practice',
      '/session?id=A',
      '/session?id=B',
    ])
    expect(trackRoute(forward.state, '/session?id=A', '1').kind).toBe(
      'traverse',
    )
  })
  it('records a forward route and identifies browser-back restoration', () => {
    const forward = trackRoute(
      state('/scenes?level=B1'),
      '/scenes/hotel-check-in?level=B1',
      '1',
    )

    expect(forward.kind).toBe('forward')
    expect(trackRoute(forward.state, '/scenes?level=B1', '0').kind).toBe(
      'traverse',
    )
  })

  it('does not claim a safe in-app back route for a direct deep link', () => {
    expect(trackRoute(state(), '/privacy', 'new').state.cursor).toBe(0)
  })

  it('replaces same-path query state without inventing a browser history entry', () => {
    expect(
      trackRoute(
        state('/practice', '/scenes?level=B1'),
        '/scenes?level=C1',
        '1',
      ),
    ).toEqual({
      state: state('/practice', '/scenes?level=C1'),
      kind: 'same',
    })
  })
})
