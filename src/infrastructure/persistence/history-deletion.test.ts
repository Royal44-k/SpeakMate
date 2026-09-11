import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createMemoryRepositories,
  createIndexedDbRepositories,
} from './repositories'
import { deleteDatabase } from './db'
import golden from '../../../tests/fixtures/learner-export-v1.json'
import {
  goalFixture,
  sceneCandidate,
  completeWarmup,
  exhaust,
  goalAt,
} from './goal-fixtures'
import { createHistoryDeletion } from './history-deletion'
import {
  createMemoryStorage,
  createIndexedDbStorage,
  type LocalStoragePort,
} from './storage'
import { STORE_NAMES } from './db'

afterEach(async () => {
  vi.restoreAllMocks()
  await deleteDatabase()
})
describe.each([
  ['memory', createMemoryRepositories],
  ['indexeddb', createIndexedDbRepositories],
] as const)('%s history deletion', (_name, create) => {
  it('does not delete rows when an undo receipt cannot be allocated', async () => {
    const repo = create()
    await repo.restoreLearnerData(
      await repo.previewRestore(JSON.stringify(golden)),
    )
    const record = (await repo.practice.read(golden.sessions[0].id))!
    vi.spyOn(crypto, 'randomUUID').mockImplementationOnce(() => {
      throw new Error('receipt unavailable')
    })
    await expect(repo.sessions.deleteHistory(record)).rejects.toThrow(
      'receipt unavailable',
    )
    expect(await repo.sessions.get(record.session.id)).toEqual(record.session)
    expect(await repo.turns.listBySession(record.session.id)).toEqual(
      record.turns,
    )
  })
  it('rolls back delete and undo at the real write boundary and permits retry of its unchanged receipt', async () => {
    const repo = create()
    await repo.restoreLearnerData(
      await repo.previewRestore(JSON.stringify(golden)),
    )
    const before = await repo.exportLearnerData()
    const record = (await repo.practice.read(before.sessions[0].id))!
    let storage: LocalStoragePort = createIndexedDbStorage()
    let fail = true
    if (_name === 'memory') {
      const backing = createMemoryStorage()
      await backing.change((state) =>
        Object.assign(
          state,
          Object.fromEntries(
            STORE_NAMES.map((name) => [
              name,
              name === 'profile'
                ? [before.profile!]
                : name === 'settings'
                  ? before.settings
                    ? [before.settings]
                    : []
                  : before[name],
            ]),
          ),
        ),
      )
      storage = {
        read: backing.read,
        change: (update) =>
          backing.change((state) => {
            const result = update(state)
            if (fail) throw new Error('write boundary')
            return result
          }),
      }
    }
    const owner = createHistoryDeletion(storage)
    const initial = await storage.read((state) => state)
    const originalDelete = IDBObjectStore.prototype.delete
    const deleting = vi
      .spyOn(IDBObjectStore.prototype, 'delete')
      .mockImplementation(function (this: IDBObjectStore, key) {
        if (_name === 'indexeddb' && this.name === 'turns')
          throw new Error('write boundary')
        return originalDelete.call(this, key)
      })
    await expect(owner.deleteHistory(record)).rejects.toThrow('write boundary')
    expect(await storage.read((state) => state)).toEqual(initial)
    fail = false
    deleting.mockRestore()
    const receipt = await owner.deleteHistory(record)
    const deleted = await storage.read((state) => state)
    record.session.openingText = 'caller mutation after committed deletion'
    fail = true
    const originalPut = IDBObjectStore.prototype.put
    const putting = vi
      .spyOn(IDBObjectStore.prototype, 'put')
      .mockImplementation(function (this: IDBObjectStore, value, key) {
        if (_name === 'indexeddb' && this.name === 'turns')
          throw new Error('write boundary')
        return originalPut.call(this, value, key)
      })
    await expect(owner.undoDeleteHistory(receipt)).rejects.toThrow(
      'write boundary',
    )
    expect(await storage.read((state) => state)).toEqual(deleted)
    putting.mockRestore()
    fail = false
    await owner.undoDeleteHistory(receipt)
    expect(await storage.read((state) => state)).toEqual(initial)
  })
  it('bounds page-local receipts and rejects reused turn identities atomically', async () => {
    const repo = create()
    await repo.restoreLearnerData(
      await repo.previewRestore(JSON.stringify(golden)),
    )
    const record = (await repo.practice.read(golden.sessions[0].id))!
    const receipt = await repo.sessions.deleteHistory(record)
    await repo.sessions.save({ ...record.session, id: 'different-owner' })
    await repo.turns.save({ ...record.turns[0], sessionId: 'different-owner' })
    const newer = await repo.turns.listBySession('different-owner')
    await expect(repo.sessions.undoDeleteHistory(receipt)).rejects.toThrow(
      'HISTORY_UNDO_CONFLICT',
    )
    expect(await repo.turns.listBySession('different-owner')).toEqual(newer)
    await repo.clearLearnerData()
    await repo.restoreLearnerData(
      await repo.previewRestore(JSON.stringify(golden)),
    )
    const receipts: string[] = []
    for (let index = 0; index < 33; index++) {
      const session = { ...record.session, id: `bounded-${index}` }
      await repo.sessions.save(session)
      receipts.push(await repo.sessions.deleteHistory({ session, turns: [] }))
    }
    await expect(repo.sessions.undoDeleteHistory(receipts[0])).rejects.toThrow(
      'HISTORY_RECEIPT_INVALID',
    )
    await repo.sessions.undoDeleteHistory(receipts[32])
    expect(await repo.sessions.get('bounded-32')).toBeDefined()
  })
  it('deletes only confirmed fresh history and undoes exact rows, retaining notes and immutable learning through cold backup', async () => {
    const repo = create()
    await repo.restoreLearnerData(
      await repo.previewRestore(JSON.stringify(golden)),
    )
    const before = await repo.exportLearnerData()
    const record = (await repo.practice.read(before.sessions[0].id))!
    expect(typeof repo.sessions.deleteHistory).toBe('function')
    const receipt = await repo.sessions.deleteHistory(record)
    const after = await repo.exportLearnerData()
    expect(after.sessions).toEqual([])
    expect(after.turns).toEqual([])
    expect(after.notebook).toEqual(before.notebook)
    expect(after.favorites).toEqual(before.favorites)
    const cold = createMemoryRepositories()
    await cold.restoreLearnerData(
      await cold.previewRestore(JSON.stringify(after)),
    )
    expect((await cold.exportLearnerData()).notebook).toEqual(before.notebook)
    await repo.sessions.undoDeleteHistory(receipt)
    const restored = await repo.exportLearnerData()
    expect(restored.sessions).toEqual(before.sessions)
    expect(restored.turns).toEqual(before.turns)
    expect(restored.learningEvents).toEqual(before.learningEvents)
    await expect(repo.sessions.undoDeleteHistory(receipt)).rejects.toThrow(
      'HISTORY_RECEIPT_INVALID',
    )
  })
  it('rejects stale deletion, same-ID reuse and identity changes without touching newer rows', async () => {
    const repo = create()
    await repo.restoreLearnerData(
      await repo.previewRestore(JSON.stringify(golden)),
    )
    const old = (await repo.practice.read(golden.sessions[0].id))!
    await repo.sessions.save({
      ...old.session,
      updatedAt: '2026-09-12T00:00:00.000Z',
    })
    await expect(repo.sessions.deleteHistory(old)).rejects.toThrow(
      'HISTORY_STALE',
    )
    const current = (await repo.practice.read(old.session.id))!
    const receipt = await repo.sessions.deleteHistory(current)
    await repo.sessions.save({
      ...current.session,
      updatedAt: '2026-09-13T00:00:00.000Z',
    })
    await expect(repo.sessions.undoDeleteHistory(receipt)).rejects.toThrow(
      'HISTORY_UNDO_CONFLICT',
    )
    expect((await repo.sessions.get(old.session.id))?.updatedAt).toBe(
      '2026-09-13T00:00:00.000Z',
    )
    const next = await repo.sessions.deleteHistory(
      (await repo.practice.read(old.session.id))!,
    )
    await repo.clearLearnerData()
    await repo.profiles.ensureGuestProfile()
    await expect(repo.sessions.undoDeleteHistory(next)).rejects.toThrow(
      'HISTORY_UNDO_CONFLICT',
    )
    expect(await repo.sessions.list()).toEqual([])
  })
  it('does not stop or settle a deleted active task and retains existing grants on undo', async () => {
    const repo = create()
    const { profile, plan } = await goalFixture(repo)
    await completeWarmup(repo, plan)
    const candidate = await sceneCandidate(plan)
    await repo.practice.commit({
      kind: 'create',
      session: candidate,
      taskLaunch: { planId: plan.id, taskId: plan.tasks[1].id },
    })
    const before = await repo.learning.getState(profile.id)
    const receipt = await repo.sessions.deleteHistory(
      (await repo.practice.read(candidate.id))!,
    )
    expect(await repo.learning.getState(profile.id)).toEqual(before)
    await repo.sessions.undoDeleteHistory(receipt)
    expect((await repo.sessions.get(candidate.id))?.status).toBe('active')
    expect(await repo.learning.getState(profile.id)).toEqual(before)
    const terminal = await exhaust(repo, candidate, 30)
    await repo.practice.commit({
      kind: 'finish',
      expected: terminal,
      at: goalAt(40),
    })
    const completed = await repo.exportLearnerData()
    const finishedReceipt = await repo.sessions.deleteHistory(
      (await repo.practice.read(candidate.id))!,
    )
    const deletedCompleted = await repo.exportLearnerData()
    expect(deletedCompleted.learningEvents).toEqual(completed.learningEvents)
    expect(deletedCompleted.pointsLedger).toEqual(completed.pointsLedger)
    expect(deletedCompleted.dailyPlans).toEqual(completed.dailyPlans)
    const cold = createMemoryRepositories()
    await cold.restoreLearnerData(
      await cold.previewRestore(JSON.stringify(deletedCompleted)),
    )
    expect(await cold.learning.balance(profile.id)).toBe(
      await repo.learning.balance(profile.id),
    )
    await repo.sessions.undoDeleteHistory(finishedReceipt)
    expect((await repo.exportLearnerData()).sessions).toEqual(
      completed.sessions,
    )
    expect((await repo.exportLearnerData()).learningEvents).toEqual(
      completed.learningEvents,
    )
  })
})
