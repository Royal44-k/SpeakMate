'use client'
import { useEffect, useState } from 'react'
import { createIndexedDbRepositories } from '@/infrastructure/persistence/repositories'
import { GoalHomeRoute } from '@/features/goals/goal-home-route'
import { AppShell } from '@/components/app-shell/app-shell'

export default function HomePage() {
  const [completed, setCompleted] = useState<boolean>()
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    void createIndexedDbRepositories()
      .profiles.get()
      .then((profile) => {
        if (active) setCompleted(profile?.onboardingCompleted ?? false)
      })
      .catch(() => {
        if (active) setError(true)
      })
    return () => {
      active = false
    }
  }, [attempt])
  if (error)
    return (
      <main className="landing-shell">
        <section>
          <h1 data-page-title tabIndex={-1}>
            本机设置暂不可用
          </h1>
          <p role="alert">没有清除记录。请重试读取，或查看数据说明。</p>
          <button
            onClick={() => {
              setError(false)
              setAttempt((value) => value + 1)
            }}
          >
            重试
          </button>
          <a href="/privacy">数据说明</a>
        </section>
      </main>
    )
  if (completed === undefined)
    return (
      <main className="landing-shell" aria-busy="true">
        <p role="status">正在读取本机设置…</p>
      </main>
    )
  if (completed)
    return (
      <AppShell activeDestination="goals" contentOwnsMain>
        <GoalHomeRoute />
      </AppShell>
    )
  return (
    <AppShell activeDestination="goals" contentOwnsMain>
      <main className="landing-shell">
        <section className="landing-hero" aria-labelledby="landing-title">
          <p className="eyebrow">SpeakMate · 口语搭子</p>
          <h1 id="landing-title" data-page-title tabIndex={-1}>
            <span>随时开口，</span>
            <span>练真实英语</span>
          </h1>
          <p className="landing-copy">
            从 A1 到
            C1，用丰富的生活、旅行、职场和社交场景，把“会做题”练成“能开口”。随时随地自在说英语！
          </p>
          <a className="primary-link" href="/welcome">
            开始练习
          </a>
          <p className="trust-copy">
            无需登录 · 不绑定付费 · 学习数据只保存在本机
          </p>
          <a href="/guide">查看使用指南</a>
        </section>
      </main>
    </AppShell>
  )
}
