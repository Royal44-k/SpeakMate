import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createMemoryRepositories,
  createIndexedDbRepositories,
} from './repositories'
import { deleteDatabase } from './db'
import { planFixture } from './learning-fixtures'
import { localContentProvider } from '@/content/dialogues/graded/provider'
import { createDialogue } from '@/domain/ai/graded-dialogue'
import type { PracticeSession } from '@/domain/practice/types'
import {
  goalFixture,
  completeWarmup,
  sceneCandidate,
  simulationCandidate,
  exhaust,
  goalAt,
} from './goal-fixtures'
import { newSimulation } from '@/features/notebook/simulation-material'
import { createPracticeRepository } from './practice-repository'
import { createMemoryStorage } from './storage'
import { STORE_NAMES } from './db'
import { createDailyPlan } from '@/domain/goals/planner'
import { createGoalService } from '@/features/goals/goal-service'
import { summarizeCheckIns } from '@/domain/goals/statistics'

afterEach(async () => {
  vi.restoreAllMocks()
  await deleteDatabase()
})
it.each(['memory', 'indexeddb'] as const)(
  'keeps the independently captured note while first-bind/create rolls back at the %s write boundary',
  async (adapter) => {
    const repos =
        adapter === 'memory'
          ? createMemoryRepositories()
          : createIndexedDbRepositories(),
      { plan } = await goalFixture(repos)
    const { session, material, note } = await simulationCandidate(repos, plan)
    await repos.notebook.capture(note)
    const before = await repos.exportLearnerData(),
      request = {
        kind: 'create' as const,
        session,
        simulationMaterial: material,
        taskLaunch: { planId: plan.id, taskId: plan.tasks[2].id },
      }
    if (adapter === 'indexeddb') {
      const original = IDBObjectStore.prototype.put
      const spy = vi
        .spyOn(IDBObjectStore.prototype, 'put')
        .mockImplementation(function (this: IDBObjectStore, value, key) {
          if (this.name === 'sessions')
            throw new DOMException(
              'create boundary quota',
              'QuotaExceededError',
            )
          return original.call(this, value, key)
        })
      await expect(repos.practice.commit(request)).rejects.toThrow(
        'create boundary quota',
      )
      spy.mockRestore()
      expect(await repos.notebook.get(note.id)).toEqual(note)
      expect(await repos.sessions.list()).toEqual([])
      expect(
        (await repos.learning.getDailyPlan(plan.profileId, plan.dateKey))!
          .tasks[2],
      ).toEqual(plan.tasks[2])
      await repos.practice.commit(request)
      expect(
        (await repos.learning.getDailyPlan(plan.profileId, plan.dateKey))!
          .tasks[2],
      ).toMatchObject({ status: 'started', swapUsed: false })
    } else {
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
      let fail = true
      const practice = createPracticeRepository({
        read: backing.read,
        change: (update) =>
          backing.change((state) => {
            const result = update(state)
            if (fail) throw Error('create memory boundary')
            return result
          }),
      })
      await expect(practice.commit(request)).rejects.toThrow(
        'create memory boundary',
      )
      expect(await backing.read((s) => s.notebook)).toEqual(before.notebook)
      expect(await backing.read((s) => s.sessions)).toEqual([])
      expect(await backing.read((s) => s.dailyPlans[0].tasks[2])).toEqual(
        plan.tasks[2],
      )
      fail = false
      await practice.commit(request)
      expect(await backing.read((s) => s.dailyPlans[0].tasks[2])).toMatchObject(
        { status: 'started', swapUsed: false },
      )
    }
  },
)
describe.each([
  ['memory', createMemoryRepositories],
  ['indexeddb', createIndexedDbRepositories],
] as const)(
  '%s goal creation and original completion transaction',
  (_, make) => {
    it('restores current-only and legacy-only core grants but rejects mixed aliases in a cold destination', async () => {
      const repos = make(),
        { plan } = await goalFixture(repos)
      await completeWarmup(repos, plan)
      const backup = await repos.exportLearnerData()
      for (const ruleId of ['goal-core', 'core-task']) {
        const snapshot = structuredClone(backup)
        snapshot.pointsLedger[0].ruleId = ruleId
        const cold = createMemoryRepositories()
        await cold.restoreLearnerData(
          await cold.previewRestore(JSON.stringify(snapshot)),
        )
        expect(await cold.learning.balance(plan.profileId)).toBe(10)
      }
      backup.pointsLedger.push({
        ...backup.pointsLedger[0],
        id: 'duplicate-alias',
        ruleId: 'core-task',
      })
      const cold = createMemoryRepositories()
      await expect(cold.previewRestore(JSON.stringify(backup))).rejects.toThrow(
        'DUPLICATE_LEDGER_GRANT',
      )
      expect(await cold.profiles.get()).toBeUndefined()
    })
    it('rejects fresh ID-only or empty recalls without a check-in or grant while reading and retrying legacy events', async () => {
      const repos = make(),
        { plan } = await goalFixture(repos)
      const service = createGoalService(repos, fetch, () => goalAt(2))
      await service.startWarmup(plan, plan.tasks[0])
      const valid = service.warmupEvent(plan, plan.tasks[0], 'typed-recall', [
        { id: 'coffee.word.black', kind: 'starter', text: 'black coffee' },
      ])
      if (valid.type !== 'warmup-completed') throw Error('fixture')
      for (const responses of [
        undefined,
        [],
        [{ id: 'coffee.word.black', kind: 'starter' as const, text: '   ' }],
      ]) {
        const invalid = { ...valid, recallResponses: responses }
        await expect(service.finishWarmup(invalid)).rejects.toThrow()
        await expect(repos.learning.recordEvent(invalid)).rejects.toThrow()
        const state = await repos.learning.getState(plan.profileId)
        expect(state.events).toEqual([])
        expect(state.dailyPlans[0].tasks[0].status).toBe('started')
        expect(state.pointsLedger).toEqual([])
        expect(summarizeCheckIns(state.events, goalAt(2)).calendar).toEqual([])
      }
      await service.finishWarmup(valid)
      const backup = await repos.exportLearnerData()
      const legacy = backup.learningEvents.find(
        (e) => e.type === 'warmup-completed',
      )!
      if (legacy.type !== 'warmup-completed') throw Error('fixture')
      delete legacy.recallResponses
      const cold = createMemoryRepositories()
      await cold.restoreLearnerData(
        await cold.previewRestore(JSON.stringify(backup)),
      )
      expect(
        (await createGoalService(cold, fetch).finishWarmup(legacy)).applied,
      ).toBe(false)
      expect(await cold.learning.balance(plan.profileId)).toBe(10)
    })
    it('settles two old plans on one actual Beijing day with no daily grant ceiling', async () => {
      const repos = make(),
        profile = await repos.profiles.ensureGuestProfile(),
        at = '2026-09-11T01:00:00Z'
      const service = createGoalService(repos, fetch, () => at)
      for (const day of ['2026-09-08', '2026-09-09']) {
        const plan = createDailyPlan({
          profile,
          at: day + 'T01:00:00Z',
          notes: [],
          reviews: [],
          sessions: [],
        })
        await repos.learning.ensureDailyPlan(plan)
        await service.startWarmup(plan, plan.tasks[0])
        await service.finishWarmup(
          service.warmupEvent(plan, plan.tasks[0], `old-${day}`, [
            { id: 'coffee.word.black', kind: 'starter', text: 'black coffee' },
          ]),
        )
      }
      const state = await repos.learning.getState(profile.id)
      expect(await repos.learning.balance(profile.id)).toBe(20)
      expect(state.events.map((e) => e.provenance?.planDate).sort()).toEqual([
        '2026-09-08',
        '2026-09-09',
      ])
      expect(summarizeCheckIns(state.events, at)).toMatchObject({
        todayCompleted: 2,
        calendar: ['2026-09-11'],
      })
    })
    it('arbitrates two selected sources without overwriting the winner or spending a swap', async () => {
      const repos = make(),
        { plan, profile } = await goalFixture(repos)
      const a = await simulationCandidate(repos, plan)
      const sourceB = { ...a.note.sources[0], id: 'source-b' }
      const note = await repos.notebook.save({
        ...a.note,
        sources: [...a.note.sources, sourceB],
      })
      const b = {
        ...newSimulation(note, sourceB, a.material),
        id: 'competing-simulation',
        startedAt: a.session.startedAt,
        updatedAt: a.session.updatedAt,
        provenance: a.session.provenance,
      }
      const result = await Promise.allSettled(
        [a.session, b].map((session) =>
          repos.practice.commit({
            kind: 'create',
            session,
            simulationMaterial: a.material,
            taskLaunch: { planId: plan.id, taskId: plan.tasks[2].id },
          }),
        ),
      )
      expect(result.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
      const stored = (await repos.learning.getDailyPlan(
        profile.id,
        plan.dateKey,
      ))!.tasks[2]
      const sessions = await repos.sessions.list()
      expect(sessions).toHaveLength(1)
      expect(stored.target).toMatchObject({
        selection: { sourceId: sessions[0].simulation!.source.sourceId },
      })
      expect(stored.swapUsed).toBe(false)
      expect(await repos.learning.balance(profile.id)).toBe(0)
    })
    it('rejects a path-cap mismatch without starting the task or creating a session', async () => {
      const repos = make(),
        { plan } = await goalFixture(repos),
        session = await sceneCandidate(plan)
      const start = createDialogue(session.gradedDialogue!.pack, {
        ...session.gradedDialogue!.state,
        mode: 'extended',
      })
      session.gradedDialogue = start.snapshot
      session.openingText = start.reply
      await expect(
        repos.practice.commit({
          kind: 'create',
          session,
          taskLaunch: { planId: plan.id, taskId: plan.tasks[1].id },
        }),
      ).rejects.toThrow('TASK_PATH_MISMATCH')
      expect(await repos.sessions.list()).toEqual([])
      expect(
        (await repos.learning.getDailyPlan(plan.profileId, plan.dateKey))!
          .tasks[1].status,
      ).toBe('not-started')
    })
    it('does not expose a second session-completion writer through generic recordEvent', async () => {
      const repos = make(),
        { plan } = await goalFixture(repos),
        session = await sceneCandidate(plan)
      await repos.practice.commit({
        kind: 'create',
        session,
        taskLaunch: { planId: plan.id, taskId: plan.tasks[1].id },
      })
      const completed = await exhaust(repos, session, 4)
      const finished = (
        await repos.practice.commit({
          kind: 'finish',
          expected: completed,
          at: goalAt(10),
        })
      ).record.session
      const { practiceCompletionEvent } =
        await import('@/domain/goals/task-policy')
      const event = practiceCompletionEvent(finished)
      const fresh = createMemoryRepositories()
      await fresh.profiles.save((await repos.profiles.get())!)
      await expect(
        fresh.learning.recordEvent({ ...event, provenance: undefined }),
      ).rejects.toThrow('PRACTICE_GUARDED_WRITE_REQUIRED')
    })
    it('settles the actual planner three-core loop for 35 and pins source-level five-question simulation despite profile changes', async () => {
      const repos = make(),
        { plan, profile } = await goalFixture(repos)
      await completeWarmup(repos, plan)
      let scene = await sceneCandidate(plan)
      await repos.practice.commit({
        kind: 'create',
        session: scene,
        taskLaunch: { planId: plan.id, taskId: plan.tasks[1].id },
      })
      scene = await exhaust(repos, scene, 4)
      await repos.practice.commit({
        kind: 'finish',
        expected: scene,
        at: goalAt(10),
      })
      expect(await repos.learning.balance(profile.id)).toBe(20)
      await repos.profiles.save({ ...profile, level: 'B2' })
      const { session, material } = await simulationCandidate(repos, plan)
      await repos.practice.commit({
        kind: 'create',
        session,
        simulationMaterial: material,
        taskLaunch: { planId: plan.id, taskId: plan.tasks[2].id },
      })
      const bound = (await repos.learning.getDailyPlan(
        profile.id,
        plan.dateKey,
      ))!.tasks[2]
      expect(bound.target).toMatchObject({
        kind: 'simulation',
        requiredUserTurns: 5,
        selection: { sourceId: 'chosen-source', sourceLevel: 'A2' },
      })
      expect(bound.swapUsed).toBe(false)
      let current = (
        await repos.practice.commit({
          kind: 'recall',
          expected: session,
          text: 'I remember this expression',
          at: goalAt(13),
        })
      ).record.session
      current = (
        await repos.practice.commit({
          kind: 'compose',
          expected: current,
          text: 'For example, I can use local practice.',
          at: goalAt(14),
        })
      ).record.session
      current = await exhaust(repos, current, 15)
      const request = {
        kind: 'finish' as const,
        expected: current,
        at: goalAt(21),
      }
      await Promise.all([
        repos.practice.commit(request),
        repos.practice.commit(request),
      ])
      const state = await repos.learning.getState(profile.id)
      expect(
        state.pointsLedger.map((r) => r.delta).sort((a, b) => a - b),
      ).toEqual([5, 10, 10, 10])
      expect(await repos.learning.balance(profile.id)).toBe(35)
      expect(
        state.events.filter((e) => e.type === 'daily-plan-completed'),
      ).toHaveLength(1)
      expect(
        state.dailyPlans[0].tasks.every((t) => t.status === 'completed'),
      ).toBe(true)
      // A distinct real run of the same fixed slot is history, not a second grant.
      const second = {
        ...(await sceneCandidate(plan)),
        id: 'second-real-run',
        startedAt: goalAt(23),
        updatedAt: goalAt(23),
      }
      await repos.practice.commit({ kind: 'create', session: second })
      const secondEnd = await exhaust(repos, second, 24)
      await repos.practice.commit({
        kind: 'finish',
        expected: secondEnd,
        at: goalAt(31),
      })
      expect(await repos.learning.balance(profile.id)).toBe(35)
      expect(
        (await repos.learning.getState(profile.id)).events.filter(
          (e) => e.type === 'session-completed',
        ),
      ).toHaveLength(2)
      const longer = await repos.learning.changeDailyMinutes(
        profile.id,
        15,
        goalAt(32),
      )
      const extension = longer.plan.tasks[3]
      const extra = {
        ...(await sceneCandidate({
          ...longer.plan,
          tasks: [longer.plan.tasks[0], extension, longer.plan.tasks[2]],
        })),
        id: 'actual-extension',
        startedAt: goalAt(33),
        updatedAt: goalAt(33),
      }
      await repos.practice.commit({
        kind: 'create',
        session: extra,
        taskLaunch: { planId: plan.id, taskId: extension.id },
      })
      const extraEnd = await exhaust(repos, extra, 34)
      await repos.practice.commit({
        kind: 'finish',
        expected: extraEnd,
        at: goalAt(40),
      })
      expect(await repos.learning.balance(profile.id)).toBe(45)
      const backup = await repos.exportLearnerData()
      const changed = structuredClone(backup)
      const originalEvent = changed.learningEvents.find(
        (e) => e.type === 'simulation-completed',
      )!
      if (originalEvent.type === 'simulation-completed')
        originalEvent.compositionText =
          'An invented different saved composition'
      const cold = createMemoryRepositories()
      await expect(
        cold.previewRestore(JSON.stringify(changed)),
      ).rejects.toThrow()
      const inflation = structuredClone(backup)
      inflation.pointsLedger[0].delta = 100
      await expect(
        cold.previewRestore(JSON.stringify(inflation)),
      ).rejects.toThrow()
    })
    it('keeps a pending material choice unstarted and rejects a page-open start', async () => {
      const repos = make()
      const profile = await repos.profiles.ensureGuestProfile()
      const plan = planFixture(profile.id)
      plan.tasks[2].target = { kind: 'simulation-choice' }
      const saved = await repos.learning.ensureDailyPlan(plan)
      expect(saved.tasks[2].status).toBe('not-started')
      await expect(
        repos.learning.updateDailyPlan(plan.id, (p) => ({
          ...p,
          tasks: p.tasks.map((t) =>
            t.slot === 'consolidation'
              ? { ...t, status: 'started', startedAt: '2026-09-08T01:00:00Z' }
              : t,
          ),
        })),
      ).rejects.toThrow('MATERIAL_CHOICE_REQUIRED')
      expect((await repos.learning.getState(profile.id)).events).toEqual([])
    })
    it('pins and starts the real scene before navigation, settles actual cross-day partial flow once, then restores without its source', async () => {
      const repos = make()
      const profile = await repos.profiles.ensureGuestProfile()
      const material = await localContentProvider.load({
        sceneId: 'dining-01',
        level: 'A1',
      })
      if (material.status !== 'available')
        throw new Error('fixture unavailable')
      const start = createDialogue(material.pack, {
        mode: 'short',
        variantId: 'counter',
      })
      const plan = planFixture(profile.id)
      plan.snapshot.level = 'A1'
      plan.tasks[1].target = {
        kind: 'scene',
        sceneId: 'dining-01',
        sceneVersion: 1,
        requiredUserTurns: 3,
        selection: {
          schemaVersion: 1,
          level: 'A1',
          mode: 'short',
          variantId: 'counter',
          contentVersion: 1,
        },
      }
      await repos.learning.ensureDailyPlan(plan)
      let session: PracticeSession = {
        id: 'goal-scene-1',
        profileId: profile.id,
        sceneId: 'dining-01',
        sceneVersion: 1,
        level: 'A1',
        status: 'active',
        startedAt: '2026-09-08T15:59:00Z',
        updatedAt: '2026-09-08T15:59:00Z',
        completedGoals: [],
        openingText: start.reply,
        gradedDialogue: start.snapshot,
        provenance: {
          planId: plan.id,
          sourceTaskId: plan.tasks[1].id,
          planDate: plan.dateKey,
          returnTo: '/',
        },
      }
      await repos.practice.commit({
        kind: 'create',
        session,
        taskLaunch: { planId: plan.id, taskId: plan.tasks[1].id },
      })
      expect(
        (await repos.learning.getDailyPlan(profile.id, plan.dateKey))?.tasks[1]
          .status,
      ).toBe('started')
      expect(await repos.learning.balance(profile.id)).toBe(0)
      for (let n = 0; n < 3; n++)
        session = (
          await repos.practice.commit({
            kind: 'advance',
            expected: session,
            turnId: `goal-turn-${n}`,
            input:
              n === 1
                ? { action: 'clarify', text: '' }
                : {
                    action: 'answer',
                    text: 'Something unrecognized but genuinely expressed',
                  },
            at: `2026-09-08T16:00:0${n}Z`,
          })
        ).record.session
      expect(session.status).toBe('active')
      expect(await repos.learning.balance(profile.id)).toBe(0)
      const confirmed = await Promise.all([
        repos.practice.commit({
          kind: 'finish',
          expected: session,
          at: '2026-09-08T16:01:00Z',
        }),
        repos.practice.commit({
          kind: 'finish',
          expected: session,
          at: '2026-09-08T16:01:00Z',
        }),
      ])
      expect(confirmed.filter((r) => r.applied)).toHaveLength(1)
      const state = await repos.learning.getState(profile.id)
      expect(state.pointsLedger.map((x) => x.delta)).toEqual([10])
      expect(state.events).toHaveLength(1)
      expect(state.events[0]).toMatchObject({
        type: 'session-completed',
        dateKey: '2026-09-09',
        provenance: { planDate: '2026-09-08' },
      })
      expect(state.dailyPlans[0].tasks[1]).toMatchObject({
        status: 'completed',
        completionEventId: state.events[0].id,
      })
      const backup = await repos.exportLearnerData()
      backup.sessions = []
      backup.turns = []
      const cold = createMemoryRepositories()
      await cold.restoreLearnerData(
        await cold.previewRestore(JSON.stringify(backup)),
      )
      expect(await cold.learning.balance(profile.id)).toBe(10)
    })
  },
)

it.each(['memory', 'indexeddb'] as const)(
  'rolls back final core, its bonus and actual session together at the %s write boundary',
  async (adapter) => {
    const repos =
        adapter === 'memory'
          ? createMemoryRepositories()
          : createIndexedDbRepositories(),
      { plan, profile } = await goalFixture(repos)
    await completeWarmup(repos, plan)
    let scene = await sceneCandidate(plan)
    await repos.practice.commit({
      kind: 'create',
      session: scene,
      taskLaunch: { planId: plan.id, taskId: plan.tasks[1].id },
    })
    scene = await exhaust(repos, scene, 4)
    await repos.practice.commit({
      kind: 'finish',
      expected: scene,
      at: goalAt(10),
    })
    const { session, material } = await simulationCandidate(repos, plan)
    await repos.practice.commit({
      kind: 'create',
      session,
      simulationMaterial: material,
      taskLaunch: { planId: plan.id, taskId: plan.tasks[2].id },
    })
    let current = (
      await repos.practice.commit({
        kind: 'recall',
        expected: session,
        text: 'I recall the expression',
        at: goalAt(13),
      })
    ).record.session
    current = (
      await repos.practice.commit({
        kind: 'compose',
        expected: current,
        text: 'For example, I practice.',
        at: goalAt(14),
      })
    ).record.session
    current = await exhaust(repos, current, 15)
    const request = {
      kind: 'finish' as const,
      expected: current,
      at: goalAt(21),
    }
    const before = await repos.exportLearnerData()
    if (adapter === 'indexeddb') {
      const original = IDBObjectStore.prototype.put
      const spy = vi
        .spyOn(IDBObjectStore.prototype, 'put')
        .mockImplementation(function (this: IDBObjectStore, value, key) {
          if (this.name === 'pointsLedger')
            throw new DOMException('final grant quota', 'QuotaExceededError')
          return original.call(this, value, key)
        })
      await expect(repos.practice.commit(request)).rejects.toThrow(
        'final grant quota',
      )
      spy.mockRestore()
      expect(await repos.learning.balance(profile.id)).toBe(20)
      expect((await repos.practice.read(current.id))!.session.status).toBe(
        'active',
      )
      expect((await repos.learning.getState(profile.id)).events).toEqual(
        before.learningEvents,
      )
      await repos.practice.commit(request)
      expect(await repos.learning.balance(profile.id)).toBe(35)
    } else {
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
      let fail = true
      const practice = createPracticeRepository({
        read: backing.read,
        change: (update) =>
          backing.change((state) => {
            const result = update(state)
            if (fail) throw new Error('final memory boundary')
            return result
          }),
      })
      await expect(practice.commit(request)).rejects.toThrow(
        'final memory boundary',
      )
      expect(
        await backing.read((s) =>
          s.pointsLedger.reduce((n, row) => n + row.delta, 0),
        ),
      ).toBe(20)
      expect((await practice.read(current.id))!.session).toEqual(current)
      fail = false
      await practice.commit(request)
      expect(
        await backing.read((s) =>
          s.pointsLedger.reduce((n, row) => n + row.delta, 0),
        ),
      ).toBe(35)
    }
  },
)
