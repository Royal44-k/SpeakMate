/* eslint-disable @next/next/no-html-link-for-pages -- Binding offline-routing contract: cross-shell learning links require document navigation, never RSC prefetch. */
'use client'

import { BookmarkSimple, SpinnerGap } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { MobilePageHeader } from '@/components/app-shell/mobile-page-header'
import { buildLearningHref } from '@/components/app-shell/learning-routes'
import { presentGradedPractice } from '@/domain/practice/graded-presenter'
import {
  createIndexedDbRepositories,
  type Repositories,
} from '@/infrastructure/persistence/repositories'
import type { PracticeRecord } from '@/infrastructure/persistence/practice-repository'
import { HistoricalPracticeRecord } from './historical-practice-record'
import styles from './session-report.module.css'
import { CaptureText } from '@/features/notebook/capture'
import { RecordCaptureFrame } from '@/features/notebook/record-capture-frame'

export function favoriteIdFor(sessionId: string, expression: string): string {
  let hash = 2166136261
  for (const character of `${sessionId}:${expression}`) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return `favorite_${sessionId}_${(hash >>> 0).toString(36)}`
}

export function SessionReportView({
  sessionId,
  repositories,
}: {
  sessionId: string
  repositories?: Repositories
}) {
  const [repository] = useState(
    () => repositories ?? createIndexedDbRepositories(),
  )
  const [loaded, setLoaded] = useState<{
    id: string
    record?: PracticeRecord
    error?: string
  }>()
  const [savedExpressions, setSavedExpressions] = useState<string[]>([])
  const [saving, setSaving] = useState<string[]>([])
  const [saveError, setSaveError] = useState('')
  const pending = useRef(new Set<string>())
  const activeId = useRef(sessionId)
  useEffect(() => {
    let active = true
    activeId.current = sessionId
    void repository.practice
      .read(sessionId)
      .then((record) => {
        if (!active) return
        setLoaded({
          id: sessionId,
          ...(record ? { record } : { error: '找不到这次练习' }),
        })
        if (!record) return
        void repository.favorites
          .list()
          .then((favorites) => {
            if (active)
              setSavedExpressions(
                favorites
                  .filter((item) => item.sceneId === record.session.sceneId)
                  .map((item) => item.expression),
              )
          })
          .catch(() => {
            if (active) setSaveError('收藏状态暂时无法读取；对话记录仍可查看。')
          })
      })
      .catch(() => {
        if (active) setLoaded({ id: sessionId, error: '本机记录暂时无法读取' })
      })
    return () => {
      active = false
      activeId.current = ''
    }
  }, [repository, sessionId])
  const record = loaded?.id === sessionId ? loaded.record : undefined
  async function saveExpression(expression: string) {
    if (
      !record ||
      pending.current.has(expression) ||
      savedExpressions.includes(expression)
    )
      return
    const id = record.session.id
    pending.current.add(expression)
    setSaving((values) => [...values, expression])
    setSaveError('')
    try {
      const now = new Date().toISOString()
      await repository.favorites.save({
        id: favoriteIdFor(id, expression),
        expression,
        sceneId: record.session.sceneId,
        createdAt: now,
        updatedAt: now,
      })
      if (activeId.current === id)
        setSavedExpressions((values) => [...values, expression])
    } catch {
      if (activeId.current === id)
        setSaveError('收藏未保存，请重试；原文没有被删除。')
    } finally {
      pending.current.delete(expression)
      if (activeId.current === id)
        setSaving((values) => values.filter((value) => value !== expression))
    }
  }
  if (loaded?.id === sessionId && loaded.error)
    return (
      <main className={styles.empty} role="alert">
        <h1 data-page-title tabIndex={-1}>
          {loaded.error}
        </h1>
        <p>没有新建、清除或自动完成任何记录。可返回本机记录检查或恢复备份。</p>
        <a href="/me">返回我的练习</a>
      </main>
    )
  if (!record)
    return (
      <main className={styles.loading} role="status">
        <SpinnerGap aria-hidden size={24} />
        正在整理复盘…
      </main>
    )
  if (record.status === 'recovery')
    return (
      <main className={styles.empty} role="alert">
        <h1 data-page-title tabIndex={-1}>
          这份记录暂时无法复盘
        </h1>
        <p>
          {record.message} 原记录仍保留，请导出备份后检查，不会补造缺失对话。
        </p>
        <a href="/me">返回我的练习</a>
      </main>
    )
  const view =
    record.status === 'ready'
      ? presentGradedPractice(record.session, record.turns)
      : undefined
  const expressions = [
    ...new Set(
      record.turns
        .map((turn) => turn.learnerText)
        .filter((text) => text.trim()),
    ),
  ]
  const expressionSection = (
    <section className={styles.expressions} aria-labelledby="expression-title">
      <h2 id="expression-title">你保存的表达</h2>
      <p>保留原文供回看与收藏，不因没有问题标签就判定为好表达。</p>
      {expressions.length ? (
        expressions.map((expression) => (
          <article key={expression}>
            <p lang="en">{expression}</p>
            <button
              type="button"
              aria-label={`${savedExpressions.includes(expression) ? '已收藏' : '收藏'}表达：${expression}`}
              disabled={
                savedExpressions.includes(expression) ||
                saving.includes(expression)
              }
              onClick={() => void saveExpression(expression)}
            >
              <BookmarkSimple
                aria-hidden
                size={20}
                weight={
                  savedExpressions.includes(expression) ? 'fill' : 'regular'
                }
              />
            </button>
          </article>
        ))
      ) : (
        <p>本轮没有保存非空表达。</p>
      )}
      {saveError ? <p role="alert">{saveError}</p> : null}
    </section>
  )
  if (!view)
    return (
      <HistoricalPracticeRecord record={record} repositories={repository}>
        {expressionSection}
      </HistoricalPracticeRecord>
    )
  const workflow =
    record.session.status === 'completed'
      ? '已确认结束并保存'
      : record.session.status === 'abandoned'
        ? '已停止，未记作完成'
        : view.outcome === 'active'
          ? '仍可继续'
          : '等待你确认结束'
  const outcome =
    view.outcome === 'achieved'
      ? '所选目标已确认'
      : view.outcome === 'partial'
        ? '部分结束'
        : view.outcome === 'declined'
          ? '明确停止'
          : '进行中'
  const resumeHref = buildLearningHref({
    kind: record.session.simulation ? 'simulation' : 'session',
    id: sessionId,
  })
  return (
    <RecordCaptureFrame
      repositories={repository}
      returnTo={record.session.simulation?.returnTo ?? '/me'}
    >
      <main className={styles.report}>
        <MobilePageHeader
          title="本次复盘"
          eyebrow="SESSION RECORD"
          fallbackHref="/me"
          backLabel="返回我的练习"
        />
        <header className={styles.scoreHeader}>
          {record.session.simulation ? (
            <section>
              <h2>定向模拟练习记录</h2>
              <p>原表达：{record.session.simulation.source.noteText}</p>
              <p>本次覆盖目标：{record.session.simulation.target.text}</p>
              <p>
                回忆：{record.session.simulation.recall?.text ?? '尚未保存'}
              </p>
              <p>
                造句：
                {record.session.simulation.composition?.text ?? '尚未保存'}
              </p>
              <p>
                独立路径 {record.session.simulation.descriptor.id} · v
                {record.session.simulation.descriptor.version}；来源语料 v
                {record.session.simulation.descriptor.sourceContentVersion}。
              </p>
              <a href={record.session.simulation.returnTo}>返回词句或记录簿</a>
            </section>
          ) : null}
          <h2>
            {outcome} · {workflow}
          </h2>
          <p>
            流程状态与表达覆盖分开记录，不提供语法、词汇、自然度或发音分数。
          </p>
        </header>
        <section className={styles.improve}>
          <h2>本地覆盖与流程</h2>
          <p>
            已匹配表达：
            {
              view.history.filter((turn) => turn.confirmation === 'exact')
                .length
            }{' '}
            轮
          </p>
          <p>
            未匹配表达：
            {
              view.history.filter((turn) => turn.confirmation === 'unknown')
                .length
            }{' '}
            轮
          </p>
          <p>
            帮助或停止操作：
            {
              view.history.filter((turn) => turn.confirmation === 'repair')
                .length
            }{' '}
            轮
          </p>
          <p>
            已提交 {view.flow.submittedTurns} / {view.flow.requiredUserTurns}{' '}
            轮，其中非空表达 {view.flow.expressionTurns}{' '}
            轮。匹配只确认本题已收录表达；未收录不代表说错，帮助操作不证明表达正确。
          </p>
          {record.session.status === 'active' ? (
            <a href={resumeHref}>
              {view.canFinish
                ? '返回练习并确认结束'
                : view.canAnswer
                  ? '返回继续练习'
                  : '返回查看结束选项'}
            </a>
          ) : null}
        </section>
        <section className={styles.improve}>
          <h2>{view.presentation.counterpartZh}</h2>
          <p>{view.presentation.frameZh}</p>
          <p className={styles.material}>{view.situationZh}</p>
        </section>
        <section className={styles.improve}>
          <h2>原始对话与本题反馈</h2>
          {view.opening.map((block, index) => (
            <CaptureText key={`opening-${index}`} {...block} />
          ))}
          {view.history.map((turn) => (
            <article key={turn.turnId}>
              <h3>第 {view.history.indexOf(turn) + 1} 轮</h3>
              {turn.learner.text ? (
                <CaptureText {...turn.learner} label="你" />
              ) : (
                <p>帮助或停止操作（没有表达文字）</p>
              )}
              {turn.assistant.map((block, index) => (
                <CaptureText key={index} {...block} label="情境回复" />
              ))}
              <CaptureText
                text={turn.feedback.text}
                source={turn.learner.source}
                label="本题规则反馈"
              />
              {turn.references.length ? (
                <details>
                  <summary>当时对应题目的参考表达</summary>
                  {turn.references.map((reference) => (
                    <CaptureText
                      key={reference.id}
                      text={reference.text}
                      source={turn.learner.source}
                    />
                  ))}
                </details>
              ) : null}
            </article>
          ))}
        </section>
        {expressionSection}
        <nav className={styles.actions} aria-label="复盘后操作">
          <a href="/practice">回到今日练习</a>
          <a href="/scenes">换个场景</a>
        </nav>
      </main>
    </RecordCaptureFrame>
  )
}
