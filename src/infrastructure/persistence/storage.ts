import {
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

export function createIndexedDbStorage(): LocalStoragePort {
  async function transaction<T>(
    mode: 'readonly' | 'readwrite',
    operation: (state: DataState) => T,
  ): Promise<T> {
    const tx = (await getDatabase()).transaction([...STORE_NAMES], mode)
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
      if (result instanceof Promise)
        throw new Error('ASYNC_TRANSACTION_CALLBACK')
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
  return {
    read: (select) => transaction('readonly', select),
    change: (update) => transaction('readwrite', update),
  }
}

export function put<T extends { id: string }>(rows: T[], value: T): void {
  const index = rows.findIndex((item) => item.id === value.id)
  if (index === -1) rows.push(structuredClone(value))
  else rows[index] = structuredClone(value)
}
