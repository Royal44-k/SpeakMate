import { afterEach, describe, expect, it } from 'vitest'
import golden from '../../../tests/fixtures/learner-export-v1.json'
import {
  createMemoryRepositories,
  createIndexedDbRepositories,
} from './repositories'
import { deleteDatabase } from './db'
import { localContentProvider } from '@/content/dialogues/graded/provider'
import { createDialogue, advanceDialogue } from '@/domain/ai/graded-dialogue'

afterEach(async () => {
  await deleteDatabase()
})

describe.each([
  ['memory', createMemoryRepositories],
  ['indexeddb', createIndexedDbRepositories],
] as const)('%s graded snapshots', (_name, create) => {
  it('round-trips a pinned selected pack and state without changing a legacy golden record', async () => {
    const repository = create()
    await repository.restoreLearnerData(
      await repository.previewRestore(JSON.stringify(golden)),
    )
    const legacy = (await repository.exportLearnerData()).sessions[0]
    const loaded = await localContentProvider.load({
      sceneId: 'dining-01',
      level: 'A1',
    })
    if (loaded.status !== 'available') throw Error('missing')
    const pack = loaded.pack
    const started = createDialogue(pack, {
      mode: 'short',
      variantId: 'counter',
    })
    const run = advanceDialogue(started.snapshot, {
      text: 'An Americano, please.',
    })
    await repository.sessions.save({
      ...legacy,
      id: 'pilot-session',
      level: 'A1',
      sceneVersion: 1,
      sceneSnapshot: undefined,
      gradedDialogue: run.snapshot,
    })
    const exported = await repository.exportLearnerData()
    expect(exported.sessions.find((s) => s.id === legacy.id)).toEqual(legacy)
    const destination = createMemoryRepositories()
    await destination.restoreLearnerData(
      await destination.previewRestore(JSON.stringify(exported)),
    )
    expect(
      (await destination.exportLearnerData()).sessions.find(
        (s) => s.id === 'pilot-session',
      )?.gradedDialogue,
    ).toEqual(run.snapshot)
    const corrupt = JSON.parse(JSON.stringify(exported))
    corrupt.sessions.find(
      (s: { id: string }) => s.id === 'pilot-session',
    ).gradedDialogue.state.completedObjectives = ['drink', 'size']
    await expect(
      destination.previewRestore(JSON.stringify(corrupt)),
    ).rejects.toThrow(/DIALOGUE/)
    expect((await destination.exportLearnerData()).sessions).toEqual(
      exported.sessions,
    )
    corrupt.sessions.find(
      (s: { id: string }) => s.id === 'pilot-session',
    ).gradedDialogue.state.engineVersion = 2
    await expect(
      destination.previewRestore(JSON.stringify(corrupt)),
    ).rejects.toThrow()
    expect((await destination.exportLearnerData()).sessions).toEqual(
      exported.sessions,
    )
    const mismatch = JSON.parse(JSON.stringify(exported))
    mismatch.sessions.find(
      (s: { id: string }) => s.id === 'pilot-session',
    ).level = 'C1'
    await expect(
      destination.previewRestore(JSON.stringify(mismatch)),
    ).rejects.toThrow(/GRADED_SNAPSHOT_MISMATCH/)
  })
})
