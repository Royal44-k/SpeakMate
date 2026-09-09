import { openDB } from 'idb'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DATABASE_NAME, deleteDatabase, getDatabase } from './db'
import {
  createIndexedDbRepositories,
  createMemoryRepositories,
} from './repositories'
import golden from '../../../tests/fixtures/learner-export-v1.json'

afterEach(async () => {
  await deleteDatabase()
  vi.restoreAllMocks()
})

describe('v1 upgrade safety', () => {
  it('rolls back an aborted upgrade without losing v1 data, then retries after the source conflict is resolved', async () => {
    const old = await openDB(DATABASE_NAME, 1, {
      upgrade(db) {
        for (const name of [
          'profile',
          'settings',
          'sessions',
          'turns',
          'favorites',
          'outbox',
        ])
          db.createObjectStore(name, { keyPath: 'id' })
      },
    })
    await old.put('sessions', golden.sessions[0])
    await old.put('sessions', {
      ...golden.sessions[0],
      id: 'ambiguous_session',
      profileId: 'another_owner',
    })
    await old.put('favorites', golden.favorites[0])
    old.close()
    await expect(getDatabase()).rejects.toThrow()
    const stillV1 = await openDB(DATABASE_NAME, 1)
    expect(stillV1.objectStoreNames.contains('notebook')).toBe(false)
    expect(await stillV1.count('sessions')).toBe(2)
    expect(await stillV1.count('favorites')).toBe(1)
    await stillV1.delete('sessions', 'ambiguous_session')
    stillV1.close()
    expect((await getDatabase()).version).toBe(2)
    expect(await (await getDatabase()).count('notebook')).toBe(1)
  })

  it('reports a blocked upgrade, then retries successfully after the other tab closes', async () => {
    const old = await openDB(DATABASE_NAME, 1)
    await expect(getDatabase()).rejects.toThrow('DATABASE_UPGRADE_BLOCKED')
    old.close()
    const retry = await getDatabase()
    expect(retry.version).toBe(2)
  })

  it('does not retain a rejected opening promise', async () => {
    const original = indexedDB.open.bind(indexedDB)
    const open = vi.spyOn(indexedDB, 'open').mockImplementationOnce(() => {
      throw new DOMException('storage denied', 'SecurityError')
    })
    await expect(Promise.resolve().then(() => getDatabase())).rejects.toThrow(
      'storage denied',
    )
    open.mockImplementation(original)
    expect((await getDatabase()).version).toBe(2)
  })

  it('preserves the exact golden C1 profile, active coffee session and settings, with one durable migrated note', async () => {
    const old = await openDB(DATABASE_NAME, 1, {
      upgrade(db) {
        for (const store of ['profile', 'settings', 'favorites', 'outbox'])
          db.createObjectStore(store, { keyPath: 'id' })
        const sessions = db.createObjectStore('sessions', { keyPath: 'id' })
        sessions.createIndex('by-status', 'status')
        sessions.createIndex('by-updated-at', 'updatedAt')
        db.createObjectStore('turns', { keyPath: 'id' }).createIndex(
          'by-session',
          'sessionId',
        )
      },
    })
    await old.put('profile', golden.profile)
    await old.put('settings', golden.settings)
    await old.put('sessions', golden.sessions[0])
    await old.put('turns', golden.turns[0])
    await old.put('favorites', golden.favorites[0])
    old.close()
    const db = await getDatabase()
    expect(db.version).toBe(2)
    expect(await db.get('profile', 'guest_migration_fixture')).toMatchObject({
      level: 'C1',
      dailyMinutes: 15,
    })
    expect(await db.get('sessions', 'session_migration_fixture')).toMatchObject(
      { status: 'active', sceneId: 'dining-01' },
    )
    expect(await db.get('settings', 'settings')).toMatchObject({
      speechRate: 0.85,
      autoPlayAi: false,
      feedbackExpanded: true,
    })
    const notes = await db.getAll('notebook')
    expect(notes).toHaveLength(1)
    expect(notes[0]).toMatchObject({
      text: 'Could I get an oat-milk latte to go, please?',
      favoriteIds: ['favorite_migration_fixture'],
    })
    db.close()
    vi.resetModules()
    const reopened = await (await import('./db')).getDatabase()
    expect(await reopened.getAll('notebook')).toHaveLength(1)
    reopened.close()
  })

  it('serializes concurrent first-use identity creation in independent callers', async () => {
    const a = createIndexedDbRepositories()
    vi.resetModules()
    const b = (await import('./repositories')).createIndexedDbRepositories()
    const [first, second] = await Promise.all([
      a.profiles.ensureGuestProfile(),
      b.profiles.ensureGuestProfile(),
    ])
    expect(first.id).toBe(second.id)
    expect(await (await getDatabase()).count('profile')).toBe(1)
    ;(await (await import('./db')).getDatabase()).close()
  })
})

describe.each([
  ['memory', createMemoryRepositories],
  ['indexeddb', createIndexedDbRepositories],
] as const)('%s notebook bridge', (_name, create) => {
  it('captures available live turn context and level in new favorite sources', async () => {
    const repository = create()
    const profile = await repository.profiles.ensureGuestProfile()
    await repository.saveTurnAndSession(golden.turns[0], {
      ...golden.sessions[0],
      profileId: profile.id,
      level: 'C1',
      status: 'active',
    })
    await repository.favorites.save(golden.favorites[0])
    expect((await repository.notebook.list())[0].sources[0]).toMatchObject({
      level: 'C1',
      sessionId: 'session_migration_fixture',
      learnerText: 'Could I have an oat-milk latte to go, please?',
    })
  })

  it('refuses runtime audio fields and malformed edits before storage is changed', async () => {
    const repository = create()
    const profile = await repository.profiles.ensureGuestProfile()
    await expect(
      repository.sessions.save({
        ...golden.sessions[0],
        profileId: profile.id,
        level: 'C1',
        status: 'active',
        audio: new Blob(['recording']),
      } as never),
    ).rejects.toThrow()
    expect(await repository.sessions.list()).toEqual([])
    await repository.favorites.save({ ...golden.favorites[0] })
    const note = (await repository.notebook.list())[0]
    await expect(
      repository.notebook.save({ ...note, updatedAt: 'not-an-iso-date' }),
    ).rejects.toThrow()
    expect((await repository.notebook.list())[0].updatedAt).toBe(
      '2026-09-08T15:58:10.000Z',
    )
  })

  it('merges case/space/boundary-punctuation duplicates without losing original text; delete/undo stays stable', async () => {
    const repository = create()
    await repository.profiles.ensureGuestProfile()
    await repository.favorites.save({
      id: 'favorite_a',
      expression: ' Hello there! ',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    })
    await repository.favorites.save({
      id: 'favorite_b',
      expression: 'hello   there',
      createdAt: '2026-09-02T00:00:00.000Z',
      updatedAt: '2026-09-02T00:00:00.000Z',
    })
    expect(repository.notebook).toBeDefined()
    const notes = await repository.notebook.list()
    expect(notes).toHaveLength(1)
    expect(
      notes[0].sources.map((source) => source.originalText).sort(),
    ).toEqual([' Hello there! ', 'hello   there'])
    await repository.notebook.save({
      ...notes[0],
      notes: 'personal edit',
      updatedAt: '2026-09-03T00:00:00.000Z',
    })
    await repository.notebook.remove(notes[0].id, '2026-09-04T00:00:00.000Z')
    expect(await repository.notebook.list()).toEqual([])
    expect(await repository.favorites.list()).toEqual([])
    await repository.notebook.restore(notes[0].id, '2026-09-05T00:00:00.000Z')
    expect((await repository.notebook.list())[0].notes).toBe('personal edit')
    expect(
      (await repository.favorites.list()).map((favorite) => favorite.id).sort(),
    ).toEqual(['favorite_a', 'favorite_b'])
  })

  it('does not let repeated compatibility saves overwrite an edited note bridge', async () => {
    const repository = create()
    await repository.profiles.ensureGuestProfile()
    const favorite = {
      id: 'favorite_edit',
      expression: 'Original text.',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    }
    await repository.favorites.save(favorite)
    const note = (await repository.notebook.list())[0]
    await repository.notebook.save({
      ...note,
      text: 'Edited display.',
      updatedAt: '2026-09-02T00:00:00.000Z',
    })
    await repository.favorites.save(favorite)
    expect((await repository.favorites.list())[0].expression).toBe(
      'Edited display.',
    )
    expect((await repository.notebook.list())[0].sources[0].originalText).toBe(
      'Original text.',
    )
  })

  it('compares ISO offsets by actual time when choosing the newer note', async () => {
    const repository = create()
    await repository.profiles.ensureGuestProfile()
    await repository.favorites.save({
      id: 'offset_note',
      expression: 'Newest text.',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T12:00:00.000Z',
    })
    const note = (await repository.notebook.list())[0]
    await repository.notebook.save({
      ...note,
      text: 'Older edit.',
      updatedAt: '2026-09-01T15:00:00+08:00',
    })
    expect((await repository.notebook.list())[0].text).toBe('Newest text.')
  })
})
