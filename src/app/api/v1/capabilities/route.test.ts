import { afterEach, describe, expect, it, vi } from 'vitest'

import { GET } from './route'

describe('GET /api/v1/capabilities', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('reports all remote learning capabilities disabled despite leftover env values', async () => {
    vi.stubEnv('AI_MODE', 'cloudflare')
    vi.stubEnv('AI_SHARED_RATE_LIMIT_READY', 'true')
    vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', 'old-account')
    vi.stubEnv('CLOUDFLARE_API_TOKEN', 'old-token')
    vi.stubEnv('NEXT_PUBLIC_SYNC_ENABLED', 'true')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'old-key')

    await expect(GET().json()).resolves.toMatchObject({
      cloudAsr: false,
      cloudConversation: false,
      emailSync: false,
      textFallback: true,
    })
  })
})
