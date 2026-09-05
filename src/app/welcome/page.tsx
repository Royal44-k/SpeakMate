'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { OnboardingFlow, type OnboardingChoices } from '@/features/onboarding/onboarding-flow'
import type { LearnerProfile } from '@/domain/learning/types'
import { createIndexedDbRepositories } from '@/infrastructure/persistence/repositories'

export default function WelcomePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<LearnerProfile | null>(null)

  useEffect(() => {
    let mounted = true
    const repositories = createIndexedDbRepositories()

    void repositories.profiles.ensureGuestProfile().then((guestProfile) => {
      if (mounted) setProfile(guestProfile)
    })

    return () => { mounted = false }
  }, [])

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

  if (!profile) return null

  const initialChoices: OnboardingChoices = {
    level: profile.level,
    goals: profile.goals,
    dailyMinutes: profile.dailyMinutes,
  }

  return <OnboardingFlow onComplete={complete} initialChoices={initialChoices} returnHref={profile.onboardingCompleted ? '/me' : undefined} />
}
