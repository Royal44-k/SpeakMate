'use client'

import {
  BookmarkSimple,
  ClockCounterClockwise,
  CloudSlash,
  DownloadSimple,
  Gear,
  ShieldCheck,
} from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { AppShell } from '@/components/app-shell/app-shell'
import { SCENE_METADATA } from '@/content/scenes/metadata'
import {
  savedPracticeHref,
  savedSimulationHref,
} from '@/components/app-shell/learning-routes'
import { HistoricalPracticeRecord } from '@/features/practice/historical-practice-record'
import type { PracticeRecord } from '@/infrastructure/persistence/practice-repository'
import type {
  FavoriteExpression,
  LearnerProfile,
} from '@/domain/learning/types'
import type { PracticeSession } from '@/domain/practice/types'
import {
  createIndexedDbRepositories,
  type Repositories,
} from '@/infrastructure/persistence/repositories'

import styles from './learning-center.module.css'
import { DemoRanking } from './demo-ranking'
import { summarizePoints } from '@/domain/goals/statistics'

export function LearningCenter({
  repositories: providedRepositories,
}: { repositories?: Repositories } = {}) {
  const [profile, setProfile] = useState<LearnerProfile | null>(null)
  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [favorites, setFavorites] = useState<FavoriteExpression[]>([])
  const [loadError, setLoadError] = useState(false)
  const [loadedAt] = useState(() => Date.now())
  const [retained, setRetained] = useState<PracticeRecord>()
  const [profileStyle, setProfileStyle] = useState<string>()
  const [points, setPoints] = useState<ReturnType<typeof summarizePoints>>()
  const [repo] = useState(
    () => providedRepositories ?? createIndexedDbRepositories(),
  )
  const [attempt, setAttempt] = useState(0)
  const [deleting, setDeleting] = useState<PracticeRecord>()
  const [receipt, setReceipt] = useState<string>()
  const [historyBusy, setHistoryBusy] = useState(false)
  const [historyMessage, setHistoryMessage] = useState('')
  const [historyError, setHistoryError] = useState('')
  const deletionTitle = useRef<HTMLHeadingElement>(null)
  const deletionTrigger = useRef<HTMLButtonElement>(null)
  const undoButton = useRef<HTMLButtonElement>(null)
  const historyTitle = useRef<HTMLHeadingElement>(null)
  const selectedRead = useRef(false)
  async function readSelected(id: string, action: 'view' | 'delete') {
    if (selectedRead.current || historyBusy) return
    selectedRead.current = true
    setHistoryBusy(true)
    setHistoryError('')
    try {
      const record = await repo.practice.read(id)
      if (!record) throw new Error('HISTORY_MISSING')
      if (action === 'view') setRetained(record)
      else setDeleting(record)
    } catch {
      setHistoryError('这条记录暂时无法读取，请重试；没有删除或覆盖记录。')
    } finally {
      selectedRead.current = false
      setHistoryBusy(false)
    }
  }
  useEffect(() => {
    if (deleting) deletionTitle.current?.focus()
  }, [deleting])
  useEffect(() => {
    if (historyMessage && !historyBusy)
      (receipt ? undoButton.current : historyTitle.current)?.focus()
  }, [historyMessage, historyBusy, receipt])

  async function changeHistory(undo = false) {
    if (historyBusy || (!undo && !deleting) || (undo && !receipt)) return
    setHistoryBusy(true)
    setHistoryError('')
    setHistoryMessage('')
    try {
      if (undo) {
        await repo.sessions.undoDeleteHistory(receipt!)
        setReceipt(undefined)
        setHistoryMessage('本次历史已恢复；没有重复发放积分。')
      } else {
        setReceipt(await repo.sessions.deleteHistory(deleting!))
        setDeleting(undefined)
        setHistoryMessage(
          '这条历史已删除，笔记、收藏和已记录的学习积分仍保留。刷新或离开后不保证可撤销。',
        )
      }
      setAttempt((value) => value + 1)
    } catch {
      setHistoryError(
        '操作未完成：记录可能已被另一窗口修改，或存储不可用。请重新读取后核对；没有覆盖其他记录。',
      )
    } finally {
      setHistoryBusy(false)
    }
  }

  useEffect(() => {
    let active = true
    async function load() {
      const repositories = repo
      const [learner, savedSessions, savedFavorites, settings] =
        await Promise.all([
          repositories.profiles.ensureGuestProfile(),
          repositories.sessions.list(),
          repositories.favorites.list(),
          repositories.learning.getSettings(),
        ])
      const learning = await repositories.learning.getState(learner.id)
      if (!active) return
      const latest = savedSessions.sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      )
      setProfile(learner)
      setLoadError(false)
      setProfileStyle(settings.appliedProfileStyle)
      setPoints(summarizePoints(learning.pointsLedger))
      setSessions(latest)
      setFavorites(
        savedFavorites.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      )
    }
    void load().catch(() => {
      if (active) setLoadError(true)
    })
    return () => {
      active = false
    }
  }, [repo, attempt])

  const completedThisWeek = useMemo(() => {
    const cutoff = loadedAt - 7 * 24 * 60 * 60 * 1_000
    return sessions.filter(
      (session) =>
        session.completedAt &&
        new Date(session.completedAt).getTime() >= cutoff,
    ).length
  }, [loadedAt, sessions])
  const completed = sessions.filter((session) => session.status === 'completed')

  if (retained)
    return (
      <AppShell activeDestination="me">
        <HistoricalPracticeRecord record={retained} unlinked>
          <button type="button" onClick={() => setRetained(undefined)}>
            返回本页列表
          </button>
        </HistoricalPracticeRecord>
      </AppShell>
    )

  return (
    <AppShell activeDestination="me">
      <div className={styles.page}>
        <header data-profile-style={profileStyle}>
          <div>
            <p>LEARNING CENTER</p>
            <h1 data-page-title tabIndex={-1}>
              我的练习
            </h1>
          </div>
          <span>{profile?.level ?? 'A2'}</span>
        </header>

        <section className={styles.stats} aria-label="学习统计">
          <article>
            <strong>{completedThisWeek}</strong>
            <span>近 7 天练习</span>
          </article>
          <article>
            <strong>{completed.length}</strong>
            <span>已结束练习（含旧版）</span>
          </article>
          <article>
            <strong>{favorites.length}</strong>
            <span>收藏表达</span>
          </article>
        </section>

        {points ? (
          <section className={styles.section} aria-label="本机个人成绩">
            <h2>我的练习积分</h2>
            <p>
              累计获得 {points.earned} · 可兑换余额 {points.available}
            </p>
            <a className={styles.sectionLink} href="/rewards">
              查看数字奖励
            </a>
          </section>
        ) : null}

        {loadError ? (
          <p role="alert">
            本机记录暂时无法读取，请刷新重试；没有清除任何数据。
          </p>
        ) : null}

        <section className={styles.localStatus}>
          <CloudSlash aria-hidden size={23} />
          <div>
            <h2>记录保存在本机</h2>
            <p>无需登录即可免费使用；本版不连接账号、云端智能或自动同步。</p>
          </div>
          <a href="/auth">本机数据说明</a>
        </section>

        <section className={styles.section} aria-labelledby="history-title">
          <div className={styles.sectionTitle}>
            <ClockCounterClockwise aria-hidden size={21} />
            <h2 id="history-title" ref={historyTitle} tabIndex={-1}>
              完整练习历史
            </h2>
          </div>
          {sessions.length > 0 ? (
            <div className={styles.list}>
              {sessions.map((session) => {
                const scene = SCENE_METADATA.find(
                  (item) => item.id === session.sceneId,
                )
                const label = !session.gradedDialogue
                  ? session.status === 'completed'
                    ? '旧版已结束记录（只读）'
                    : session.status === 'abandoned'
                      ? '旧版已停止记录（只读）'
                      : '旧版未结束记录（只读）'
                  : session.status === 'completed'
                    ? session.gradedDialogue?.state.outcome === 'partial'
                      ? '已结束，部分目标未确认'
                      : '已结束，所选目标已确认'
                    : session.status === 'abandoned'
                      ? '已停止，未记作完成'
                      : session.gradedDialogue?.state.outcome === 'active'
                        ? '继续练习'
                        : '待查看结束选项'
                const href = session.simulation
                  ? savedSimulationHref(session.id, '/me')
                  : savedPracticeHref(
                      session.id,
                      session.status === 'completed' ||
                        session.status === 'abandoned'
                        ? 'report'
                        : 'session',
                      '/me',
                    )
                const content = (
                  <>
                    <span>
                      <strong>
                        {session.sceneSnapshot?.titleZh ??
                          scene?.titleZh ??
                          '英语对话'}
                      </strong>
                      <small>
                        {session.level} · {label}
                      </small>
                    </span>
                    <time dateTime={session.updatedAt}>
                      {new Date(session.updatedAt).toLocaleDateString('zh-CN', {
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </time>
                  </>
                )
                return (
                  <div key={session.id}>
                    {href ? (
                      <a href={href}>{content}</a>
                    ) : (
                      <>
                        {content}
                        <button
                          type="button"
                          disabled={historyBusy}
                          onClick={() => void readSelected(session.id, 'view')}
                        >
                          在此查看保留记录（只读）
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      disabled={historyBusy}
                      onClick={(event) => {
                        deletionTrigger.current = event.currentTarget
                        void readSelected(session.id, 'delete')
                      }}
                      aria-label={`删除此练习：${session.sceneSnapshot?.titleZh ?? scene?.titleZh ?? '英语对话'}`}
                    >
                      删除此练习
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className={styles.empty}>完成第一场练习后，记录会出现在这里。</p>
          )}
        </section>

        {deleting ? (
          <section className={styles.section} aria-label="确认删除历史">
            <h2 ref={deletionTitle} tabIndex={-1}>
              删除这条历史？
            </h2>
            <p>
              {deleting.session.sceneSnapshot?.titleZh ?? '英语对话'} ·{' '}
              {deleting.session.level} · {deleting.session.updatedAt}
            </p>
            <p>
              只删除本条会话及话轮；词句笔记及任务完成凭据可能仍含学习文字，收藏、计划与积分保留。彻底清除请前往隐私与数据明确确认。刷新或离开后不保证可撤销。
            </p>
            {deleting.session.status === 'active' ? (
              <p>
                这条练习尚未结束。删除后不能继续原记录；未完成任务只能按原固定目标另开。
              </p>
            ) : null}
            <button
              type="button"
              disabled={historyBusy}
              onClick={() => void changeHistory()}
            >
              确认删除这条历史
            </button>
            <button
              type="button"
              disabled={historyBusy}
              onClick={() => {
                setDeleting(undefined)
                deletionTrigger.current?.focus()
              }}
            >
              取消删除
            </button>
          </section>
        ) : null}
        {historyMessage ? (
          <p className={styles.section} role="status">
            {historyMessage}
          </p>
        ) : null}
        {receipt ? (
          <button
            ref={undoButton}
            className={styles.section}
            type="button"
            disabled={historyBusy}
            onClick={() => void changeHistory(true)}
          >
            撤销本次删除
          </button>
        ) : null}
        {historyError ? (
          <section className={styles.section}>
            <p role="alert">{historyError}</p>
            <button
              disabled={historyBusy}
              onClick={() => {
                setDeleting(undefined)
                setAttempt((value) => value + 1)
              }}
            >
              重新读取历史
            </button>
          </section>
        ) : null}

        <section className={styles.section} aria-labelledby="favorite-title">
          <div className={styles.sectionTitle}>
            <BookmarkSimple aria-hidden size={21} />
            <h2 id="favorite-title">收藏表达</h2>
            <a href="/notebook">在记录簿查看与复习</a>
          </div>
          {favorites.length > 0 ? (
            <div className={styles.favoriteList}>
              {favorites.slice(0, 5).map((favorite) => (
                <blockquote key={favorite.id}>
                  “{favorite.expression}”
                </blockquote>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>在复盘页收藏的表达会保存在这里。</p>
          )}
        </section>

        <nav className={styles.settings} aria-label="设置与数据">
          <a href="/privacy">
            <ShieldCheck aria-hidden size={20} />
            <span>
              <strong>隐私与数据</strong>
              <small>导出、清空与数据说明</small>
            </span>
          </a>
          <a href="/install">
            <DownloadSimple aria-hidden size={20} />
            <span>
              <strong>安装到手机</strong>
              <small>查看 iPhone 与安卓步骤</small>
            </span>
          </a>
          <a href="/welcome">
            <Gear aria-hidden size={20} />
            <span>
              <strong>重新设置目标</strong>
              <small>修改水平、场景与每日时长</small>
            </span>
          </a>
          <a href="/guide">
            <Gear aria-hidden size={20} />
            <span>
              <strong>使用指南</strong>
              <small>重新查看本机学习方法</small>
            </span>
          </a>
        </nav>
        <div className={styles.section}>
          <DemoRanking />
        </div>
      </div>
    </AppShell>
  )
}
