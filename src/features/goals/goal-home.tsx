'use client'
/* Cross-shell navigation follows the existing local document-navigation contract. */
import { useEffect, useMemo, useState } from 'react'
import type { DailyPlanTask } from '@/domain/goals/types'
import {
  createIndexedDbRepositories,
  type Repositories,
} from '@/infrastructure/persistence/repositories'
import {
  createGoalService,
  nowIso,
  type GoalData,
  type GoalService,
} from './goal-service'
import { WarmupFlow } from './warmup-flow'
import { GoalMaterialChoice } from './goal-material-choice'
import { CheckInCalendar } from './check-in-calendar'
import { summarizePoints, summarizeCheckIns } from '@/domain/goals/statistics'
import { swapUnstartedTask } from '@/domain/goals/planner'
import { getSceneMetadata } from '@/content/scenes/metadata'
import {
  navigateLocalHref,
  buildGoalHref,
} from '@/components/app-shell/learning-routes'
import styles from './goals.module.css'
import { useGoalInteraction } from './use-goal-interaction'
const titles = {
  warmup: '表达热身',
  scene: '场景应用',
  consolidation: '记录簿巩固',
  extension: '可选拓展',
}
export function GoalHome({
  repositories,
  fetcher = fetch,
  clock = nowIso,
  navigate = (href) => navigateLocalHref(href, false, 'forward', true),
  date,
  focusTask,
}: {
  repositories?: Repositories
  fetcher?: typeof fetch
  clock?: () => string
  navigate?: (href: string) => void | Promise<void>
  date?: string
  focusTask?: string
}) {
  const [repo] = useState(() => repositories ?? createIndexedDbRepositories())
  const service = useMemo(
    () => createGoalService(repo, fetcher, clock),
    [repo, fetcher, clock],
  )
  const [data, setData] = useState<GoalData>(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0)
  const [warmup, setWarmup] = useState<{
    task: DailyPlanTask
    materials: Awaited<ReturnType<GoalService['warmupMaterials']>>
  }>()
  const [materialTask, setMaterialTask] = useState<DailyPlanTask>()
  const warmupActive =
    !!warmup &&
    data?.plan.tasks.find((task) => task.id === warmup.task.id)?.status !==
      'completed'
  useGoalInteraction(busy)
  useEffect(() => {
    let active = true
    void service
      .load(date)
      .then((value) => {
        if (active) {
          setData(value)
          setError('')
        }
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error ? e.message : '本机计划读取失败，请重试。',
          )
      })
    return () => {
      active = false
    }
  }, [service, date, retry])
  async function action(task: DailyPlanTask) {
    if (!data || busy || warmupActive) return
    setBusy(true)
    setError('')
    try {
      if (task.target.kind === 'warmup') {
        const materials = await service.warmupMaterials(data.plan, task)
        setWarmup({ task, materials })
      } else if (task.target.kind === 'scene' || task.status === 'started') {
        const href = await service.launchScene(data.plan, task)
        await navigate(href)
      } else {
        setMaterialTask(task)
      }
    } catch (e) {
      setError(
        e instanceof Error && /资料|词句|任务/.test(e.message)
          ? e.message
          : '资料准备或本机保存失败。所选任务保持原样，请重试；也可先完成更新。',
      )
    } finally {
      setBusy(false)
    }
  }
  async function duration(value: 5 | 10 | 15) {
    if (!data || warmupActive) return
    setBusy(true)
    try {
      await repo.learning.changeDailyMinutes(data.profile.id, value, clock())
      setRetry((n) => n + 1)
    } catch {
      setError('时长没有保存成功，请重试；已有进度未清除。')
    } finally {
      setBusy(false)
    }
  }
  async function swap(task: DailyPlanTask) {
    if (!data || warmupActive) return
    setBusy(true)
    try {
      await repo.learning.updateDailyPlan(data.plan.id, (p) =>
        swapUnstartedTask(p, task.id, clock()),
      )
      setRetry((n) => n + 1)
    } catch {
      setError('这项任务不能再更换，请重新读取已保存计划。')
    } finally {
      setBusy(false)
    }
  }
  if (!data)
    return (
      <main className={styles.page}>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button onClick={() => setRetry((n) => n + 1)}>重试读取</button>
          </>
        ) : (
          <p role="status">正在读取本机目标…</p>
        )}
      </main>
    )
  const points = summarizePoints(data.state.pointsLedger),
    stats = summarizeCheckIns(data.state.events, clock())
  const stoppedTasks = new Set(
    data.plan.tasks
      .filter((task) => {
        const runs = data.sessions.filter(
          (s) =>
            s.provenance?.planId === data.plan.id &&
            s.provenance.sourceTaskId === task.id,
        )
        return (
          task.status === 'started' &&
          runs.length > 0 &&
          runs.every((s) => s.status === 'abandoned')
        )
      })
      .map((task) => task.id),
  )
  const missingRuns = new Set(
    data.plan.tasks
      .filter(
        (task) =>
          task.status === 'started' &&
          task.target.kind !== 'warmup' &&
          !data.sessions.some(
            (session) =>
              session.provenance?.planId === data.plan.id &&
              session.provenance.sourceTaskId === task.id,
          ),
      )
      .map((task) => task.id),
  )
  if (materialTask)
    return (
      <GoalMaterialChoice
        plan={data.plan}
        task={materialTask}
        notes={data.notes}
        repositories={repo}
        fetcher={fetcher}
        clock={clock}
        navigate={navigate}
      />
    )
  return (
    <main className={styles.page} data-focus-task={focusTask}>
      <header
        className={styles.header}
        data-cover={data.settings.appliedGoalCover}
      >
        <p className={styles.eyebrow}>ONE SMALL PRACTICE</p>
        <h1 data-page-title tabIndex={-1}>
          今日目标
        </h1>
        <p>
          {data.plan.dateKey} · 今日任务等级 {data.plan.snapshot.level}
        </p>
        <p>
          当前个人等级 {data.profile.level}
          。等级和兴趣修改用于未来计划；新的自由练习立即使用当前选择。
        </p>
        <label>
          每日安排
          <select
            disabled={busy || warmupActive || data.plan.dateKey !== stats.today}
            value={data.plan.snapshot.dailyMinutes}
            onChange={(e) =>
              void duration(Number(e.target.value) as 5 | 10 | 15)
            }
          >
            {[5, 10, 15].map((n) => (
              <option key={n} value={n}>
                {n} 分钟
              </option>
            ))}
          </select>
        </label>
        <p>时长为估算；已选路径和已经开始的任务保留。</p>
      </header>
      <section aria-label="本机积分" className={styles.card}>
        <h2>每一步都算数</h2>
        <p>
          累计获得 {points.earned} · 可兑换余额 {points.available}
        </p>
        <a href="/rewards">查看数字奖励</a>
      </section>
      {error ? (
        <div role="alert" className={styles.error}>
          <p>{error}</p>
          <button disabled={busy} onClick={() => setRetry((n) => n + 1)}>
            重新读取
          </button>
          <a href="/install">查看离线与更新</a>
        </div>
      ) : null}
      {warmup ? (
        <WarmupFlow
          key={warmup.task.id}
          service={service}
          plan={data.plan}
          task={warmup.task}
          materials={warmup.materials}
          onComplete={() => setRetry((n) => n + 1)}
          onStarted={() => {
            return navigate(buildGoalHref(data.plan.dateKey, 'warmup'))
          }}
        />
      ) : null}
      <section aria-label="今日任务">
        {data.plan.tasks
          .filter((t) => t.enabled)
          .map((task) => (
            <article
              key={task.id}
              id={`task-${task.slot}`}
              tabIndex={-1}
              className={styles.card}
            >
              <p>{task.optional ? '按需选择 · +10' : '核心任务 · +10'}</p>
              <h2>{titles[task.slot]}</h2>
              <p>
                {task.purposeZh} · 约 {task.estimatedMinutes} 分钟
              </p>
              {task.source.sceneId ? (
                <p>{getSceneMetadata(task.source.sceneId)?.titleZh}</p>
              ) : null}
              <p>{task.completionConditionZh}</p>
              <p>
                {task.status === 'completed'
                  ? '已完成'
                  : missingRuns.has(task.id)
                    ? '原练习历史已删除；任务和积分未重置，可按原日期、等级与材料另开练习。'
                    : stoppedTasks.has(task.id)
                      ? '上次练习已停止；固定目标与原记录保留，可重新练习。'
                      : task.status === 'started'
                        ? '已开始，可继续'
                        : '尚未开始'}
              </p>
              <div className={styles.actions}>
                {task.status !== 'completed' ? (
                  <button
                    className={styles.primary}
                    disabled={busy || warmupActive}
                    onClick={() => void action(task)}
                  >
                    {missingRuns.has(task.id)
                      ? '按原目标另开练习'
                      : stoppedTasks.has(task.id)
                        ? '重新开始固定任务'
                        : task.target.kind === 'warmup'
                          ? '准备表达热身'
                          : task.target.kind === 'scene'
                            ? task.slot === 'extension'
                              ? '开始可选拓展'
                              : task.status === 'started'
                                ? '继续场景应用'
                                : '开始场景应用'
                            : task.status === 'started'
                              ? '继续记录簿巩固'
                              : '选择巩固材料'}
                  </button>
                ) : null}
                {(task.target.kind === 'scene' ||
                  (task.target.kind === 'warmup' &&
                    task.target.noteIds.length > 0)) &&
                task.status === 'not-started' &&
                !task.swapUsed ? (
                  <button
                    disabled={busy || warmupActive}
                    onClick={() => void swap(task)}
                  >
                    {task.target.kind === 'warmup'
                      ? '换成校审备用热身'
                      : '换一项'}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
      </section>
      <section className={styles.card}>
        <h2>本周回顾</h2>
        <p>
          本周完成 {stats.weekCompleted} 次学习 · 连续打卡 {stats.streak} 天
        </p>
        <p>
          今天前台练习 {Math.floor(stats.todayForegroundMs / 60000)}{' '}
          分钟；隐藏页面不累计。
        </p>
        <ul className={styles.days}>
          {stats.sevenDays.map((day) => (
            <li key={day.dateKey} data-done={day.completed > 0}>
              {day.dateKey.slice(5)}
              <br />
              {day.completed ? '已打卡' : '未打卡'}
            </li>
          ))}
        </ul>
        <p>北京时间，周一开始。打开页面、计时和兑换都不打卡。</p>
        {data.plan.tasks.some(
          (t) => !t.optional && t.status !== 'completed',
        ) ? (
          <p>
            应用内提醒：还有一小步未完成；现在方便的话，可以继续。没有后台推送。
          </p>
        ) : (
          <p>这份计划的三项核心任务已完成。</p>
        )}
      </section>
      <CheckInCalendar today={stats.today} completedDates={stats.calendar} />
      <a href="/practice">另开自由练习</a>
      <a href="/guide">本机练习指南</a>
    </main>
  )
}
