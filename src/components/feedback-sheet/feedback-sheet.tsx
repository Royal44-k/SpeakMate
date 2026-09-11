'use client'

import { CaretDown, Lightbulb, Info } from '@phosphor-icons/react'
import { useEffect, useRef } from 'react'

import type { ConversationResult } from '@/domain/ai/contracts'

import styles from './feedback-sheet.module.css'

export function FeedbackSheet({
  feedback,
  graded,
  expanded,
  contentId,
  onToggle,
  onExpanded,
}: {
  feedback?: ConversationResult['feedback']
  graded?: {
    confirmation: 'none' | 'exact' | 'unknown' | 'repair'
    text: string
    explanationZh: string
  }
  expanded: boolean
  contentId: string
  onToggle: () => void
  onExpanded?: () => void
}) {
  const title = graded
    ? graded.confirmation === 'exact'
      ? '已匹配本地参考表达'
      : graded.confirmation === 'unknown'
        ? '未匹配本地参考表达'
        : '本轮帮助操作'
    : '历史规则反馈'
  const detailsRef = useRef<HTMLDivElement>(null)
  const wasExpanded = useRef(false)

  useEffect(() => {
    if (!expanded) {
      wasExpanded.current = false
      return
    }
    if (wasExpanded.current) return
    wasExpanded.current = true

    const frame = requestAnimationFrame(() => {
      detailsRef.current?.scrollIntoView({ block: 'nearest' })
      onExpanded?.()
    })
    return () => cancelAnimationFrame(frame)
  }, [expanded, onExpanded])

  return (
    <section className={styles.sheet} aria-label="本轮表达反馈">
      <button
        type="button"
        className={styles.summary}
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={onToggle}
      >
        <span className={styles.issueIcon}>
          <Info aria-hidden size={21} />
        </span>
        <span>
          <strong>{title}</strong>
          <small>本地收录范围有限，不作全面正确性评估</small>
        </span>
        <CaretDown
          aria-hidden
          size={19}
          className={expanded ? styles.caretOpen : styles.caret}
        />
      </button>
      {expanded ? (
        <div ref={detailsRef} id={contentId} className={styles.details}>
          <div>
            <span>已确认文字</span>
            <p>{graded?.text ?? feedback?.heard ?? '本轮没有提交表达文字。'}</p>
          </div>
          {feedback?.corrected ? (
            <div>
              <span>当时保存的建议</span>
              <p className={styles.corrected}>{feedback.corrected}</p>
            </div>
          ) : null}
          <div className={styles.explanation}>
            <Lightbulb aria-hidden size={19} />
            <p>{graded?.explanationZh ?? feedback?.explanationZh}</p>
          </div>
        </div>
      ) : null}
    </section>
  )
}
