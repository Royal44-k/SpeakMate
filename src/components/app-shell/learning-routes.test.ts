import { describe, expect, it, vi } from 'vitest'
import * as routes from './learning-routes'

describe('local learning route contract', () => {
  it('does not repair an invalid new target into a valid creation by navigation fallback', () => {
    window.history.replaceState(null, '', '/session?id=A')
    expect(() =>
      routes.navigateLocalHref('/session?id=new&level=INVALID'),
    ).toThrow()
    expect(window.location.search).toBe('?id=A')
  })
  it('does not silently default duplicated legacy public options', () => {
    expect(
      routes.canonicalLegacyHref(
        '/session/new?scene=coffee-order&level=A1&level=C1',
      ),
    ).toBeUndefined()
    expect(
      routes.canonicalLegacyHref(
        '/scenes/coffee-order?mode=short&mode=extended',
      ),
    ).toBeUndefined()
  })
  it('keeps an unrelated prior stack entry when new creation was not yet tracked', () => {
    sessionStorage.setItem(
      'speakmate-route-stack',
      JSON.stringify(['/scenes?level=C1']),
    )
    window.history.replaceState(
      null,
      '',
      '/session?id=new&scene=coffee-order&level=C1',
    )
    routes.replaceCreatedSessionId('saved-B')
    expect(
      JSON.parse(sessionStorage.getItem('speakmate-route-stack')!),
    ).toEqual([
      '/scenes?level=C1',
      '/session?id=saved-B&scene=coffee-order&level=C1',
    ])
  })
  it.each([
    '/session',
    '/session?id=',
    '/session?id=A&id=B',
    '/session?id=a/b',
    '/session/report',
    '/session/report?id=new',
    '/scenes/prepare',
    '/session?id=new&level=Z9',
    '/session?id=new&mode=other',
  ])(
    'rejects ambiguous or invalid target %s without default creation',
    (href) => {
      expect(routes.parseLearningTarget(href).status).toBe('invalid')
    },
  )
  it('distinguishes explicit create, restore and report and strips private nested sources', () => {
    expect(
      routes.parseLearningTarget(
        '/session?id=new&scene=coffee-order&level=C1&mode=short&round=r1',
      ).status,
    ).toBe('valid')
    expect(
      routes.buildLearningHref({
        kind: 'session',
        id: 'A',
        from: '/scenes?q=private&level=B1',
      }),
    ).toBe('/session?id=A&from=%2Fscenes%3Flevel%3DB1')
    expect(
      routes.canonicalLegacyHref(
        '/session/A/report?q=private&from=%2Fscenes%3Fq%3Dprivate%26level%3DB1',
      ),
    ).toBe('/session/report?id=A&from=%2Fscenes%3Flevel%3DB1')
    expect(routes.canonicalLegacyHref('/session/report')).toBeUndefined()
    expect(routes.canonicalLegacyHref('/scenes/prepare')).toBeUndefined()
  })
  it('replaces saved identity with supported native history data and preserves public origin options', () => {
    window.history.replaceState(
      { __NA: true, secret: 'framework' },
      '',
      '/session?id=new&scene=coffee-order&level=B1&mode=short&round=r1&from=%2Fpractice',
    )
    const replace = vi.spyOn(window.history, 'replaceState')
    routes.replaceCreatedSessionId('saved-A')
    expect(replace).toHaveBeenLastCalledWith(
      null,
      '',
      '/session?id=saved-A&scene=coffee-order&level=B1&mode=short&round=r1&from=%2Fpractice',
    )
    expect(window.location.search).toContain('id=saved-A')
    replace.mockRestore()
  })
})
