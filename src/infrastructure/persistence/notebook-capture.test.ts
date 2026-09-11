import { afterEach, describe, expect, it } from 'vitest'
import type { NotebookEntry } from '@/domain/notebook/types'
import { deleteDatabase } from './db'
import {
  createMemoryRepositories,
  createIndexedDbRepositories,
} from './repositories'

const at = '2026-09-11T00:00:00.000Z'
function candidate(profileId: string, id = 'note-a'): NotebookEntry {
  return {
    id,
    profileId,
    kind: 'sentence',
    text: 'Could we test that assumption?',
    normalizedText: '',
    notes: '',
    tags: [],
    favoriteIds: [],
    createdAt: at,
    updatedAt: at,
    sources: [
      {
        id: `source-${id}`,
        kind: 'turn',
        originalText: 'Could we test that assumption?',
        sceneId: 'work-05',
        level: 'C1',
        sessionId: 'deleted-source',
        questionId: 'meeting-disagreement.C1.assumption',
        createdAt: at,
      },
    ],
  }
}
afterEach(deleteDatabase)
describe.each([
  ['memory', createMemoryRepositories],
  ['indexeddb', createIndexedDbRepositories],
] as const)('%s capture receipt', (_name, create) => {
  it('undoes a new capture without removing its retained data', async () => {
    const repo = create()
    const profile = await repo.profiles.ensureGuestProfile()
    expect(typeof repo.notebook.capture).toBe('function')
    const saved = await repo.notebook.capture(candidate(profile.id))
    expect(saved.duplicate).toBe(false)
    await repo.notebook.undoCapture(saved.receipt, '2026-09-11T01:00:00.000Z')
    expect(await repo.notebook.list()).toEqual([])
    expect(
      (await repo.notebook.get(saved.entry.id))?.sources[0].questionId,
    ).toBe('meeting-disagreement.C1.assumption')
  })
  it('merges only this capture source and undo preserves canonical text, notes and identity', async () => {
    const repo = create()
    const profile = await repo.profiles.ensureGuestProfile()
    const initial = await repo.notebook.save({
      ...candidate(profile.id),
      notes: 'My own explanation',
      tags: ['work'],
    })
    const saved = await repo.notebook.capture({
      ...candidate(profile.id, 'candidate-b'),
      text: 'COULD WE TEST THAT ASSUMPTION?',
      updatedAt: '2026-09-11T01:00:00.000Z',
    })
    expect(saved.entry.id).toBe(initial.id)
    expect(saved.duplicate).toBe(true)
    expect(saved.entry.notes).toBe('My own explanation')
    expect(saved.entry.text).toBe(initial.text)
    expect(saved.entry.sources).toHaveLength(2)
    await repo.notebook.undoCapture(saved.receipt, '2026-09-11T02:00:00.000Z')
    expect(await repo.notebook.get(initial.id)).toEqual(initial)
  })
  it('refuses stale and forged undo rather than overwriting a later edit', async () => {
    const repo = create()
    const profile = await repo.profiles.ensureGuestProfile()
    const saved = await repo.notebook.capture(candidate(profile.id))
    await repo.notebook.save({
      ...saved.entry,
      notes: 'Later edit',
      updatedAt: '2026-09-11T01:00:00.000Z',
    })
    await expect(
      repo.notebook.undoCapture(saved.receipt, '2026-09-11T02:00:00.000Z'),
    ).rejects.toThrow('CAPTURE_UNDO_CONFLICT')
    await expect(repo.notebook.undoCapture('forged', at)).rejects.toThrow(
      'CAPTURE_RECEIPT_INVALID',
    )
    expect((await repo.notebook.get(saved.entry.id))?.notes).toBe('Later edit')
  })
  it('does not let a mutated returned entry rewrite the private undo comparison snapshot', async () => {
    const repo = create()
    const profile = await repo.profiles.ensureGuestProfile()
    await repo.notebook.save(candidate(profile.id))
    const saved = await repo.notebook.capture(
      candidate(profile.id, 'new-source'),
    )
    const later = {
      ...saved.entry,
      notes: 'Concurrent edit',
      updatedAt: '2026-09-11T01:00:00.000Z',
    }
    await repo.notebook.save(later)
    Object.assign(saved.entry, later)
    await expect(
      repo.notebook.undoCapture(saved.receipt, '2026-09-11T02:00:00.000Z'),
    ).rejects.toThrow('CAPTURE_UNDO_CONFLICT')
    expect((await repo.notebook.get(saved.entry.id))?.notes).toBe(
      'Concurrent edit',
    )
  })
  it('round-trips optional question context to both destinations and accepts old snapshots without it', async () => {
    const repo = create()
    const profile = await repo.profiles.ensureGuestProfile()
    const saved = await repo.notebook.save(candidate(profile.id))
    const old = candidate(profile.id, 'legacy')
    old.text = 'Old source'
    delete old.sources[0].questionId
    await repo.notebook.save(old)
    const backup = JSON.stringify(await repo.exportLearnerData())
    for (const make of [
      createMemoryRepositories,
      createIndexedDbRepositories,
    ]) {
      const destination = make()
      await destination.clearLearnerData()
      await destination.restoreLearnerData(
        await destination.previewRestore(backup),
      )
      expect(
        (await destination.notebook.get(saved.id))?.sources[0].questionId,
      ).toBe('meeting-disagreement.C1.assumption')
      expect(
        (await destination.notebook.get('legacy'))?.sources[0].questionId,
      ).toBeUndefined()
    }
    const invalid = candidate(profile.id, 'invalid')
    invalid.sources[0].questionId = ''
    await expect(repo.notebook.save(invalid)).rejects.toThrow()
  })
})
