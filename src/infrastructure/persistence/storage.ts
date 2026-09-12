import { openDB, type IDBPDatabase } from 'idb'
import {
  DATABASE_NAME,
  getDatabase,
  STORE_NAMES,
  type SpeakMateDbSchema,
  type StoreName,
} from './db'

export type DataState = { [K in StoreName]: SpeakMateDbSchema[K]['value'][] }
export interface LocalStoragePort {
  read<T>(select: (state: DataState) => T): Promise<T>
  change<T>(update: (state: DataState) => T): Promise<T>
}
export function emptyState(): DataState {
  return {
    profile: [],
    sessions: [],
    turns: [],
    favorites: [],
    settings: [],
    outbox: [],
    notebook: [],
    reviews: [],
    dailyPlans: [],
    learningEvents: [],
    pointsLedger: [],
    rewardUnlocks: [],
  }
}

export function createMemoryStorage(): LocalStoragePort {
  let state = emptyState()
  return {
    async read(select) {
      return structuredClone(select(structuredClone(state)))
    },
    async change(update) {
      const draft = structuredClone(state)
      const result = update(draft)
      if (result instanceof Promise)
        throw new Error('ASYNC_TRANSACTION_CALLBACK')
      state = draft
      return structuredClone(result)
    },
  }
}

async function transaction<T>(
  database: IDBPDatabase<SpeakMateDbSchema>,
  mode: 'readonly' | 'readwrite',
  operation: (state: DataState) => T,
): Promise<T> {
  const tx = database.transaction([...STORE_NAMES], mode)
  const writes: Promise<unknown>[] = []
  // Attach immediately: a synchronous put failure can abort earlier requests.
  void tx.done.catch(() => undefined)
  try {
    const rows = await Promise.all(
      STORE_NAMES.map((name) => tx.objectStore(name).getAll()),
    )
    const state = Object.fromEntries(
      STORE_NAMES.map((name, index) => [name, rows[index]]),
    ) as DataState
    const before = structuredClone(state)
    const result = operation(state)
    if (result instanceof Promise) throw new Error('ASYNC_TRANSACTION_CALLBACK')
    if (mode === 'readwrite') {
      for (const name of STORE_NAMES) {
        const old = new Map(
          before[name].map((value) => [value.id, JSON.stringify(value)]),
        )
        const current = new Set(state[name].map((value) => value.id))
        for (const id of old.keys())
          if (!current.has(id)) writes.push(tx.objectStore(name).delete!(id))
        for (const value of state[name])
          if (old.get(value.id) !== JSON.stringify(value))
            writes.push(tx.objectStore(name).put!(value))
      }
      await Promise.all(writes)
    }
    await tx.done
    return structuredClone(result)
  } catch (error) {
    try {
      tx.abort()
    } catch {
      /* Already aborted by IndexedDB. */
    }
    await Promise.allSettled(writes)
    await tx.done.catch(() => undefined)
    throw error
  }
}
export function createIndexedDbStorage(): LocalStoragePort {
  return {
    read: async (select) =>
      transaction(await getDatabase(), 'readonly', select),
    change: async (update) =>
      transaction(await getDatabase(), 'readwrite', update),
  }
}

/** Recovery never calls the migrating opener and never exposes a write port. */
export function createRecoveryReadStorage(): Pick<LocalStoragePort, 'read'> {
  return {
    async read(select) {
      let missing = false
      const database = await openDB<SpeakMateDbSchema>(
        DATABASE_NAME,
        undefined,
        {
          upgrade(_db, _old, _next, tx) {
            missing = true
            void tx.done.catch(() => undefined)
            tx.abort()
          },
        },
      ).catch((cause: unknown) => {
        if (missing)
          throw new Error(
            'RECOVERY_DATABASE_MISSING: 没有现存数据库；未创建或升级数据。',
          )
        throw cause
      })
      try {
        if (database.version !== 2)
          throw new Error(
            'RECOVERY_DATABASE_VERSION: 只读恢复仅支持已升级的版本 2；原数据库未修改。',
          )
        if (
          database.objectStoreNames.length !== STORE_NAMES.length ||
          STORE_NAMES.some((name) => !database.objectStoreNames.contains(name))
        )
          throw new Error(
            'RECOVERY_DATABASE_STORES: 数据存储区不完整；没有修复或修改原数据。',
          )
        return await transaction(database, 'readonly', select)
      } finally {
        database.close()
      }
    },
  }
}

export function put<T extends { id: string }>(rows: T[], value: T): void {
  const index = rows.findIndex((item) => item.id === value.id)
  if (index === -1) rows.push(structuredClone(value))
  else rows[index] = structuredClone(value)
}
