import type { LearnerDataExport, LearnerDataExportV2 } from './repositories'
import { STORE_NAMES, type StoreName } from './db'
import { createGuestProfile } from './identity'
import { canonical, validateRelations } from './data-invariants'
import { emptyState, type DataState } from './storage'
import {
  mergeNote,
  noteFromFavorite,
  notebookIdentityMap,
} from './notebook-data'
import { backupV2Schema } from './backup-schemas'

export interface RestoreCount {
  incoming: number
  added: number
  updated: number
  unchanged: number
  removed: number
}
export type RestoreCounts = Record<StoreName, RestoreCount>
const immutable = new Set<StoreName>([
  'reviews',
  'learningEvents',
  'pointsLedger',
  'rewardUnlocks',
])
const timestamp = (value: object): number => {
  const row = value as { updatedAt?: string; createdAt?: string }
  return Date.parse(row.updatedAt ?? row.createdAt ?? '')
}

export function exportState(
  state: DataState,
  at = new Date().toISOString(),
): LearnerDataExportV2 {
  if (state.profile.length > 1 || state.settings.length > 1)
    throw new Error('MULTIPLE_SINGLETONS')
  return {
    ...state,
    schemaVersion: 2,
    exportedAt: at,
    profile: state.profile[0],
    settings: state.settings[0],
  }
}
export function validateState(state: DataState): void {
  backupV2Schema.parse(exportState(state))
  validateRelations(state)
}

export function importState(
  data: LearnerDataExport,
  local: DataState,
): { state: DataState; warnings: string[] } {
  const state = emptyState()
  const warnings: string[] = []
  state.profile = data.profile ? [structuredClone(data.profile)] : []
  state.settings = data.settings ? [structuredClone(data.settings)] : []
  state.sessions = structuredClone(data.sessions)
  state.turns = structuredClone(data.turns)
  state.favorites = structuredClone(data.favorites)
  if (data.schemaVersion === 2) {
    for (const name of [
      'notebook',
      'reviews',
      'dailyPlans',
      'learningEvents',
      'pointsLedger',
      'rewardUnlocks',
      'outbox',
    ] as const)
      Object.assign(state, { [name]: structuredClone(data[name]) })
  }
  for (const name of STORE_NAMES) {
    if (new Set(state[name].map((row) => row.id)).size !== state[name].length)
      throw new Error(`DUPLICATE_${name}`)
  }
  if (!state.profile[0]) {
    const owners = [
      ...new Set(
        [
          ...state.sessions,
          ...state.notebook,
          ...state.dailyPlans,
          ...state.learningEvents,
          ...state.reviews,
          ...state.pointsLedger,
          ...state.rewardUnlocks,
        ].map((row) => row.profileId),
      ),
    ]
    if (owners.length > 1) throw new Error('MISSING_PROFILE_AMBIGUOUS')
    if (owners.length || state.favorites.length) {
      const id =
        owners[0] ?? local.profile[0]?.id ?? 'guest_recovered_favorites'
      state.profile = [
        local.profile[0]?.id === id
          ? structuredClone(local.profile[0])
          : createGuestProfile(id, data.exportedAt),
      ]
      warnings.push(
        `备份缺少个人设置；将使用资料 ${id} 的默认设置恢复，不改写已有学习记录的归属。`,
      )
    }
  }
  if (data.schemaVersion === 1) {
    for (const favorite of state.favorites) {
      const turn = state.turns.find((item) => item.id === favorite.turnId)
      const session = state.sessions.find((item) => item.id === turn?.sessionId)
      const candidate = noteFromFavorite(
        favorite,
        state.profile[0].id,
        turn,
        session,
      )
      const index = state.notebook.findIndex(
        (note) => note.normalizedText === candidate.normalizedText,
      )
      if (index < 0) state.notebook.push(candidate)
      else state.notebook[index] = mergeNote(state.notebook[index], candidate)
    }
  }
  notebookIdentityMap(state.notebook)
  return { state, warnings }
}

export function mergeStates(
  local: DataState,
  incoming: DataState,
): { state: DataState; counts: RestoreCounts; conflicts: string[] } {
  const state = structuredClone(local)
  const counts = {} as RestoreCounts
  const conflicts: string[] = []
  const localHasLearning = [
    'sessions',
    'turns',
    'favorites',
    'notebook',
    'reviews',
    'dailyPlans',
    'learningEvents',
    'pointsLedger',
    'rewardUnlocks',
  ].some((name) => local[name as StoreName].length > 0)
  if (
    local.profile[0] &&
    incoming.profile[0] &&
    local.profile[0].id !== incoming.profile[0].id
  ) {
    if (localHasLearning || local.profile[0].onboardingCompleted)
      conflicts.push(
        'PROFILE_MISMATCH: 本机已有另一份学习资料，请先导出备份并选择空设备恢复。',
      )
    else state.profile = []
  }
  for (const name of STORE_NAMES) {
    const count = (counts[name] = {
      incoming: incoming[name].length,
      added: 0,
      updated: 0,
      unchanged: 0,
      removed: 0,
    })
    const rows = state[name] as Array<{ id: string }>
    for (const item of incoming[name]) {
      const index = rows.findIndex((row) => row.id === item.id)
      if (index < 0) {
        rows.push(structuredClone(item))
        count.added++
        continue
      }
      const old = rows[index]
      if (canonical(old) === canonical(item)) {
        count.unchanged++
        continue
      }
      if (immutable.has(name)) {
        conflicts.push(`IMMUTABLE_CONFLICT:${name}:${item.id}`)
        continue
      }
      if (timestamp(item) > timestamp(old)) {
        rows[index] = structuredClone(item)
        count.updated++
      } else if (timestamp(item) === timestamp(old))
        conflicts.push(`TIMESTAMP_CONFLICT:${name}:${item.id}`)
      else count.unchanged++
    }
  }
  // Sources survive ordinary newest-record selection; a newer tombstone is never replayed.
  for (const incomingNote of incoming.notebook) {
    const old = local.notebook.find((note) => note.id === incomingNote.id)
    if (old) {
      try {
        state.notebook[state.notebook.findIndex((note) => note.id === old.id)] =
          mergeNote(old, incomingNote)
      } catch {
        conflicts.push(`NOTE_SOURCE_CONFLICT:${old.id}`)
      }
    }
  }
  const canonicalNotes: DataState['notebook'] = []
  for (const note of state.notebook) {
    const index = canonicalNotes.findIndex(
      (item) =>
        item.profileId === note.profileId &&
        item.normalizedText === note.normalizedText,
    )
    if (index < 0) canonicalNotes.push(note)
    else {
      try {
        canonicalNotes[index] = mergeNote(canonicalNotes[index], note)
      } catch {
        conflicts.push(`NOTE_SOURCE_CONFLICT:${note.id}`)
      }
    }
  }
  state.notebook = canonicalNotes
  const deletedFavorites = new Set(
    state.notebook
      .filter((note) => note.deletedAt)
      .flatMap((note) => note.favoriteIds),
  )
  state.favorites = state.favorites.filter(
    (favorite) => !deletedFavorites.has(favorite.id),
  )
  if (!conflicts.length) validateState(state)
  // Count the actual post-normalization mutations, not discarded incoming rows.
  for (const name of STORE_NAMES) {
    const old = new Map(local[name].map((row) => [row.id, canonical(row)]))
    const current = new Map(state[name].map((row) => [row.id, canonical(row)]))
    counts[name] = {
      incoming: incoming[name].length,
      added: 0,
      updated: 0,
      unchanged: 0,
      removed: 0,
    }
    for (const [id, value] of current) {
      if (!old.has(id)) counts[name].added++
      else if (old.get(id) === value) counts[name].unchanged++
      else counts[name].updated++
    }
    for (const id of old.keys()) if (!current.has(id)) counts[name].removed++
  }
  return { state, counts, conflicts }
}
