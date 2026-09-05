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
  const search = state.search.trim()

  if (search) params.set('q', search)
  if (state.category !== 'all') params.set('category', state.category)
  params.set('level', state.level)
  if (state.duration !== 'all') params.set('duration', String(state.duration))

  return params.toString()
}

export function sceneLibraryHref(state: SceneFilterState) {
  const query = serializeSceneFilterState(state)
  return query ? `/scenes?${query}` : '/scenes'
}
