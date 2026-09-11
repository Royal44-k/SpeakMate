import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  trackRoute,
  readRouteHistory,
  visitRoute,
  canReturnToRoute,
  prepareRouteNavigation,
  commitPendingNavigation,
  cancelRouteNavigation,
} from './navigation-history'

afterEach(() => {
  sessionStorage.clear()
  history.replaceState(null, '')
  vi.restoreAllMocks()
})
describe('identified native route history', () => {
  it('bounds entries and refuses an evicted native entry as proof of a previous app route', () => {
    let state = {
      version: 1 as const,
      entries: [] as Array<{ entryId: string; route: string }>,
      cursor: -1,
    }
    for (let n = 0; n < 30; n++)
      state = trackRoute(state, `/session?id=${n}`, `entry-${n}`).state
    expect(state.entries).toHaveLength(24)
    expect(state.entries[0].entryId).toBe('entry-6')
    sessionStorage.setItem('speakmate-route-stack', JSON.stringify(state))
    history.replaceState({ __speakmateRouteEntry: 'entry-0' }, '')
    visitRoute('/session?id=0')
    expect(readRouteHistory().entries).toHaveLength(1)
    expect(canReturnToRoute('/session?id=29')).toBe(false)
  })
  it.each(['wrong-source', 'expired', 'invalid-target'] as const)(
    'ignores %s pending return without altering safe destination',
    (kind) => {
      visitRoute('/me')
      prepareRouteNavigation('/notebook', 'return', false)
      commitPendingNavigation()
      const state = readRouteHistory()
      if (kind === 'wrong-source') state.pending!.sourceId = 'other'
      if (kind === 'expired') state.pending!.at = Date.now() - 31000
      if (kind === 'invalid-target') state.pending!.target = '//external.test'
      sessionStorage.setItem('speakmate-route-stack', JSON.stringify(state))
      history.replaceState(null, '')
      expect(visitRoute('/notebook').kind).toBe('forward')
      expect(readRouteHistory().pending).toBeUndefined()
    },
  )
  it('keeps explicit return as a new entry so native Back and Forward retain report and source', () => {
    let state = {
      version: 1 as const,
      entries: [] as Array<{ entryId: string; route: string }>,
      cursor: -1,
    }
    for (const [entryId, route] of [
      ['one', '/notebook'],
      ['two', '/notebook/note?id=A'],
      ['three', '/notebook/simulation?id=B'],
      ['four', '/session/report?id=B'],
    ])
      state = trackRoute(state, route, entryId).state
    const returned = trackRoute(state, '/notebook', 'five', 'return')
    expect(returned.kind).toBe('return')
    expect(returned.state.entries.map((e) => e.entryId)).toEqual([
      'one',
      'two',
      'three',
      'four',
      'five',
    ])
    const back = trackRoute(returned.state, '/session/report?id=B', 'four')
    expect(back.kind).toBe('traverse')
    expect(back.state.cursor).toBe(3)
    const forward = trackRoute(back.state, '/notebook', 'five')
    expect(forward.kind).toBe('traverse')
    expect(forward.state.cursor).toBe(4)
  })
  it('does not infer Back from an ordinary forward link to an earlier URL', () => {
    const state = {
      version: 1 as const,
      entries: [
        { entryId: 'a', route: '/notebook' },
        { entryId: 'b', route: '/me' },
      ],
      cursor: 1,
    }
    const result = trackRoute(state, '/notebook', 'c')
    expect(result.kind).toBe('forward')
    expect(result.state.cursor).toBe(2)
    expect(result.state.entries.map((e) => e.route)).toEqual([
      '/notebook',
      '/me',
      '/notebook',
    ])
  })
  it('keeps legacy URLs only as context without inventing native entry identities', () => {
    sessionStorage.setItem(
      'speakmate-route-stack',
      JSON.stringify(['/notebook', '/me']),
    )
    visitRoute('/me')
    expect(canReturnToRoute('/notebook')).toBe(false)
    expect(readRouteHistory().entries).toHaveLength(1)
  })
  it('preserves other history fields and consumes a committed matching return once', () => {
    history.replaceState({ __NA: true, custom: 'keep' }, '')
    visitRoute('/session/report?id=B')
    const source = history.state.__speakmateRouteEntry
    expect(history.state).toMatchObject({ __NA: true, custom: 'keep' })
    prepareRouteNavigation('/notebook', 'return', false)
    expect(readRouteHistory().pending).toBeUndefined()
    commitPendingNavigation()
    expect(readRouteHistory().pending).toMatchObject({
      sourceId: source,
      target: '/notebook',
    })
    history.replaceState(null, '')
    expect(visitRoute('/notebook').kind).toBe('return')
    expect(readRouteHistory().pending).toBeUndefined()
    history.replaceState(null, '')
    expect(visitRoute('/notebook').kind).not.toBe('return')
  })
  it('keeps a slow navigation candidate but drops canceled intent before a later pagehide', async () => {
    visitRoute('/me')
    prepareRouteNavigation('/notebook', 'return', false)
    await new Promise((resolve) => setTimeout(resolve, 1))
    commitPendingNavigation()
    expect(readRouteHistory().pending).toBeDefined()
    cancelRouteNavigation()
    expect(readRouteHistory().pending).toBeUndefined()
  })
})
