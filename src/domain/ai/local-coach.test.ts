import { describe, expect, it } from 'vitest'

import { getSceneBySlug, SCENE_CATALOG } from '@/content/scenes/catalog'
import { adaptScene } from '@/domain/scenes/adapt-scene'
import { CEFR_LEVELS } from '@/domain/scenes/types'

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
    expect(result.reply.text).toMatch(/passport|booking confirmation/i)
    expect(result.reply.text).not.toBe(hotel.openingLines[0])
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

  it('does not complete a goal merely because several turns have passed', async () => {
    const result = await localCoach.nextTurn({
      scene: hotel,
      learnerText: 'I am still thinking about my answer.',
      history: [],
      completedGoalIds: [],
      turnIndex: 4,
    })

    expect(result.progress.completedGoalIds).toEqual([])
  })

  it('keeps every scene and level inside its vocabulary and response constraints', async () => {
    for (const definition of SCENE_CATALOG) {
      for (const level of CEFR_LEVELS) {
        const scene = adaptScene(definition, level)
        const result = await localCoach.nextTurn({
          scene,
          learnerText: `I would like to discuss ${scene.keywords[0]}.`,
          history: [],
          completedGoalIds: [],
          turnIndex: 0,
        })
        const wordCount = result.reply.text.trim().split(/\s+/).length

        expect(result.progress.completedGoalIds, `${scene.slug} ${level}`).toContain(scene.goals[0].id)
        expect(result.reply.text.toLowerCase(), `${scene.slug} ${level}`).toContain(scene.keywords[1].toLowerCase())
        expect(wordCount, `${scene.slug} ${level}`).toBeGreaterThanOrEqual(scene.constraints.minAiWords)
        expect(wordCount, `${scene.slug} ${level}`).toBeLessThanOrEqual(scene.constraints.maxAiWords)
      }
    }
  })
})
