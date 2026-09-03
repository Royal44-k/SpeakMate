import { describe, expect, it } from 'vitest'

import { getSceneBySlug } from '@/content/scenes/catalog'
import { adaptScene } from '@/domain/scenes/adapt-scene'

import { localCoach } from './local-coach'

const hotel = adaptScene(getSceneBySlug('hotel-check-in')!, 'B1')

describe('localCoach', () => {
  it('returns a scenario-valid reply without inventing issues for a clear sentence', async () => {
    const result = await localCoach.nextTurn({
      scene: hotel,
      learnerText: 'Hello, I have a reservation under the name Chen.',
      history: [],
      completedGoalIds: [],
      turnIndex: 0,
    })

    expect(result.provider).toBe('local')
    expect(result.degraded).toBe(true)
    expect(result.feedback.issueTags).toHaveLength(0)
    expect(result.reply.text).toMatch(/reservation|passport|name|room/i)
  })

  it('limits feedback to the one or two issues that matter most', async () => {
    const result = await localCoach.nextTurn({
      scene: hotel,
      learnerText: 'I am agree and I want room now because he need sleep.',
      history: [],
      completedGoalIds: [],
      turnIndex: 1,
    })

    expect(result.feedback.issueTags.length).toBeLessThanOrEqual(2)
    expect(result.feedback.corrected).toContain('I agree')
  })

  it('marks a goal complete when its keywords appear', async () => {
    const result = await localCoach.nextTurn({
      scene: hotel,
      learnerText: `My ${hotel.keywords[0]} is ready.`,
      history: [],
      completedGoalIds: [],
      turnIndex: 2,
    })

    expect(result.progress.completedGoalIds.length).toBeGreaterThan(0)
  })
})
