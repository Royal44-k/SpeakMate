import { describe, expect, it } from 'vitest'

import { favoriteIdFor } from './session-report'

describe('favoriteIdFor', () => {
  it('uses a stable identity so repeated taps cannot create duplicate favorites', () => {
    expect(favoriteIdFor('session-1', 'Could I check in early?')).toBe(
      favoriteIdFor('session-1', 'Could I check in early?'),
    )
    expect(favoriteIdFor('session-1', 'Could I check in early?')).not.toBe(
      favoriteIdFor('session-1', 'May I see your passport?'),
    )
  })
})
