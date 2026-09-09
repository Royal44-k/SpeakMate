import { type DBSchema, type IDBPDatabase, openDB } from 'idb'

import type {
  FavoriteExpression,
  LearnerProfile,
  LearnerSettings,
} from '@/domain/learning/types'
import type { PracticeSession, PracticeTurn } from '@/domain/practice/types'
import type { NotebookEntry, ReviewRecord } from '@/domain/notebook/types'
import type {
  DailyPlan,
  LearningEvent,
  PointsLedgerEntry,
  RewardUnlock,
} from '@/domain/goals/types'
import { createGuestProfile } from './identity'
import { mergeNote, noteFromFavorite } from './notebook-data'

export const DATABASE_NAME = 'speakmate-v1'
export const DATABASE_VERSION = 2
export const STORE_NAMES = [
  'profile',
  'sessions',
  'turns',
  'favorites',
  'settings',
  'outbox',
  'notebook',
  'reviews',
  'dailyPlans',
  'learningEvents',
  'pointsLedger',
  'rewardUnlocks',
] as const
export type StoreName = (typeof STORE_NAMES)[number]

export interface OutboxItem {
  id: string
  entityType: 'profile' | 'session' | 'turn' | 'favorite'
  entityId: string
  operation: 'upsert' | 'delete'
  createdAt: string
}

export interface SpeakMateDbSchema extends DBSchema {
  notebook: { key: string; value: NotebookEntry }
  reviews: { key: string; value: ReviewRecord }
  dailyPlans: { key: string; value: DailyPlan }
  learningEvents: { key: string; value: LearningEvent }
  pointsLedger: { key: string; value: PointsLedgerEntry }
  rewardUnlocks: { key: string; value: RewardUnlock }
  profile: {
    key: string
    value: LearnerProfile
  }
  sessions: {
    key: string
    value: PracticeSession
    indexes: { 'by-status': string; 'by-updated-at': string }
  }
  turns: {
    key: string
    value: PracticeTurn
    indexes: { 'by-session': string }
  }
  favorites: {
    key: string
    value: FavoriteExpression
  }
  settings: {
    key: string
    value: LearnerSettings
  }
  outbox: {
    key: string
    value: OutboxItem
  }
}

let databasePromise: Promise<IDBPDatabase<SpeakMateDbSchema>> | undefined

export function getDatabase(): Promise<IDBPDatabase<SpeakMateDbSchema>> {
  if (databasePromise) return databasePromise
  let blocked = false
  let migrationFailure: Error | undefined
  let rejectBlocked: (reason: Error) => void
  const blockedPromise = new Promise<never>((_resolve, reject) => {
    rejectBlocked = reject
  })
  const opening = openDB<SpeakMateDbSchema>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(database, oldVersion, _newVersion, transaction) {
      void transaction.done.catch(() => undefined)
      if (!database.objectStoreNames.contains('profile')) {
        database.createObjectStore('profile', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('sessions')) {
        const sessions = database.createObjectStore('sessions', {
          keyPath: 'id',
        })
        sessions.createIndex('by-status', 'status')
        sessions.createIndex('by-updated-at', 'updatedAt')
      }
      if (!database.objectStoreNames.contains('turns')) {
        const turns = database.createObjectStore('turns', { keyPath: 'id' })
        turns.createIndex('by-session', 'sessionId')
      }
      if (!database.objectStoreNames.contains('favorites')) {
        database.createObjectStore('favorites', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('outbox')) {
        database.createObjectStore('outbox', { keyPath: 'id' })
      }
      for (const name of [
        'notebook',
        'reviews',
        'dailyPlans',
        'learningEvents',
        'pointsLedger',
        'rewardUnlocks',
      ] as const) {
        if (!database.objectStoreNames.contains(name))
          database.createObjectStore(name, { keyPath: 'id' })
      }
      if (oldVersion < 2) {
        // Only IDB request awaits: all migration writes belong to the upgrade transaction.
        void (async () => {
          const [favorites, profiles, turns, sessions] = await Promise.all([
            transaction.objectStore('favorites').getAll(),
            transaction.objectStore('profile').getAll(),
            transaction.objectStore('turns').getAll(),
            transaction.objectStore('sessions').getAll(),
          ])
          if (!favorites.length) return
          let profile = profiles[0]
          if (!profile) {
            const owners = [
              ...new Set(sessions.map((session) => session.profileId)),
            ]
            if (owners.length > 1)
              throw new Error('MIGRATION_PROFILE_AMBIGUOUS')
            profile = createGuestProfile(
              owners[0] ?? 'guest_recovered_favorites',
              favorites[0].createdAt,
            )
            await transaction.objectStore('profile').put(profile)
          }
          const notes: NotebookEntry[] = []
          for (const favorite of favorites) {
            const turn = turns.find((item) => item.id === favorite.turnId)
            const session = sessions.find((item) => item.id === turn?.sessionId)
            const note = noteFromFavorite(favorite, profile.id, turn, session)
            const index = notes.findIndex(
              (item) => item.normalizedText === note.normalizedText,
            )
            if (index === -1) notes.push(note)
            else notes[index] = mergeNote(notes[index], note)
          }
          for (const note of notes)
            await transaction.objectStore('notebook').put(note)
        })().catch((cause: unknown) => {
          const ambiguous =
            cause instanceof Error &&
            cause.message === 'MIGRATION_PROFILE_AMBIGUOUS'
          migrationFailure = new Error(
            ambiguous
              ? 'MIGRATION_PROFILE_AMBIGUOUS: 旧记录缺少个人资料且包含多个归属，无法自动迁移。原有数据已保留；请保留此浏览器数据并联系支持进行人工恢复，不要清空站点数据。'
              : 'DATABASE_MIGRATION_FAILED: 本地数据升级失败，原有数据已保留。请保留此浏览器数据并联系支持进行人工恢复，不要清空站点数据。',
            { cause },
          )
          try {
            transaction.abort()
          } catch {
            /* A failed request may already have aborted it. */
          }
        })
      }
    },
    blocked() {
      blocked = true
      rejectBlocked(
        new Error(
          'DATABASE_UPGRADE_BLOCKED: 请关闭其他 SpeakMate 页面后重试；数据未清空。',
        ),
      )
    },
    blocking() {
      void opening.then((database) => database.close()).catch(() => undefined)
      databasePromise = undefined
    },
    terminated() {
      databasePromise = undefined
    },
  })
  const pending = Promise.race([
    opening.then((database) => {
      if (blocked) {
        database.close()
        throw new Error('DATABASE_UPGRADE_BLOCKED')
      }
      return database
    }),
    blockedPromise,
  ]).catch((error: unknown) => {
    if (databasePromise === pending) databasePromise = undefined
    throw migrationFailure ?? error
  })
  databasePromise = pending
  return pending
}

export async function deleteDatabase(): Promise<void> {
  const database = await databasePromise?.catch(() => undefined)
  database?.close()
  databasePromise = undefined

  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('DATABASE_DELETE_BLOCKED'))
  })
}

export async function clearDatabase(): Promise<void> {
  const database = await getDatabase()
  const stores = STORE_NAMES
  const transaction = database.transaction([...stores], 'readwrite')
  await Promise.all([
    ...stores.map((store) => transaction.objectStore(store).clear()),
    transaction.done,
  ])
}
