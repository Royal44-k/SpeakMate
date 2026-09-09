import type { LearnerSettings } from '@/domain/learning/types'
import { normalizeSpeechRate } from '@/infrastructure/audio/browser-tts'

import { getDatabase } from './db'

export const DEFAULT_LEARNER_SETTINGS: LearnerSettings = Object.freeze({
  id: 'settings',
  speechRate: 1,
  autoPlayAi: true,
  feedbackExpanded: false,
  updatedAt: '',
})

export async function loadLearnerSettings(): Promise<LearnerSettings> {
  const stored = await (await getDatabase()).get('settings', 'settings')
  if (!stored) return DEFAULT_LEARNER_SETTINGS
  return {
    ...stored,
    speechRate: normalizeSpeechRate(stored.speechRate),
  }
}
