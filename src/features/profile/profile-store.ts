import { createStore } from 'zustand/vanilla'

import type { LearnerProfile } from '@/domain/learning/types'
import type { CefrLevel, SceneCategory } from '@/domain/scenes/types'
import type { ProfileRepository } from '@/infrastructure/persistence/repositories'

interface OnboardingChoices {
  level: CefrLevel
  goals: SceneCategory[]
  dailyMinutes: 5 | 10 | 15
}

interface ProfileState {
  profile?: LearnerProfile
  status: 'idle' | 'loading' | 'ready' | 'error'
  error?: string
  bootstrap(): Promise<void>
  completeOnboarding(choices: OnboardingChoices): Promise<void>
}

export function createProfileStore(repository: ProfileRepository) {
  return createStore<ProfileState>((set, get) => ({
    status: 'idle',
    async bootstrap() {
      set({ status: 'loading', error: undefined })
      try {
        const profile = await repository.ensureGuestProfile()
        set({ profile, status: 'ready' })
      } catch {
        set({ status: 'error', error: '无法读取本机学习记录，请稍后重试。' })
      }
    },
    async completeOnboarding(choices) {
      const existing = get().profile ?? (await repository.ensureGuestProfile())
      const profile: LearnerProfile = {
        ...existing,
        ...choices,
        onboardingCompleted: true,
        updatedAt: new Date().toISOString(),
      }
      await repository.save(profile)
      set({ profile, status: 'ready', error: undefined })
    },
  }))
}
