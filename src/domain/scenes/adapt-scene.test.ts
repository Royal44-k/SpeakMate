import { describe, expect, it } from 'vitest'

import { SCENE_CATALOG, getSceneBySlug } from '@/content/scenes/catalog'

import { adaptScene } from './adapt-scene'

describe('adaptScene', () => {
  it('selects the complete A1 language and task constraints', () => {
    const hotelCheckIn = getSceneBySlug('hotel-check-in')

    expect(hotelCheckIn).toBeDefined()
    const adapted = adaptScene(hotelCheckIn!, 'A1')

    expect(adapted.level).toBe('A1')
    expect(adapted.constraints.maxAiWords).toBe(9)
    expect(adapted.keywords).toContain('reservation')
    expect(adapted.exampleExpressions[0]).toMatch(/reservation/i)
    expect(adapted.openingLines.length).toBeGreaterThan(0)
  })

  it('gives C1 learners implicit-intent practice instead of beginner scaffolding', () => {
    const hotelCheckIn = getSceneBySlug('hotel-check-in')
    const adapted = adaptScene(hotelCheckIn!, 'C1')

    expect(adapted.constraints.strategy).toContain('implicit intent')
    expect(adapted.constraints.maxAiWords).toBeGreaterThan(26)
    expect(adapted.exampleExpressions).not.toEqual(
      adaptScene(hotelCheckIn!, 'A1').exampleExpressions,
    )
  })

  it('does not mutate the versioned source scene', () => {
    const source = SCENE_CATALOG[0]
    const before = structuredClone(source)

    adaptScene(source, 'B2')

    expect(source).toEqual(before)
  })
})
