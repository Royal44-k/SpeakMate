import type { LearningEvent } from '@/domain/goals/types'
import { stableId } from './identity'
export { canonical } from './identity'
import { normalizeNotebookText, notebookIdentityMap } from './notebook-data'
import type { DataState } from './storage'

export function beijingDateKey(iso: string): string {
  return new Date(Date.parse(iso) + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
}
export const completionTypes = new Set([
  'session-completed',
  'warmup-completed',
  'simulation-completed',
])
export function learningEventId(event: LearningEvent): string {
  switch (event.type) {
    case 'turn-completed':
      return stableId(event.type, event.turnId)
    case 'session-completed':
      return stableId(event.type, event.sessionId)
    case 'warmup-completed':
    case 'simulation-completed':
      return stableId(event.type, event.runId)
    case 'review-completed':
      return stableId(event.type, event.reviewId)
    case 'notebook-added':
      return stableId(event.type, event.noteId)
    case 'daily-plan-completed':
      return stableId(event.planId, event.type)
    case 'foreground-time-recorded':
      return stableId(event.profileId, event.runId, event.segmentId)
    case 'reward-redeemed':
      return stableId(event.profileId, event.rewardId, event.type)
  }
}
function requireValid(condition: unknown, code: string): asserts condition {
  if (!condition) throw new Error(code)
}
function unique<T>(items: T[], key: (item: T) => string, label: string): void {
  requireValid(
    new Set(items.map(key)).size === items.length,
    `DUPLICATE_${label}`,
  )
}

/** Shared by notebook writes and whole-backup validation, without requiring staged history to be complete. */
export function validateNotebookRelations(state: DataState): void {
  const sessions = new Map(state.sessions.map((item) => [item.id, item]))
  const turns = new Map(state.turns.map((item) => [item.id, item]))
  notebookIdentityMap(state.notebook)
  for (const note of state.notebook) {
    requireValid(
      state.profile[0]?.id === note.profileId,
      'BROKEN_PROFILE_REFERENCE',
    )
    requireValid(
      note.normalizedText === normalizeNotebookText(note.text) &&
        !!note.normalizedText,
      'INVALID_NORMALIZED_TEXT',
    )
    unique(note.sources, (source) => source.id, 'NOTE_SOURCE')
    unique(note.favoriteIds, (id) => id, 'FAVORITE_BRIDGE')
    for (const source of note.sources) {
      if (source.sessionId && sessions.has(source.sessionId))
        requireValid(
          sessions.get(source.sessionId)?.profileId === note.profileId,
          'SOURCE_OWNER_MISMATCH',
        )
      if (source.turnId && turns.has(source.turnId) && source.sessionId)
        requireValid(
          turns.get(source.turnId)?.sessionId === source.sessionId,
          'SOURCE_CONTEXT_MISMATCH',
        )
    }
  }
  unique(
    state.notebook,
    (note) => stableId(note.profileId, note.normalizedText),
    'NORMALIZED_NOTE',
  )
  unique(
    state.notebook.flatMap((note) => note.favoriteIds),
    (id) => id,
    'FAVORITE_BRIDGE',
  )
}

/** Authoritative links are strict; history pointers may outlive deleted sessions/turns. */
export function validateRelations(state: DataState): void {
  for (const [name, rows] of Object.entries(state))
    unique(rows, (row: { id: string }) => row.id, name)
  requireValid(
    state.profile.length <= 1 && state.settings.length <= 1,
    'MULTIPLE_SINGLETONS',
  )
  const profile = state.profile[0]
  const owns = (id: string) =>
    requireValid(profile?.id === id, 'BROKEN_PROFILE_REFERENCE')
  const sessions = new Map(state.sessions.map((item) => [item.id, item]))
  const turns = new Map(state.turns.map((item) => [item.id, item]))
  const notes = notebookIdentityMap(state.notebook)
  const events = new Map(state.learningEvents.map((item) => [item.id, item]))
  const plans = new Map(state.dailyPlans.map((item) => [item.id, item]))
  const reviews = new Map(state.reviews.map((item) => [item.id, item]))
  for (const session of state.sessions) {
    owns(session.profileId)
    if (session.simulation) {
      const note = notes.get(session.simulation.source.noteId)
      requireValid(
        note && note.profileId === session.profileId,
        'BROKEN_SIMULATION_NOTE',
      )
      for (const turn of state.turns.filter(
        (turn) => turn.sessionId === session.id,
      ))
        requireValid(
          session.simulation.composition &&
            Date.parse(turn.createdAt) >=
              Date.parse(session.simulation.composition.completedAt),
          'SIMULATION_TIME_MISMATCH',
        )
    }
    if (session.gradedDialogue)
      requireValid(
        session.gradedDialogue.pack.sceneId === session.sceneId &&
          session.gradedDialogue.pack.level === session.level,
        'GRADED_SNAPSHOT_MISMATCH',
      )
    if (session.sceneSnapshot)
      requireValid(
        session.sceneSnapshot.id === session.sceneId &&
          session.sceneSnapshot.version === session.sceneVersion &&
          session.sceneSnapshot.level === session.level,
        'SCENE_SNAPSHOT_MISMATCH',
      )
  }
  for (const turn of state.turns)
    requireValid(sessions.has(turn.sessionId), 'BROKEN_SESSION_REFERENCE')
  unique(
    state.turns,
    (turn) => stableId(turn.sessionId, String(turn.index)),
    'TURN_INDEX',
  )
  validateNotebookRelations(state)
  const checkProvenance = (
    provenance: NonNullable<LearningEvent['provenance']>,
    owner: string,
  ) => {
    const plan = plans.get(provenance.planId)
    requireValid(
      plan &&
        plan.profileId === owner &&
        plan.dateKey === provenance.planDate &&
        plan.tasks.some((task) => task.id === provenance.sourceTaskId),
      'BROKEN_TASK_PROVENANCE',
    )
    if (provenance.sourceNoteId)
      requireValid(notes.has(provenance.sourceNoteId), 'BROKEN_NOTE_REFERENCE')
  }
  for (const session of state.sessions)
    if (session.provenance)
      checkProvenance(session.provenance, session.profileId)
  unique(
    state.dailyPlans,
    (plan) => stableId(plan.profileId, plan.dateKey),
    'DAILY_PLAN',
  )
  for (const plan of state.dailyPlans) {
    owns(plan.profileId)
    unique(plan.tasks, (task) => task.id, 'TASK_ID')
    unique(plan.tasks, (task) => task.slot, 'TASK_SLOT')
    requireValid(
      ['warmup', 'scene', 'consolidation'].every((slot) =>
        plan.tasks.some((task) => task.slot === slot),
      ),
      'MISSING_CORE_SLOT',
    )
    for (const task of plan.tasks) {
      requireValid(
        task.optional === (task.slot === 'extension') &&
          (task.optional || task.enabled),
        'INVALID_OPTIONAL_SLOT',
      )
      requireValid(
        task.status === 'not-started' || (!!task.startedAt && task.enabled),
        'INVALID_STARTED_SLOT',
      )
      if (task.status === 'completed') {
        const event = events.get(task.completionEventId ?? '')
        requireValid(
          task.completedAt &&
            event &&
            completionTypes.has(event.type) &&
            event.provenance?.sourceTaskId === task.id &&
            event.provenance.planId === plan.id,
          'BROKEN_COMPLETION_EVENT',
        )
      } else
        requireValid(
          !task.completedAt && !task.completionEventId,
          'INVALID_INCOMPLETE_SLOT',
        )
      for (const id of [
        ...task.source.noteIds,
        ...('noteIds' in task.target ? task.target.noteIds : []),
      ])
        requireValid(notes.has(id), 'BROKEN_NOTE_REFERENCE')
    }
  }
  unique(state.learningEvents, learningEventId, 'LOGICAL_EVENT')
  for (const event of state.learningEvents) {
    owns(event.profileId)
    requireValid(
      beijingDateKey(event.occurredAt) === event.dateKey,
      'EVENT_DATE_MISMATCH',
    )
    if (event.provenance) checkProvenance(event.provenance, event.profileId)
    if (event.provenance && completionTypes.has(event.type)) {
      const task = plans
        .get(event.provenance.planId)!
        .tasks.find((item) => item.id === event.provenance!.sourceTaskId)!
      const expected = {
        warmup: 'warmup-completed',
        scene: 'session-completed',
        simulation: 'simulation-completed',
      }[task.target.kind]
      requireValid(event.type === expected, 'TASK_EVIDENCE_MISMATCH')
    }
    if ('sessionId' in event && sessions.has(event.sessionId))
      requireValid(
        sessions.get(event.sessionId)?.profileId === event.profileId,
        'EVENT_OWNER_MISMATCH',
      )
    if (event.type === 'turn-completed' && turns.has(event.turnId))
      requireValid(
        turns.get(event.turnId)?.sessionId === event.sessionId,
        'EVENT_TURN_MISMATCH',
      )
    if ('noteId' in event)
      requireValid(notes.has(event.noteId), 'BROKEN_NOTE_REFERENCE')
    if (event.type === 'warmup-completed') {
      for (const id of event.recalledNoteIds)
        requireValid(notes.has(id), 'BROKEN_NOTE_REFERENCE')
      requireValid(
        event.recalledNoteIds.length +
          event.recalledStarterExpressionIds.length >
          0,
        'EMPTY_WARMUP_EVIDENCE',
      )
    }
    if (event.type === 'simulation-completed') {
      for (const id of event.noteIds)
        requireValid(notes.has(id), 'BROKEN_NOTE_REFERENCE')
      requireValid(
        event.recallCompleted &&
          !!event.compositionText.trim() &&
          event.completedUserTurns >= 3,
        'EMPTY_SIMULATION_EVIDENCE',
      )
    }
    if (event.type === 'review-completed')
      requireValid(
        reviews.get(event.reviewId)?.eventId === event.id &&
          reviews.get(event.reviewId)?.noteId === event.noteId,
        'BROKEN_REVIEW_REFERENCE',
      )
    if (event.type === 'daily-plan-completed')
      requireValid(
        plans
          .get(event.planId)
          ?.tasks.filter((task) => !task.optional)
          .every((task) => task.status === 'completed'),
        'INCOMPLETE_PLAN',
      )
    if (event.type === 'foreground-time-recorded') {
      const elapsed = Date.parse(event.endedAt) - Date.parse(event.startedAt)
      requireValid(
        elapsed >= event.durationMs &&
          beijingDateKey(event.startedAt) === event.dateKey &&
          beijingDateKey(
            new Date(
              Math.max(
                Date.parse(event.startedAt),
                Date.parse(event.endedAt) - 1,
              ),
            ).toISOString(),
          ) === event.dateKey,
        'INVALID_FOREGROUND_SEGMENT',
      )
    }
  }
  unique(
    state.reviews,
    (review) => stableId(review.noteId, review.previousReviewId ?? 'initial'),
    'REVIEW_SUCCESSOR',
  )
  for (const review of state.reviews) {
    owns(review.profileId)
    const reviewEvent = events.get(review.eventId)
    requireValid(
      notes.has(review.noteId) &&
        reviewEvent?.type === 'review-completed' &&
        reviewEvent.reviewId === review.id &&
        reviewEvent.noteId === review.noteId,
      'BROKEN_REVIEW_REFERENCE',
    )
    if (review.previousReviewId)
      requireValid(
        notes.get(reviews.get(review.previousReviewId)?.noteId ?? '')?.id ===
          notes.get(review.noteId)?.id &&
          Date.parse(reviews.get(review.previousReviewId)!.reviewedAt) <
            Date.parse(review.reviewedAt),
        'BROKEN_REVIEW_CHAIN',
      )
    requireValid(
      beijingDateKey(review.reviewedAt) === review.dateKey &&
        beijingDateKey(review.nextReviewAt) === review.nextReviewDateKey &&
        Date.parse(review.nextReviewAt) > Date.parse(review.reviewedAt),
      'INVALID_REVIEW_SCHEDULE',
    )
    requireValid(
      [1, 3, 7, 14, 30][review.scheduleStep] === review.intervalDays,
      'INVALID_REVIEW_INTERVAL',
    )
  }
  unique(
    state.pointsLedger,
    (entry) => {
      const event = events.get(entry.eventId)
      const source =
        event?.provenance && completionTypes.has(event.type)
          ? stableId(event.provenance.planId, event.provenance.sourceTaskId)
          : event?.type === 'daily-plan-completed'
            ? stableId('plan', event.planId)
            : entry.eventId
      return stableId(source, entry.ruleId)
    },
    'LEDGER_GRANT',
  )
  unique(
    state.rewardUnlocks,
    (entry) => stableId(entry.profileId, entry.rewardId),
    'REWARD_UNLOCK',
  )
  let balance = 0
  for (const entry of state.pointsLedger) {
    owns(entry.profileId)
    const event = events.get(entry.eventId)
    requireValid(
      event && event.profileId === entry.profileId,
      'BROKEN_LEDGER_EVENT',
    )
    requireValid(entry.delta !== 0, 'EMPTY_LEDGER_ENTRY')
    if (entry.delta > 0) {
      requireValid(
        (completionTypes.has(event.type) && event.provenance) ||
          event.type === 'daily-plan-completed',
        'INVALID_REWARD_EVIDENCE',
      )
      if (event.provenance && completionTypes.has(event.type)) {
        const task = plans
          .get(event.provenance.planId)
          ?.tasks.find((item) => item.id === event.provenance!.sourceTaskId)
        requireValid(
          task?.status === 'completed' && task.completionEventId === event.id,
          'UNSETTLED_TASK_GRANT',
        )
      }
    } else
      requireValid(event.type === 'reward-redeemed', 'INVALID_REDEMPTION_EVENT')
    balance += entry.delta
    requireValid(Number.isSafeInteger(balance), 'LEDGER_OVERFLOW')
  }
  requireValid(balance >= 0, 'INSUFFICIENT_POINTS')
  for (const unlock of state.rewardUnlocks) {
    owns(unlock.profileId)
    const event = events.get(unlock.eventId)
    requireValid(
      event?.type === 'reward-redeemed' &&
        event.rewardId === unlock.rewardId &&
        event.profileId === unlock.profileId &&
        state.pointsLedger.some(
          (entry) => entry.eventId === event.id && entry.delta < 0,
        ),
      'BROKEN_REWARD_REFERENCE',
    )
  }
  for (const event of state.learningEvents.filter(
    (item) => item.type === 'reward-redeemed',
  ))
    requireValid(
      state.rewardUnlocks.some((unlock) => unlock.eventId === event.id),
      'MISSING_REWARD_UNLOCK',
    )
}
