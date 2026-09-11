'use client'
import { useRef, useState } from 'react'
import type { DailyPlan, DailyPlanTask } from '@/domain/goals/types'
import type { NotebookEntry } from '@/domain/notebook/types'
import type { Repositories } from '@/infrastructure/persistence/repositories'
import { loadPublicCategory } from '@/content/public-category'
import { starterTarget } from '@/domain/goals/planner'
import { SimulationEntry } from '@/features/notebook/simulation-entry'
import {
  buildGoalHref,
  buildLearningHref,
} from '@/components/app-shell/learning-routes'
import styles from './goals.module.css'
import { ExitGuard } from '@/features/practice/exit-guard'
import { useGoalInteraction } from './use-goal-interaction'

export function GoalMaterialChoice({
  plan,
  task,
  notes,
  repositories,
  fetcher,
  clock,
  navigate,
}: {
  plan: DailyPlan
  task: DailyPlanTask
  notes: NotebookEntry[]
  repositories: Repositories
  fetcher: typeof fetch
  clock: () => string
  navigate: (href: string) => void | Promise<void>
}) {
  const [selected, setSelected] = useState<NotebookEntry>(),
    [preview, setPreview] = useState<NotebookEntry>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  const pending = useRef<NotebookEntry | undefined>(undefined)
  useGoalInteraction(busy)
  const returnTo = buildGoalHref(plan.dateKey, task.slot)
  async function prepare() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const data = await loadPublicCategory(starterTarget.category, fetcher)
      const analysis = data.analyses.find(
        (item) => item.id === starterTarget.id,
      )
      if (
        !analysis ||
        !analysis.examples.some(
          (example) => example.level === plan.snapshot.level,
        )
      )
        throw new Error('资料不匹配')
      const at = clock()
      setPreview({
        id: crypto.randomUUID(),
        profileId: plan.profileId,
        kind: analysis.kind,
        text: analysis.forms[0],
        normalizedText: '',
        translationZh: analysis.meaningZh,
        notes: '',
        tags: [],
        favoriteIds: [],
        createdAt: at,
        updatedAt: at,
        sources: [
          {
            id: crypto.randomUUID(),
            kind: 'scene',
            originalText: analysis.forms[0],
            translationZh: analysis.meaningZh,
            sceneId: starterTarget.sceneId,
            level: plan.snapshot.level,
            createdAt: at,
          },
        ],
      })
    } catch {
      setError('备用公开资料尚未准备好，请重试或完成更新；已有笔记保持原样。')
    } finally {
      setBusy(false)
    }
  }
  async function capture() {
    if (busy || !preview) return
    setBusy(true)
    setError('')
    try {
      pending.current ??= preview
      const saved = await repositories.notebook.capture(pending.current)
      setSelected(saved.entry)
    } catch {
      setError('词句尚未保存成功，请重试；不会开始练习。')
    } finally {
      setBusy(false)
    }
  }
  if (selected)
    return (
      <>
        <p className={styles.page}>
          词句已保存。请确认来源等级与实际练习路径后开始；仅保存不打卡、不发积分。
        </p>
        <SimulationEntry
          noteId={selected.id}
          repositories={repositories}
          fetcher={fetcher}
          taskProvenance={{
            planId: plan.id,
            sourceTaskId: task.id,
            planDate: plan.dateKey,
            sourceNoteId: selected.id,
            returnTo,
          }}
          onCreated={(id) => {
            return navigate(
              buildLearningHref({ kind: 'simulation', id, from: returnTo }),
            )
          }}
        />
      </>
    )
  return (
    <main className={styles.page}>
      <ExitGuard
        state={busy ? 'processing' : 'clean'}
        fallbackHref={returnTo}
        onConfirmExit={() => {}}
      />
      <h1 data-page-title tabIndex={-1}>
        选择巩固材料
      </h1>
      <p>
        先选真实词句，再确认可用来源和实际轮数。未知原文不会被替换，也不会生成完成记录。
      </p>
      {notes.length ? (
        <section className={styles.card}>
          <h2>我的记录簿</h2>
          {notes.map((note) => (
            <button
              key={note.id}
              disabled={busy}
              onClick={() => setSelected(note)}
            >
              {note.text}
            </button>
          ))}
        </section>
      ) : (
        <p>记录簿还没有词句。可以先查看一条公开校审词句，再决定是否记录。</p>
      )}
      <section className={styles.card}>
        <h2>明确选择备用词句</h2>
        <button disabled={busy} onClick={() => void prepare()}>
          查看校审备用词句
        </button>
        {preview ? (
          <>
            <p lang="en" className={styles.english}>
              {preview.text}
            </p>
            <p>{preview.translationZh}</p>
            <p>
              来源：咖啡点单 · {plan.snapshot.level}。会按真实来源准备定向资料。
            </p>
            <button disabled={busy} onClick={() => void capture()}>
              记录这条校审词句并用于任务
            </button>
          </>
        ) : null}
      </section>
      {error ? <p role="alert">{error}</p> : null}
      <a data-return-to-source href={returnTo}>
        返回原计划
      </a>
      <a href="/install">查看离线与更新</a>
    </main>
  )
}
