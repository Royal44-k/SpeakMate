// Test-only real planner / public material / protected transaction composition.
import type { Repositories } from './repositories'
import type { PracticeSession } from '@/domain/practice/types'
import { createDailyPlan } from '@/domain/goals/planner'
import { practiceFlow } from '@/domain/practice/graded-evidence'
import { settleTaskCompletion } from '@/domain/goals/task-policy'
import { createDialogue } from '@/domain/ai/graded-dialogue'
import { localContentProvider } from '@/content/dialogues/graded/provider'
import {
  newSimulation,
  simulationOptions,
} from '@/features/notebook/simulation-material'
import { GET } from '@/app/content/v1/[category]/route'
import type { LearningEvent } from '@/domain/goals/types'
export const goalAt = (n: number) =>
  new Date(Date.parse('2026-09-10T00:00:00Z') + n * 1000).toISOString()
export async function goalFixture(repos: Repositories) {
  const profile = {
    ...(await repos.profiles.ensureGuestProfile()),
    level: 'A2' as const,
    goals: ['dining' as const],
    dailyMinutes: 5 as const,
  }
  await repos.profiles.save(profile)
  const plan = createDailyPlan({
    profile,
    at: goalAt(0),
    notes: [],
    reviews: [],
    sessions: [],
  })
  await repos.learning.ensureDailyPlan(plan)
  return { profile, plan }
}
export async function completeWarmup(
  repos: Repositories,
  plan: Awaited<ReturnType<typeof goalFixture>>['plan'],
) {
  const task = plan.tasks[0]
  if (task.target.kind !== 'warmup') throw new Error('fixture target')
  await repos.learning.updateDailyPlan(plan.id, (p) => ({
    ...p,
    updatedAt: goalAt(1),
    tasks: p.tasks.map((t) =>
      t.id === task.id ? { ...t, status: 'started', startedAt: goalAt(1) } : t,
    ),
  }))
  const event: LearningEvent = {
    id: 'warmup-event',
    type: 'warmup-completed',
    runId: 'warmup-run',
    profileId: plan.profileId,
    occurredAt: goalAt(2),
    dateKey: plan.dateKey,
    provenance: {
      planId: plan.id,
      sourceTaskId: task.id,
      planDate: plan.dateKey,
      returnTo: '/',
    },
    recalledNoteIds: task.target.noteIds,
    recalledStarterExpressionIds: task.target.starterExpressionIds,
  }
  await repos.learning.recordEvent(event, (state) =>
    settleTaskCompletion(state, event),
  )
}
export async function sceneCandidate(
  plan: Awaited<ReturnType<typeof goalFixture>>['plan'],
) {
  const task = plan.tasks[1],
    target = task.target
  if (target.kind !== 'scene' || !target.selection)
    throw new Error('fixture target')
  const material = await localContentProvider.load({
    sceneId: target.sceneId,
    level: target.selection.level,
  })
  if (material.status !== 'available') throw new Error('fixture unavailable')
  const start = createDialogue(material.pack, target.selection)
  const session: PracticeSession = {
    id: 'goal-actual-scene',
    profileId: plan.profileId,
    sceneId: target.sceneId,
    sceneVersion: target.sceneVersion,
    level: target.selection.level,
    status: 'active',
    startedAt: goalAt(3),
    updatedAt: goalAt(3),
    completedGoals: [],
    openingText: start.reply,
    gradedDialogue: start.snapshot,
    provenance: {
      planId: plan.id,
      sourceTaskId: task.id,
      planDate: plan.dateKey,
      returnTo: '/',
    },
  }
  return session
}
export async function exhaust(
  repos: Repositories,
  initial: PracticeSession,
  offset: number,
) {
  let session = initial
  const cap = practiceFlow(session.gradedDialogue!).requiredUserTurns
  for (let n = 0; n < cap; n++)
    session = (
      await repos.practice.commit({
        kind: 'advance',
        expected: session,
        turnId: `${session.id}-turn-${n}`,
        input: { action: 'answer', text: 'My real imperfect expression' },
        at: goalAt(offset + n),
      })
    ).record.session
  return session
}
export async function simulationCandidate(
  repos: Repositories,
  plan: Awaited<ReturnType<typeof goalFixture>>['plan'],
) {
  const source = {
    id: 'chosen-source',
    kind: 'scene' as const,
    originalText: 'for example',
    sceneId: 'study-02',
    level: 'A2' as const,
    createdAt: goalAt(0),
  }
  const note = await repos.notebook.save({
    id: 'chosen-note',
    profileId: plan.profileId,
    kind: 'phrase',
    text: source.originalText,
    normalizedText: '',
    notes: '',
    tags: [],
    favoriteIds: [],
    sources: [source],
    createdAt: goalAt(0),
    updatedAt: goalAt(0),
  })
  const response = await GET(
    new Request('https://local.test/content/v1/study'),
    { params: Promise.resolve({ category: 'study' }) },
  )
  const options = await simulationOptions(note, source, async () =>
    response.clone(),
  )
  if (!options.length) throw new Error('fixture association unavailable')
  const session = {
    ...newSimulation(note, source, options[0]),
    id: 'goal-actual-simulation',
    startedAt: goalAt(12),
    updatedAt: goalAt(12),
    provenance: {
      planId: plan.id,
      sourceTaskId: plan.tasks[2].id,
      planDate: plan.dateKey,
      sourceNoteId: note.id,
      returnTo: '/',
    },
  }
  return { session, material: options[0], note }
}
