import type {
  DailyPlan,
  LearningEvent,
  PointsLedgerEntry,
  RewardUnlock,
} from '@/domain/goals/types'
import type { ReviewRecord } from '@/domain/notebook/types'
import type { PracticeSession, PracticeTurn } from '@/domain/practice/types'
import { planSchema, eventSchema } from './backup-schemas'
import { validateState } from './backup-merge'
import { canonical, learningEventId } from './data-invariants'
import { put, type DataState, type LocalStoragePort } from './storage'
import { notebookIdentityMap } from './notebook-data'

export { learningEventId, beijingDateKey } from './data-invariants'
export { stableId } from './identity'
export interface LearningState {
  dailyPlans: DailyPlan[]
  events: LearningEvent[]
  reviews: ReviewRecord[]
  pointsLedger: PointsLedgerEntry[]
  rewardUnlocks: RewardUnlock[]
}
export interface LearningEffects {
  dailyPlan?: DailyPlan
  review?: ReviewRecord
  pointsLedger?: PointsLedgerEntry[]
  rewardUnlocks?: RewardUnlock[]
  session?: PracticeSession
  turn?: PracticeTurn
}
export interface LearningRepository {
  getState(profileId: string): Promise<LearningState>
  getDailyPlan(profileId: string, day: string): Promise<DailyPlan | undefined>
  ensureDailyPlan(candidate: DailyPlan): Promise<DailyPlan>
  updateDailyPlan(
    planId: string,
    update: (current: Readonly<DailyPlan>) => DailyPlan,
  ): Promise<DailyPlan>
  listReviews(noteId: string): Promise<ReviewRecord[]>
  getReviewSchedule(noteId: string): Promise<ReviewRecord | undefined>
  balance(profileId: string): Promise<number>
  recordEvent(
    event: LearningEvent,
    derive?: (current: Readonly<LearningState>) => LearningEffects,
  ): Promise<{ applied: boolean; state: LearningState }>
}

function learningState(state: DataState, id: string): LearningState {
  const owned = <T extends { profileId: string }>(rows: T[]) =>
    structuredClone(rows.filter((row) => row.profileId === id))
  return {
    dailyPlans: owned(state.dailyPlans),
    events: owned(state.learningEvents),
    reviews: owned(state.reviews),
    pointsLedger: owned(state.pointsLedger),
    rewardUnlocks: owned(state.rewardUnlocks),
  }
}
function reviewsForNote(state: DataState, id: string): ReviewRecord[] {
  const identities = notebookIdentityMap(state.notebook)
  const note = identities.get(id)
  if (!note) return []
  return state.reviews
    .filter((review) => identities.get(review.noteId)?.id === note.id)
    .sort(
      (a, b) =>
        Date.parse(a.reviewedAt) - Date.parse(b.reviewedAt) ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    )
}
function validatePlanUpdate(
  previous: DailyPlan,
  next: DailyPlan,
  completion = false,
): void {
  if (
    next.id !== previous.id ||
    next.profileId !== previous.profileId ||
    next.dateKey !== previous.dateKey ||
    next.createdAt !== previous.createdAt ||
    Date.parse(next.updatedAt) < Date.parse(previous.updatedAt)
  )
    throw new Error('PLAN_IDENTITY_CHANGED')
  for (const old of previous.tasks) {
    const task = next.tasks.find((item) => item.id === old.id)
    if (!task || task.slot !== old.slot) throw new Error('PLAN_SLOT_REMOVED')
    if (old.swapUsed && !task.swapUsed) throw new Error('SWAP_RESET')
    if (
      canonical(old.target) !== canonical(task.target) ||
      canonical(old.source) !== canonical(task.source)
    ) {
      if (old.status !== 'not-started' || old.swapUsed || !task.swapUsed)
        throw new Error('SWAP_NOT_ALLOWED')
    }
    if (
      old.status !== 'not-started' &&
      (!task.enabled ||
        task.status === 'not-started' ||
        task.startedAt !== old.startedAt)
    )
      throw new Error('STARTED_TASK_RESET')
    if (old.status === 'completed' && canonical(old) !== canonical(task))
      throw new Error('COMPLETED_TASK_CHANGED')
    if (
      !completion &&
      old.status !== 'completed' &&
      task.status === 'completed'
    )
      throw new Error('COMPLETION_REQUIRES_EVENT')
  }
}
function appendImmutable<T extends { id: string }>(
  rows: T[],
  incoming: T[],
): void {
  for (const item of incoming) {
    const existing = rows.find((row) => row.id === item.id)
    if (existing && canonical(existing) !== canonical(item))
      throw new Error('IMMUTABLE_CONFLICT')
    if (!existing) put(rows, item)
  }
}

export function createLearningRepository(
  storage: LocalStoragePort,
): LearningRepository {
  return {
    getState: (id) => storage.read((state) => learningState(state, id)),
    getDailyPlan: (id, day) =>
      storage.read((state) =>
        state.dailyPlans.find(
          (plan) => plan.profileId === id && plan.dateKey === day,
        ),
      ),
    ensureDailyPlan: (candidate) =>
      storage.change((state) => {
        const existing = state.dailyPlans.find(
          (plan) =>
            plan.profileId === candidate.profileId &&
            plan.dateKey === candidate.dateKey,
        )
        if (existing) return existing
        const plan = planSchema.parse(candidate)
        if (plan.tasks.some((task) => task.status !== 'not-started'))
          throw new Error('NEW_PLAN_ALREADY_STARTED')
        put(state.dailyPlans, plan)
        validateState(state)
        return plan
      }),
    updateDailyPlan: (id, update) =>
      storage.change((state) => {
        const previous = state.dailyPlans.find((plan) => plan.id === id)
        if (!previous) throw new Error('PLAN_NOT_FOUND')
        const updated = update(structuredClone(previous))
        if (updated instanceof Promise)
          throw new Error('ASYNC_TRANSACTION_CALLBACK')
        const next = planSchema.parse(updated)
        validatePlanUpdate(previous, next)
        put(state.dailyPlans, next)
        validateState(state)
        return next
      }),
    listReviews: (id) => storage.read((state) => reviewsForNote(state, id)),
    getReviewSchedule: (id) =>
      storage.read((state) => reviewsForNote(state, id).at(-1)),
    balance: (id) =>
      storage.read((state) =>
        state.pointsLedger
          .filter((entry) => entry.profileId === id)
          .reduce((total, entry) => total + entry.delta, 0),
      ),
    recordEvent: (input, derive = () => ({})) =>
      storage.change((state) => {
        const event = eventSchema.parse(input)
        const existing = state.learningEvents.find(
          (item) =>
            item.id === event.id ||
            learningEventId(item) === learningEventId(event),
        )
        if (existing) {
          if (canonical(existing) !== canonical(event))
            throw new Error('IMMUTABLE_CONFLICT')
          return {
            applied: false,
            state: learningState(state, event.profileId),
          }
        }
        const effects = derive(learningState(state, event.profileId))
        if (effects instanceof Promise)
          throw new Error('ASYNC_TRANSACTION_CALLBACK')
        if (
          [
            ...(effects.pointsLedger ?? []),
            ...(effects.rewardUnlocks ?? []),
            ...(effects.review ? [effects.review] : []),
          ].some(
            (item) =>
              item.eventId !== event.id || item.profileId !== event.profileId,
          )
        )
          throw new Error('EFFECT_EVENT_MISMATCH')
        if (effects.dailyPlan) {
          const previous = state.dailyPlans.find(
            (plan) => plan.id === effects.dailyPlan!.id,
          )
          if (!previous) throw new Error('PLAN_NOT_FOUND')
          validatePlanUpdate(previous, effects.dailyPlan, true)
          put(state.dailyPlans, effects.dailyPlan)
        }
        if (effects.review) {
          const previous = reviewsForNote(state, effects.review.noteId).at(-1)
          if (effects.review.previousReviewId !== previous?.id)
            throw new Error('REVIEW_SCHEDULE_STALE')
          appendImmutable(state.reviews, [effects.review])
        }
        if (effects.session) put(state.sessions, effects.session)
        if (effects.turn) put(state.turns, effects.turn)
        appendImmutable(state.pointsLedger, effects.pointsLedger ?? [])
        appendImmutable(state.rewardUnlocks, effects.rewardUnlocks ?? [])
        state.learningEvents.push(event)
        validateState(state)
        return { applied: true, state: learningState(state, event.profileId) }
      }),
  }
}
