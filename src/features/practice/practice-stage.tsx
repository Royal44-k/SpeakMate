'use client'

import { ArrowLeft, Check, Headphones, Keyboard, SpinnerGap } from '@phosphor-icons/react'
import Link from 'next/link'
import { useState } from 'react'

import { FeedbackSheet } from '@/components/feedback-sheet/feedback-sheet'
import { SceneImage } from '@/components/scene-image/scene-image'
import { SpeechControl } from '@/components/speech-control/speech-control'
import type { AdaptedScene } from '@/domain/scenes/types'

import styles from './practice-stage.module.css'
import { usePracticeSession } from './use-practice-session'

export function PracticeStage({
  scene,
  sessionId,
}: {
  scene: AdaptedScene
  sessionId: string
}) {
  const practice = usePracticeSession(scene, sessionId)
  const [feedbackExpanded, setFeedbackExpanded] = useState(false)
  const status = practice.machine.status
  const isReviewing = status === 'reviewing' || (status === 'recoverable-error' && Boolean(practice.machine.draftTranscript))
  const completedGoals = practice.latestResult?.progress.completedGoalIds ?? []

  if (status === 'completed') {
    return (
      <main className={styles.completed}>
        <span><Check aria-hidden size={34} weight="bold" /></span>
        <p>SESSION COMPLETE</p>
        <h1>这次真的开口了。</h1>
        <p>练习已保存在本机。完整复盘会在下一阶段生成。</p>
        <Link href="/practice">返回今日练习</Link>
      </main>
    )
  }

  return (
    <main className={styles.stage}>
      <header className={styles.topbar}>
        <Link href={`/scenes/${scene.slug}?level=${scene.level}`} aria-label="退出本次练习"><ArrowLeft aria-hidden size={23} /></Link>
        <div><p>{scene.titleEn}</p><h1>{scene.titleZh}</h1></div>
        <span>{Math.min(practice.machine.turnIndex + 1, scene.recommendedTurns)} / {scene.recommendedTurns}</span>
      </header>

      <div className={styles.progress} aria-label={`已完成 ${completedGoals.length} 个任务目标`}>
        {scene.goals.map((goal) => <span key={goal.id} className={completedGoals.includes(goal.id) ? styles.progressDone : styles.progressTodo} />)}
      </div>

      <section className={styles.sceneStrip} aria-label="当前对话场景">
        <SceneImage image={scene.image} priority />
        <span>你是：{scene.learnerRole}</span>
      </section>

      <section className={styles.dialogue} aria-live="polite">
        <div className={styles.speakerLine}><span>AI · {scene.aiRole}</span><button type="button" aria-label="播放 AI 回复" onClick={() => void practice.speakReply().catch(() => undefined)}><Headphones aria-hidden size={21} /></button></div>
        <blockquote>“{practice.aiReply}”</blockquote>
        <p className={styles.hint}>{practice.aiHint}</p>
      </section>

      {practice.latestResult ? (
        <FeedbackSheet feedback={practice.latestResult.feedback} expanded={feedbackExpanded} onToggle={() => setFeedbackExpanded((value) => !value)} />
      ) : (
        <aside className={styles.firstHint}><Keyboard aria-hidden size={20} /><p>第一次可先用键盘组织一句，再尝试录音。反馈只指出最影响沟通的问题。</p></aside>
      )}

      {isReviewing ? (
        <section className={styles.review} aria-labelledby="review-title">
          <div><span>YOUR TURN</span><h2 id="review-title">确认你刚才说的话</h2></div>
          <label htmlFor="turn-transcript">英文内容</label>
          <textarea id="turn-transcript" rows={4} autoFocus value={practice.machine.draftTranscript ?? ''} placeholder="例如：Hello, I have a reservation under the name Chen." onChange={(event) => practice.updateTranscript(event.target.value)} />
          {practice.audio && !(practice.machine.draftTranscript ?? '').trim() ? <p>录音已准备，但当前浏览器无法本地转写。输入或修改英文后继续。</p> : null}
          <div className={styles.reviewActions}><button type="button" onClick={practice.cancelReview}>取消</button><button type="button" disabled={!(practice.machine.draftTranscript ?? '').trim()} onClick={() => void practice.submitTurn()}>提交这一轮</button></div>
        </section>
      ) : null}

      {status === 'recoverable-error' && !isReviewing ? (
        <section className={styles.error} role="alert"><p>{practice.machine.errorMessage}</p><button type="button" onClick={practice.retry}>返回继续</button></section>
      ) : null}

      {['submitting', 'receiving'].includes(status) ? (
        <div className={styles.processing} role="status"><SpinnerGap aria-hidden size={22} /><span>正在理解并准备下一句…</span></div>
      ) : null}

      {practice.latestResult?.progress.shouldOfferCompletion && status === 'ready' ? (
        <button type="button" className={styles.completeButton} onClick={() => void practice.completeSession()}>完成场景并查看复盘</button>
      ) : null}

      {!practice.ready ? <div className={styles.loading} role="status">正在准备对话舞台…</div> : null}

      <div className={styles.speechDock}>
        <SpeechControl status={status} elapsedSeconds={practice.elapsedSeconds} amplitude={practice.amplitude} onStart={() => void practice.startRecording()} onStop={() => void practice.stopRecording()} onOpenKeyboard={practice.openKeyboard} />
      </div>
    </main>
  )
}
