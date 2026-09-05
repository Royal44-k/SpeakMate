'use client'

import { BookmarkSimple, ClockCounterClockwise, CloudSlash, DownloadSimple, Gear, ShieldCheck } from '@phosphor-icons/react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { AppShell } from '@/components/app-shell/app-shell'
import { SCENE_CATALOG } from '@/content/scenes/catalog'
import type { FavoriteExpression, LearnerProfile } from '@/domain/learning/types'
import type { PracticeSession } from '@/domain/practice/types'
import { createIndexedDbRepositories } from '@/infrastructure/persistence/repositories'

import styles from './learning-center.module.css'

export function LearningCenter() {
  const [profile, setProfile] = useState<LearnerProfile | null>(null)
  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [favorites, setFavorites] = useState<FavoriteExpression[]>([])
  const [loadedAt] = useState(() => Date.now())

  useEffect(() => {
    let active = true
    async function load() {
      const repositories = createIndexedDbRepositories()
      const [learner, savedSessions, savedFavorites] = await Promise.all([
        repositories.profiles.ensureGuestProfile(),
        repositories.sessions.list(),
        repositories.favorites.list(),
      ])
      if (!active) return
      setProfile(learner)
      setSessions(savedSessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
      setFavorites(savedFavorites.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
    }
    void load()
    return () => { active = false }
  }, [])

  const completedThisWeek = useMemo(() => {
    const cutoff = loadedAt - 7 * 24 * 60 * 60 * 1_000
    return sessions.filter((session) => session.completedAt && new Date(session.completedAt).getTime() >= cutoff).length
  }, [loadedAt, sessions])
  const completed = sessions.filter((session) => session.status === 'completed')

  return (
    <AppShell activeDestination="me">
      <div className={styles.page}>
        <header>
          <div><p>LEARNING CENTER</p><h1>我的练习</h1></div>
          <span>{profile?.level ?? 'A2'}</span>
        </header>

        <section className={styles.stats} aria-label="学习统计">
          <article><strong>{completedThisWeek}</strong><span>近 7 天练习</span></article>
          <article><strong>{completed.length}</strong><span>完成场景</span></article>
          <article><strong>{favorites.length}</strong><span>收藏表达</span></article>
        </section>

        <section className={styles.localStatus}><CloudSlash aria-hidden size={23} /><div><h2>记录保存在本机</h2><p>无需登录即可免费使用；跨设备同步为可选功能。</p></div><Link href="/auth">了解同步</Link></section>

        <section className={styles.section} aria-labelledby="history-title">
          <div className={styles.sectionTitle}><ClockCounterClockwise aria-hidden size={21} /><h2 id="history-title">最近练习</h2></div>
          {sessions.length > 0 ? <div className={styles.list}>{sessions.slice(0, 6).map((session) => {
            const scene = SCENE_CATALOG.find((item) => item.id === session.sceneId)
            return <Link key={session.id} href={session.status === 'completed' ? `/session/${session.id}/report` : `/session/${session.id}`}><span><strong>{scene?.titleZh ?? '英语对话'}</strong><small>{session.level} · {session.status === 'completed' ? '已完成' : '继续练习'}</small></span><time dateTime={session.updatedAt}>{new Date(session.updatedAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}</time></Link>
          })}</div> : <p className={styles.empty}>完成第一场练习后，记录会出现在这里。</p>}
        </section>

        <section className={styles.section} aria-labelledby="favorite-title">
          <div className={styles.sectionTitle}><BookmarkSimple aria-hidden size={21} /><h2 id="favorite-title">收藏表达</h2></div>
          {favorites.length > 0 ? <div className={styles.favoriteList}>{favorites.slice(0, 5).map((favorite) => <blockquote key={favorite.id}>“{favorite.expression}”</blockquote>)}</div> : <p className={styles.empty}>在复盘页收藏的好表达会保存在这里。</p>}
        </section>

        <nav className={styles.settings} aria-label="设置与数据">
          <Link href="/privacy"><ShieldCheck aria-hidden size={20} /><span><strong>隐私与数据</strong><small>导出、清空与数据说明</small></span></Link>
          <Link href="/install"><DownloadSimple aria-hidden size={20} /><span><strong>安装到手机</strong><small>查看 iPhone 与安卓步骤</small></span></Link>
          <Link href="/welcome"><Gear aria-hidden size={20} /><span><strong>重新设置目标</strong><small>修改水平、场景与每日时长</small></span></Link>
        </nav>
      </div>
    </AppShell>
  )
}
