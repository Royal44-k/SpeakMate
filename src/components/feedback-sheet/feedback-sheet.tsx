'use client'

import { CaretDown, CheckCircle, Lightbulb, WarningCircle } from '@phosphor-icons/react'

import type { ConversationResult } from '@/domain/ai/contracts'

import styles from './feedback-sheet.module.css'

export function FeedbackSheet({
  feedback,
  expanded,
  onToggle,
}: {
  feedback: ConversationResult['feedback']
  expanded: boolean
  onToggle: () => void
}) {
  const hasIssues = feedback.issueTags.length > 0
  return (
    <section className={styles.sheet} aria-label="本轮表达反馈">
      <button type="button" className={styles.summary} aria-expanded={expanded} onClick={onToggle}>
        <span className={hasIssues ? styles.issueIcon : styles.goodIcon}>
          {hasIssues ? <WarningCircle aria-hidden size={21} weight="fill" /> : <CheckCircle aria-hidden size={21} weight="fill" />}
        </span>
        <span><strong>{hasIssues ? '有一处值得优化' : '这句话表达得很清楚'}</strong><small>{hasIssues ? '展开查看更自然的说法' : '保持节奏，继续完成任务'}</small></span>
        <CaretDown aria-hidden size={19} className={expanded ? styles.caretOpen : styles.caret} />
      </button>
      {expanded ? (
        <div className={styles.details}>
          <div><span>我听到</span><p>{feedback.heard}</p></div>
          {feedback.corrected ? <div><span>建议表达</span><p className={styles.corrected}>{feedback.corrected}</p></div> : null}
          <div className={styles.explanation}><Lightbulb aria-hidden size={19} /><p>{feedback.explanationZh}</p></div>
        </div>
      ) : null}
    </section>
  )
}
