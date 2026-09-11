import {
  CEFR_LEVELS,
  type CefrLevel,
  type SceneCategory,
} from '@/domain/scenes/types'

const categories = [
  'travel',
  'dining',
  'daily',
  'work',
  'social',
  'study',
  'emergency',
] as const

const durations = [3, 5, 8, 10] as const

export type DurationFilter = 'all' | (typeof durations)[number]

export interface SceneFilterState {
  search: string
  category: SceneCategory | 'all'
  level: CefrLevel
  duration: DurationFilter
}

function isCategory(value: string | null): value is SceneCategory {
  return categories.includes(value as SceneCategory)
}

function isLevel(value: string | null): value is CefrLevel {
  return CEFR_LEVELS.includes(value as CefrLevel)
}

function isDuration(value: string | null) {
  return durations.some((duration) => String(duration) === value)
}

export function parseSceneFilterState(
  params: URLSearchParams,
  fallbackLevel: CefrLevel,
): SceneFilterState {
  const category = params.get('category')
  const level = params.get('level')
  const duration = params.get('duration')

  return {
    search: params.get('q') ?? '',
    category: isCategory(category) ? category : 'all',
    level: isLevel(level) ? level : fallbackLevel,
    duration: isDuration(duration)
      ? (Number(duration) as DurationFilter)
      : 'all',
  }
}

export function serializeSceneFilterState(state: SceneFilterState): string {
  const params = new URLSearchParams()
  if (state.category !== 'all') params.set('category', state.category)
  params.set('level', state.level)
  if (state.duration !== 'all') params.set('duration', String(state.duration))

  return params.toString()
}

export function sceneLibraryHref(state: SceneFilterState) {
  const query = serializeSceneFilterState(state)
  return query ? `/scenes?${query}` : '/scenes'
}

export function isSceneLibraryHref(value: unknown): value is string {
  return typeof value === 'string' && /^\/scenes(?:\?.*)?$/.test(value)
}

const LOCAL_FILTER_KEY = 'speakmate-scene-filters-v1'
let fallbackFilters: Record<string, SceneFilterState> = {}

function readLocalFilters(): Record<string, SceneFilterState> {
  if (typeof window === 'undefined') return {}
  try {
    const parsed: unknown = JSON.parse(
      window.sessionStorage.getItem(LOCAL_FILTER_KEY) ?? '{}',
    )
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return {}
    const result: Record<string, SceneFilterState> = {}
    for (const [key, value] of Object.entries(parsed).slice(-24)) {
      if (
        !isSceneLibraryHref(key) ||
        key.length > 200 ||
        !value ||
        typeof value !== 'object'
      )
        continue
      const state = value as SceneFilterState
      if (
        typeof state.search === 'string' &&
        state.search.length <= 200 &&
        isLevel(state.level) &&
        (state.category === 'all' || isCategory(state.category)) &&
        (state.duration === 'all' || isDuration(String(state.duration))) &&
        sceneLibraryHref(state) === key
      )
        result[key] = state
    }
    return result
  } catch {
    return fallbackFilters
  }
}

export function rememberSceneFilters(state: SceneFilterState): boolean {
  const bounded = { ...state, search: state.search.slice(0, 200) }
  const key = sceneLibraryHref(bounded)
  const entries = readLocalFilters()
  delete entries[key]
  fallbackFilters = Object.fromEntries(
    [...Object.entries(entries), [key, bounded]].slice(-24),
  )
  try {
    window.sessionStorage.setItem(
      LOCAL_FILTER_KEY,
      JSON.stringify(fallbackFilters),
    )
    return true
  } catch {
    return false
  }
}

export function restoreSceneFilters(
  params: URLSearchParams,
  fallbackLevel: CefrLevel,
): SceneFilterState {
  const publicState = parseSceneFilterState(params, fallbackLevel)
  if (params.has('q'))
    return { ...publicState, search: publicState.search.slice(0, 200) }
  return readLocalFilters()[sceneLibraryHref(publicState)] ?? publicState
}

/** Free-text identity is local, independent of the shareable public URL. */
export function sceneFilterIdentity(state: SceneFilterState) {
  return JSON.stringify(state)
}
