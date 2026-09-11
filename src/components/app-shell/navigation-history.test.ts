import { describe, expect, it } from 'vitest'

import { canGoBackWithinApp, trackRoute } from './navigation-history'

describe('navigation history', () => {
  it('treats record A to B as forward and restores A on back within the same shell', () => {
    const forward = trackRoute(['/practice', '/session?id=A'], '/session?id=B')
    expect(forward).toEqual({
      stack: ['/practice', '/session?id=A', '/session?id=B'],
      kind: 'forward',
    })
    expect(trackRoute(forward.stack, '/session?id=A')).toEqual({
      stack: ['/practice', '/session?id=A'],
      kind: 'back',
    })
  })
  it('records a forward route and identifies browser-back restoration', () => {
    const forward = trackRoute(
      ['/scenes?level=B1'],
      '/scenes/hotel-check-in?level=B1',
    )

    expect(forward).toEqual({
      stack: ['/scenes?level=B1', '/scenes/hotel-check-in?level=B1'],
      kind: 'forward',
    })
    expect(trackRoute(forward.stack, '/scenes?level=B1')).toEqual({
      stack: ['/scenes?level=B1'],
      kind: 'back',
    })
  })

  it('does not claim a safe in-app back route for a direct deep link', () => {
    expect(canGoBackWithinApp(['/privacy'])).toBe(false)
  })

  it('replaces same-path query state without inventing a browser history entry', () => {
    expect(
      trackRoute(['/practice', '/scenes?level=B1'], '/scenes?q=hotel&level=B1'),
    ).toEqual({
      stack: ['/practice', '/scenes?q=hotel&level=B1'],
      kind: 'same',
    })
  })
})
