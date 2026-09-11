'use client'

import { ArrowRight, Clock, Headphones, Sparkle } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

import { AppShell } from '@/components/app-shell/app-shell'
import { SceneImage } from '@/components/scene-image/scene-image'
import { SCENE_METADATA } from '@/content/scenes/metadata'
import {
  buildLearningHref,
  savedPracticeHref,
  savedSimulationHref,
} from '@/components/app-shell/learning-routes'
import { HistoricalPracticeRecord } from './historical-practice-record'
import type { PracticeRecord } from '@/infrastructure/persistence/practice-repository'
import { recommendScene } from '@/domain/learning/recommendation'
import type { LearnerProfile } from '@/domain/learning/types'
import type { PracticeSession } from '@/domain/practice/types'
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
  recent?: PracticeRecord
}

export function PracticeHome({ repositories }: PracticeHomeProps) {
  const [repository] = useState(
    () => repositories ?? createIndexedDbRepositories(),
  )
  const [data, setData] = useState<PracticeHomeData>()
  const [loadError, setLoadError] = useState(false)
  const [levelError, setLevelError] = useState('')
  const [savingLevel, setSavingLevel] = useState(false)
  const [retained, setRetained] = useState<PracticeRecord>()

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
        const latest = [...sessions]
          .filter((session) => session.status === 'active')
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
        const recent = latest
          ? await repository.practice.read(latest.id)
          : undefined
        if (active) setData({ profile, sessions, recent })
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
      <AppShell activeDestination="practice" contentOwnsMain>
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
      <AppShell activeDestination="practice" contentOwnsMain>
        <main className={styles.state} aria-busy="true">
          <p>正在准备今天的练习…</p>
        </main>
      </AppShell>
    )
  }

  const scene =
    recommendScene(data.profile, SCENE_METADATA, data.sessions) ??
    SCENE_METADATA[0]
  const level = data.profile.level
  const recent = data.recent
  const recentHref = recent
    ? recent.session.simulation
      ? savedSimulationHref(recent.session.id)
      : savedPracticeHref(recent.session.id, 'session')
    : undefined
  const recentLabel =
    recent?.status === 'historical'
      ? '查看旧版记录'
      : recent?.status === 'recovery'
        ? '查看保留记录'
        : recent?.session.gradedDialogue?.state.outcome === 'active'
          ? '继续本次对话'
          : '返回查看结束选项'
  const href = buildLearningHref({ kind: 'prepare', scene: scene.slug, level })

  if (retained)
    return (
      <AppShell activeDestination="practice">
        <HistoricalPracticeRecord
          record={retained}
          repositories={repository}
          unlinked
        >
          <button type="button" onClick={() => setRetained(undefined)}>
            返回本页列表
          </button>
        </HistoricalPracticeRecord>
      </AppShell>
    )

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
              今日推荐
            </span>
          </div>
          <div className={styles.body}>
            <p>{scene.titleEn}</p>
            <h2 id="recommendation-title">{scene.titleZh}</h2>
            <div className={styles.meta}>
              <span>新练习水平 {level}</span>
              <span>
                <Clock aria-hidden size={16} />
                {scene.estimatedMinutes} 分钟
              </span>
              <span>
                <Headphones aria-hidden size={16} />3 种长度
              </span>
            </div>
            <p className={styles.summary}>{scene.summaryZh}</p>
            <a href={href}>
              准备开始
              <ArrowRight aria-hidden size={20} weight="bold" />
            </a>
          </div>
        </section>
        {recent ? (
          <section className={styles.newPractice} aria-label="已保存练习">
            <h2>上次的记录仍在</h2>
            <p>
              {recent.session.sceneSnapshot?.titleZh ??
                SCENE_METADATA.find(
                  (item) => item.id === recent.session.sceneId,
                )?.titleZh ??
                '历史场景'}{' '}
              · 原记录 {recent.session.level}。新练习使用当前 {level}
              ，不会改写原记录。
            </p>
            {recentHref ? (
              <a href={recentHref}>
                {recentLabel}
                <ArrowRight aria-hidden size={20} />
              </a>
            ) : (
              <button type="button" onClick={() => setRetained(recent)}>
                在此查看保留记录（只读）
              </button>
            )}
          </section>
        ) : null}
        <section className={styles.explore}>
          <div>
            <p>还想练点别的？</p>
            <h2>{SCENE_METADATA.length} 个场景，练习不同情境的表达。</h2>
          </div>
          <a href={`/scenes?level=${data.profile.level}`}>浏览全部场景</a>
        </section>
      </div>
    </AppShell>
  )
}
