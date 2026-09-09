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
    // Corpus edits do not change the historical scene-definition version.
    pack.contentVersion = 2
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
      sceneSnapshot: {
        id: 'dining-01',
        slug: 'coffee-order',
        version: 1,
        category: 'dining',
        level: 'A1',
        titleZh: '咖啡点单',
        titleEn: 'Coffee order',
        summaryZh: '历史场景定义快照',
        learnerRole: 'Customer',
        aiRole: 'Barista',
        estimatedMinutes: 3,
        recommendedTurns: 3,
        goals: [],
        keywords: [],
        exampleExpressions: ['An Americano, please.'],
        openingLines: ['What would you like?'],
        constraints: {
          minAiWords: 3,
          maxAiWords: 30,
          followUpStyle: 'short',
          feedbackFocus: 'clarity',
          strategy: 'simple choices',
          speechRate: 0.8,
        },
        image: { key: 'coffee-order', altZh: '咖啡', focalPoint: '50% 50%' },
        status: 'published',
      },
      gradedDialogue: run.snapshot,
    })
    const exported = await repository.exportLearnerData()
    expect(exported.sessions.find((s) => s.id === legacy.id)).toEqual(legacy)
    for (const kind of ['question', 'answer', 'variant'] as const) {
      const invalid = structuredClone(exported)
      const invalidSession = invalid.sessions.find(
        (s) => s.id === 'pilot-session',
      )!
      invalidSession.updatedAt = '2026-09-10T00:00:00.000Z'
      const selected = invalidSession.gradedDialogue!.pack
      if (kind === 'question') selected.questions[1].review.state = 'draft'
      if (kind === 'answer')
        selected.questions[1].answers[0].review.state = 'draft'
      if (kind === 'variant') selected.variants[0].review.state = 'draft'
      const before = await repository.exportLearnerData()
      await expect(
        repository.previewRestore(JSON.stringify(invalid)),
      ).rejects.toThrow(/DIALOGUE_UNREVIEWED.*未完成逐项模型辅助阅读/)
      const after = await repository.exportLearnerData()
      expect({ ...after, exportedAt: before.exportedAt }).toEqual(before)
    }
    const destination = createMemoryRepositories()
    await destination.restoreLearnerData(
      await destination.previewRestore(JSON.stringify(exported)),
    )
    expect(
      (await destination.exportLearnerData()).sessions.find(
        (s) => s.id === 'pilot-session',
      )?.gradedDialogue,
    ).toEqual(run.snapshot)
    const restoredPilot = (await destination.exportLearnerData()).sessions.find(
      (s) => s.id === 'pilot-session',
    )!
    expect(restoredPilot.sceneVersion).toBe(1)
    expect(restoredPilot.sceneSnapshot).toEqual(
      exported.sessions.find((s) => s.id === 'pilot-session')!.sceneSnapshot,
    )
    expect(restoredPilot.gradedDialogue?.pack.contentVersion).toBe(2)
    expect(restoredPilot.gradedDialogue?.state.contentVersion).toBe(2)
    const sceneMismatch = structuredClone(exported)
    const mismatchedSceneSession = sceneMismatch.sessions.find(
      (s) => s.id === 'pilot-session',
    )!
    mismatchedSceneSession.sceneVersion = 2
    mismatchedSceneSession.updatedAt = '2026-09-10T00:00:00.000Z'
    await expect(
      destination.previewRestore(JSON.stringify(sceneMismatch)),
    ).rejects.toThrow(/SCENE_SNAPSHOT_MISMATCH/)
    expect((await destination.exportLearnerData()).sessions).toEqual(
      exported.sessions,
    )
    const contentMismatch = JSON.parse(JSON.stringify(exported))
    contentMismatch.sessions.find(
      (s: { id: string }) => s.id === 'pilot-session',
    ).gradedDialogue.state.contentVersion = 1
    await expect(
      destination.previewRestore(JSON.stringify(contentMismatch)),
    ).rejects.toThrow(/DIALOGUE/)
    expect((await destination.exportLearnerData()).sessions).toEqual(
      exported.sessions,
    )
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
