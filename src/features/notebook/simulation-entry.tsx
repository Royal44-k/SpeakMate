'use client'
import { useEffect, useRef, useState } from 'react'
import type { NotebookEntry } from '@/domain/notebook/types'
import type { TaskProvenance } from '@/domain/goals/types'
import {
  createIndexedDbRepositories,
  type Repositories,
} from '@/infrastructure/persistence/repositories'
import type { PracticeChange } from '@/infrastructure/persistence/practice-repository'
import { SessionResolver } from '@/features/practice/session-resolver'
import { ExitGuard } from '@/features/practice/exit-guard'
import {
  navigateLearning,
  savedSimulationHref,
} from '@/components/app-shell/learning-routes'
import { selectNotebookSource } from './view-state'
import {
  newSimulation,
  simulationOptions,
  type SimulationOption,
} from './simulation-material'
import styles from './notebook.module.css'

const openCreated = (id: string) =>
  navigateLearning({ kind: 'simulation', id }, true, true)
export function SimulationEntry({
  noteId,
  sourceId,
  repositories,
  fetcher = fetch,
  onCreated = openCreated,
  taskProvenance,
}: {
  noteId: string
  sourceId?: string
  repositories?: Repositories
  fetcher?: typeof fetch
  onCreated?: (id: string) => void | Promise<void>
  taskProvenance?: TaskProvenance
}) {
  const [repo] = useState(() => repositories ?? createIndexedDbRepositories())
  const [note, setNote] = useState<NotebookEntry>()
  const [selected, setSelected] = useState(sourceId ?? '')
  const [prepared, setPrepared] = useState<{
    key: string
    options?: SimulationOption[]
    error?: string
  }>()
  const [choice, setChoice] = useState('')
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [busy, setBusy] = useState(false)
  const [hasPending, setHasPending] = useState(false)
  const [created, setCreated] = useState('')
  const [addressError, setAddressError] = useState(false)
  useEffect(() => {
    if (!busy) return
    const root = document.documentElement
    const previous = root.dataset.interactionBusy
    root.dataset.interactionBusy = 'true'
    return () => {
      if (previous === undefined) delete root.dataset.interactionBusy
      else root.dataset.interactionBusy = previous
    }
  }, [busy])
  const lock = useRef(false)
  const pending = useRef<
    Extract<PracticeChange, { kind: 'create' }> | undefined
  >(undefined)
  useEffect(() => {
    let active = true
    void repo.notebook
      .get(noteId)
      .then((value) => {
        if (!active) return
        if (!value || value.deletedAt)
          throw new Error('这条词句不存在或已删除。')
        setNote(value)
      })
      .catch(() => {
        if (active) setError('本机词句暂不可用，请重试读取；记录未被修改。')
      })
    return () => {
      active = false
    }
  }, [noteId, repo, retry])
  const source =
    note?.sources.find((item) => item.id === selected) ??
    (note?.sources.length === 1 ? note.sources[0] : undefined)
  const key = JSON.stringify([note?.id, note?.text, note?.kind, source, retry])
  const options = prepared?.key === key ? prepared.options : undefined
  const displayError =
    error || (prepared?.key === key ? prepared.error : undefined)
  useEffect(() => {
    if (source) selectNotebookSource(noteId, source.id)
  }, [noteId, source])
  useEffect(() => {
    if (!note) return
    let active = true
    pending.current = undefined
    void simulationOptions(note, source, fetcher)
      .then((value) => {
        if (active) {
          setPrepared({ key, options: value })
          setHasPending(false)
          setChoice(value[0]?.analysis.id ?? '')
        }
      })
      .catch(() => {
        if (active)
          setPrepared({
            key,
            error:
              '公开资料尚未准备好或下载失败。请重试；原文仍可阅读和导出，不把失败当作未收录。',
          })
      })
    return () => {
      active = false
    }
  }, [note, source, fetcher, retry, key])
  async function start() {
    const option = options?.find((item) => item.analysis.id === choice)
    if (lock.current || !note || !source || !option) return
    lock.current = true
    setBusy(true)
    setError('')
    try {
      pending.current ??= {
        kind: 'create',
        session: {
          ...newSimulation(note, source, option),
          ...(taskProvenance ? { provenance: taskProvenance } : {}),
        },
        ...(taskProvenance
          ? {
              taskLaunch: {
                planId: taskProvenance.planId,
                taskId: taskProvenance.sourceTaskId,
              },
            }
          : {}),
        simulationMaterial: {
          analysis: option.analysis,
          sourcePack: option.sourcePack,
          descriptor: option.descriptor,
        },
      }
      setHasPending(true)
      const saved = await repo.practice.commit(pending.current)
      try {
        await onCreated?.(saved.record.session.id)
      } catch {
        setAddressError(true)
      }
      setCreated(saved.record.session.id)
    } catch {
      setError(
        (taskProvenance ? '词句已保存，练习尚未开始。' : '') +
          '未能确认本机保存。请重试同一次创建，或返回重新读取词句；不会自动替换来源。',
      )
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  if (created)
    return (
      <>
        {addressError ? (
          <p role="alert">
            练习已保存，但地址未更新。请
            <a href={savedSimulationHref(created)}>打开这次已保存练习</a>
            ，不要重新新建。
          </p>
        ) : null}
        <SessionResolver
          requestedId={created}
          repositories={repo}
          simulationOnly
        />
      </>
    )
  return (
    <main className={styles.page}>
      <ExitGuard
        state={busy ? 'processing' : 'clean'}
        fallbackHref={taskProvenance?.returnTo ?? '/notebook'}
        onConfirmExit={() => {}}
      />
      <h1 data-page-title tabIndex={-1}>
        定向模拟练习
      </h1>
      {note ? (
        <>
          <p>原文：{note.text}</p>
          <label>
            本次使用的来源
            <select
              value={source?.id ?? ''}
              disabled={busy || hasPending}
              onChange={(event) => {
                setSelected(event.target.value)
                setError('')
              }}
            >
              <option value="">请明确选择来源</option>
              {note.sources.map((item, index) => (
                <option key={item.id} value={item.id}>
                  {index + 1} ·{' '}
                  {item.sceneTitleZh ?? item.sceneId ?? '没有场景语境'} ·{' '}
                  {item.level ?? '等级未保存'}
                </option>
              ))}
            </select>
          </label>
          {source ? (
            <p>{source.originalText}</p>
          ) : (
            <p>没有所选来源，不借用其他词句的同名来源。</p>
          )}
          {options?.length ? (
            <section className={styles.card}>
              <label>
                本次练习的已覆盖表达
                <select
                  value={choice}
                  disabled={busy || hasPending}
                  onChange={(event) => setChoice(event.target.value)}
                >
                  {options.map((option) => (
                    <option key={option.analysis.id} value={option.analysis.id}>
                      {option.target.text}
                    </option>
                  ))}
                </select>
              </label>
              <p>
                {options.find((option) => option.analysis.id === choice)?.target
                  .coverage === 'partial'
                  ? '仅练明确选中的覆盖片段，不解析、确认或评分原整句。'
                  : '按保存来源等级练习相关用法，不是对原句语言能力评分。'}
              </p>
              <p>
                这是一段新的固定情境，不沿用原对话中的事实。来源等级{' '}
                {source?.level}；先回忆、自己造句，再完成{' '}
                {
                  options.find((option) => option.analysis.id === choice)
                    ?.descriptor.questionIds.length
                }{' '}
                轮应用。
              </p>
              <button disabled={busy} onClick={() => void start()}>
                开始这次定向练习
              </button>
            </section>
          ) : options ? (
            <p>
              此来源与表达没有可用的定向资料；可返回词句做自我回忆、写备注或本地跟读，不生成模拟完成或评分。
            </p>
          ) : !displayError ? (
            <p role="status">正在本机准备公开资料…</p>
          ) : null}
        </>
      ) : !displayError ? (
        <p role="status">正在读取词句…</p>
      ) : null}
      {displayError ? (
        <>
          <p role="alert">{displayError}</p>
          <button
            disabled={busy}
            onClick={() =>
              pending.current ? void start() : setRetry((n) => n + 1)
            }
          >
            重试
          </button>
        </>
      ) : null}
      <div className={styles.actions}>
        {taskProvenance ? (
          <a data-return-to-source href={taskProvenance.returnTo}>
            返回原计划
          </a>
        ) : null}
        <a data-return-to-source href="/notebook">
          返回记录簿
        </a>
        <a href="/privacy">导出本机数据</a>
      </div>
    </main>
  )
}
