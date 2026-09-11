import {
  CEFR_LEVELS,
  SCENE_CATEGORIES,
  type CefrLevel,
} from '@/domain/scenes/types'
import type { DialogueMode } from '@/content/dialogues/graded/schema'
import type { TaskSlot } from '@/domain/goals/types'

type Options = {
  scene?: string
  level?: CefrLevel
  mode?: DialogueMode
  round?: string
  from?: string
}
export type LearningTarget =
  | ({ kind: 'session'; id: string } & Options)
  | { kind: 'report' | 'note'; id: string; from?: string }
  | { kind: 'simulation'; id: string; source?: string; from?: string }
  | ({ kind: 'prepare'; scene: string } & Omit<Options, 'scene' | 'round'>)
export type LearningTargetResult =
  | { status: 'valid'; target: LearningTarget }
  | { status: 'invalid'; message: string }
const paths = {
  session: '/session',
  report: '/session/report',
  note: '/notebook/note',
  simulation: '/notebook/simulation',
  prepare: '/scenes/prepare',
} as const
const opaque = /^[a-zA-Z0-9._:-]{1,120}$/
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const modes = ['short', 'standard', 'extended']
const base = 'https://local.invalid'

function localUrl(href: string) {
  if (
    !href.startsWith('/') ||
    href.startsWith('//') ||
    href.includes('\\') ||
    href.length > 2000
  )
    return undefined
  try {
    const url = new URL(href, base)
    return url.origin === base ? url : undefined
  } catch {
    return undefined
  }
}

/** Public source projection: never preserves free text or a nested return chain. */
export function safeSourceHref(href?: string): string | undefined {
  const url = href ? localUrl(href) : undefined
  if (!url) return undefined
  const legacy = canonicalLegacyHref(href!, false)
  if (legacy) return safeSourceHref(legacy)
  if (
    ![
      '/',
      '/practice',
      '/practice/today',
      '/scenes',
      '/notebook',
      '/me',
      '/privacy',
      '/install',
      '/rewards',
      '/guide',
      '/welcome',
      '/auth',
      ...Object.values(paths),
    ].includes(url.pathname)
  )
    return undefined
  const params = new URLSearchParams()
  for (const key of [
    'id',
    'scene',
    'level',
    'mode',
    'round',
    'category',
    'duration',
    'source',
    'date',
    'task',
  ]) {
    const values = url.searchParams.getAll(key)
    if (values.length !== 1) continue
    const value = values[0]
    const valid =
      key === 'date'
        ? url.pathname === '/' && validGoalDate(value)
        : key === 'task'
          ? url.pathname === '/' &&
            ['warmup', 'scene', 'consolidation', 'extension'].includes(value)
          : key === 'level'
            ? CEFR_LEVELS.includes(value as CefrLevel)
            : key === 'mode'
              ? modes.includes(value)
              : key === 'category'
                ? SCENE_CATEGORIES.includes(
                    value as (typeof SCENE_CATEGORIES)[number],
                  )
                : key === 'duration'
                  ? ['3', '5', '8', '10'].includes(value)
                  : key === 'scene'
                    ? value.length <= 100 && slug.test(value)
                    : opaque.test(value)
    if (valid) params.set(key, value)
  }
  return url.pathname + (params.size ? `?${params}` : '')
}

export function validGoalDate(date: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(date + 'T00:00:00Z')) &&
    new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) === date
  )
}
export function buildGoalHref(date: string, task?: TaskSlot): string {
  if (
    !validGoalDate(date) ||
    (task !== undefined &&
      !['warmup', 'scene', 'consolidation', 'extension'].includes(task))
  )
    throw new Error('目标来源参数无效。')
  return `/?date=${date}${task ? `&task=${task}` : ''}`
}

export function parseLearningTarget(href: string): LearningTargetResult {
  const invalid: LearningTargetResult = {
    status: 'invalid',
    message:
      '练习链接缺少必要信息或参数无效。记录未被修改，请返回场景库重新选择。',
  }
  const url = localUrl(href)
  if (!url) return invalid
  const kind = (Object.keys(paths) as Array<keyof typeof paths>).find(
    (key) => paths[key] === url.pathname,
  )
  if (!kind) return invalid
  const allowed =
    kind === 'session'
      ? ['id', 'scene', 'level', 'mode', 'round', 'from']
      : kind === 'prepare'
        ? ['scene', 'level', 'mode', 'from']
        : kind === 'simulation'
          ? ['id', 'source', 'from']
          : ['id', 'from']
  for (const key of url.searchParams.keys())
    if (!allowed.includes(key) || url.searchParams.getAll(key).length !== 1)
      return invalid
  const params = url.searchParams
  const id = params.get('id')
  const scene = params.get('scene')
  const level = params.get('level')
  const mode = params.get('mode')
  const round = params.get('round')
  const source = params.get('source')
  if (kind !== 'prepare' && (!id || !opaque.test(id))) return invalid
  if ((kind === 'report' || kind === 'note') && id === 'new') return invalid
  if (
    (kind === 'prepare' && !scene) ||
    (scene !== null && (scene.length > 100 || !slug.test(scene)))
  )
    return invalid
  if (level !== null && !CEFR_LEVELS.includes(level as CefrLevel))
    return invalid
  if (mode !== null && !modes.includes(mode)) return invalid
  if (round !== null && !opaque.test(round)) return invalid
  if (source !== null && !opaque.test(source)) return invalid
  if (kind === 'simulation' && id === 'new' && !source) return invalid
  const from = safeSourceHref(params.get('from') ?? undefined)
  if (params.has('from') && !from) return invalid
  const target = {
    kind,
    ...(id ? { id } : {}),
    ...(scene ? { scene } : {}),
    ...(level ? { level } : {}),
    ...(mode ? { mode } : {}),
    ...(round ? { round } : {}),
    ...(source ? { source } : {}),
    ...(from ? { from } : {}),
  } as LearningTarget
  return { status: 'valid', target }
}

export function buildLearningHref(target: LearningTarget): string {
  const params = new URLSearchParams()
  for (const key of [
    'id',
    'scene',
    'level',
    'mode',
    'round',
    'source',
    'from',
  ] as const) {
    const value =
      key in target
        ? (target as unknown as Record<string, string>)[key]
        : undefined
    if (value !== undefined) {
      const safe = key === 'from' ? safeSourceHref(value) : value
      if (safe !== undefined) params.set(key, safe)
    }
  }
  const href = paths[target.kind] + `?${params}`
  if (parseLearningTarget(href).status !== 'valid')
    throw new Error('无效的本地学习目标。')
  return href
}

export function canonicalLegacyHref(
  href: string,
  includeFrom = true,
): string | undefined {
  const url = localUrl(href)
  if (!url) return undefined
  for (const key of ['scene', 'level', 'mode', 'round', 'from'])
    if (url.searchParams.getAll(key).length > 1) return undefined
  const report = /^\/session\/([a-zA-Z0-9._:-]+)\/report$/.exec(url.pathname)
  const session = /^\/session\/([a-zA-Z0-9._:-]+)$/.exec(url.pathname)
  const scene = /^\/scenes\/([a-z0-9-]+)$/.exec(url.pathname)
  let target: LearningTarget
  if (report && report[1] !== 'new' && report[1] !== 'report')
    target = { kind: 'report', id: report[1] }
  else if (session && !['report', 'prepare'].includes(session[1]))
    target = { kind: 'session', id: session[1] }
  else if (scene && scene[1] !== 'prepare')
    target = { kind: 'prepare', scene: scene[1] }
  else return undefined
  const clean = url.searchParams
  if (target.kind === 'session' || target.kind === 'prepare') {
    if (clean.has('level')) target.level = clean.get('level') as CefrLevel
    if (clean.has('mode')) target.mode = clean.get('mode') as DialogueMode
    if (target.kind === 'session') {
      if (clean.has('scene')) target.scene = clean.get('scene')!
      if (clean.has('round')) target.round = clean.get('round')!
    }
  }
  if (includeFrom && url.searchParams.getAll('from').length === 1)
    target.from = safeSourceHref(url.searchParams.get('from')!)
  try {
    return buildLearningHref(target)
  } catch {
    return undefined
  }
}

/** Storage accepts older IDs beyond new-route bounds. Never rewrite or throw on them. */
export function savedPracticeHref(
  id: string,
  kind: 'session' | 'report',
  from?: string,
): string | undefined {
  return opaque.test(id) && id !== 'new'
    ? buildLearningHref({ kind, id, from })
    : undefined
}

export function savedNotebookHref(
  id: string,
  from?: string,
): string | undefined {
  return opaque.test(id) && id !== 'new'
    ? buildLearningHref({ kind: 'note', id, from })
    : undefined
}

export function savedSimulationHref(
  id: string,
  from?: string,
): string | undefined {
  return opaque.test(id) && id !== 'new'
    ? buildLearningHref({ kind: 'simulation', id, from })
    : undefined
}

export function semanticRouteIdentity(href: string): string {
  const url = localUrl(href)
  if (!url) return href
  const recordShell = [
    '/session',
    '/session/report',
    '/notebook/note',
    '/notebook/simulation',
  ].includes(url.pathname)
  return (
    url.pathname +
    (recordShell
      ? `:${url.searchParams.get('id') ?? ''}`
      : url.pathname === '/scenes/prepare'
        ? `:${url.searchParams.get('scene') ?? ''}`
        : '')
  )
}

/** Call only after the existing exit guard has released pending audio/draft work. */
export function navigateLearning(target: LearningTarget, replace = false) {
  const href = buildLearningHref(target)
  if (window.location.pathname === paths[target.kind])
    window.history[replace ? 'replaceState' : 'pushState'](null, '', href)
  else documentNavigation[replace ? 'replace' : 'assign'](href)
}

export const documentNavigation = {
  assign: (href: string) => window.location.assign(href),
  replace: (href: string) => window.location.replace(href),
}

export function navigateLocalHref(href: string, replace = false) {
  const canonical = canonicalLegacyHref(href) ?? href
  const parsed = parseLearningTarget(canonical)
  if (
    parsed.status === 'invalid' &&
    Object.values(paths).some((path) => path === localUrl(canonical)?.pathname)
  )
    throw new Error('学习入口参数无效，未跳转或创建记录。')
  const safe =
    parsed.status === 'valid'
      ? buildLearningHref(parsed.target)
      : safeSourceHref(canonical)
  if (!safe) throw new Error('返回入口无效。')
  if (new URL(safe, base).pathname === window.location.pathname)
    window.history[replace ? 'replaceState' : 'pushState'](null, '', safe)
  else documentNavigation[replace ? 'replace' : 'assign'](safe)
}

export function replaceCreatedSessionId(id: string) {
  const previousHref = window.location.pathname + window.location.search
  const current = parseLearningTarget(
    window.location.pathname + window.location.search,
  )
  if (
    current.status !== 'valid' ||
    current.target.kind !== 'session' ||
    current.target.id !== 'new'
  )
    throw new Error('当前不是新建练习入口。')
  const href = buildLearningHref({ ...current.target, id })
  window.history.replaceState(null, '', href)
  try {
    const key = 'speakmate-route-stack'
    const stack: unknown = JSON.parse(
      window.sessionStorage.getItem(key) ?? '[]',
    )
    if (
      Array.isArray(stack) &&
      stack.length <= 24 &&
      stack.every((value) => typeof value === 'string' && value.length <= 2000)
    ) {
      const clean = stack
        .map((value) => safeSourceHref(value))
        .filter((value): value is string => !!value)
      const prior =
        clean.at(-1) === safeSourceHref(previousHref)
          ? clean.slice(0, -1)
          : clean
      window.sessionStorage.setItem(
        key,
        JSON.stringify([...prior, href].slice(-24)),
      )
    }
  } catch {
    /* The committed record and address remain usable without UI storage. */
  }
}
