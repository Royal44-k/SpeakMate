'use client'

import { ArrowRight, BookmarkSimple, CheckCircle, SpinnerGap } from '@phosphor-icons/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { SCENE_CATALOG } from '@/content/scenes/catalog'
import { buildSessionReport, type SessionReport } from '@/domain/practice/report'
import type { PracticeSession } from '@/domain/practice/types'
import {
  createIndexedDbRepositories,
  type Repositories,
} from '@/infrastructure/persistence/repositories'

import styles from './session-report.module.css'

const metricOrder = ['grammar', 'vocabulary', 'naturalness', 'interaction'] as const

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
  const [repository] = useState(() => repositories ?? createIndexedDbRepositories())
  const [report, setReport] = useState<SessionReport | null>(null)
  const [session, setSession] = useState<PracticeSession | null>(null)
  const [savedExpressions, setSavedExpressions] = useState<string[]>([])
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      const value = await repository.sessions.get(sessionId)
      if (!value) {
        if (active) setMissing(true)
        return
      }
      const [turns, favorites] = await Promise.all([
        repository.turns.listBySession(sessionId),
        repository.favorites.list(),
      ])
      const scene = SCENE_CATALOG.find(
        (item) => item.id === value.sceneId && item.version === value.sceneVersion,
      )
      if (!active) return
      setSession(value)
      setReport(buildSessionReport(value, turns, scene?.goals.length ?? 0))
      setSavedExpressions(favorites
        .filter((favorite) => favorite.sceneId === value.sceneId)
        .map((favorite) => favorite.expression))
    }
    void load().catch(() => active && setMissing(true))
    return () => { active = false }
  }, [repository, sessionId])

  async function saveExpression(expression: string) {
    if (savedExpressions.includes(expression)) return
    const now = new Date().toISOString()
    await repository.favorites.save({
      id: favoriteIdFor(sessionId, expression),
      expression,
      sceneId: session?.sceneId,
      createdAt: now,
      updatedAt: now,
    })
    setSavedExpressions((values) => [...values, expression])
  }

  if (missing) return <main className={styles.empty}><h1>找不到这次练习</h1><p>记录可能已在本机被清空。</p><Link href="/practice">返回练习</Link></main>
  if (!report) return <main className={styles.loading} role="status"><SpinnerGap aria-hidden size={24} />正在整理复盘…</main>

  return (
    <main className={styles.report}>
      <header>
        <span><CheckCircle aria-hidden size={24} weight="fill" />SESSION COMPLETE</span>
        <h1>{report.completionPercent}%<small>任务完成</small></h1>
        <p>分数来自本轮文字与任务完成情况，不包含没有声学依据的发音评分。</p>
      </header>

      <section className={styles.metrics} aria-labelledby="metric-title">
        <h2 id="metric-title">表达概览</h2>
        <div>{metricOrder.map((key) => {
          const detail = report.metricDetails[key]
          return <article key={key}><span>{detail.label}</span><strong>{detail.score}<small>/4</small></strong><p>{detail.description}</p></article>
        })}</div>
      </section>

      <section className={styles.expressions} aria-labelledby="expression-title">
        <h2 id="expression-title">本场好表达</h2>
        {report.bestExpressions.length > 0 ? report.bestExpressions.map((expression) => (
          <article key={expression}><p>“{expression}”</p><button type="button" aria-label={`收藏表达：${expression}`} disabled={savedExpressions.includes(expression)} onClick={() => void saveExpression(expression)}><BookmarkSimple aria-hidden size={20} weight={savedExpressions.includes(expression) ? 'fill' : 'regular'} /></button></article>
        )) : <p className={styles.emptyCopy}>再完成一轮，就能在这里积累好表达。</p>}
      </section>

      <section className={styles.improve} aria-labelledby="improve-title">
        <h2 id="improve-title">下一次更进一步</h2>
        {report.improvementThemes.length > 0 ? <ul>{report.improvementThemes.map((theme) => <li key={theme}>{theme}</li>)}</ul> : <p>这次没有明显错误，下一步尝试加入更多具体细节。</p>}
        <aside><span>NEXT MOVE</span><p>{report.nextAction}</p></aside>
      </section>

      <nav className={styles.actions} aria-label="复盘后操作"><Link href="/practice">回到今日练习</Link><Link href="/scenes">换个场景<ArrowRight aria-hidden size={19} /></Link></nav>
    </main>
  )
}
