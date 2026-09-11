'use client'

import { Check, Headphones, SpinnerGap } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { FeedbackSheet } from '@/components/feedback-sheet/feedback-sheet'
import { SceneImage } from '@/components/scene-image/scene-image'
import { SpeechControl } from '@/components/speech-control/speech-control'
import { buildLearningHref } from '@/components/app-shell/learning-routes'
import type { PreparedPractice } from '@/domain/practice/prepared-practice'
import {
  createIndexedDbRepositories,
  type Repositories,
} from '@/infrastructure/persistence/repositories'
import { CaptureProvider, CaptureText } from '@/features/notebook/capture'
import { SimulationStep } from '@/features/notebook/simulation-step'
import { ExitGuard, exitGuardState } from './exit-guard'
import styles from './practice-stage.module.css'
import { TextReviewDock } from './text-review-dock'
import { usePracticeSession } from './use-practice-session'

const actionLabels = {
  clarify: '请再解释一下',
  struggle: '我需要表达提示',
  'off-topic': '帮我回到当前问题',
  refuse: '停止本次练习',
} as const

export function PracticeStage({
  scene,
  sessionId,
  completed = false,
  exitHref,
  repositories,
}: {
  scene: PreparedPractice
  sessionId: string
  completed?: boolean
  exitHref?: string
  repositories?: Repositories
}) {
  const [repository] = useState(
    () => repositories ?? createIndexedDbRepositories(),
  )
  const practice = usePracticeSession(scene, sessionId, repository)
  const [captureBusy, setCaptureBusy] = useState(false)
  const stageRef = useRef<HTMLElement>(null)
  const [feedbackOverride, setFeedbackOverride] = useState<boolean | null>(null)
  const expanded = feedbackOverride ?? practice.feedbackExpanded
  const status = practice.machine.status
  const view = practice.view
  const processing = ['submitting', 'receiving', 'completing'].includes(status)
  const reviewing =
    status === 'reviewing' ||
    (status === 'recoverable-error' &&
      !!(practice.machine.draftTranscript || practice.audio))
  const busy =
    captureBusy ||
    !!practice.simulationDraft?.text ||
    processing ||
    reviewing ||
    ['recording', 'requesting-permission'].includes(status)
  const latest = view?.history.at(-1)
  const prepareHref =
    practice.record?.session.provenance?.returnTo ??
    practice.record?.session.simulation?.returnTo ??
    exitHref ??
    buildLearningHref({
      kind: 'prepare',
      scene: scene.slug,
      level: scene.level,
      mode: scene.mode,
    })
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
  useEffect(() => {
    const stage = stageRef.current
    const dock = stage?.querySelector<HTMLElement>('[data-practice-dock]')
    if (!stage || !dock) return
    const measure = () =>
      stage.style.setProperty(
        '--practice-dock-space',
        `${Math.ceil(dock.getBoundingClientRect().height) + 24}px`,
      )
    measure()
    const observer =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(measure)
        : undefined
    observer?.observe(dock)
    window.addEventListener('resize', measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
      stage.style.removeProperty('--practice-dock-space')
    }
  }, [practice.ready, status, view?.canAnswer])

  if (!practice.ready)
    return (
      <main
        className={styles.state ?? styles.dialogue}
        aria-busy={status !== 'recoverable-error'}
      >
        <h1 data-page-title tabIndex={-1}>
          {status === 'recoverable-error'
            ? '暂时无法打开练习'
            : '正在准备对话舞台…'}
        </h1>
        {practice.machine.errorMessage ? (
          <>
            <p role="alert">{practice.machine.errorMessage}</p>
            <button type="button" onClick={practice.retryInitialization}>
              重试打开同一练习
            </button>
          </>
        ) : null}
        <a href={prepareHref}>返回场景准备</a>
      </main>
    )

  // Record-only links must wait until the creation effect supplies a saved ID.
  const reportHref = buildLearningHref({
    kind: 'report',
    id: practice.sessionId,
  })
  const nextHref = buildLearningHref({
    kind: 'session',
    id: 'new',
    scene: scene.slug,
    level: scene.level,
    mode: scene.mode,
    round: practice.sessionId,
  })

  if (
    practice.record?.session.simulation &&
    (practice.simulationDraft?.text ||
      (practice.record.session.status === 'active' &&
        !practice.record.session.simulation.composition))
  )
    return (
      <SimulationStep
        simulation={practice.record.session.simulation}
        draft={practice.simulationDraft}
        active={practice.record.session.status === 'active'}
        busy={processing}
        reloading={practice.reloading}
        error={practice.machine.errorMessage}
        onSubmit={practice.submitSimulationStep}
        onReload={practice.reloadSession}
        onDraftChange={practice.updateSimulationDraft}
        onDiscard={practice.discardSimulationDraft}
      />
    )

  if (
    practice.record?.session.status === 'completed' ||
    status === 'completed' ||
    completed
  )
    return (
      <main className={styles.completed}>
        <span>
          <Check aria-hidden size={34} />
        </span>
        <p>PRACTICE SAVED</p>
        <h1 data-page-title tabIndex={-1}>
          这轮已保存。
        </h1>
        <p>
          {view?.outcome === 'achieved'
            ? '所选流程的目标已由本地收录表达确认。'
            : '本轮已结束，仍有目标未确认。'}{' '}
          这不是语言能力评分，也不代表真实服务已完成。
        </p>
        <a href={reportHref}>查看本次复盘</a>
        {!practice.record?.session.simulation ? (
          <a href={nextHref}>再练一轮新对话</a>
        ) : null}
        <a href={prepareHref}>
          {practice.record?.session.simulation
            ? '返回词句或记录簿'
            : '返回场景准备'}
        </a>
      </main>
    )

  return (
    <CaptureProvider repositories={repository} onBusyChange={setCaptureBusy}>
      <main ref={stageRef} className={styles.stage}>
        <header className={styles.topbar}>
          <ExitGuard
            state={
              captureBusy
                ? 'draft'
                : exitGuardState(
                    status,
                    practice.machine.draftTranscript ?? '',
                    !!practice.audio,
                  )
            }
            fallbackHref={prepareHref}
            onConfirmExit={practice.discardPending}
          />
          <div>
            <p>SpeakMate</p>
            <h1 data-page-title tabIndex={-1}>
              Dialogue Stage
            </h1>
            <small>情境演练 · {scene.titleZh}</small>
          </div>
          <span>
            <strong>
              {view!.flow.submittedTurns} / {view!.flow.requiredUserTurns}
            </strong>
            <small>{scene.level} · 已提交轮次</small>
          </span>
        </header>
        <section className={styles.sceneStrip} aria-label="当前练习场景">
          <SceneImage
            image={scene.image}
            priority
            className={styles.sceneImage}
          />
        </section>
        <section className={styles.context} aria-label="完整情境与材料">
          {practice.record?.session.simulation ? (
            <p>
              定向应用 ·
              使用保存的来源等级与独立校审路径。这是新的固定情境，不沿用原对话事实；仅本地规则确认收录表达，不为造句、语义或发音评分。
            </p>
          ) : null}
          <h2>{view!.presentation.counterpartZh}</h2>
          <p>{view!.presentation.frameZh}</p>
          <p>{view!.situationZh}</p>
          <p>
            帮助和改答也占用轮次；还可提交{' '}
            {Math.max(
              0,
              view!.flow.requiredUserTurns - view!.flow.submittedTurns,
            )}{' '}
            轮。到上限可能仍有目标未确认，可结束后开启新一轮，不代表练习失败。
          </p>
        </section>
        {[
          practice.settingsError,
          practice.speechError,
          practice.foreground.error,
        ]
          .filter(Boolean)
          .map((notice) => (
            <p key={notice} className={styles.storageNotice} role="status">
              {notice}
            </p>
          ))}
        {practice.addressError ? (
          <p className={styles.storageNotice} role="alert">
            {practice.addressError}{' '}
            <a
              href={buildLearningHref({
                kind: 'session',
                id: practice.sessionId,
              })}
            >
              打开已保存练习
            </a>
          </p>
        ) : null}
        {view!.history.length ? (
          <details className={styles.replySupport}>
            <summary>本轮对话记录（{view!.history.length} 轮）</summary>
            {view!.opening.map((block, index) => (
              <CaptureText
                key={`opening-${index}`}
                {...block}
                label="情境提问"
              />
            ))}
            {view!.history.map((turn) => (
              <div key={turn.turnId}>
                {turn.learner.text ? (
                  <CaptureText {...turn.learner} label="你" />
                ) : (
                  <p>
                    {
                      actionLabels[
                        turn.input.action as keyof typeof actionLabels
                      ]
                    }
                  </p>
                )}
                {turn.assistant.map((block, index) => (
                  <CaptureText key={index} {...block} label="情境回复" />
                ))}
              </div>
            ))}
          </details>
        ) : null}
        <section
          className={styles.dialogue}
          aria-label={view!.canAnswer ? '当前问题' : '本轮结尾'}
          aria-live="polite"
        >
          <div className={styles.speakerLine}>
            <span>本地编写的情境问答</span>
            <button
              type="button"
              aria-label="播放本地助手回复"
              disabled={processing}
              onClick={() => void practice.speakReply()}
            >
              <Headphones aria-hidden size={21} />
            </button>
          </div>
          {(latest?.assistant ?? view!.opening).map((block, index) => (
            <CaptureText key={index} {...block} />
          ))}
          {view!.canAnswer ? (
            <p className={styles.hint}>{practice.aiHint}</p>
          ) : null}
        </section>
        {view!.canAnswer ? (
          <details
            key={practice.changeQuestionId ?? view!.currentQuestion!.id}
            className={styles.replySupport}
          >
            <summary>
              {practice.changeQuestionId ? '改答参考表达' : '本题参考表达'}
            </summary>
            <p>
              仅对应这道题。可选后编辑，最终按你确认的文字匹配，不按按钮或答案编号认定。
            </p>
            {practice.targetQuestion ? (
              <p>{practice.targetQuestion.text}</p>
            ) : null}
            {practice.suggestions.map((answer, index) => (
              <div key={answer.id}>
                <CaptureText
                  text={answer.text}
                  source={{
                    sceneId: practice.record!.session.sceneId,
                    level: scene.level,
                    sessionId: practice.sessionId,
                    questionId:
                      practice.targetQuestion?.id ?? view!.currentQuestion?.id,
                  }}
                  label="校审参考表达"
                />
                <button
                  type="button"
                  disabled={
                    processing ||
                    ['recording', 'requesting-permission'].includes(status)
                  }
                  onClick={() =>
                    practice.chooseSuggestion(answer.id, answer.text)
                  }
                >
                  使用参考 {index + 1} 并确认
                </button>
              </div>
            ))}
          </details>
        ) : null}
        {latest ? (
          <div className={styles.feedbackHolder}>
            <FeedbackSheet
              graded={{
                confirmation: latest.confirmation,
                text: latest.learner.text,
                explanationZh: latest.feedback.text,
                source: latest.learner.source,
              }}
              expanded={expanded}
              contentId={`feedback-${latest.turnId}`}
              onToggle={() => setFeedbackOverride(!expanded)}
            />
          </div>
        ) : null}
        {practice.machine.errorMessage ? (
          <section className={styles.error} role="alert">
            <p>{practice.machine.errorMessage}</p>
            <button
              type="button"
              disabled={processing || practice.reloading}
              onClick={() => void practice.reloadSession()}
            >
              读取最新记录并重新确认
            </button>
          </section>
        ) : null}
        {practice.reloading ? (
          <p role="status">
            正在读取最新记录；你仍可编辑。取消或提交后，将忽略这次迟到的读取结果。
          </p>
        ) : null}
        {view!.canAnswer ? (
          <section className={styles.actions} aria-label="帮助与调整">
            {(['clarify', 'struggle', 'off-topic'] as const).map((action) => (
              <button
                key={action}
                type="button"
                disabled={busy}
                onClick={() => void practice.submitAction(action)}
              >
                {actionLabels[action]}
              </button>
            ))}
            {view!.history
              .filter(
                (turn) =>
                  turn.confirmation === 'exact' &&
                  turn.learner.source.questionId,
              )
              .filter(
                (turn, index, all) =>
                  all.findIndex(
                    (other) =>
                      other.learner.source.questionId ===
                      turn.learner.source.questionId,
                  ) === index,
              )
              .map((turn) => (
                <button
                  key={turn.turnId}
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    practice.beginChange(turn.learner.source.questionId!)
                  }
                >
                  修改第 {view!.history.indexOf(turn) + 1} 轮已确认回答
                </button>
              ))}
          </section>
        ) : null}
        {practice.record!.session.status === 'active' ? (
          <button
            className={styles.completeButton}
            type="button"
            disabled={busy}
            onClick={() =>
              void (view!.canAnswer
                ? practice.submitAction('refuse')
                : practice.stopSession())
            }
          >
            停止本次练习
          </button>
        ) : (
          <p className={styles.context}>
            这次练习已停止，未记作完成。<a href={reportHref}>查看本次记录</a>
            <a href={nextHref}>开启新一轮</a>
          </p>
        )}
        {processing ? (
          <div data-practice-dock className={styles.practiceDock}>
            <div className={styles.processingDock} aria-disabled="true">
              <SpinnerGap aria-hidden size={22} />
              <span role="status">
                {status === 'completing'
                  ? '正在保存练习…'
                  : '正在本机保存并准备下一句…'}
              </span>
            </div>
          </div>
        ) : !view!.canAnswer ? (
          <div className={styles.endDock}>
            <p>
              {view!.outcome === 'partial'
                ? '本轮已到上限，仍有目标未确认。'
                : view!.outcome === 'achieved'
                  ? '所选流程的目标已确认，请确认结束。'
                  : '练习已停止。'}
            </p>
            {view!.canFinish ? (
              <button
                type="button"
                onClick={() => void practice.completeSession()}
              >
                确认结束并保存复盘
              </button>
            ) : (
              <p>
                {practice.record!.session.provenance
                  ? '任务结算尚未接通，不能在此标记任务完成。'
                  : '仅帮助或停止操作不能记作完成。'}
              </p>
            )}
          </div>
        ) : (
          <div data-practice-dock className={styles.practiceDock}>
            {reviewing ? (
              <TextReviewDock
                transcript={practice.machine.draftTranscript ?? ''}
                canSubmit={!!practice.machine.draftTranscript?.trim()}
                errorMessage={practice.machine.errorMessage}
                hasAudio={!!practice.audio}
                audio={practice.audio?.blob}
                onChange={practice.updateTranscript}
                onCancel={practice.cancelReview}
                onSubmit={() => void practice.submitTurn()}
              />
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
        )}
      </main>
    </CaptureProvider>
  )
}
