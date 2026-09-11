import type {
  DailyPlan,
  DailyPlanTask,
  LearningEvent,
} from '@/domain/goals/types'
import type { Repositories } from '@/infrastructure/persistence/repositories'
import type { PracticeChange } from '@/infrastructure/persistence/practice-repository'
import { createDailyPlan, starterTarget } from '@/domain/goals/planner'
import {
  beijingDateKey,
  learningEventId,
} from '@/infrastructure/persistence/data-invariants'
import {
  publicContentProvider,
  loadPublicCategory,
} from '@/content/public-category'
import { createDialogue } from '@/domain/ai/graded-dialogue'
import { selectedPracticePresentation } from '@/content/scenes/practice-presentation'
import {
  buildLearningHref,
  buildGoalHref,
  savedPracticeHref,
  savedSimulationHref,
} from '@/components/app-shell/learning-routes'
import { settleTaskCompletion } from '@/domain/goals/task-policy'
import { canonical } from '@/infrastructure/persistence/identity'

export const nowIso = () => new Date().toISOString()
export function createGoalService(
  repo: Repositories,
  fetcher: typeof fetch,
  clock = nowIso,
) {
  const pending = new Map<string, Extract<PracticeChange, { kind: 'create' }>>()
  return {
    repositories: repo,
    async load(date?: string) {
      const profile = await repo.profiles.ensureGuestProfile()
      const [state, notes, sessions, settings] = await Promise.all([
        repo.learning.getState(profile.id),
        repo.notebook.list({ profileId: profile.id }),
        repo.sessions.list(),
        repo.learning.getSettings(),
      ])
      const at = clock(),
        today = beijingDateKey(at),
        day = date ?? today
      let plan = await repo.learning.getDailyPlan(profile.id, day)
      if (!plan && day !== today)
        throw new Error('这个日期没有保存的计划；本机记录没有修改。')
      plan ??= await repo.learning.ensureDailyPlan(
        createDailyPlan({
          profile,
          at,
          notes,
          reviews: state.reviews,
          sessions,
        }),
      )
      return { profile, plan, state, notes, sessions, settings }
    },
    async launchScene(plan: DailyPlan, task: DailyPlanTask) {
      const existing = (await repo.sessions.list())
        .filter(
          (s) =>
            s.provenance?.planId === plan.id &&
            s.provenance.sourceTaskId === task.id &&
            s.status !== 'abandoned',
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
      if (existing) {
        const href = existing.simulation
          ? savedSimulationHref(existing.id)
          : savedPracticeHref(
              existing.id,
              existing.status === 'completed' ? 'report' : 'session',
            )
        if (!href)
          throw new Error('此保留记录不能直接链接，请在练习记录中查看。')
        return href
      }
      const target = task.target
      if (target.kind !== 'scene' || !target.selection)
        throw new Error('旧任务缺少固定路径信息，请保留记录并另开自由练习。')
      const key = plan.id + task.id
      let command = pending.get(key)
      if (!command) {
        const selected = target.selection
        const material = await publicContentProvider(fetcher).load({
          sceneId: target.sceneId,
          level: selected.level,
          contentVersion: selected.contentVersion,
        })
        if (material.status !== 'available')
          throw new Error('所选资料尚未准备好，请重试或完成更新。')
        const start = createDialogue(material.pack, selected),
          at = clock()
        command = {
          kind: 'create',
          taskLaunch: { planId: plan.id, taskId: task.id },
          session: {
            id: `goal-session_${crypto.randomUUID()}`,
            profileId: plan.profileId,
            sceneId: target.sceneId,
            sceneVersion: target.sceneVersion,
            level: selected.level,
            status: 'active',
            startedAt: at,
            updatedAt: at,
            completedGoals: [],
            openingText: start.reply,
            gradedDialogue: start.snapshot,
            presentation: selectedPracticePresentation(
              material.pack,
              selected.variantId,
            ),
            provenance: {
              planId: plan.id,
              sourceTaskId: task.id,
              planDate: plan.dateKey,
              returnTo: buildGoalHref(plan.dateKey, task.slot),
            },
          },
        }
        pending.set(key, command)
      }
      const saved = await repo.practice.commit(command)
      return buildLearningHref({
        kind: 'session',
        id: saved.record.session.id,
        from: buildGoalHref(plan.dateKey, task.slot),
      })
    },
    async warmupMaterials(plan: DailyPlan, task: DailyPlanTask) {
      if (task.target.kind !== 'warmup') throw new Error('热身目标无效')
      const materials: {
        id: string
        kind: 'note' | 'starter'
        text: string
        cue: string
      }[] = []
      for (const id of task.target.noteIds) {
        const note = await repo.notebook.get(id)
        if (!note || note.deletedAt)
          throw new Error('已选词句暂不可用；未开始任务，请恢复原词句后重试。')
        materials.push({
          id,
          kind: 'note',
          text: note.text,
          cue:
            note.translationZh || '回忆刚才读过的词句；也可以用自己的话表达。',
        })
      }
      if (task.target.starterExpressionIds.length) {
        const data = await loadPublicCategory(starterTarget.category, fetcher)
        for (const id of task.target.starterExpressionIds) {
          const entry = data.analyses.find(
            (e) =>
              e.id === id &&
              e.examples.some(
                (example) => example.level === plan.snapshot.level,
              ),
          )
          if (!entry)
            throw new Error('已选热身资料不匹配，请完成资料更新后重试。')
          materials.push({
            id,
            kind: 'starter',
            text: entry.forms[0],
            cue: entry.meaningZh,
          })
        }
      }
      return materials
    },
    startWarmup: (plan: DailyPlan, task: DailyPlanTask) =>
      repo.learning.updateDailyPlan(plan.id, (current) => ({
        ...current,
        updatedAt: clock(),
        tasks: current.tasks.map((t) => {
          if (t.id !== task.id) return t
          if (t.status === 'completed')
            throw new Error('任务已完成，请返回目标查看。')
          if (
            t.target.kind !== 'warmup' ||
            canonical(t.target) !== canonical(task.target)
          )
            throw new Error('热身材料已变化，请重新准备。')
          return t.status === 'started'
            ? t
            : { ...t, status: 'started', startedAt: clock() }
        }),
      })),
    finishWarmup: async (event: LearningEvent) =>
      repo.learning.recordEvent(event, (state) =>
        settleTaskCompletion(state, event),
      ),
    warmupEvent: (
      plan: DailyPlan,
      task: DailyPlanTask,
      runId: string,
      responses: { id: string; kind: 'note' | 'starter'; text: string }[],
    ): LearningEvent => {
      if (responses.some((r) => !r.text.trim()))
        throw new Error('请先写出你的回忆。')
      const at = clock(),
        event: LearningEvent = {
          id: 'pending',
          type: 'warmup-completed',
          profileId: plan.profileId,
          runId,
          occurredAt: at,
          dateKey: beijingDateKey(at),
          provenance: {
            planId: plan.id,
            sourceTaskId: task.id,
            planDate: plan.dateKey,
            returnTo: buildGoalHref(plan.dateKey, task.slot),
          },
          recalledNoteIds: responses
            .filter((r) => r.kind === 'note')
            .map((r) => r.id),
          recalledStarterExpressionIds: responses
            .filter((r) => r.kind === 'starter')
            .map((r) => r.id),
          recallResponses: responses.map((r) => ({
            id: r.id,
            kind: r.kind,
            text: r.text.trim(),
          })),
        }
      event.id = learningEventId(event)
      return event
    },
  }
}
export type GoalService = ReturnType<typeof createGoalService>
export type GoalData = Awaited<ReturnType<GoalService['load']>>
