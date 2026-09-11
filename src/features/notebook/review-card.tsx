'use client'
import { useEffect, useRef, useState } from 'react'
import type { LearningAssistantProvider } from '@/content/analysis/provider'
import { publicLearningAssistant } from '@/content/public-category'
import type { NotebookEntry, ReviewRating } from '@/domain/notebook/types'
import type { Repositories } from '@/infrastructure/persistence/repositories'
import { reviewCompletion } from './review'
import styles from './notebook.module.css'
import { selectedNotebookSource } from './view-state'
const publicAssistant = publicLearningAssistant()
export function ReviewCard({
  note,
  repositories,
  onCompleted,
  assistant = publicAssistant,
}: {
  note: NotebookEntry
  repositories: Repositories
  onCompleted?: () => void
  assistant?: LearningAssistantProvider
}) {
  const [revealed, setRevealed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const [hasPending, setHasPending] = useState(false)
  const pending = useRef<ReturnType<typeof reviewCompletion> | undefined>(
    undefined,
  )
  const working = useRef(false)
  const source =
    note.sources.find((item) => item.id === selectedNotebookSource(note.id)) ??
    note.sources[0]
  const cueKey = JSON.stringify([note.id, note.text, note.kind, source])
  const [cue, setCue] = useState<{ key: string; text: string }>()
  useEffect(() => {
    let active = true
    const context = source?.originalText ?? ''
    const escaped = note.text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const masked = escaped
      ? context.replace(new RegExp(escaped, 'gi'), '____')
      : context
    const fallback =
      masked !== context && /[a-z]/i.test(masked.replaceAll('____', ''))
        ? `保存时的上下文：${masked}`
        : '暂无可用的非答案提示。请自行回忆，或查看原文后再练；没有生成释义。'
    void assistant
      .analyze({
        text: note.text,
        kind: note.kind,
        sceneId: source?.sceneId,
        questionId: source?.questionId,
        level: source?.level ?? 'A1',
      })
      .then((result) => {
        // Only an exact reviewed meaning describes this whole answer. Partial matches must not imply whole-expression coverage.
        const meaning =
          result.status === 'exact' ? result.entries[0]?.meaningZh : undefined
        const safeMeaning =
          meaning && escaped
            ? meaning.replace(new RegExp(escaped, 'gi'), '____')
            : undefined
        if (active)
          setCue({
            key: cueKey,
            text: safeMeaning ? `校审含义：${safeMeaning}` : fallback,
          })
      })
      .catch(() => {
        if (active)
          setCue({
            key: cueKey,
            text: `${fallback} 本地提示资料暂不可用，可继续自评。`,
          })
      })
    return () => {
      active = false
    }
  }, [assistant, cueKey, note.text, note.kind, source])
  async function save(rating?: ReviewRating) {
    if (working.current) return
    working.current = true
    setBusy(true)
    setError('')
    try {
      if (!pending.current) {
        if (!rating || !revealed) return
        const head = await repositories.learning.getReviewSchedule(note.id)
        pending.current = reviewCompletion(
          note,
          rating,
          head,
          crypto.randomUUID(),
          new Date().toISOString(),
        )
        setHasPending(true)
      }
      const completion = pending.current
      await repositories.learning.recordEvent(completion.event, () => ({
        review: completion.review,
      }))
      setDone(
        `本次自评已保存，下次复习：${completion.review.nextReviewDateKey}。`,
      )
      pending.current = undefined
      setHasPending(false)
      onCompleted?.()
    } catch (cause) {
      if (
        cause instanceof Error &&
        cause.message.includes('REVIEW_SCHEDULE_STALE')
      ) {
        try {
          await repositories.learning.getReviewSchedule(note.id)
          pending.current = undefined
          setHasPending(false)
          setRevealed(false)
          setError(
            '另一窗口已提交复习，已重新读取最新进度。请重新回忆后确认，不会另起旧复习链。',
          )
        } catch {
          setError('最新复习进度暂时无法读取，请重试；不会从旧进度另起复习链。')
        }
      } else setError('自评未保存，请重试本次自评；不会重复记录。')
    } finally {
      working.current = false
      setBusy(false)
    }
  }
  return (
    <section className={styles.card} aria-label="自评复习">
      <h2>自我回忆</h2>
      <p>
        来源：
        {source?.sceneTitleZh ?? source?.sceneId ?? '个人词句'}
        。先试着回想这条{note.kind === 'word' ? '单词' : '表达'}。
      </p>
      {!revealed && !done ? (
        <p>{cue?.key === cueKey ? cue.text : '正在读取本地回忆提示…'}</p>
      ) : null}
      {done ? (
        <p role="status">{done}</p>
      ) : revealed ? (
        <>
          <p lang="en" className={styles.original}>
            {note.text}
          </p>
          <p>这是你的自评，不是系统测出的掌握率。</p>
          <div className={styles.actions}>
            {(['remember', 'vague', 'forgot'] as const).map((rating, index) => (
              <button
                key={rating}
                disabled={busy || hasPending}
                onClick={() => void save(rating)}
              >
                {['记得', '模糊', '忘记'][index]}
              </button>
            ))}
          </div>
        </>
      ) : (
        <button disabled={busy} onClick={() => setRevealed(true)}>
          已尝试回忆，查看原文
        </button>
      )}
      {error ? <p role="alert">{error}</p> : null}
      {hasPending && error ? (
        <button disabled={busy} onClick={() => void save()}>
          重试保存本次自评
        </button>
      ) : null}
    </section>
  )
}
