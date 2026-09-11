import { safeSourceHref, semanticRouteIdentity } from './learning-routes'
const MAX_ROUTES = 24
const KEY = 'speakmate-route-stack'
export const ROUTE_ENTRY_KEY = '__speakmateRouteEntry'
type Entry = { entryId: string; route: string }
type Pending = {
  sourceId: string
  target: string
  replace: boolean
  intent: 'return' | 'forward'
  at: number
}
export type RouteHistory = {
  version: 1
  entries: Entry[]
  cursor: number
  pending?: Pending
  legacy?: string[]
}
const empty = (): RouteHistory => ({ version: 1, entries: [], cursor: -1 })
const validId = (id: unknown): id is string =>
  typeof id === 'string' && /^[\w-]{1,100}$/.test(id)
export function readRouteHistory(): RouteHistory {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) ?? 'null')
    if (
      Array.isArray(value) &&
      value.length <= MAX_ROUTES &&
      value.every((v) => typeof v === 'string' && safeSourceHref(v))
    )
      return { ...empty(), legacy: value.map((v) => safeSourceHref(v)!) }
    if (
      !value ||
      value.version !== 1 ||
      !Array.isArray(value.entries) ||
      value.entries.length > MAX_ROUTES ||
      !Number.isInteger(value.cursor) ||
      value.cursor < -1 ||
      value.cursor >= value.entries.length ||
      (value.entries.length && value.cursor < 0) ||
      !value.entries.every(
        (e: Entry) =>
          e &&
          validId(e.entryId) &&
          typeof e.route === 'string' &&
          safeSourceHref(e.route) === e.route,
      ) ||
      new Set(value.entries.map((e: Entry) => e.entryId)).size !==
        value.entries.length
    )
      return empty()
    const state: RouteHistory = {
      version: 1,
      entries: value.entries,
      cursor: value.cursor,
    }
    const p = value.pending
    if (
      p &&
      validId(p.sourceId) &&
      typeof p.target === 'string' &&
      safeSourceHref(p.target) === p.target &&
      typeof p.replace === 'boolean' &&
      ['return', 'forward'].includes(p.intent) &&
      Number.isFinite(p.at) &&
      Date.now() - p.at >= 0 &&
      Date.now() - p.at < 30000
    )
      state.pending = p
    return state
  } catch {
    return empty()
  }
}
function write(state: RouteHistory) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* optional UI state */
  }
}
export function nativeEntryId(): string | undefined {
  const id = history.state?.[ROUTE_ENTRY_KEY]
  return validId(id) ? id : undefined
}

export function trackRoute(
  state: RouteHistory,
  route: string,
  entryId: string,
  intent?: 'return' | 'replace',
) {
  const index = state.entries.findIndex((e) => e.entryId === entryId)
  if (index >= 0) {
    const entries = state.entries.map((e, i) =>
      i === index ? { entryId, route } : e,
    )
    return {
      state: { version: 1 as const, entries, cursor: index },
      kind: index === state.cursor ? ('same' as const) : ('traverse' as const),
    }
  }
  const prior = state.entries[state.cursor]
  const entries = [
    ...state.entries.slice(0, state.cursor + (intent === 'replace' ? 0 : 1)),
    { entryId, route },
  ].slice(-MAX_ROUTES)
  const kind =
    intent === 'return'
      ? 'return'
      : prior &&
          semanticRouteIdentity(prior.route) === semanticRouteIdentity(route)
        ? 'same'
        : 'forward'
  return {
    state: { version: 1 as const, entries, cursor: entries.length - 1 },
    kind,
  }
}
export function visitRoute(route: string) {
  let state = readRouteHistory()
  const safe = safeSourceHref(route) ?? '/'
  let id = nativeEntryId()
  if (id && !state.entries.some((e) => e.entryId === id)) state = empty()
  const p = state.pending
  const returning =
    !id &&
    p?.sourceId === state.entries[state.cursor]?.entryId &&
    p?.target === safe
  if (!id) {
    id = crypto.randomUUID()
    try {
      history.replaceState({ ...history.state, [ROUTE_ENTRY_KEY]: id }, '')
    } catch {
      return { state: empty(), kind: 'forward' }
    }
  }
  const result = trackRoute(
    state,
    safe,
    id,
    returning
      ? p!.intent === 'return'
        ? 'return'
        : p!.replace
          ? 'replace'
          : undefined
      : undefined,
  )
  if (returning && p?.replace) {
    result.state.entries = [
      ...state.entries.slice(0, state.cursor),
      { entryId: id, route: safe },
    ].slice(-MAX_ROUTES)
    result.state.cursor = result.state.entries.length - 1
  }
  write(result.state)
  return result
}
export function canReturnToRoute(href: string) {
  const state = readRouteHistory()
  return (
    history.state?.__speakmateRoutePlaceholder === undefined &&
    state.entries[state.cursor]?.entryId === nativeEntryId() &&
    state.cursor > 0 &&
    state.entries[state.cursor - 1]?.route === safeSourceHref(href)
  )
}
let candidate: Pending | undefined
export function cancelRouteNavigation() {
  candidate = undefined
  const state = readRouteHistory()
  if (state.pending) write({ ...state, pending: undefined })
}
export function prepareRouteNavigation(
  target: string,
  intent: 'return' | 'forward',
  replace: boolean,
) {
  candidate = undefined
  const state = readRouteHistory()
  if (state.pending) write({ ...state, pending: undefined })
  const sourceId = nativeEntryId(),
    safe = safeSourceHref(target)
  if (
    (intent === 'return' || replace) &&
    sourceId &&
    state.entries[state.cursor]?.entryId === sourceId &&
    safe
  )
    candidate = { sourceId, target: safe, replace, intent, at: Date.now() }
}
export function commitPendingNavigation() {
  if (candidate && candidate.sourceId === nativeEntryId())
    write({ ...readRouteHistory(), pending: candidate })
  candidate = undefined
}
export function replaceRouteIdentity(route: string) {
  const id = nativeEntryId()
  if (id)
    write(
      trackRoute(readRouteHistory(), safeSourceHref(route) ?? '/', id).state,
    )
}

// The existing guard owns its physical placeholder; navigation cannot release a draft.
let savedRelease: ((target: string) => Promise<void>) | undefined
let releaseInFlight = false
export function registerSavedNavigationRelease(
  release: (target: string) => Promise<void>,
) {
  savedRelease = release
  return () => {
    if (savedRelease === release) savedRelease = undefined
  }
}
export function releaseForSavedNavigation(
  target: string,
): Promise<void> | undefined {
  if (releaseInFlight)
    return Promise.reject(new Error('正在等待历史条目，请勿重复跳转。'))
  if (!history.state?.__speakmateExitGuard) return
  if (!savedRelease)
    throw new Error('已保存记录的地址暂时无法更新，请使用保留入口。')
  releaseInFlight = true
  return savedRelease(target).finally(() => {
    releaseInFlight = false
  })
}
