import { describe, expect, it } from 'vitest'

import { CEFR_LEVELS } from '@/domain/scenes/types'

import {
  SCENE_CATALOG,
  getPublishedScenes,
  getSceneBySlug,
} from './catalog'

describe('SCENE_CATALOG', () => {
  it('publishes exactly forty-two unique scenes across seven balanced categories', () => {
    expect(SCENE_CATALOG).toHaveLength(42)
    expect(new Set(SCENE_CATALOG.map((scene) => scene.id)).size).toBe(42)
    expect(new Set(SCENE_CATALOG.map((scene) => scene.slug)).size).toBe(42)

    const categoryCounts = SCENE_CATALOG.reduce<Record<string, number>>(
      (counts, scene) => {
        counts[scene.category] = (counts[scene.category] ?? 0) + 1
        return counts
      },
      {},
    )

    expect(Object.keys(categoryCounts)).toHaveLength(7)
    expect(Object.values(categoryCounts).every((count) => count === 6)).toBe(true)
    expect(SCENE_CATALOG.every((scene) => scene.status === 'published')).toBe(true)
  })

  it('contains complete, measurable content for A1 through C1', () => {
    for (const scene of SCENE_CATALOG) {
      expect(scene.version).toBeGreaterThan(0)
      expect(scene.goals).toHaveLength(3)
      expect(scene.goals.every((goal) => goal.completionSignal.trim().length > 0)).toBe(
        true,
      )

      for (const level of CEFR_LEVELS) {
        expect(scene.keywords[level].length).toBeGreaterThanOrEqual(3)
        expect(scene.exampleExpressions[level].length).toBeGreaterThanOrEqual(2)
        expect(scene.openingLines[level].length).toBeGreaterThanOrEqual(1)
        expect(scene.constraints[level].maxAiWords).toBeGreaterThan(0)
      }
    }
  })

  it('marks every health and emergency scene with a language-only safety note', () => {
    const emergencyScenes = SCENE_CATALOG.filter(
      (scene) => scene.category === 'emergency',
    )

    expect(emergencyScenes).toHaveLength(6)
    expect(
      emergencyScenes.every((scene) =>
        scene.safetyNote?.includes('紧急情况请联系当地专业服务'),
      ),
    ).toBe(true)
  })

  it('looks up published scenes without exposing a mutable catalog', () => {
    expect(getSceneBySlug('hotel-check-in')?.titleEn).toBe('Hotel check-in')
    expect(getSceneBySlug('missing')).toBeUndefined()
    expect(getPublishedScenes()).not.toBe(SCENE_CATALOG)
  })
})
