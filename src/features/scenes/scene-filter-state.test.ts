import { describe, expect, it } from 'vitest'

import {
  parseSceneFilterState,
  serializeSceneFilterState,
} from './scene-filter-state'

describe('scene filter state', () => {
  it('uses a saved B1 level when the URL has no level', () => {
    expect(parseSceneFilterState(new URLSearchParams(), 'B1')).toEqual({
      search: '',
      category: 'all',
      level: 'B1',
      duration: 'all',
    })
  })

  it('normalizes invalid public parameters without throwing', () => {
    const state = parseSceneFilterState(
      new URLSearchParams('q=hotel&category=wrong&level=Z9&duration=99'),
      'B2',
    )

    expect(state).toEqual({
      search: 'hotel',
      category: 'all',
      level: 'B2',
      duration: 'all',
    })
  })

  it('serializes only meaningful values in a stable order', () => {
    expect(
      serializeSceneFilterState({
        search: '',
        category: 'social',
        level: 'B1',
        duration: 5,
      }),
    ).toBe('category=social&level=B1&duration=5')
  })
})
