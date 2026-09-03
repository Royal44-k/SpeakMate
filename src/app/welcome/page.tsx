'use client'

import { useRouter } from 'next/navigation'

import { OnboardingFlow, type OnboardingChoices } from '@/features/onboarding/onboarding-flow'
import { createIndexedDbRepositories } from '@/infrastructure/persistence/repositories'

export default function WelcomePage() {
  const router = useRouter()

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

  return <OnboardingFlow onComplete={complete} />
}
