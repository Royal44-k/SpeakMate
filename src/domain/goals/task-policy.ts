import type {
  DailyPlan,
  DailyPlanTask,
  LearningEvent,
  SimulationSelection,
} from './types'
import type { PracticeSession } from '@/domain/practice/types'
import { practiceFlow } from '@/domain/practice/graded-evidence'
import { canonical, stableId } from '@/infrastructure/persistence/identity'
import {
  beijingDateKey,
  learningEventId,
} from '@/infrastructure/persistence/data-invariants'
import type {
  LearningEffects,
  LearningState,
} from '@/infrastructure/persistence/learning-repository'

export function simulationSelection(
  session: PracticeSession,
): SimulationSelection {
  const sim = session.simulation!
  return {
    schemaVersion: 1,
    noteId: sim.source.noteId,
    sourceId: sim.source.sourceId,
    sourceLevel: session.level,
    descriptorId: sim.descriptor.id,
    descriptorVersion: sim.descriptor.version,
    sourceContentVersion: sim.descriptor.sourceContentVersion,
  }
}

export function validateTaskSession(
  task: DailyPlanTask,
  session: PracticeSession,
): void {
  const target = task.target,
    snapshot = session.gradedDialogue
  if (
    !snapshot ||
    !('requiredUserTurns' in target) ||
    target.requiredUserTurns !== practiceFlow(snapshot).requiredUserTurns
  )
    throw new Error('TASK_PATH_MISMATCH')
  if (target.kind === 'scene') {
    const selected = target.selection
    if (
      session.simulation ||
      target.sceneId !== session.sceneId ||
      target.sceneVersion !== session.sceneVersion ||
      !selected ||
      selected.level !== session.level ||
      selected.mode !== snapshot.state.mode ||
      selected.variantId !== snapshot.state.variantId ||
      selected.contentVersion !== snapshot.pack.contentVersion
    )
      throw new Error('TASK_PATH_MISMATCH')
  } else if (target.kind === 'simulation') {
    if (
      !session.simulation ||
      canonical(target.noteIds) !== canonical(session.simulation.noteIds) ||
      !target.selection ||
      canonical(target.selection) !== canonical(simulationSelection(session))
    )
      throw new Error('TASK_SOURCE_MISMATCH')
  } else throw new Error('TASK_PATH_MISMATCH')
}

export function launchTask(
  plan: DailyPlan,
  taskId: string,
  session: PracticeSession,
): DailyPlan {
  const original = plan.tasks.find((t) => t.id === taskId)
  if (!original || original.status !== 'not-started' || !original.enabled)
    throw new Error('TASK_ALREADY_STARTED')
  const p = session.provenance
  if (
    !p ||
    p.planId !== plan.id ||
    p.sourceTaskId !== taskId ||
    p.planDate !== plan.dateKey ||
    session.profileId !== plan.profileId
  )
    throw new Error('TASK_PROVENANCE_MISMATCH')
  let task = structuredClone(original)
  if (task.target.kind === 'simulation-choice') {
    if (!session.simulation) throw new Error('MATERIAL_CHOICE_REQUIRED')
    const cap = practiceFlow(session.gradedDialogue!).requiredUserTurns
    if (cap !== 3 && cap !== 4 && cap !== 5)
      throw new Error('TASK_PATH_MISMATCH')
    task = {
      ...task,
      target: {
        kind: 'simulation',
        noteIds: session.simulation.noteIds,
        requiredUserTurns: cap,
        selection: simulationSelection(session),
      },
      source: {
        reason: task.source.reason,
        noteIds: session.simulation.noteIds,
        sceneId: session.sceneId,
      },
      completionConditionZh: `主动回忆并造句，完成所选 ${cap} 次提交的应用流程后确认结束`,
    }
  }
  validateTaskSession(task, session)
  task = { ...task, status: 'started', startedAt: session.startedAt }
  return {
    ...plan,
    updatedAt: session.startedAt,
    tasks: plan.tasks.map((t) => (t.id === taskId ? task : t)),
  }
}

/** Live evidence only. Historical snapshots may legitimately omit responses. */
export function hasFreshRecallEvidence(event: LearningEvent): boolean {
  if (event.type !== 'warmup-completed') return false
  const ids = [
    ...event.recalledNoteIds.map((id) => 'note:' + id),
    ...event.recalledStarterExpressionIds.map((id) => 'starter:' + id),
  ]
  const responses = event.recallResponses
  return (
    !!responses &&
    ids.length > 0 &&
    new Set(ids).size === ids.length &&
    responses.length === ids.length &&
    new Set(responses.map((r) => r.kind + ':' + r.id)).size === ids.length &&
    responses.every((r) => !!r.text.trim() && ids.includes(r.kind + ':' + r.id))
  )
}

export function qualifiesTaskCompletion(
  task: DailyPlanTask,
  event: LearningEvent,
): boolean {
  if (task.status === 'not-started' || !task.enabled) return false
  const t = task.target
  if (t.kind === 'warmup' && event.type === 'warmup-completed') {
    const notes = new Set(event.recalledNoteIds),
      starters = new Set(event.recalledStarterExpressionIds)
    if (
      event.recallResponses &&
      (event.recallResponses.length !== notes.size + starters.size ||
        new Set(event.recallResponses.map((r) => r.kind + ':' + r.id)).size !==
          event.recallResponses.length ||
        event.recallResponses.some(
          (r) =>
            !r.text.trim() || !(r.kind === 'note' ? notes : starters).has(r.id),
        ))
    )
      return false
    return (
      notes.size === event.recalledNoteIds.length &&
      starters.size === event.recalledStarterExpressionIds.length &&
      [...notes].every((id) => t.noteIds.includes(id)) &&
      [...starters].every((id) => t.starterExpressionIds.includes(id)) &&
      notes.size + starters.size >= t.requiredRecallCount
    )
  }
  if (
    (t.kind === 'scene' && event.type === 'session-completed') ||
    (t.kind === 'simulation' && event.type === 'simulation-completed')
  ) {
    const e = event.evidence
    if (
      !e ||
      e.sessionId !== event.sessionId ||
      e.confirmedAt !== event.occurredAt ||
      e.requiredUserTurns !== t.requiredUserTurns ||
      e.expressionTurns < 1 ||
      e.expressionTurns > e.submittedTurns ||
      !(
        (e.basis === 'path-cap' && e.submittedTurns === e.requiredUserTurns) ||
        (e.basis === 'achieved' &&
          e.outcome === 'achieved' &&
          e.submittedTurns <= e.requiredUserTurns)
      )
    )
      return false
    if (t.kind === 'scene')
      return (
        e.sceneId === t.sceneId &&
        e.sceneVersion === t.sceneVersion &&
        (!t.selection ||
          (e.level === t.selection.level &&
            e.mode === t.selection.mode &&
            e.variantId === t.selection.variantId &&
            e.contentVersion === t.selection.contentVersion))
      )
    return (
      event.type === 'simulation-completed' &&
      event.recallCompleted &&
      !!event.compositionText.trim() &&
      event.completedUserTurns === e.submittedTurns &&
      canonical(event.noteIds) === canonical(t.noteIds) &&
      !!t.selection &&
      canonical(event.selection) === canonical(t.selection)
    )
  }
  return false
}

export function settleTaskCompletion(
  state: Readonly<LearningState>,
  event: LearningEvent,
): LearningEffects {
  if (event.type === 'warmup-completed' && !hasFreshRecallEvidence(event))
    throw new Error('WARMUP_RECALL_REQUIRED')
  if (!event.provenance) return {}
  const plan = state.dailyPlans.find((p) => p.id === event.provenance!.planId)
  const task = plan?.tasks.find((t) => t.id === event.provenance!.sourceTaskId)
  if (
    !plan ||
    !task ||
    plan.profileId !== event.profileId ||
    plan.dateKey !== event.provenance.planDate ||
    !qualifiesTaskCompletion(task, event)
  )
    throw new Error('TASK_EVIDENCE_MISMATCH')
  if (task.status === 'completed') return {}
  const done = {
    ...task,
    status: 'completed' as const,
    progress: 1,
    completedAt: event.occurredAt,
    completionEventId: event.id,
  }
  const dailyPlan = {
    ...plan,
    updatedAt: event.occurredAt,
    tasks: plan.tasks.map((t) => (t.id === task.id ? done : t)),
  }
  const ruleId = task.optional ? 'goal-extension' : 'goal-core'
  const pointsLedger = [
    {
      id: stableId(plan.id, task.id, ruleId),
      profileId: plan.profileId,
      eventId: event.id,
      ruleId,
      ruleVersion: 1,
      delta: 10,
      createdAt: event.occurredAt,
    },
  ]
  if (
    !task.optional &&
    dailyPlan.tasks
      .filter((t) => !t.optional)
      .every((t) => t.status === 'completed') &&
    !state.events.some(
      (e) => e.type === 'daily-plan-completed' && e.planId === plan.id,
    )
  ) {
    const dailyPlanCompletion: LearningEvent = {
      id: stableId(plan.id, 'daily-plan-completed'),
      type: 'daily-plan-completed',
      profileId: plan.profileId,
      planId: plan.id,
      occurredAt: event.occurredAt,
      dateKey: event.dateKey,
    }
    pointsLedger.push({
      id: stableId(plan.id, 'goal-all-core'),
      profileId: plan.profileId,
      eventId: dailyPlanCompletion.id,
      ruleId: 'goal-all-core',
      ruleVersion: 1,
      delta: 5,
      createdAt: event.occurredAt,
    })
    return { dailyPlan, pointsLedger, dailyPlanCompletion }
  }
  return { dailyPlan, pointsLedger }
}

export function practiceCompletionEvent(
  session: PracticeSession,
): LearningEvent {
  const common = {
    id: 'pending',
    profileId: session.profileId,
    occurredAt: session.completedAt!,
    dateKey: beijingDateKey(session.completedAt!),
    ...(session.provenance ? { provenance: session.provenance } : {}),
    sessionId: session.id,
    evidence: session.completionEvidence!,
  }
  const sim = session.simulation
  const event: LearningEvent = sim
    ? {
        ...common,
        type: 'simulation-completed',
        runId: session.id,
        noteIds: sim.noteIds,
        recallCompleted: !!sim.recall,
        compositionText: sim.composition!.text,
        completedUserTurns: session.completionEvidence!.submittedTurns,
        selection: simulationSelection(session),
      }
    : { ...common, type: 'session-completed' }
  event.id = learningEventId(event)
  return event
}
