import { afterEach, describe, expect, it, vi } from 'vitest'
import { openDB } from 'idb'
import * as database from './db'
import {
  classifyPractice,
  createPracticeRepository,
} from './practice-repository'
import { createMemoryStorage } from './storage'
import {
  createMemoryRepositories,
  createIndexedDbRepositories,
  type Repositories,
} from './repositories'
import { deleteDatabase } from './db'
import { localContentProvider } from '@/content/dialogues/graded/provider'
import { createDialogue } from '@/domain/ai/graded-dialogue'
import type { PracticeSession } from '@/domain/practice/types'
import { completionFixture } from './learning-fixtures'

const at = (n: number) => `2026-09-10T01:00:${String(n).padStart(2, '0')}.000Z`
async function candidate(repository: Repositories): Promise<PracticeSession> {
  const profile = await repository.profiles.ensureGuestProfile()
  const content = await localContentProvider.load({
    sceneId: 'dining-01',
    level: 'A1',
  })
  if (content.status !== 'available') throw new Error('fixture unavailable')
  const start = createDialogue(content.pack, {
    mode: 'short',
    variantId: 'counter',
  })
  return {
    id: 'practice-pinned',
    profileId: profile.id,
    sceneId: 'dining-01',
    sceneVersion: 1,
    level: 'A1',
    status: 'active',
    startedAt: at(0),
    updatedAt: at(0),
    completedGoals: [],
    openingText: start.reply,
    gradedDialogue: start.snapshot,
  }
}
afterEach(async () => {
  vi.restoreAllMocks()
  await deleteDatabase()
})
describe.each([
  ['memory', createMemoryRepositories],
  ['indexeddb', createIndexedDbRepositories],
] as const)('%s guarded practice', (_name, make) => {
  it('preserves actual reviewed social refusal/privacy answers and atomically arbitrates finish against stop', async () => {
    const repository = make()
    const base = await candidate(repository)
    const loaded = await localContentProvider.load({
      sceneId: 'social-04',
      level: 'A1',
    })
    if (loaded.status !== 'available') throw new Error('social fixture')
    const start = createDialogue(loaded.pack, {
      mode: 'short',
      variantId: loaded.pack.variants[0].id,
    })
    let session: PracticeSession = {
      ...base,
      sceneId: 'social-04',
      openingText: start.reply,
      gradedDialogue: start.snapshot,
    }
    await repository.practice.commit({ kind: 'create', session })
    for (let n = 1; session.gradedDialogue!.state.outcome === 'active'; n++) {
      const current = session.gradedDialogue!
      const question = current.pack.questions.find(
        (q) => q.id === current.state.currentQuestionId,
      )!
      const answer =
        question.answers.find((a) =>
          /private|not to give|not give|rather not/i.test(a.text),
        ) ?? question.answers[0]
      session = (
        await repository.practice.commit({
          kind: 'advance',
          expected: session,
          turnId: `social-${n}`,
          input: { action: 'answer', text: answer.text },
          at: at(n),
        })
      ).record.session
      expect(session.status).toBe('active')
    }
    expect(session.gradedDialogue!.state.outcome).toBe('achieved')
    expect(
      session.gradedDialogue!.state.turns.some((turn) =>
        /private|not to give|not give|rather not/i.test(turn.text),
      ),
    ).toBe(true)
    const results = await Promise.allSettled([
      repository.practice.commit({
        kind: 'finish',
        expected: session,
        at: at(5),
      }),
      repository.practice.commit({
        kind: 'stop',
        expected: session,
        at: at(5),
      }),
    ])
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1)
    const saved = (await repository.practice.read(session.id))!
    expect(saved.session.status).toBe('completed')
    expect(saved.session.completionEvidence?.outcome).toBe('achieved')
    const exported = await repository.exportLearnerData()
    await repository.clearLearnerData()
    await repository.restoreLearnerData(
      await repository.previewRestore(JSON.stringify(exported)),
    )
    let restored
    if (_name === 'indexeddb') {
      const fresh = await openDB<database.SpeakMateDbSchema>(
        database.DATABASE_NAME,
        database.DATABASE_VERSION,
      )
      try {
        vi.spyOn(database, 'getDatabase').mockResolvedValueOnce(fresh)
        restored = await make().practice.read(session.id)
      } finally {
        vi.restoreAllMocks()
        fresh.close()
      }
    } else restored = await repository.practice.read(session.id)
    expect(restored).toEqual(saved)
    const afterRestore = await repository.exportLearnerData()
    expect(afterRestore.learningEvents).toHaveLength(
      saved.session.status === 'completed' ? 1 : 0,
    )
    expect(afterRestore.pointsLedger).toEqual([])
  })
  it('serializes an advance against stop without dropping a committed input', async () => {
    const repository = make()
    const session = await candidate(repository)
    await repository.practice.commit({ kind: 'create', session })
    const results = await Promise.allSettled([
      repository.practice.commit({
        kind: 'advance',
        expected: session,
        turnId: 'racing',
        input: { text: 'An Americano, please.' },
        at: at(1),
      }),
      repository.practice.commit({
        kind: 'stop',
        expected: session,
        at: at(1),
      }),
    ])
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1)
    expect((await repository.practice.read(session.id))?.turns).toHaveLength(1)
  })
  it('keeps shape-valid completed history with impossible confirmation time recovery-only', async () => {
    const repository = make()
    let session = await candidate(repository)
    await repository.practice.commit({ kind: 'create', session })
    for (let n = 1; n <= 3; n++)
      session = (
        await repository.practice.commit({
          kind: 'advance',
          expected: session,
          turnId: `time-${n}`,
          input: { text: 'Confirmed outside curated forms.' },
          at: at(n),
        })
      ).record.session
    const record = (await repository.practice.read(session.id))!
    for (const completedAt of [at(1), at(9)]) {
      expect(
        classifyPractice(
          { ...session, status: 'completed', completedAt },
          record.turns,
        ).status,
      ).toBe('recovery')
    }
    expect((await repository.practice.read(session.id))?.session).toEqual(
      session,
    )
  })
  it('creates once with exact selected opening and reloads the pinned mode/variant', async () => {
    const repository = make()
    const session = await candidate(repository)
    expect(
      (await repository.practice.commit({ kind: 'create', session })).applied,
    ).toBe(true)
    expect(
      (await repository.practice.commit({ kind: 'create', session })).applied,
    ).toBe(false)
    expect(await repository.practice.read(session.id)).toEqual({
      session,
      turns: [],
      status: 'ready',
    })
    await expect(
      repository.practice.commit({
        kind: 'create',
        session: { ...session, startedAt: at(1), updatedAt: at(1) },
      }),
    ).rejects.toThrow(/CONFLICT/)
  })
  it('atomically saves actual input/reply, rejects stale state, and returns latest head on an older exact retry', async () => {
    const repository = make()
    const session = await candidate(repository)
    await repository.practice.commit({ kind: 'create', session })
    const request = {
      kind: 'advance' as const,
      expected: session,
      turnId: 'turn-1',
      input: { text: 'An Americano, please.' },
      at: at(1),
    }
    const first = await repository.practice.commit(request)
    expect(first.record.turns[0]).toMatchObject({
      learnerText: request.input.text,
      aiText: first.record.session.gradedDialogue!.state.reply,
      index: 0,
    })
    const second = await repository.practice.commit({
      kind: 'advance',
      expected: first.record.session,
      turnId: 'turn-2',
      input: { text: 'Something outside this local corpus.' },
      at: at(2),
    })
    expect((await repository.practice.commit(request)).record).toEqual(
      second.record,
    )
    expect(
      (await repository.practice.commit({ kind: 'create', session })).record,
    ).toEqual(second.record)
    await expect(
      repository.practice.commit({
        ...request,
        expected: { ...session, startedAt: at(1) },
      }),
    ).rejects.toThrow(/CONFLICT/)
    await expect(
      repository.practice.commit({
        ...request,
        input: { text: 'Changed actual text.' },
      }),
    ).rejects.toThrow(/CONFLICT/)
    await expect(
      repository.practice.commit({ ...request, turnId: 'stale-turn' }),
    ).rejects.toThrow(/STALE/)
    expect((await repository.practice.read(session.id))?.turns).toHaveLength(2)
  })
  it('keeps a partial terminal active until explicit finish; finish is durable and report reads create no events', async () => {
    const repository = make()
    let session = await candidate(repository)
    await repository.practice.commit({ kind: 'create', session })
    for (let n = 1; n <= 3; n++)
      session = (
        await repository.practice.commit({
          kind: 'advance',
          expected: session,
          turnId: `turn-${n}`,
          input: { text: 'My unrecognized but confirmed expression.' },
          at: at(n),
        })
      ).record.session
    expect(session.status).toBe('active')
    expect(session.gradedDialogue!.state.outcome).toBe('partial')
    await expect(
      repository.practice.commit({
        kind: 'advance',
        expected: session,
        turnId: 'terminal-extra',
        input: { text: 'extra' },
        at: at(4),
      }),
    ).rejects.toThrow(/TERMINAL/)
    const finished = await repository.practice.commit({
      kind: 'finish',
      expected: session,
      at: at(5),
    })
    expect(finished.record.session).toMatchObject({
      status: 'completed',
      completedAt: at(5),
      completionEvidence: {
        schemaVersion: 1,
        ruleVersion: 1,
        expressionTurns: 3,
        submittedTurns: 3,
        outcome: 'partial',
        basis: 'path-cap',
        confirmedAt: at(5),
      },
    })
    expect(
      (
        await repository.practice.commit({
          kind: 'finish',
          expected: session,
          at: at(6),
        })
      ).record,
    ).toEqual(finished.record)
    await repository.practice.read(session.id)
    const afterRead = await repository.exportLearnerData()
    expect(afterRead.learningEvents).toHaveLength(1)
    expect(afterRead.learningEvents[0]).toMatchObject({
      type: 'session-completed',
      sessionId: session.id,
      evidence: finished.record.session.completionEvidence,
    })
    expect(afterRead.pointsLedger).toEqual([])
    await expect(
      repository.practice.commit({
        kind: 'stop',
        expected: session,
        at: at(7),
      }),
    ).rejects.toThrow()
  })
  it('does not permit ordinary save ports to overwrite a graded session or its turns', async () => {
    const repository = make()
    const session = await candidate(repository)
    await repository.practice.commit({ kind: 'create', session })
    await expect(
      repository.sessions.save({ ...session, status: 'completed' }),
    ).rejects.toThrow(/GUARDED/)
    await expect(
      repository.turns.save({
        id: 'unsafe',
        sessionId: session.id,
        index: 0,
        learnerText: 'fake',
        aiText: 'fake',
        createdAt: at(1),
      }),
    ).rejects.toThrow(/GUARDED/)
    await expect(
      repository.learning.recordEvent(
        completionFixture(session.profileId),
        () => ({ session: { ...session, status: 'completed' } }),
      ),
    ).rejects.toThrow(/GUARDED/)
    expect((await repository.exportLearnerData()).learningEvents).toEqual([])
  })

  it('does not finish repair-only exhaustion or explicit stop, but permits mixed unknown expression and repairs', async () => {
    const repository = make()
    let session = await candidate(repository)
    await repository.practice.commit({ kind: 'create', session })
    for (let n = 1; n <= 3; n++)
      session = (
        await repository.practice.commit({
          kind: 'advance',
          expected: session,
          turnId: `repair-${n}`,
          input: { action: 'clarify', text: '' },
          at: at(n),
        })
      ).record.session
    await expect(
      repository.practice.commit({
        kind: 'finish',
        expected: session,
        at: at(4),
      }),
    ).rejects.toThrow(/INELIGIBLE/)
    const stopped = await repository.practice.commit({
      kind: 'stop',
      expected: session,
      at: at(4),
    })
    expect(stopped.record.session.status).toBe('abandoned')
    expect(stopped.record.session.gradedDialogue).toEqual(
      session.gradedDialogue,
    )
    const second = { ...(await candidate(repository)), id: 'mixed-round' }
    session = (
      await repository.practice.commit({ kind: 'create', session: second })
    ).record.session
    for (let n = 1; n <= 3; n++)
      session = (
        await repository.practice.commit({
          kind: 'advance',
          expected: session,
          turnId: `mixed-${n}`,
          input:
            n === 1
              ? { text: 'Not covered, but my confirmed response.' }
              : { action: 'clarify', text: '' },
          at: at(n),
        })
      ).record.session
    expect(
      (
        await repository.practice.commit({
          kind: 'finish',
          expected: session,
          at: at(4),
        })
      ).record.session.completionEvidence?.expressionTurns,
    ).toBe(1)
  })

  it('keeps no/private boundaries as answers while explicit refuse abandons without a completion', async () => {
    const repository = make()
    const initial = await candidate(repository)
    await repository.practice.commit({ kind: 'create', session: initial })
    const answer = await repository.practice.commit({
      kind: 'advance',
      expected: initial,
      turnId: 'answer-no',
      input: { text: 'No, I prefer not to say.' },
      at: at(1),
    })
    expect(answer.record.session.status).toBe('active')
    const stop = await repository.practice.commit({
      kind: 'advance',
      expected: answer.record.session,
      turnId: 'explicit-stop',
      input: { action: 'refuse', text: '' },
      at: at(2),
    })
    expect(stop.record.session.status).toBe('abandoned')
    expect(stop.record.session.gradedDialogue?.state.outcome).toBe('declined')
    expect(stop.record.session.completionEvidence).toBeUndefined()
    await expect(
      repository.practice.commit({
        kind: 'finish',
        expected: stop.record.session,
        at: at(3),
      }),
    ).rejects.toThrow(/TERMINAL/)
  })

  it('preserves optional saved presentation through backup/reopen and rejects unsupported presentation before writes', async () => {
    const repository = make()
    const session = {
      ...(await candidate(repository)),
      presentation: {
        schemaVersion: 1 as const,
        counterpartZh: '已保存的旧称呼',
        frameZh: '已保存的回应演练说明，不与今天的映射比较。',
      },
    }
    await repository.practice.commit({ kind: 'create', session })
    const exported = await repository.exportLearnerData()
    await repository.clearLearnerData()
    await repository.restoreLearnerData(
      await repository.previewRestore(JSON.stringify(exported)),
    )
    if (_name === 'indexeddb') {
      const fresh = await openDB<database.SpeakMateDbSchema>(
        database.DATABASE_NAME,
        database.DATABASE_VERSION,
      )
      try {
        vi.spyOn(database, 'getDatabase').mockResolvedValueOnce(fresh)
        expect(
          (await make().practice.read(session.id))?.session.presentation,
        ).toEqual(session.presentation)
      } finally {
        vi.restoreAllMocks()
        fresh.close()
      }
    } else
      expect(
        (await repository.practice.read(session.id))?.session.presentation,
      ).toEqual(session.presentation)
    for (const presentation of [
      { ...session.presentation, schemaVersion: 2 },
      { ...session.presentation, counterpartZh: '' },
      { ...session.presentation, frameZh: ' ' },
      { ...session.presentation, frameZh: 'x'.repeat(501) },
    ]) {
      const invalid = { ...exported, sessions: [{ ...session, presentation }] }
      await expect(
        repository.previewRestore(JSON.stringify(invalid)),
      ).rejects.toThrow()
      expect(
        (await repository.practice.read(session.id))?.session.presentation,
      ).toEqual(session.presentation)
    }
  })
})

it('serializes competing advances from two independent IndexedDB connections without losing a turn', async () => {
  const repository = createIndexedDbRepositories()
  const session = await candidate(repository)
  await repository.practice.commit({ kind: 'create', session })
  const a = await openDB<database.SpeakMateDbSchema>(
    database.DATABASE_NAME,
    database.DATABASE_VERSION,
  )
  const b = await openDB<database.SpeakMateDbSchema>(
    database.DATABASE_NAME,
    database.DATABASE_VERSION,
  )
  expect(a).not.toBe(b)
  try {
    vi.spyOn(database, 'getDatabase')
      .mockResolvedValueOnce(a)
      .mockResolvedValueOnce(b)
    const results = await Promise.allSettled(
      ['a', 'b'].map((turnId) =>
        createIndexedDbRepositories().practice.commit({
          kind: 'advance',
          expected: session,
          turnId,
          input: { text: 'An Americano, please.' },
          at: at(1),
        }),
      ),
    )
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1)
    expect(
      results.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1)
  } finally {
    vi.restoreAllMocks()
    a.close()
    b.close()
  }
  expect((await repository.practice.read(session.id))?.turns).toHaveLength(1)
})

it('rolls back both proposed memory rows when the transaction fails after the operation', async () => {
  const backing = createMemoryStorage()
  const setup = createMemoryRepositories()
  const session = await candidate(setup)
  const profile = (await setup.profiles.get())!
  await backing.change((state) => {
    state.profile = [profile]
  })
  let fail = false
  const repository = createPracticeRepository({
    read: backing.read,
    change: (update) =>
      backing.change((state) => {
        const result = update(state)
        if (fail) throw new Error('QuotaExceededError')
        return result
      }),
  })
  await repository.commit({ kind: 'create', session })
  fail = true
  const request = {
    kind: 'advance' as const,
    expected: session,
    turnId: 'retry-turn',
    input: { text: 'An Americano, please.' },
    at: at(1),
  }
  await expect(repository.commit(request)).rejects.toThrow('QuotaExceededError')
  expect((await repository.read(session.id))?.session).toEqual(session)
  expect((await repository.read(session.id))?.turns).toEqual([])
  fail = false
  expect((await repository.commit(request)).record.turns).toHaveLength(1)
  let latest = (await repository.read(session.id))!.session
  for (let n = 2; n <= 3; n++)
    latest = (
      await repository.commit({
        kind: 'advance',
        expected: latest,
        turnId: `end-${n}`,
        input: { text: 'My confirmed expression.' },
        at: at(n),
      })
    ).record.session
  fail = true
  await expect(
    repository.commit({ kind: 'finish', expected: latest, at: at(4) }),
  ).rejects.toThrow('QuotaExceededError')
  expect((await repository.read(session.id))?.session).toEqual(latest)
  fail = false
  expect(
    (await repository.commit({ kind: 'finish', expected: latest, at: at(4) }))
      .record.session.completionEvidence,
  ).toBeDefined()
})

it('aborts IndexedDB session writes when the following turn put fails', async () => {
  const repository = createIndexedDbRepositories()
  const session = await candidate(repository)
  await repository.practice.commit({ kind: 'create', session })
  const original = IDBObjectStore.prototype.put
  const spy = vi
    .spyOn(IDBObjectStore.prototype, 'put')
    .mockImplementation(function (this: IDBObjectStore, value, key) {
      if (this.name === 'turns')
        throw new DOMException('no space', 'QuotaExceededError')
      return original.call(this, value, key)
    })
  const request = {
    kind: 'advance' as const,
    expected: session,
    turnId: 'retry-turn',
    input: { text: 'An Americano, please.' },
    at: at(1),
  }
  await expect(repository.practice.commit(request)).rejects.toThrow('no space')
  spy.mockRestore()
  expect((await repository.practice.read(session.id))?.session).toEqual(session)
  expect((await repository.practice.read(session.id))?.turns).toEqual([])
  expect((await repository.practice.commit(request)).record.turns).toHaveLength(
    1,
  )
  let latest = (await repository.practice.read(session.id))!.session
  for (let n = 2; n <= 3; n++)
    latest = (
      await repository.practice.commit({
        kind: 'advance',
        expected: latest,
        turnId: `end-${n}`,
        input: { text: 'My confirmed expression.' },
        at: at(n),
      })
    ).record.session
  const finishFailure = vi
    .spyOn(IDBObjectStore.prototype, 'put')
    .mockImplementation(function (this: IDBObjectStore, value, key) {
      const request = original.call(this, value, key)
      if (this.name === 'sessions')
        throw new DOMException('finish quota', 'QuotaExceededError')
      return request
    })
  await expect(
    repository.practice.commit({ kind: 'finish', expected: latest, at: at(4) }),
  ).rejects.toThrow('finish quota')
  finishFailure.mockRestore()
  expect((await repository.practice.read(session.id))?.session).toEqual(latest)
  expect((await repository.exportLearnerData()).learningEvents).toEqual([])
  expect(
    (
      await repository.practice.commit({
        kind: 'finish',
        expected: latest,
        at: at(4),
      })
    ).record.session.completionEvidence,
  ).toBeDefined()
})
