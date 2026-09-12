import { afterEach, describe, expect, it, vi } from 'vitest'

import manifest from './manifest'

describe('PWA manifest', () => {
  afterEach(() => vi.unstubAllEnvs())
  it('keeps recovery relaunch and shortcuts out of ordinary learning entries', () => {
    vi.stubEnv('NEXT_PUBLIC_RECOVERY_ONLY', 'true')
    expect(manifest().start_url).toBe('/recovery')
    expect(manifest().shortcuts).toEqual([])
  })
  it('declares a standalone portrait app with fast practice shortcuts', () => {
    const value = manifest()

    expect(value.display).toBe('standalone')
    expect(value.orientation).toBe('portrait-primary')
    expect(value.start_url).toBe('/')
    expect(value.shortcuts?.map((item) => item.url)).toEqual([
      '/practice/today',
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
