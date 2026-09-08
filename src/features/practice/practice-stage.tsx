'use client'

import {
  Check,
  Headphones,
  Lightbulb,
  SpinnerGap,
} from '@phosphor-icons/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { FeedbackSheet } from '@/components/feedback-sheet/feedback-sheet'
import { SceneImage } from '@/components/scene-image/scene-image'
import { SpeechControl } from '@/components/speech-control/speech-control'
import type { AdaptedScene } from '@/domain/scenes/types'

import { ExitGuard, exitGuardState } from './exit-guard'
import styles from './practice-stage.module.css'
import { TextReviewDock } from './text-review-dock'
import { usePracticeSession } from './use-practice-session'

export function PracticeStage({
  scene,
  sessionId,
  completed = false,
  exitHref,
}: {
  scene: AdaptedScene
  sessionId: string
  completed?: boolean
  exitHref?: string
}) {
  const practice = usePracticeSession(scene, sessionId)
  const resolvedExitHref =
    exitHref ?? `/scenes/${scene.slug}?level=${scene.level}`
  const [feedbackExpanded, setFeedbackExpanded] = useState(false)
  const status = practice.machine.status
  const isReviewing =
    status === 'reviewing' ||
    (status === 'recoverable-error' &&
      Boolean(practice.machine.draftTranscript || practice.audio))
  const hasTranscript = Boolean(practice.machine.draftTranscript?.trim())
  const canSubmit =
    hasTranscript ||
    (Boolean(practice.audio) && practice.machine.errorCode !== 'NO_SPEECH')
  const completedGoals = practice.completedGoalIds ?? []
  const dockMode = isReviewing
    ? 'text'
    : ['submitting', 'receiving', 'completing'].includes(status)
      ? 'processing'
      : 'speech'
  const interactionBusy =
    status === 'recording' ||
    isReviewing ||
    status === 'submitting' ||
    status === 'receiving' ||
    status === 'completing'
  const guardState = exitGuardState(
    status,
    practice.machine.draftTranscript ?? '',
    Boolean(practice.audio),
  )

  useEffect(() => {
    if (!interactionBusy) return
    const root = document.documentElement
    const previousValue = root.dataset.interactionBusy
    root.dataset.interactionBusy = 'true'

    return () => {
      if (previousValue === undefined) {
        delete root.dataset.interactionBusy
      } else {
        root.dataset.interactionBusy = previousValue
      }
    }
  }, [interactionBusy])

  if (status === 'completed' || completed) {
    return (
      <main className={styles.completed}>
        <span>
          <Check aria-hidden size={34} weight="bold" />
        </span>
        <p>SESSION COMPLETE</p>
        <h1 data-page-title tabIndex={-1}>这次真的开口了。</h1>
        <p>练习已保存在本机，现在可以查看可解释的表达复盘。</p>
        <Link href={`/session/${practice.sessionId}/report`}>查看本次复盘</Link>
      </main>
    )
  }

  return (
    <main className={styles.stage}>
      <header className={styles.topbar}>
        <ExitGuard
          state={guardState}
          fallbackHref={resolvedExitHref}
        />
        <div>
          <p>SpeakMate</p>
          <h1 data-page-title tabIndex={-1}>Dialogue Stage</h1>
          <small>场景对话练习 · {scene.titleZh}</small>
        </div>
        <span>
          <strong>
            {Math.min(practice.machine.turnIndex + 1, scene.recommendedTurns)} /{' '}
            {scene.recommendedTurns}
          </strong>
          <small>任务进度</small>
        </span>
      </header>

      <div
        className={styles.progress}
        role="progressbar"
        aria-label={`已完成 ${completedGoals.length} 个任务目标`}
        aria-valuemin={0}
        aria-valuemax={scene.goals.length}
        aria-valuenow={completedGoals.length}
      >
        {scene.goals.map((goal) => (
          <span
            key={goal.id}
            className={
              completedGoals.includes(goal.id)
                ? styles.progressDone
                : styles.progressTodo
            }
          />
        ))}
      </div>

      <section className={styles.sceneStrip} aria-label="当前对话场景">
        <SceneImage image={scene.image} priority />
        <span>你是：{scene.learnerRole}</span>
      </section>

      {practice.ephemeral ? (
        <p className={styles.storageNotice} role="status">
          本机存储当前不可用；你仍可练习，但关闭页面后本次记录可能丢失。
        </p>
      ) : null}

      <section className={styles.dialogue} aria-live="polite">
        <div className={styles.speakerLine}>
          <span>AI · {scene.aiRole}</span>
          <div>
            {practice.latestResult?.degraded ? <em>基础反馈模式</em> : null}
            <button
              type="button"
              aria-label="播放 AI 回复"
              onClick={() => void practice.speakReply().catch(() => undefined)}
            >
              <Headphones aria-hidden size={21} />
            </button>
          </div>
        </div>
        <blockquote>“{practice.aiReply}”</blockquote>
        <p className={styles.hint}>{practice.aiHint}</p>
      </section>

      {practice.latestResult ? (
        <div className={styles.feedbackHolder}>
          <FeedbackSheet
            feedback={practice.latestResult.feedback}
            expanded={feedbackExpanded}
            contentId={`turn-feedback-${practice.machine.turnIndex}`}
            onToggle={() => setFeedbackExpanded((value) => !value)}
          />
        </div>
      ) : (
        <aside className={styles.firstHint}>
          <Lightbulb aria-hidden size={20} />
          <p>
            <strong>情境提示：</strong>
            第一次可先用键盘组织一句，再尝试录音。反馈只指出最影响沟通的问题。
          </p>
        </aside>
      )}

      {status === 'recoverable-error' && !isReviewing ? (
        <section className={styles.error} role="alert">
          <p>{practice.machine.errorMessage}</p>
          <button type="button" onClick={practice.retry}>
            返回继续
          </button>
        </section>
      ) : null}

      {practice.latestResult?.progress.shouldOfferCompletion &&
      status === 'ready' ? (
        <button
          type="button"
          className={styles.completeButton}
          onClick={() => void practice.completeSession()}
        >
          完成场景并查看复盘
        </button>
      ) : null}

      {!practice.ready ? (
        <div className={styles.loading} role="status">
          正在准备对话舞台…
        </div>
      ) : null}

      <div className={styles.practiceDock}>
        {dockMode === 'text' ? (
          <TextReviewDock
            transcript={practice.machine.draftTranscript ?? ''}
            canSubmit={canSubmit}
            errorMessage={practice.machine.errorMessage}
            hasAudio={Boolean(
              practice.audio && practice.machine.errorCode !== 'NO_SPEECH',
            )}
            onChange={practice.updateTranscript}
            onCancel={practice.cancelReview}
            onSubmit={() => void practice.submitTurn()}
          />
        ) : dockMode === 'processing' ? (
          <div className={styles.processingDock} aria-disabled="true">
            <SpinnerGap aria-hidden size={22} />
            <span role="status">
              {status === 'completing'
                ? '正在保存练习…'
                : '正在理解并准备下一句…'}
            </span>
          </div>
        ) : (
          <SpeechControl
            status={status}
            elapsedSeconds={practice.elapsedSeconds}
            amplitude={practice.amplitude}
            onStart={() => void practice.startRecording()}
            onStop={() => void practice.stopRecording()}
            onOpenKeyboard={practice.openKeyboard}
          />
        )}
      </div>
    </main>
  )
}
