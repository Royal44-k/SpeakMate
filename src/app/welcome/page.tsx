'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { OnboardingFlow, type OnboardingChoices } from '@/features/onboarding/onboarding-flow'
import styles from '@/features/onboarding/onboarding-flow.module.css'
import type { LearnerProfile } from '@/domain/learning/types'
import { createIndexedDbRepositories } from '@/infrastructure/persistence/repositories'

export default function WelcomePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<LearnerProfile | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    let mounted = true
    const repositories = createIndexedDbRepositories()

    void repositories.profiles.ensureGuestProfile()
      .then((guestProfile) => {
        if (mounted) setProfile(guestProfile)
      })
      .catch(() => {
        if (mounted) setLoadFailed(true)
      })

    return () => { mounted = false }
  }, [loadAttempt])

  function retryProfileLoad() {
    setLoadFailed(false)
    setLoadAttempt((attempt) => attempt + 1)
  }

  async function complete(choices: OnboardingChoices) {
    const repositories = createIndexedDbRepositories()
    const existing = await repositories.profiles.ensureGuestProfile()
    await repositories.profiles.save({
      ...existing,
      ...choices,
      onboardingCompleted: true,
      updatedAt: new Date().toISOString(),
    })
    router.push('/practice')
  }

  if (loadFailed) {
    return (
      <main className={styles.flow} aria-label="无法读取练习设置">
        <section className={`${styles.panel} ${styles.loadingPanel}`}>
          <p className={styles.brand}>SPEAKMATE</p>
          <h1 data-page-title tabIndex={-1}>暂时无法准备练习</h1>
          <p role="alert">无法读取本地练习设置，请重试。</p>
          <button className={styles.primaryButton} type="button" onClick={retryProfileLoad}>重试</button>
        </section>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className={styles.flow} aria-busy="true" aria-label="正在准备你的练习">
        <section className={`${styles.panel} ${styles.loadingPanel}`}>
          <p className={styles.brand}>SPEAKMATE</p>
          <h1>正在准备你的练习</h1>
          <p role="status">正在读取你的练习设置…</p>
        </section>
      </main>
    )
  }

  const initialChoices: OnboardingChoices = {
    level: profile.level,
    goals: profile.goals,
    dailyMinutes: profile.dailyMinutes,
  }

  return <OnboardingFlow onComplete={complete} initialChoices={initialChoices} returnHref={profile.onboardingCompleted ? '/me' : undefined} />
}
