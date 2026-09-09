import { describe, expect, it } from 'vitest'
import { SCENE_CATALOG } from '@/content/scenes/catalog'
import { searchScenes } from './search-scenes'

describe('scene search', () => {
  it.each([
    ['拿铁', 'coffee-order'],
    ['机场 托运', 'airport-check-in'],
    ['海关', 'immigration-interview'],
    ['转机', 'flight-connection'],
    ['学校 教授', 'office-hours'],
    ['ＣＯＦＦＥＥ', 'coffee-order'],
    ['cofee', 'coffee-order'],
    ['oat milk', 'coffee-order'],
  ])(
    'finds %s with multilingual terms, aliases and spelling tolerance',
    (query, slug) => {
      expect(
        searchScenes(SCENE_CATALOG, query).map((scene) => scene.slug),
      ).toContain(slug)
    },
  )
  it('returns no irrelevant scenes and restores the full catalogue on clear', () => {
    expect(searchScenes(SCENE_CATALOG, '火星飞船')).toHaveLength(0)
    expect(searchScenes(SCENE_CATALOG, '  ')).toHaveLength(42)
  })
})
