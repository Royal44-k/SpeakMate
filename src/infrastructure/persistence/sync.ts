import type { SupabaseClient } from '@supabase/supabase-js'

import type { FavoriteExpression, LearnerProfile, LearnerSettings } from '@/domain/learning/types'
import type { PracticeSession, PracticeTurn } from '@/domain/practice/types'

import type { LearnerDataExport } from './repositories'

function newest<T extends { id: string }>(
  local: T[],
  remote: T[],
  timestamp: (value: T) => string,
): T[] {
  const items = new Map<string, T>()
  for (const value of [...remote, ...local]) {
    const existing = items.get(value.id)
    if (!existing || timestamp(value) >= timestamp(existing)) items.set(value.id, value)
  }
  return [...items.values()]
}

function withoutRuntimeAudio<T extends object>(value: T): T {
  const clone = { ...value } as T & { audio?: unknown }
  delete clone.audio
  return clone
}

function latestOptional<T>(local: T | undefined, remote: T | undefined, timestamp: (value: T) => string) {
  if (!local) return remote
  if (!remote) return local
  return timestamp(local) >= timestamp(remote) ? local : remote
}

export function mergeGuestData(
  local: LearnerDataExport,
  remote: LearnerDataExport,
): LearnerDataExport {
  const sessions = newest(local.sessions, remote.sessions, (value) => value.updatedAt).map(withoutRuntimeAudio)
  const turns = newest(local.turns, remote.turns, (value) => value.createdAt).map(withoutRuntimeAudio)
  const favorites = newest(local.favorites, remote.favorites, (value) => value.updatedAt).map(withoutRuntimeAudio)
  const profile = latestOptional(local.profile, remote.profile, (value) => value.updatedAt)
  const settings = latestOptional(local.settings, remote.settings, (value) => value.updatedAt)
  return {
    schemaVersion: 1,
    exportedAt: [local.exportedAt, remote.exportedAt].sort().at(-1)!,
    profile: profile ? withoutRuntimeAudio(profile) : undefined,
    sessions,
    turns,
    favorites,
    settings: settings ? withoutRuntimeAudio(settings) : undefined,
  }
}

export async function uploadLearnerData(
  client: SupabaseClient,
  userId: string,
  data: LearnerDataExport,
) {
  const rows: Array<[string, Array<LearnerProfile | LearnerSettings | PracticeSession | PracticeTurn | FavoriteExpression>]> = [
    ['profiles', data.profile ? [data.profile] : []],
    ['sessions', data.sessions],
    ['turns', data.turns],
    ['favorites', data.favorites],
  ]
  for (const [table, values] of rows) {
    if (values.length === 0) continue
    const sanitized = values.map((value) => ({ ...withoutRuntimeAudio(value), user_id: userId }))
    const { error } = await client.from(table).upsert(sanitized)
    if (error) throw error
  }
}
