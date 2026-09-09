import { describe, expect, it } from 'vitest'
import { SCENE_CATALOG } from '@/content/scenes/catalog'
import { adaptScene } from '@/domain/scenes/adapt-scene'
import { CEFR_LEVELS } from '@/domain/scenes/types'
import type { ConversationHistoryItem } from './contracts'
import { localCoach } from './local-coach'

describe('guided dialogue progression', () => {
  it('keeps prompts fresh when just one unfinished goal remains', async () => {
    const scene = adaptScene(
      SCENE_CATALOG.find((item) => item.slug === 'coffee-order')!,
      'A2',
    )
    const history: ConversationHistoryItem[] = [
      { speaker: 'ai', text: scene.openingLines[0] },
    ]
    const seen = new Set(history.map((item) => item.text))
    let completedGoalIds: string[] = []
    for (let turnIndex = 0; turnIndex < 6; turnIndex++) {
      const learnerText =
        turnIndex === 0 ? 'A small latte with oat milk, please.' : 'Hmm.'
      const result = await localCoach.nextTurn({
        scene,
        history,
        learnerText,
        completedGoalIds,
        turnIndex,
      })
      expect(seen.has(result.reply.text), `turn ${turnIndex}`).toBe(false)
      seen.add(result.reply.text)
      completedGoalIds = result.progress.completedGoalIds
      history.push(
        { speaker: 'learner', text: learnerText },
        { speaker: 'ai', text: result.reply.text },
      )
    }
    expect(completedGoalIds).toHaveLength(2)
  })
  it('does not repeat the opening or any prompt across a six-turn practice at every level', async () => {
    for (const definition of SCENE_CATALOG) {
      for (const level of CEFR_LEVELS) {
        const scene = adaptScene(definition, level)
        const history: ConversationHistoryItem[] = [
          { speaker: 'ai', text: scene.openingLines[0] },
        ]
        const seen = new Set(history.map((item) => item.text))
        for (let turnIndex = 0; turnIndex < 6; turnIndex++) {
          const result = await localCoach.nextTurn({
            scene,
            history,
            learnerText: 'Hmm.',
            completedGoalIds: [],
            turnIndex,
          })
          expect(
            seen.has(result.reply.text),
            `${scene.slug} ${level} turn ${turnIndex}`,
          ).toBe(false)
          seen.add(result.reply.text)
          history.push(
            { speaker: 'learner', text: 'Hmm.' },
            { speaker: 'ai', text: result.reply.text },
          )
          expect(result.progress.completedGoalIds).toEqual([])
          expect(result.progress.shouldOfferCompletion).toBe(turnIndex === 5)
        }
      }
    }
  })

  it('offers more than two learner expressions and a choice of openings in every scene', () => {
    for (const definition of SCENE_CATALOG) {
      for (const level of CEFR_LEVELS) {
        const scene = adaptScene(definition, level)
        expect(
          new Set(scene.exampleExpressions).size,
          `${scene.slug} ${level}`,
        ).toBeGreaterThan(4)
        expect(new Set(scene.openingLines).size).toBeGreaterThan(2)
      }
    }
  })
})
