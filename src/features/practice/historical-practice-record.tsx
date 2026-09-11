/* eslint-disable @next/next/no-html-link-for-pages -- Binding offline-routing contract: cross-shell learning links require document navigation, never RSC prefetch. */
'use client'
import { useState } from 'react'
import {
  createIndexedDbRepositories,
  type Repositories,
} from '@/infrastructure/persistence/repositories'
import { CaptureText } from '@/features/notebook/capture'
import { RecordCaptureFrame } from '@/features/notebook/record-capture-frame'
import { presentGradedPractice } from '@/domain/practice/graded-presenter'
import { buildLearningHref } from '@/components/app-shell/learning-routes'
import { SCENE_METADATA } from '@/content/scenes/metadata'
import type { PracticeRecord } from '@/infrastructure/persistence/practice-repository'
import styles from './session-report.module.css'
import type { ReactNode } from 'react'

/** Read-only original transcript; never invokes the retired engine or grades old goals. */
export function HistoricalPracticeRecord({
  record,
  children,
  unlinked = false,
  repositories,
}: {
  record: PracticeRecord
  children?: ReactNode
  unlinked?: boolean
  repositories?: Repositories
}) {
  const { session, turns } = record
  const [repository] = useState(
    () => repositories ?? createIndexedDbRepositories(),
  )
  const presentation =
    record.status === 'ready'
      ? presentGradedPractice(session, turns)
      : undefined
  const source = {
    sessionId: session.id,
    sceneId: session.sceneId,
    level: session.level,
  }
  const scene = SCENE_METADATA.find((item) => item.id === session.sceneId)
  const Root = unlinked ? 'section' : 'main'
  return (
    <RecordCaptureFrame repositories={repository}>
      <Root className={styles.report}>
        <h1 data-page-title tabIndex={-1}>
          {unlinked ? '保留的练习记录（只读）' : '旧版练习记录（只读）'}
        </h1>
        <h2>
          {session.sceneSnapshot?.titleZh ?? scene?.titleZh ?? '历史场景'}
        </h2>
        <p>
          {session.level} ·{' '}
          {session.status === 'completed'
            ? '当时已结束'
            : session.status === 'abandoned'
              ? '当时已停止'
              : '当时未结束'}
          。
          {unlinked
            ? '此编号不能直接链接或从此路由续练。此处只读展示原文、时间和当时保存的反馈；另行开始新版练习不会改写本记录或引用。'
            : '旧版流程不再继续运行；原文、时间和当时保存的反馈仍保留，不换成新题库，也不把旧关键词目标算作新版确认事实。'}
        </p>
        {unlinked ? (
          <>
            {record.status === 'recovery' ? (
              <p role="alert">
                {record.message ??
                  '保存状态需要检查；这里只读保留原文，不执行或修复该记录。'}
              </p>
            ) : null}
            <a href="/privacy">导出本机备份</a>
          </>
        ) : null}
        <p>
          开始：{session.startedAt}；最后保存：{session.updatedAt}
        </p>
        {session.openingText ? (
          <section>
            {session.simulation ? (
              <>
                <h2>定向练习保留内容</h2>
                <p>来源原文：{session.simulation.source.noteText}</p>
                <p>
                  保存时完整语境：
                  {session.simulation.source.snapshot.originalText}
                </p>
                <p>本次目标：{session.simulation.target.text}</p>
                <p>回忆：{session.simulation.recall?.text ?? '未保存'}</p>
                <p>造句：{session.simulation.composition?.text ?? '未保存'}</p>
                <p>
                  独立路径：{session.simulation.descriptor.id} v
                  {session.simulation.descriptor.version}；来源语料 v
                  {session.simulation.descriptor.sourceContentVersion}
                </p>
              </>
            ) : null}
            <section>
              <h2>当时开场</h2>
              <CaptureText text={session.openingText} source={source} />
            </section>
          </section>
        ) : (
          <p>当时没有保存开场文字，不从当前目录补写。</p>
        )}
        {turns.map((turn) => {
          const original = presentation?.history.find(
            (item) => item.turnId === turn.id,
          )
          const feedback = turn.result?.feedback ?? turn.feedback
          return (
            <section key={turn.id}>
              <h2>第 {turn.index + 1} 轮</h2>
              <p>你</p>
              <CaptureText
                text={turn.learnerText}
                source={
                  original?.learner.source ?? { ...source, turnId: turn.id }
                }
              />
              <p>当时回复</p>
              {original ? (
                original.assistant.map((block, index) => (
                  <CaptureText key={index} {...block} />
                ))
              ) : (
                <CaptureText
                  text={turn.aiText}
                  source={{ ...source, turnId: turn.id }}
                />
              )}
              {feedback ? (
                <details>
                  <summary>当时的规则反馈（非新版评估）</summary>
                  <p>{feedback.explanationZh}</p>
                  {feedback.corrected ? <p>{feedback.corrected}</p> : null}
                </details>
              ) : null}
            </section>
          )
        })}
        {scene ? (
          <a
            href={buildLearningHref({
              kind: 'prepare',
              scene: scene.slug,
              level: session.level,
            })}
          >
            开始新版练习
          </a>
        ) : (
          <a href="/scenes">选择新版场景</a>
        )}
        {children}
        <nav className={styles.actions} aria-label="复盘后操作">
          <a href="/me">返回我的练习</a>
          <a href="/practice">回到今日练习</a>
          <a href="/scenes">换个场景</a>
        </nav>
      </Root>
    </RecordCaptureFrame>
  )
}
