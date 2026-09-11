import { expect, it } from 'vitest'
import {
  splitForegroundInterval,
  summarizeCheckIns,
  summarizePoints,
} from './statistics'
import type { LearningEvent } from './types'
const base = {
  profileId: 'user',
  occurredAt: '2026-09-11T00:00:00Z',
  dateKey: '2026-09-11',
}
it('splits actual visible duration across Beijing midnight without counting a hidden gap', () => {
  expect(
    splitForegroundInterval({
      startedAt: '2026-09-10T15:59:58Z',
      endedAt: '2026-09-10T16:00:02Z',
      durationMs: 4000,
    }),
  ).toEqual([
    {
      startedAt: '2026-09-10T15:59:58.000Z',
      endedAt: '2026-09-10T16:00:00.000Z',
      dateKey: '2026-09-10',
      durationMs: 2000,
    },
    {
      startedAt: '2026-09-10T16:00:00.000Z',
      endedAt: '2026-09-10T16:00:02.000Z',
      dateKey: '2026-09-11',
      durationMs: 2000,
    },
  ])
  expect(
    splitForegroundInterval({
      startedAt: base.occurredAt,
      endedAt: base.occurredAt,
      durationMs: 0,
    }),
  ).toEqual([])
})
it('counts actual completion days once, keeps calendar/week/foreground separate and ignores page-like events', () => {
  const events: LearningEvent[] = [
    { ...base, id: 's1', type: 'session-completed', sessionId: 's1' },
    {
      ...base,
      id: 's2',
      type: 'session-completed',
      sessionId: 's2',
      dateKey: '2026-09-10',
      occurredAt: '2026-09-10T00:00:00Z',
    },
    { ...base, id: 'n', type: 'notebook-added', noteId: 'n' },
    {
      ...base,
      id: 'f',
      type: 'foreground-time-recorded',
      runId: 'r',
      segmentId: 'f',
      startedAt: '2026-09-11T00:00:00Z',
      endedAt: '2026-09-11T00:00:04Z',
      durationMs: 4000,
    },
  ]
  const stats = summarizeCheckIns(events, '2026-09-11T01:00:00Z')
  expect(stats.streak).toBe(2)
  expect(stats.todayCompleted).toBe(1)
  expect(stats.sevenDays).toHaveLength(7)
  expect(stats.weekStart).toBe('2026-09-07')
  expect(stats.weekCompleted).toBe(2)
  expect(stats.todayForegroundMs).toBe(4000)
  expect(summarizeCheckIns(events.slice(2), base.occurredAt).streak).toBe(0)
})
it('computes earned separately from spendable with no trusted balance', () => {
  expect(
    summarizePoints([{ delta: 100 }, { delta: -100 }, { delta: 35 }]),
  ).toEqual({ earned: 135, available: 35 })
})
