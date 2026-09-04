import { describe, expect, it, vi } from 'vitest'

import { getSceneBySlug } from '@/content/scenes/catalog'
import { adaptScene } from '@/domain/scenes/adapt-scene'

import { assertAllowedModel } from './cloudflare-client'
import { createConversationProvider, resolveAiEnvironment } from './provider-factory'

const hotel = adaptScene(getSceneBySlug('hotel-check-in')!, 'B1')

describe('createConversationProvider', () => {
  it('selects local mode when zero-billing credentials are absent', () => {
    expect(createConversationProvider({ AI_MODE: 'auto' }).kind).toBe('local')
  })

  it('does not validate unused cloud models in explicit local mode', () => {
    expect(resolveAiEnvironment({
      AI_MODE: 'local',
      CLOUDFLARE_ACCOUNT_ID: 'account',
      CLOUDFLARE_API_TOKEN: 'secret',
      CLOUDFLARE_ASR_MODEL: 'paid-or-unknown',
    })).toEqual({ mode: 'local' })
  })

  it('falls back safely when auto mode contains an invalid cloud model', () => {
    expect(resolveAiEnvironment({
      AI_MODE: 'auto',
      CLOUDFLARE_ACCOUNT_ID: 'account',
      CLOUDFLARE_API_TOKEN: 'secret',
      CLOUDFLARE_LLM_MODEL: 'paid-or-unknown',
    })).toMatchObject({ mode: 'local', configurationError: expect.any(String) })
  })

  it('refuses an unapproved paid or unknown model', () => {
    expect(() => assertAllowedModel('@cf/zai-org/glm-5.3')).toThrow(
      'Model is not allowed in zero-billing mode',
    )
  })

  it('falls back to the deterministic coach on a Cloudflare rate limit in auto mode', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('rate limited', { status: 429 }))
    const provider = createConversationProvider({
      AI_MODE: 'auto',
      CLOUDFLARE_ACCOUNT_ID: 'account',
      CLOUDFLARE_API_TOKEN: 'secret',
    }, fetchImpl)

    const result = await provider.nextTurn({
      scene: hotel,
      learnerText: 'I have a reservation under Chen.',
      history: [],
      completedGoalIds: [],
      turnIndex: 0,
    })

    expect(result.provider).toBe('local')
    expect(result.degraded).toBe(true)
  })

  it('repairs malformed structured output once before falling back', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      result: { response: 'not-json' },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const provider = createConversationProvider({
      AI_MODE: 'auto',
      CLOUDFLARE_ACCOUNT_ID: 'account',
      CLOUDFLARE_API_TOKEN: 'secret',
    }, fetchImpl)

    const result = await provider.nextTurn({
      scene: hotel,
      learnerText: 'I have a reservation under Chen.',
      history: [],
      completedGoalIds: [],
      turnIndex: 0,
    })

    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(result.provider).toBe('local')
  })

  it('returns validated Cloudflare output when the zero-billing model succeeds', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      result: { response: JSON.stringify({
        reply: { text: 'May I see your passport, please?', hintZh: '出示证件并确认预订。', emotion: 'warm' },
        feedback: { heard: 'I have a reservation.', corrected: null, naturalAlternative: null, explanationZh: '表达清楚。', issueTags: [] },
        progress: { completedGoalIds: [hotel.goals[0].id], shouldOfferCompletion: false },
      }) },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const provider = createConversationProvider({
      AI_MODE: 'auto',
      CLOUDFLARE_ACCOUNT_ID: 'account',
      CLOUDFLARE_API_TOKEN: 'secret',
    }, fetchImpl)

    const result = await provider.nextTurn({ scene: hotel, learnerText: 'I have a reservation.', history: [], completedGoalIds: [], turnIndex: 0 })

    expect(result).toMatchObject({ provider: 'cloudflare', degraded: false })
  })

  it('falls back after the 15 second LLM deadline', async () => {
    vi.useFakeTimers()
    const fetchImpl = vi.fn((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true })
    }))
    const provider = createConversationProvider({
      AI_MODE: 'auto',
      CLOUDFLARE_ACCOUNT_ID: 'account',
      CLOUDFLARE_API_TOKEN: 'secret',
    }, fetchImpl as typeof fetch)
    const pending = provider.nextTurn({ scene: hotel, learnerText: 'I have a reservation.', history: [], completedGoalIds: [], turnIndex: 0 })
    await vi.advanceTimersByTimeAsync(15_001)

    await expect(pending).resolves.toMatchObject({ provider: 'local', degraded: true })
    vi.useRealTimers()
  })
})
