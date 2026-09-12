import { openDB } from 'idb'
import { afterEach, expect, it, vi } from 'vitest'
import golden from '../../../tests/fixtures/learner-export-v1.json'
import { DATABASE_NAME, deleteDatabase, STORE_NAMES } from './db'
import { createIndexedDbRepositories } from './repositories'
import { createRecoveryReadStorage } from './storage'
import { exportLearnerData } from './backup'

afterEach(async () => {
  await deleteDatabase()
  vi.restoreAllMocks()
})

it('exports the same complete schema2 data using only readonly transactions and closes its connection', async () => {
  const repo = createIndexedDbRepositories()
  await repo.restoreLearnerData(
    await repo.previewRestore(JSON.stringify(golden)),
  )
  const expected = await repo.exportLearnerData()
  const transaction = vi.spyOn(IDBDatabase.prototype, 'transaction')
  const close = vi.spyOn(IDBDatabase.prototype, 'close')
  const storage = createRecoveryReadStorage()
  expect(Object.keys(storage)).toEqual(['read'])
  const actual = await exportLearnerData(storage)
  expect({ ...actual, exportedAt: expected.exportedAt }).toEqual(expected)
  expect(transaction.mock.calls.map((args) => args[1])).toEqual(['readonly'])
  expect(close).toHaveBeenCalledOnce()
  const after = await repo.exportLearnerData()
  expect({ ...after, exportedAt: expected.exportedAt }).toEqual(expected)
})

it('refuses missing databases without creating one', async () => {
  await expect(exportLearnerData(createRecoveryReadStorage())).rejects.toThrow(
    'RECOVERY_DATABASE_MISSING',
  )
  expect(
    (await indexedDB.databases()).some((db) => db.name === DATABASE_NAME),
  ).toBe(false)
})

it.each([1, 3])(
  'refuses existing version %s without upgrading or changing stores',
  async (version) => {
    const old = await openDB(DATABASE_NAME, version, {
      upgrade(db) {
        db.createObjectStore('untouched', { keyPath: 'id' })
      },
    })
    await old.put('untouched', { id: 'synthetic', text: 'preserve exactly' })
    old.close()
    await expect(
      exportLearnerData(createRecoveryReadStorage()),
    ).rejects.toThrow('RECOVERY_DATABASE_VERSION')
    const reopened = await openDB(DATABASE_NAME)
    expect(reopened.version).toBe(version)
    expect([...reopened.objectStoreNames]).toEqual(['untouched'])
    expect(await reopened.getAll('untouched')).toEqual([
      { id: 'synthetic', text: 'preserve exactly' },
    ])
    reopened.close()
  },
)

it('refuses incomplete schema2 and preserves corrupt supported records rather than repairing them', async () => {
  const incomplete = await openDB(DATABASE_NAME, 2, {
    upgrade(db) {
      db.createObjectStore('profile', { keyPath: 'id' })
    },
  })
  incomplete.close()
  await expect(exportLearnerData(createRecoveryReadStorage())).rejects.toThrow(
    'RECOVERY_DATABASE_STORES',
  )
  await deleteDatabase()
  const corrupt = await openDB(DATABASE_NAME, 2, {
    upgrade(db) {
      for (const name of STORE_NAMES)
        db.createObjectStore(name, { keyPath: 'id' })
    },
  })
  await corrupt.put('profile', { id: 'corrupt' })
  await expect(exportLearnerData(createRecoveryReadStorage())).rejects.toThrow()
  expect(await corrupt.getAll('profile')).toEqual([{ id: 'corrupt' }])
  corrupt.close()
})
