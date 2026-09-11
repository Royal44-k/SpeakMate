import type { LearningEvent } from './types'
import { beijingDateKey } from '@/infrastructure/persistence/data-invariants'
const dayMs = 86400000
const moveDay = (day: string, n: number) =>
  new Date(Date.parse(day + 'T00:00:00Z') + n * dayMs)
    .toISOString()
    .slice(0, 10)
export function splitForegroundInterval(input: {
  startedAt: string
  endedAt: string
  durationMs: number
}) {
  const start = Date.parse(input.startedAt),
    end = Date.parse(input.endedAt),
    wall = end - start
  if (
    !Number.isFinite(wall) ||
    wall < 0 ||
    wall > dayMs ||
    !Number.isFinite(input.durationMs) ||
    input.durationMs < 0
  )
    throw new Error('INVALID_FOREGROUND_INTERVAL')
  const total = Math.min(Math.floor(input.durationMs), wall)
  if (!total || !wall) return []
  const segments = []
  let cursor = start,
    used = 0
  while (cursor < end) {
    const dateKey = beijingDateKey(new Date(cursor).toISOString())
    const midnight = Date.parse(moveDay(dateKey, 1) + 'T00:00:00+08:00')
    const until = Math.min(midnight, end)
    const duration =
      until === end
        ? total - used
        : Math.floor((total * (until - cursor)) / wall)
    if (duration)
      segments.push({
        startedAt: new Date(cursor).toISOString(),
        endedAt: new Date(until).toISOString(),
        dateKey,
        durationMs: duration,
      })
    used += duration
    cursor = until
  }
  return segments
}
export function summarizePoints(ledger: readonly { delta: number }[]) {
  return ledger.reduce(
    (sum, row) => ({
      earned: sum.earned + Math.max(0, row.delta),
      available: sum.available + row.delta,
    }),
    { earned: 0, available: 0 },
  )
}
export function summarizeCheckIns(
  events: readonly LearningEvent[],
  at: string,
) {
  const today = beijingDateKey(at),
    completed = new Map<string, number>(),
    foreground = new Map<string, number>()
  const learningTypes = new Set([
    'session-completed',
    'warmup-completed',
    'simulation-completed',
    'review-completed',
  ])
  for (const event of events) {
    if (learningTypes.has(event.type))
      completed.set(event.dateKey, (completed.get(event.dateKey) ?? 0) + 1)
    if (event.type === 'foreground-time-recorded')
      foreground.set(
        event.dateKey,
        (foreground.get(event.dateKey) ?? 0) + event.durationMs,
      )
  }
  let cursor = completed.has(today) ? today : moveDay(today, -1),
    streak = 0
  while (completed.has(cursor)) {
    streak++
    cursor = moveDay(cursor, -1)
  }
  const weekDay = new Date(today + 'T00:00:00Z').getUTCDay()
  const weekStart = moveDay(today, -((weekDay + 6) % 7))
  const sevenDays = Array.from({ length: 7 }, (_, i) => {
    const dateKey = moveDay(today, i - 6)
    return {
      dateKey,
      completed: completed.get(dateKey) ?? 0,
      foregroundMs: foreground.get(dateKey) ?? 0,
    }
  })
  return {
    today,
    streak,
    todayCompleted: completed.get(today) ?? 0,
    todayForegroundMs: foreground.get(today) ?? 0,
    sevenDays,
    calendar: [...completed.keys()].sort(),
    weekStart,
    weekCompleted: [...completed]
      .filter(([day]) => day >= weekStart && day <= today)
      .reduce((n, [, count]) => n + count, 0),
  }
}
