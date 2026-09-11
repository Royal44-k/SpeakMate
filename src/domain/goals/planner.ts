import type { DailyPlan, DailyPlanTask, TaskSlot } from './types'
import type { LearnerProfile } from '@/domain/learning/types'
import type { NotebookEntry } from '@/domain/notebook/types'
import type { CefrLevel } from '@/domain/scenes/types'
import paths from '@/content/goal-path-metadata.json'
import { stableId } from '@/infrastructure/persistence/identity'
import { beijingDateKey } from '@/infrastructure/persistence/data-invariants'

const allocation = { 5: [1, 3, 1], 10: [2, 5, 3], 15: [2, 6, 4, 3] } as const
const ordered = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
function rotation(key: string, length: number) {
  let hash = 0
  for (const c of key) hash = (hash * 31 + c.charCodeAt(0)) >>> 0
  return hash % length
}
export const starterTarget = {
  id: 'coffee.word.black',
  sceneId: 'dining-01',
  category: 'dining' as const,
}

function sceneTask(
  plan: Pick<DailyPlan, 'id' | 'snapshot' | 'dateKey'>,
  slot: 'scene' | 'extension',
  exclude?: string,
): DailyPlanTask {
  const all = paths.filter((p) => p.level === plan.snapshot.level)
  const interested = all.filter((p) =>
    plan.snapshot.interests.includes(
      p.sceneId.split('-')[0] as LearnerProfile['goals'][number],
    ),
  )
  const pool = interested.length ? interested : all
  const candidates = pool.filter((p) => p.sceneId !== exclude)
  const choices = [...(candidates.length ? candidates : pool)].sort((a, b) =>
    ordered(`${a.sceneId}/${a.variantId}`, `${b.sceneId}/${b.variantId}`),
  )
  if (!choices.length) throw new Error('GOAL_PATH_METADATA_UNAVAILABLE')
  const chosen = choices[rotation(plan.id + slot, choices.length)]
  const mode =
    slot === 'extension' || plan.snapshot.dailyMinutes === 5
      ? 'short'
      : 'standard'
  const cap = chosen.modes[mode]
  return {
    id: stableId(plan.id, slot),
    slot,
    optional: slot === 'extension',
    enabled: true,
    status: 'not-started',
    swapUsed: false,
    purposeZh:
      slot === 'scene' ? '把表达用在真实情境演练中' : '再试一个不同情境',
    estimatedMinutes:
      slot === 'extension' ? 3 : allocation[plan.snapshot.dailyMinutes][1],
    completionConditionZh: `完成所选 ${cap} 次提交流程（可使用帮助），再确认结束`,
    target: {
      kind: 'scene',
      sceneId: chosen.sceneId,
      sceneVersion: 1,
      requiredUserTurns: cap,
      selection: {
        schemaVersion: 1,
        level: chosen.level as CefrLevel,
        mode,
        variantId: chosen.variantId,
        contentVersion: chosen.contentVersion,
      },
    },
    source: { reason: 'interests', noteIds: [], sceneId: chosen.sceneId },
    progress: 0,
  }
}
export interface PlanInput {
  profile: LearnerProfile
  at: string
  notes: NotebookEntry[]
  reviews: { noteId: string; nextReviewDateKey: string; reviewedAt: string }[]
  sessions: { sceneId: string; startedAt: string }[]
}
export function createDailyPlan(input: PlanInput): DailyPlan {
  const { profile, at } = input,
    dateKey = beijingDateKey(at)
  const id = stableId('daily-plan', profile.id, dateKey)
  const plan: DailyPlan = {
    id,
    profileId: profile.id,
    dateKey,
    snapshot: {
      level: profile.level,
      interests: [...profile.goals],
      dailyMinutes: profile.dailyMinutes,
    },
    tasks: [],
    createdAt: at,
    updatedAt: at,
  }
  const reviews = new Map(
    [...input.reviews]
      .sort((a, b) => ordered(a.reviewedAt, b.reviewedAt))
      .map((r) => [r.noteId, r]),
  )
  const notes = input.notes.filter(
    (n) => !n.deletedAt && n.profileId === profile.id,
  )
  const priority = (n: NotebookEntry) =>
    reviews.get(n.id)?.nextReviewDateKey &&
    reviews.get(n.id)!.nextReviewDateKey <= dateKey
      ? 0
      : n.favoriteIds.length
        ? 1
        : 2
  notes.sort((a, b) => priority(a) - priority(b) || ordered(a.id, b.id))
  const note = notes[0],
    due = note && priority(note) === 0
  const base = (
    slot: TaskSlot,
  ): Pick<
    DailyPlanTask,
    'id' | 'slot' | 'optional' | 'enabled' | 'status' | 'swapUsed' | 'progress'
  > => ({
    id: stableId(id, slot),
    slot,
    optional: false,
    enabled: true,
    status: 'not-started',
    swapUsed: false,
    progress: 0,
  })
  plan.tasks.push({
    ...base('warmup'),
    purposeZh: '先回忆一条熟悉的表达',
    estimatedMinutes: allocation[profile.dailyMinutes][0],
    completionConditionZh: '先隐藏参考，主动写出回忆，再确认完成',
    target: {
      kind: 'warmup',
      noteIds: note ? [note.id] : [],
      starterExpressionIds: note ? [] : [starterTarget.id],
      requiredRecallCount: 1,
    },
    source: {
      reason: note
        ? due
          ? 'due-notes'
          : note.favoriteIds.length
            ? 'favorites'
            : 'today-expressions'
        : 'starter',
      noteIds: note ? [note.id] : [],
      ...(!note ? { sceneId: starterTarget.sceneId } : {}),
    },
  })
  const last = [...input.sessions].sort((a, b) =>
    ordered(b.startedAt, a.startedAt),
  )[0]
  plan.tasks.push(sceneTask(plan, 'scene', last?.sceneId))
  plan.tasks.push({
    ...base('consolidation'),
    purposeZh: '把记录簿中的表达变成自己的话',
    estimatedMinutes: allocation[profile.dailyMinutes][2],
    completionConditionZh: '先明确选择支持的材料，再完成回忆、造句和定向应用',
    target: { kind: 'simulation-choice' },
    source: { reason: 'today-expressions', noteIds: [] },
  })
  if (profile.dailyMinutes === 15)
    plan.tasks.push(sceneTask(plan, 'extension', plan.tasks[1].source.sceneId))
  return plan
}
export function reconfigureDailyPlan(
  plan: DailyPlan,
  minutes: 5 | 10 | 15,
  at: string,
): DailyPlan {
  const next = structuredClone(plan)
  next.snapshot.dailyMinutes = minutes
  next.updatedAt = at
  next.tasks = next.tasks.map((task) => {
    if (task.status !== 'not-started') return task
    if (task.optional) return { ...task, enabled: minutes === 15 }
    const index = ['warmup', 'scene', 'consolidation'].indexOf(task.slot)
    // Selected practice paths stay fixed; daily minutes are an estimate, not a new length choice.
    return { ...task, estimatedMinutes: allocation[minutes][index] }
  })
  if (minutes === 15 && !next.tasks.some((t) => t.optional))
    next.tasks.push(sceneTask(next, 'extension', next.tasks[1].source.sceneId))
  return next
}
export function swapUnstartedTask(
  plan: DailyPlan,
  taskId: string,
  at: string,
): DailyPlan {
  const task = plan.tasks.find((t) => t.id === taskId)
  if (!task || task.status !== 'not-started' || task.swapUsed || !task.enabled)
    throw new Error('SWAP_NOT_ALLOWED')
  let replacement: DailyPlanTask
  if (task.target.kind === 'warmup' && task.target.noteIds.length)
    replacement = {
      ...task,
      target: {
        kind: 'warmup',
        noteIds: [],
        starterExpressionIds: [starterTarget.id],
        requiredRecallCount: 1,
      },
      source: {
        reason: 'starter',
        noteIds: [],
        sceneId: starterTarget.sceneId,
      },
    }
  else if (task.target.kind === 'scene')
    replacement = sceneTask(
      plan,
      task.slot as 'scene' | 'extension',
      task.target.sceneId,
    )
  else throw new Error('NO_ALTERNATIVE_MATERIAL')
  return {
    ...plan,
    updatedAt: at,
    tasks: plan.tasks.map((t) =>
      t.id === taskId ? { ...replacement, id: t.id, swapUsed: true } : t,
    ),
  }
}
