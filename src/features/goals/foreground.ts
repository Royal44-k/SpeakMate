import type { LearningEvent } from '@/domain/goals/types'
import { splitForegroundInterval } from '@/domain/goals/statistics'
import { learningEventId } from '@/infrastructure/persistence/data-invariants'
export function createForegroundRecorder(input: {
  profileId: string
  runId: string
  clock: () => string
  monotonic: () => number
  save: (event: LearningEvent) => Promise<unknown>
}) {
  let head: { at: string; mono: number } | undefined,
    sequence = 0,
    inflight: Promise<void> | undefined
  const pending: LearningEvent[] = []
  function cut() {
    if (!head) return
    const endedAt = input.clock(),
      mono = input.monotonic()
    const before = head
    head = { at: endedAt, mono }
    // A backwards clock or >24h suspended process is not reliable foreground evidence.
    if (
      Date.parse(endedAt) < Date.parse(before.at) ||
      Date.parse(endedAt) - Date.parse(before.at) > 86400000
    )
      return
    for (const part of splitForegroundInterval({
      startedAt: before.at,
      endedAt,
      durationMs: Math.max(0, mono - before.mono),
    })) {
      const event: LearningEvent = {
        id: 'pending',
        profileId: input.profileId,
        runId: input.runId,
        segmentId: String(sequence++),
        type: 'foreground-time-recorded',
        occurredAt: part.startedAt,
        ...part,
      }
      event.id = learningEventId(event)
      pending.push(event)
    }
  }
  return {
    setVisible(visible: boolean) {
      if (visible) {
        head ??= { at: input.clock(), mono: input.monotonic() }
      } else {
        cut()
        head = undefined
      }
    },
    flush() {
      cut()
      if (inflight) return inflight
      inflight = (async () => {
        while (pending.length) {
          await input.save(pending[0])
          pending.shift()
        }
      })().finally(() => {
        inflight = undefined
      })
      return inflight
    },
  }
}
