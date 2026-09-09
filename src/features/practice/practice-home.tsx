'use client'

import { ArrowRight, Clock, Headphones, Sparkle } from '@phosphor-icons/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { AppShell } from '@/components/app-shell/app-shell'
import { SceneImage } from '@/components/scene-image/scene-image'
import { SCENE_CATALOG } from '@/content/scenes/catalog'
import { recommendScene } from '@/domain/learning/recommendation'
import type { LearnerProfile } from '@/domain/learning/types'
import type { PracticeSession } from '@/domain/practice/types'
import { adaptScene } from '@/domain/scenes/adapt-scene'
import { CEFR_LEVELS, type CefrLevel } from '@/domain/scenes/types'
import {
  createIndexedDbRepositories,
  type Repositories,
} from '@/infrastructure/persistence/repositories'

import styles from '@/app/practice/practice-home.module.css'

interface PracticeHomeProps {
  repositories?: Repositories
}

interface PracticeHomeData {
  profile: LearnerProfile
  sessions: PracticeSession[]
}

export function PracticeHome({ repositories }: PracticeHomeProps) {
  const [repository] = useState(
    () => repositories ?? createIndexedDbRepositories(),
  )
  const [data, setData] = useState<PracticeHomeData>()
  const [loadError, setLoadError] = useState(false)
  const [levelError, setLevelError] = useState('')
  const [savingLevel, setSavingLevel] = useState(false)

  async function changeLevel(level: CefrLevel) {
    if (!data || savingLevel) return
    setSavingLevel(true)
    setLevelError('')
    try {
      const profile = {
        ...data.profile,
        level,
        updatedAt: new Date().toISOString(),
      }
      await repository.profiles.save(profile)
      setData({ ...data, profile })
    } catch {
      setLevelError('水平未能保存，请再试一次。')
    } finally {
      setSavingLevel(false)
    }
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const profile = await repository.profiles.ensureGuestProfile()
        const sessions = await repository.sessions.list()
        if (active) setData({ profile, sessions })
      } catch {
        if (active) setLoadError(true)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [repository])

  if (loadError) {
    return (
      <AppShell activeDestination="practice">
        <main className={styles.state}>
          <h1 data-page-title tabIndex={-1}>
            暂时无法读取练习记录
          </h1>
          <p>请刷新页面重试。你的本地记录不会因此被清除。</p>
        </main>
      </AppShell>
    )
  }

  if (!data) {
    return (
      <AppShell activeDestination="practice">
        <main className={styles.state} aria-busy="true">
          <p>正在准备今天的练习…</p>
        </main>
      </AppShell>
    )
  }

  const latestActive = [...data.sessions]
    .filter((session) => session.status === 'active')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  const catalogDefinition = latestActive
    ? SCENE_CATALOG.find(
        (item) =>
          item.id === latestActive.sceneId &&
          item.version === latestActive.sceneVersion,
      )
    : undefined
  const recoverableScene =
    latestActive?.sceneSnapshot ??
    (latestActive && catalogDefinition
      ? adaptScene(catalogDefinition, latestActive.level)
      : undefined)
  const recommendation =
    recommendScene(data.profile, SCENE_CATALOG, data.sessions) ??
    SCENE_CATALOG[0]
  const recoverable = recoverableScene ? latestActive : undefined
  const level = recoverableScene?.level ?? data.profile.level
  const scene = recoverableScene ?? adaptScene(recommendation, level)
  const href = recoverable
    ? `/session/${recoverable.id}?scene=${scene.slug}&level=${level}`
    : `/scenes/${scene.slug}?level=${level}`

  return (
    <AppShell activeDestination="practice">
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <p>DAILY PRACTICE</p>
            <h1
              data-page-title
              tabIndex={-1}
            >{`今天，开口说 ${data.profile.dailyMinutes} 分钟`}</h1>
          </div>
          <label className={styles.levelPicker}>
            当前水平
            <select
              aria-label="当前练习水平"
              value={data.profile.level}
              disabled={savingLevel}
              onChange={(event) =>
                void changeLevel(event.target.value as CefrLevel)
              }
            >
              {CEFR_LEVELS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </header>
        {levelError ? (
          <p className={styles.levelError} role="alert">
            {levelError}
          </p>
        ) : null}
        {recoverable ? (
          <section className={styles.newPractice} aria-label="新一轮练习">
            <h2>换个开场，再练一次</h2>
            <p>
              {scene.titleZh} · 使用当前 {data.profile.level}{' '}
              水平。原对话保留，随时可以继续。
            </p>
            <Link
              href={`/session/new?scene=${scene.slug}&level=${data.profile.level}`}
            >
              开启新一轮对话
              <ArrowRight aria-hidden size={20} />
            </Link>
          </section>
        ) : null}
        <section
          className={styles.recommendation}
          aria-labelledby="recommendation-title"
        >
          <div className={styles.image}>
            <SceneImage
              image={scene.image}
              priority
              className={styles.imageFrame}
            />
            <span className={styles.badge}>
              <Sparkle aria-hidden size={16} weight="fill" />
              {recoverable ? '继续练习' : '今日推荐'}
            </span>
          </div>
          <div className={styles.body}>
            <p>{scene.titleEn}</p>
            <h2 id="recommendation-title">{scene.titleZh}</h2>
            <div className={styles.meta}>
              <span>
                {recoverable ? '原对话' : '练习水平'} {level}
              </span>
              <span>
                <Clock aria-hidden size={16} />
                {scene.estimatedMinutes} 分钟
              </span>
              <span>
                <Headphones aria-hidden size={16} />
                {scene.recommendedTurns} 轮
              </span>
            </div>
            <p className={styles.summary}>{scene.summaryZh}</p>
            <Link href={href}>
              {recoverable ? '继续本次对话' : '准备开始'}
              <ArrowRight aria-hidden size={20} weight="bold" />
            </Link>
          </div>
        </section>
        <section className={styles.explore}>
          <div>
            <p>还想练点别的？</p>
            <h2>{SCENE_CATALOG.length} 个场景，覆盖生活里的每一次开口。</h2>
          </div>
          <Link href={`/scenes?level=${data.profile.level}`}>浏览全部场景</Link>
        </section>
      </div>
    </AppShell>
  )
}
