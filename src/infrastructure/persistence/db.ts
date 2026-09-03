import { type DBSchema, type IDBPDatabase, openDB } from 'idb'

import type {
  FavoriteExpression,
  LearnerProfile,
  LearnerSettings,
} from '@/domain/learning/types'
import type { PracticeSession, PracticeTurn } from '@/domain/practice/types'

export const DATABASE_NAME = 'speakmate-v1'
export const DATABASE_VERSION = 1

export interface OutboxItem {
  id: string
  entityType: 'profile' | 'session' | 'turn' | 'favorite'
  entityId: string
  operation: 'upsert' | 'delete'
  createdAt: string
}

export interface SpeakMateDbSchema extends DBSchema {
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
  databasePromise ??= openDB<SpeakMateDbSchema>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('profile')) {
        database.createObjectStore('profile', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('sessions')) {
        const sessions = database.createObjectStore('sessions', { keyPath: 'id' })
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
    },
  })

  return databasePromise
}

export async function deleteDatabase(): Promise<void> {
  const database = await databasePromise
  database?.close()
  databasePromise = undefined

  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve()
  })
}
