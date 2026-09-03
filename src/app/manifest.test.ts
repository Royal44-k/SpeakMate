import { describe, expect, it } from 'vitest'

import manifest from './manifest'

describe('PWA manifest', () => {
  it('declares a standalone portrait app with fast practice shortcuts', () => {
    const value = manifest()

    expect(value.display).toBe('standalone')
    expect(value.orientation).toBe('portrait')
    expect(value.start_url).toBe('/practice')
    expect(value.shortcuts?.map((item) => item.url)).toEqual([
      '/practice',
      '/scenes',
    ])
    expect(value.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: '192x192' }),
        expect.objectContaining({ sizes: '512x512', purpose: 'maskable' }),
      ]),
    )
  })
})
