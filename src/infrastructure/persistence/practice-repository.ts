import type { PracticeSession, PracticeTurn } from '@/domain/practice/types'
import {
  createDialogue,
  advanceDialogue,
  dialogueInputSchema,
  type DialogueInput,
} from '@/domain/ai/graded-dialogue'
import {
  practiceFlow,
  completionEvidenceSchema,
} from '@/domain/practice/graded-evidence'
import { sessionSchema, turnSchema, isoSchema } from './backup-schemas'
import { put, type DataState, type LocalStoragePort } from './storage'

export interface PracticeRecord {
  session: PracticeSession
  turns: PracticeTurn[]
  status: 'ready' | 'historical' | 'recovery'
  message?: string
}
export type PracticeChange =
  | { kind: 'create'; session: PracticeSession }
  | {
      kind: 'advance'
      expected: PracticeSession
      turnId: string
      input: DialogueInput
      at: string
    }
  | { kind: 'finish' | 'stop'; expected: PracticeSession; at: string }
export interface PracticeRepository {
  read(id: string): Promise<PracticeRecord | undefined>
  commit(
    change: PracticeChange,
  ): Promise<{ applied: boolean; record: PracticeRecord }>
}
const equal = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b)
const fail = (code: string): never => {
  throw new Error(`PRACTICE_${code}`)
}

/** Shape-valid imports may be readable but not executable; never backfill rows. */
export function classifyPractice(
  session: PracticeSession,
  rows: PracticeTurn[],
): PracticeRecord {
  const turns = [...rows].sort((a, b) => a.index - b.index)
  const record = { session, turns }
  try {
    const parsed = sessionSchema.parse(session)
    if (!parsed.gradedDialogue)
      return {
        ...record,
        status: 'historical',
        message: '旧版练习记录已保留；新版对话需要开始新一轮。',
      }
    const snapshot = parsed.gradedDialogue
    let replay = createDialogue(snapshot.pack, snapshot.state).snapshot
    if (
      session.openingText !== replay.state.reply ||
      turns.length !== snapshot.state.turns.length ||
      new Set(turns.map((turn) => turn.id)).size !== turns.length ||
      session.completedGoals.length > 0
    )
      fail('INCOHERENT')
    for (let index = 0; index < turns.length; index++) {
      const row = turnSchema.parse(turns[index])
      const input = snapshot.state.turns[index]
      if (replay.state.outcome !== 'active') fail('INCOHERENT')
      replay = advanceDialogue(replay, input).snapshot
      if (
        row.sessionId !== session.id ||
        row.index !== index ||
        row.learnerText !== input.text ||
        row.aiText !== replay.state.reply ||
        Date.parse(row.createdAt) <
          Date.parse(index ? turns[index - 1].createdAt : session.startedAt) ||
        Date.parse(row.createdAt) > Date.parse(session.updatedAt)
      )
        fail('INCOHERENT')
    }
    if (
      !equal(replay, snapshot) ||
      Date.parse(session.updatedAt) < Date.parse(session.startedAt) ||
      (session.status === 'active' &&
        (session.completedAt || snapshot.state.outcome === 'declined')) ||
      (session.status === 'completed' &&
        (!session.completedAt || !practiceFlow(snapshot).basis)) ||
      (session.status === 'abandoned' && session.completedAt)
    )
      fail('INCOHERENT')
    if (
      session.completedAt &&
      (Date.parse(session.completedAt) <
        Date.parse(turns.at(-1)?.createdAt ?? session.startedAt) ||
        Date.parse(session.completedAt) > Date.parse(session.updatedAt))
    )
      fail('INCOHERENT')
    return { ...record, status: 'ready' }
  } catch {
    return {
      ...record,
      status: 'recovery',
      message:
        '保存的练习状态与话轮不完整或版本不受支持。记录已保留，请重试读取或导出备份；不会自动继续或另建练习。',
    }
  }
}

export function assertHistoricalPracticeWrite(
  state: DataState,
  session?: PracticeSession,
  turn?: PracticeTurn,
) {
  const affected = [
    session?.id,
    turn?.sessionId,
    turn ? state.turns.find((row) => row.id === turn.id)?.sessionId : undefined,
  ]
  if (
    session?.gradedDialogue ||
    affected.some(
      (id) => id && state.sessions.find((row) => row.id === id)?.gradedDialogue,
    )
  )
    fail('GUARDED_WRITE_REQUIRED')
}

function read(state: DataState, id: string) {
  const session = state.sessions.find((row) => row.id === id)
  return session
    ? classifyPractice(
        session,
        state.turns.filter((row) => row.sessionId === id),
      )
    : undefined
}
function ready(record: PracticeRecord | undefined): PracticeRecord {
  if (!record) return fail('NOT_FOUND')
  if (record.status !== 'ready' || !record.session.gradedDialogue)
    fail('NOT_RESUMABLE')
  return record
}

function activePrefixHead(
  record: PracticeRecord,
  count: number,
): PracticeSession {
  const current = record.session
  const snapshot = current.gradedDialogue!
  let prefix = createDialogue(snapshot.pack, snapshot.state).snapshot
  for (const input of snapshot.state.turns.slice(0, count))
    prefix = advanceDialogue(prefix, input).snapshot
  return sessionSchema.parse({
    ...current,
    status: 'active',
    completedAt: undefined,
    completionEvidence: undefined,
    updatedAt: count ? record.turns[count - 1].createdAt : current.startedAt,
    gradedDialogue: prefix,
  }) as PracticeSession
}

export function createPracticeRepository(
  storage: LocalStoragePort,
): PracticeRepository {
  return {
    read: (id) => storage.read((state) => read(state, id)),
    commit: (change) =>
      storage.change((state) => {
        if (change.kind === 'create') {
          const candidate = sessionSchema.parse(
            change.session,
          ) as PracticeSession
          const initial = ready(classifyPractice(candidate, []))
          if (
            candidate.status !== 'active' ||
            candidate.completedAt ||
            candidate.completionEvidence ||
            candidate.updatedAt !== candidate.startedAt ||
            !state.profile.some((profile) => profile.id === candidate.profileId)
          )
            fail('INVALID_CREATE')
          const existing = read(state, candidate.id)
          if (existing) {
            if (!equal(activePrefixHead(ready(existing), 0), candidate))
              fail('CREATE_CONFLICT')
            return { applied: false, record: ready(existing) }
          }
          if (state.turns.some((turn) => turn.sessionId === candidate.id))
            fail('CREATE_CONFLICT')
          put(state.sessions, candidate)
          return { applied: true, record: initial }
        }
        const expected = sessionSchema.parse(change.expected) as PracticeSession
        const record = ready(read(state, expected.id))
        const current = sessionSchema.parse(record.session) as PracticeSession
        const snapshot = current.gradedDialogue!
        const at = isoSchema.parse(change.at)
        if (!state.profile.some((profile) => profile.id === current.profileId))
          fail('PROFILE_MISSING')

        if (change.kind === 'advance') {
          const input = dialogueInputSchema.parse({
            ...change.input,
            action: change.input.action ?? 'answer',
          })
          if (
            (input.action === 'answer' || input.action === 'change') &&
            !input.text.trim()
          )
            fail('EMPTY_EXPRESSION')
          const existing = state.turns.find((turn) => turn.id === change.turnId)
          if (existing) {
            const count = expected.gradedDialogue?.state.turns.length
            if (
              existing.sessionId !== current.id ||
              existing.createdAt !== at ||
              existing.learnerText !== input.text ||
              count !== existing.index ||
              !equal(snapshot.state.turns[existing.index], input) ||
              !equal(expected, activePrefixHead(record, existing.index))
            )
              fail('TURN_CONFLICT')
            return { applied: false, record }
          }
          if (!equal(current, expected)) fail('STALE')
          if (
            current.status !== 'active' ||
            snapshot.state.outcome !== 'active'
          )
            fail('TERMINAL')
          if (Date.parse(at) < Date.parse(current.updatedAt))
            fail('INVALID_TIME')
          const result = advanceDialogue(snapshot, input)
          const turn = turnSchema.parse({
            id: change.turnId,
            sessionId: current.id,
            index: snapshot.state.turns.length,
            learnerText: input.text,
            aiText: result.reply,
            createdAt: at,
          })
          const next = sessionSchema.parse({
            ...current,
            gradedDialogue: result.snapshot,
            updatedAt: at,
            status: input.action === 'refuse' ? 'abandoned' : 'active',
          }) as PracticeSession
          const coherent = ready(
            classifyPractice(next, [...record.turns, turn]),
          )
          put(state.turns, turn)
          put(state.sessions, next)
          return { applied: true, record: coherent }
        }
        if (
          change.kind === 'finish' &&
          current.status === 'completed' &&
          current.completionEvidence &&
          equal(activePrefixHead(record, record.turns.length), expected)
        )
          return { applied: false, record }
        if (
          change.kind === 'stop' &&
          current.status === 'abandoned' &&
          equal(activePrefixHead(record, record.turns.length), expected)
        )
          return { applied: false, record }
        if (!equal(current, expected)) fail('STALE')
        if (current.status !== 'active') fail('TERMINAL')
        if (Date.parse(at) < Date.parse(current.updatedAt)) fail('INVALID_TIME')
        let next: PracticeSession
        if (change.kind === 'stop')
          next = { ...current, status: 'abandoned', updatedAt: at }
        else {
          const flow = practiceFlow(snapshot)
          if (!flow.basis) fail('FINISH_INELIGIBLE')
          // Task 5 inserts its actual synchronous policy/event/plan/ledger effects
          // HERE, inside this same storage.change after fresh evidence validation.
          // Do not activate task-linked finish before that atomic integration exists.
          if (current.provenance) fail('TASK_SETTLEMENT_NOT_CONNECTED')
          const completionEvidence = completionEvidenceSchema.parse({
            schemaVersion: 1,
            ruleVersion: 1,
            sessionId: current.id,
            sceneId: current.sceneId,
            sceneVersion: current.sceneVersion,
            level: current.level,
            contentVersion: snapshot.pack.contentVersion,
            engineVersion: snapshot.state.engineVersion,
            mode: snapshot.state.mode,
            variantId: snapshot.state.variantId,
            ...flow,
            outcome: snapshot.state.outcome,
            confirmedAt: at,
          })
          next = {
            ...current,
            status: 'completed',
            completedAt: at,
            updatedAt: at,
            completionEvidence,
          }
        }
        const coherent = ready(
          classifyPractice(
            sessionSchema.parse(next) as PracticeSession,
            record.turns,
          ),
        )
        put(state.sessions, next)
        return { applied: true, record: coherent }
      }),
  }
}
