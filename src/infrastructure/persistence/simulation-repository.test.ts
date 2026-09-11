import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/content/v1/[category]/route'
import { createDialogue } from '@/domain/ai/graded-dialogue'
import { projectMicroPractice } from '@/content/micro-practice'
import type { PracticeSession } from '@/domain/practice/types'
import {
  newSimulation,
  simulationOptions,
} from '@/features/notebook/simulation-material'
import { deleteDatabase } from './db'
import {
  createMemoryRepositories,
  createIndexedDbRepositories,
  type Repositories,
} from './repositories'
const at = (n: number) => `2026-09-11T01:00:${String(n).padStart(2, '0')}.000Z`
async function fixture(repo: Repositories) {
  const profile = await repo.profiles.ensureGuestProfile()
  const source = {
    id: 'shared-source',
    kind: 'turn' as const,
    originalText: 'Could we test that assumption?',
    sceneId: 'work-05',
    level: 'C1' as const,
    questionId: 'meeting-disagreement.C1.assumption',
    sessionId: 'deleted-original',
    createdAt: at(0),
  }
  const note = await repo.notebook.save({
    id: 'canonical-note',
    profileId: profile.id,
    kind: 'sentence',
    text: source.originalText,
    normalizedText: '',
    notes: '',
    tags: [],
    favoriteIds: [],
    sources: [source],
    createdAt: at(0),
    updatedAt: at(0),
  })
  const data = await (
    await GET(new Request('https://local.test'), {
      params: Promise.resolve({ category: 'work' }),
    })
  ).json()
  const descriptor = data.microPractices.find(
    (d: { id: string }) => d.id === 'micro.work.meeting.test-assumption.C1',
  )
  const analysis = data.analyses.find(
    (a: { id: string }) => a.id === descriptor.analysisEntryId,
  )
  const sourcePack = data.packs.find(
    (p: { sceneId: string; level: string }) =>
      p.sceneId === 'work-05' && p.level === 'C1',
  )
  const start = createDialogue(projectMicroPractice(sourcePack, descriptor), {
    mode: 'short',
    variantId: descriptor.sourceVariantId,
  })
  const example = analysis.examples.find(
    (example: { level: string }) => example.level === 'C1',
  )
  const session: PracticeSession = {
    id: 'simulation-one',
    profileId: profile.id,
    sceneId: 'work-05',
    sceneVersion: 1,
    level: 'C1',
    status: 'active',
    startedAt: at(1),
    updatedAt: at(1),
    completedGoals: [],
    openingText: start.reply,
    gradedDialogue: start.snapshot,
    simulation: {
      schemaVersion: 1,
      noteIds: [note.id],
      source: {
        noteId: note.id,
        sourceId: source.id,
        snapshot: source,
        noteText: note.text,
        noteKind: note.kind,
      },
      returnTo: '/notebook/note?id=canonical-note',
      descriptor,
      target: {
        coverage: 'exact',
        text: note.text,
        kind: note.kind,
        meaningZh: analysis.meaningZh,
        example: example.text,
        substitution: example.substitution,
      },
    },
  }
  return { session, material: { analysis, sourcePack, descriptor }, note }
}
afterEach(deleteDatabase)

it('rolls back an IndexedDB recall write failure, then retries the exact same phase once', async () => {
  const repo = createIndexedDbRepositories()
  const { session, material } = await fixture(repo)
  const current = (
    await repo.practice.commit({
      kind: 'create',
      session,
      simulationMaterial: material,
    })
  ).record.session
  const request = {
    kind: 'recall' as const,
    expected: current,
    text: 'A genuine recall attempt',
    at: at(2),
  }
  const original = IDBObjectStore.prototype.put
  const spy = vi
    .spyOn(IDBObjectStore.prototype, 'put')
    .mockImplementation(function (this: IDBObjectStore, value, key) {
      const result = original.call(this, value, key)
      if (this.name === 'sessions')
        throw new DOMException('quota', 'QuotaExceededError')
      return result
    })
  try {
    await expect(repo.practice.commit(request)).rejects.toThrow('quota')
    expect((await repo.practice.read(current.id))!.session).toEqual(current)
  } finally {
    spy.mockRestore()
  }
  expect((await repo.practice.commit(request)).applied).toBe(true)
  expect((await repo.practice.commit(request)).applied).toBe(false)
  expect((await repo.exportLearnerData()).learningEvents).toEqual([])
})
describe.each([
  ['memory', createMemoryRepositories],
  ['indexeddb', createIndexedDbRepositories],
] as const)('%s simulation phases', (_name, make) => {
  it('round-trips all five v2 targets and their old v1 snapshots through both cold adapters, rejecting malformed overrides', async () => {
    const repo = make()
    const profile = await repo.profiles.ensureGuestProfile()
    const legacySessions: PracticeSession[] = []
    for (const level of ['A1', 'A2', 'B1', 'B2', 'C1'] as const) {
      const text = ['A1', 'A2'].includes(level)
        ? 'on the side'
        : 'No chilli, please.'
      const source = {
        id: `source-${level}`,
        kind: 'turn' as const,
        originalText: text,
        sceneId: 'dining-02',
        level,
        createdAt: at(0),
      }
      const note = await repo.notebook.save({
        id: `note-${level}`,
        profileId: profile.id,
        text,
        kind: text === 'on the side' ? 'phrase' : 'sentence',
        normalizedText: '',
        notes: '',
        tags: [],
        favoriteIds: [],
        sources: [source],
        createdAt: at(0),
        updatedAt: at(0),
      })
      const [option] = await simulationOptions(note, source, async () =>
        GET(new Request('https://local.test'), {
          params: Promise.resolve({ category: 'dining' }),
        }),
      )
      if (option.descriptor.version !== 2) throw Error('fixture')
      const session = newSimulation(note, source, option)
      await repo.practice.commit({
        kind: 'create',
        session,
        simulationMaterial: option,
      })
      const { targetQuestionOverride: _override, ...rest } = option.descriptor
      expect(_override.id).toBe(`restaurant-order.${level}.chilli`)
      legacySessions.push(
        newSimulation(note, source, {
          ...option,
          descriptor: { ...rest, version: 1 },
        }),
      )
    }
    const backup = await repo.exportLearnerData()
    const both = {
      ...backup,
      sessions: [...backup.sessions, ...legacySessions],
    }
    for (const makeDestination of [
      createMemoryRepositories,
      createIndexedDbRepositories,
    ]) {
      const destination = makeDestination()
      await destination.clearLearnerData()
      await destination.restoreLearnerData(
        await destination.previewRestore(JSON.stringify(both)),
      )
      expect((await destination.exportLearnerData()).sessions).toHaveLength(
        both.sessions.length,
      )
      for (const session of both.sessions)
        expect((await destination.practice.read(session.id))!.session).toEqual(
          session,
        )
      for (const mutation of [
        'missing',
        'wrong-fact',
        'wrong-intent',
        'wrong-pack',
        'draft',
        'v1-extra',
      ] as const) {
        const bad = structuredClone(both)
        const session = bad.sessions[0]
        const desc = session.simulation!.descriptor
        if (desc.version !== 2) throw Error('fixture')
        if (mutation === 'missing')
          Reflect.deleteProperty(desc, 'targetQuestionOverride')
        if (mutation === 'wrong-fact')
          desc.targetQuestionOverride.answers[0].effects[0].key = 'meal'
        if (mutation === 'wrong-intent')
          desc.targetQuestionOverride.intent = 'other'
        if (mutation === 'draft')
          desc.targetQuestionOverride.answers[0].review.state = 'draft'
        if (mutation === 'v1-extra') Reflect.set(desc, 'version', 1)
        if (mutation === 'wrong-pack')
          session.gradedDialogue!.pack.questions.at(-1)!.answers[0].text =
            'Unrelated answer'
        await expect(
          destination.previewRestore(JSON.stringify(bad)),
        ).rejects.toThrow()
      }
    }
  })
  it('guards actual recall then composition before application, persists exact evidence and finishes without an empty award event', async () => {
    const repo = make()
    const { session, material } = await fixture(repo)
    let current = (
      await repo.practice.commit({
        kind: 'create',
        session,
        simulationMaterial: material,
      })
    ).record.session
    await expect(
      repo.practice.commit({
        kind: 'advance',
        expected: current,
        turnId: 'skip',
        input: { text: 'skip' },
        at: at(2),
      }),
    ).rejects.toThrow('SIMULATION_PHASE')
    await expect(
      repo.practice.commit({
        kind: 'compose',
        expected: current,
        text: 'a sentence',
        at: at(2),
      }),
    ).rejects.toThrow('SIMULATION_PHASE')
    const recall = {
      kind: 'recall' as const,
      expected: current,
      text: 'Could we test that assumption?',
      at: at(2),
    }
    current = (await repo.practice.commit(recall)).record.session
    expect((await repo.practice.commit(recall)).applied).toBe(false)
    current = (
      await repo.practice.commit({
        kind: 'compose',
        expected: current,
        text: 'Could we test the main assumption first?',
        at: at(3),
      })
    ).record.session
    const retained = structuredClone(current.simulation)
    for (let n = 4; n < 7; n++) {
      const snap = current.gradedDialogue!
      const q = snap.pack.questions.find(
        (q) => q.id === snap.state.currentQuestionId,
      )!
      current = (
        await repo.practice.commit({
          kind: 'advance',
          expected: current,
          turnId: `turn-${n}`,
          input: { text: q.answers[0].text },
          at: at(n),
        })
      ).record.session
    }
    current = (
      await repo.practice.commit({
        kind: 'finish',
        expected: current,
        at: at(7),
      })
    ).record.session
    expect(current.simulation).toEqual(retained)
    expect(current.completionEvidence?.requiredUserTurns).toBe(3)
    const backup = await repo.exportLearnerData()
    expect(backup.learningEvents).toHaveLength(1)
    expect(backup.learningEvents[0]).toMatchObject({
      type: 'simulation-completed',
      sessionId: current.id,
      compositionText: current.simulation?.composition?.text,
      evidence: current.completionEvidence,
    })
    expect(backup.pointsLedger).toEqual([])
    const missingEvidence = structuredClone(backup)
    delete missingEvidence.sessions[0].completionEvidence
    await expect(
      repo.previewRestore(JSON.stringify(missingEvidence)),
    ).rejects.toThrow()
    for (const makeDestination of [
      createMemoryRepositories,
      createIndexedDbRepositories,
    ]) {
      const destination = makeDestination()
      await destination.clearLearnerData()
      await destination.restoreLearnerData(
        await destination.previewRestore(JSON.stringify(backup)),
      )
      expect((await destination.practice.read(current.id))?.session).toEqual(
        current,
      )
    }
    await expect(
      repo.sessions.save({ ...current, simulation: undefined }),
    ).rejects.toThrow('GUARDED_WRITE_REQUIRED')
  })
  it('binds canonical note plus source, refuses unknown material, and rejects forged phase/time/descriptor backup', async () => {
    const repo = make()
    const { session, material, note } = await fixture(repo)
    await repo.notebook.save({
      ...note,
      id: 'other-note',
      text: 'Other text',
      normalizedText: '',
      sources: [{ ...note.sources[0], sceneId: 'work-01' }],
    })
    await expect(
      repo.practice.commit({
        kind: 'create',
        session: {
          ...session,
          simulation: {
            ...session.simulation!,
            source: { ...session.simulation!.source, noteId: 'other-note' },
          },
        },
        simulationMaterial: material,
      }),
    ).rejects.toThrow()
    await expect(
      repo.practice.commit({
        kind: 'create',
        session,
        simulationMaterial: {
          ...material,
          analysis: { ...material.analysis, forms: ['Unrelated'] },
        },
      }),
    ).rejects.toThrow('SIMULATION_SOURCE')
    await expect(
      repo.practice.commit({
        kind: 'create',
        session,
        simulationMaterial: {
          ...material,
          sourcePack: session.gradedDialogue!.pack,
        },
      }),
    ).rejects.toThrow('SIMULATION_SOURCE')
    await repo.practice.commit({
      kind: 'create',
      session,
      simulationMaterial: material,
    })
    const backup = await repo.exportLearnerData()
    backup.sessions[0].simulation!.composition = {
      text: 'forged',
      completedAt: at(0),
    }
    await expect(repo.previewRestore(JSON.stringify(backup))).rejects.toThrow()
  })
  it('resumes pinned recall in both cold destinations and refuses stale compose/stop without changing the saved head', async () => {
    const repo = make()
    const { session, material } = await fixture(repo)
    const creation = {
      kind: 'create' as const,
      session,
      simulationMaterial: material,
    }
    const initial = (await repo.practice.commit(creation)).record.session
    const recall = {
      kind: 'recall' as const,
      expected: initial,
      text: 'My actual recall',
      at: at(2),
    }
    const head = (await repo.practice.commit(recall)).record.session
    expect((await repo.practice.commit(creation)).record.session).toEqual(head)
    const backup = JSON.stringify(await repo.exportLearnerData())
    for (const makeDestination of [
      createMemoryRepositories,
      createIndexedDbRepositories,
    ]) {
      const destination = makeDestination()
      await destination.clearLearnerData()
      await destination.restoreLearnerData(
        await destination.previewRestore(backup),
      )
      const current = (await destination.practice.read(session.id))!.session
      expect(current).toEqual(head)
      expect((await destination.practice.commit(recall)).applied).toBe(false)
      const compose = {
        kind: 'compose' as const,
        expected: current,
        text: 'An actual new sentence',
        at: at(3),
      }
      const composed = (await destination.practice.commit(compose)).record
        .session
      expect((await destination.practice.commit(compose)).applied).toBe(false)
      await expect(
        destination.practice.commit({
          kind: 'compose',
          expected: current,
          text: 'Other window',
          at: at(4),
        }),
      ).rejects.toThrow('SIMULATION_STEP_CONFLICT')
      await expect(
        destination.practice.commit({
          kind: 'stop',
          expected: current,
          at: at(4),
        }),
      ).rejects.toThrow('STALE')
      expect((await destination.practice.read(session.id))!.session).toEqual(
        composed,
      )
    }
  })
})
