import { beforeEach, describe, expect, it } from 'vitest'

import { getDatabase } from './db'
import { DEFAULT_LEARNER_SETTINGS, loadLearnerSettings } from './learner-settings'
import { createIndexedDbRepositories } from './repositories'

describe('loadLearnerSettings', () => {
  beforeEach(async () => {
    await createIndexedDbRepositories().clearLearnerData()
  })

  it('returns stable local defaults when settings have not been saved', async () => {
    await expect(loadLearnerSettings()).resolves.toEqual(
      DEFAULT_LEARNER_SETTINGS,
    )
  })

  it('normalizes a persisted speech rate while retaining local preferences', async () => {
    await (await getDatabase()).put('settings', {
      id: 'settings',
      speechRate: 1.12,
      autoPlayAi: false,
      feedbackExpanded: true,
      updatedAt: '2026-09-09T00:00:00.000Z',
    })

    await expect(loadLearnerSettings()).resolves.toMatchObject({
      speechRate: 1.15,
      autoPlayAi: false,
      feedbackExpanded: true,
    })
  })
})
