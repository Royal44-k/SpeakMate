import { afterEach, describe, expect, it, vi } from 'vitest'

import { GET } from './route'

describe('GET /api/v1/health', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('reports the explicit release SHA for a manual production deployment', async () => {
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', '')
    vi.stubEnv('SPEAKMATE_RELEASE_SHA', 'a668452-release-candidate')

    const body = await GET().json()

    expect(body).toMatchObject({
      status: 'ok',
      version: '2.1.1',
      buildSha: 'a668452-rele',
    })
  })
})
