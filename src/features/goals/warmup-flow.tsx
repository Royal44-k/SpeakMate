'use client'
import { useRef, useState } from 'react'
import type {
  DailyPlan,
  DailyPlanTask,
  LearningEvent,
} from '@/domain/goals/types'
import type { GoalService } from './goal-service'
import { ExitGuard } from '@/features/practice/exit-guard'
import styles from './goals.module.css'
import { useForegroundTime } from './use-foreground-time'
import { buildGoalHref } from '@/components/app-shell/learning-routes'
import { useGoalInteraction } from './use-goal-interaction'
export function WarmupFlow({
  service,
  plan,
  task,
  materials,
  onComplete,
  onStarted,
}: {
  service: GoalService
  plan: DailyPlan
  task: DailyPlanTask
  materials: Awaited<ReturnType<GoalService['warmupMaterials']>>
  onComplete: () => void
  onStarted: () => void | Promise<void>
}) {
  const [hidden, setHidden] = useState(false),
    [done, setDone] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  const [texts, setTexts] = useState<string[]>(materials.map(() => '')),
    [runId] = useState(() => `warmup_${crypto.randomUUID()}`)
  const pending = useRef<LearningEvent>(undefined)
  const [hasPending, setHasPending] = useState(false)
  useGoalInteraction(busy || (!done && texts.some((text) => !!text.trim())))
  const foreground = useForegroundTime(
    service.repositories,
    plan.profileId,
    runId,
    hidden && !done,
  )
  async function start() {
    setBusy(true)
    setError('')
    try {
      await service.startWarmup(plan, task)
      await onStarted()
      setHidden(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : '本机保存失败，请重试。')
    } finally {
      setBusy(false)
    }
  }
  async function finish() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      pending.current ??= service.warmupEvent(
        plan,
        task,
        runId,
        materials.map((m, i) => ({ ...m, text: texts[i] })),
      )
      setHasPending(true)
      await service.finishWarmup(pending.current)
      setDone(true)
      setTexts(materials.map(() => ''))
      onComplete()
    } catch {
      setError('本机保存未成功，回忆仍保留；请重试同一次完成。')
    } finally {
      setBusy(false)
    }
  }
  if (done) return <p role="status">热身已完成，已保存这次回忆。</p>
  return (
    <section className={styles.card} aria-label="表达热身流程">
      <ExitGuard
        state={
          busy ? 'processing' : texts.some((t) => t.trim()) ? 'draft' : 'clean'
        }
        fallbackHref={buildGoalHref(plan.dateKey, task.slot)}
        onConfirmExit={() => setTexts(materials.map(() => ''))}
      />
      <h2>表达热身</h2>
      <a data-return-to-source href={buildGoalHref(plan.dateKey, task.slot)}>
        返回目标列表
      </a>
      <p>
        {hidden
          ? '看中文提示，主动写出回忆。不要求与参考一字不差。'
          : '先读一遍参考，再隐藏它，尝试回忆。打开参考本身不计完成。'}
      </p>
      {materials.map((m, i) => (
        <div key={`${m.kind}:${m.id}`}>
          <p>{m.cue}</p>
          {!hidden ? (
            <p lang="en" className={styles.english}>
              {m.text}
            </p>
          ) : (
            <label>
              我的回忆{materials.length > 1 ? ` ${i + 1}` : ''}
              <textarea
                maxLength={20000}
                disabled={busy || hasPending}
                value={texts[i]}
                onChange={(e) =>
                  setTexts((old) =>
                    old.map((t, n) => (n === i ? e.target.value : t)),
                  )
                }
              />
            </label>
          )}
        </div>
      ))}
      {error ? <p role="alert">{error}</p> : null}
      {foreground.error ? (
        <p role="status">
          {foreground.error}
          <button onClick={foreground.retry}>重试保存时长</button>
        </p>
      ) : null}
      {!hidden ? (
        <button disabled={busy} onClick={() => void start()}>
          隐藏参考，开始回忆
        </button>
      ) : (
        <button
          disabled={busy || texts.some((t) => !t.trim())}
          onClick={() => void finish()}
        >
          确认完成热身
        </button>
      )}
    </section>
  )
}
