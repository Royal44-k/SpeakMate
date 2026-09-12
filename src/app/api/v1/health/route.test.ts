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
      version: '3.0.0',
      mode: 'local-learning',
      buildSha: 'a668452-rele',
    })
  })
  it('labels the compiled recovery configuration without claiming a learning service', async () => {
    vi.stubEnv('NEXT_PUBLIC_RECOVERY_ONLY', 'true')
    expect(await GET().json()).toMatchObject({
      version: '3.0.0',
      mode: 'recovery-readonly',
      aiMode: 'local',
    })
  })
})
