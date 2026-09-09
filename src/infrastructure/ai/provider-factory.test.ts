import { describe, expect, it, vi } from 'vitest'

import { getSceneBySlug } from '@/content/scenes/catalog'
import { adaptScene } from '@/domain/scenes/adapt-scene'

import { assertAllowedModel } from './cloudflare-client'
import {
  createConversationProvider,
  resolveAiEnvironment,
} from './provider-factory'

const hotel = adaptScene(getSceneBySlug('hotel-check-in')!, 'B1')

describe('createConversationProvider', () => {
  it('selects local mode when zero-billing credentials are absent', () => {
    expect(createConversationProvider({ AI_MODE: 'auto' }).kind).toBe('local')
  })

  it('does not validate unused cloud models in explicit local mode', () => {
    expect(
      resolveAiEnvironment({
        AI_MODE: 'local',
        CLOUDFLARE_ACCOUNT_ID: 'account',
        CLOUDFLARE_API_TOKEN: 'secret',
        CLOUDFLARE_ASR_MODEL: 'paid-or-unknown',
      }),
    ).toEqual({ mode: 'local' })
  })

  it('ignores dormant cloud configuration including an invalid model', () => {
    expect(
      resolveAiEnvironment({
        AI_MODE: 'auto',
        CLOUDFLARE_ACCOUNT_ID: 'account',
        CLOUDFLARE_API_TOKEN: 'secret',
        CLOUDFLARE_LLM_MODEL: 'paid-or-unknown',
      }),
    ).toEqual({ mode: 'local' })
  })

  it('keeps cloud AI disabled when stale credentials remain', () => {
    expect(
      resolveAiEnvironment({
        AI_MODE: 'auto',
        CLOUDFLARE_ACCOUNT_ID: 'account',
        CLOUDFLARE_API_TOKEN: 'secret',
      }),
    ).toEqual({ mode: 'local' })
  })

  it('refuses an unapproved paid or unknown model', () => {
    expect(() => assertAllowedModel('@cf/zai-org/glm-5.3')).toThrow(
      'Model is not allowed in zero-billing mode',
    )
  })

  it('does not contact Cloudflare when an auto-mode adapter would rate limit', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response('rate limited', { status: 429 }))
    const provider = createConversationProvider(
      {
        AI_MODE: 'auto',
        CLOUDFLARE_ACCOUNT_ID: 'account',
        CLOUDFLARE_API_TOKEN: 'secret',
        AI_SHARED_RATE_LIMIT_READY: 'true',
      },
      fetchImpl,
    )

    const result = await provider.nextTurn({
      scene: hotel,
      learnerText: 'I have a reservation under Chen.',
      history: [],
      completedGoalIds: [],
      turnIndex: 0,
    })

    expect(result.provider).toBe('local')
    expect(result.degraded).toBe(true)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('does not contact a dormant adapter with malformed response fixtures', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          result: { response: 'not-json' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    const provider = createConversationProvider(
      {
        AI_MODE: 'auto',
        CLOUDFLARE_ACCOUNT_ID: 'account',
        CLOUDFLARE_API_TOKEN: 'secret',
        AI_SHARED_RATE_LIMIT_READY: 'true',
      },
      fetchImpl,
    )

    const result = await provider.nextTurn({
      scene: hotel,
      learnerText: 'I have a reservation under Chen.',
      history: [],
      completedGoalIds: [],
      turnIndex: 0,
    })

    expect(fetchImpl).not.toHaveBeenCalled()
    expect(result.provider).toBe('local')
  })

  it('stays local even when the dormant adapter could return valid output', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          result: {
            response: JSON.stringify({
              reply: {
                text: 'May I see your passport, please?',
                hintZh: '出示证件并确认预订。',
                emotion: 'warm',
              },
              feedback: {
                heard: 'I have a reservation.',
                corrected: null,
                naturalAlternative: null,
                explanationZh: '表达清楚。',
                issueTags: [],
              },
              progress: {
                completedGoalIds: [hotel.goals[0].id],
                shouldOfferCompletion: false,
              },
            }),
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    const provider = createConversationProvider(
      {
        AI_MODE: 'auto',
        CLOUDFLARE_ACCOUNT_ID: 'account',
        CLOUDFLARE_API_TOKEN: 'secret',
        AI_SHARED_RATE_LIMIT_READY: 'true',
      },
      fetchImpl,
    )

    const result = await provider.nextTurn({
      scene: hotel,
      learnerText: 'I have a reservation.',
      history: [],
      completedGoalIds: [],
      turnIndex: 0,
    })

    expect(result).toMatchObject({ provider: 'local', degraded: true })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('returns locally without starting a remote deadline', async () => {
    const fetchImpl = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(init.signal?.reason),
            { once: true },
          )
        }),
    )
    const provider = createConversationProvider(
      {
        AI_MODE: 'auto',
        CLOUDFLARE_ACCOUNT_ID: 'account',
        CLOUDFLARE_API_TOKEN: 'secret',
        AI_SHARED_RATE_LIMIT_READY: 'true',
      },
      fetchImpl as typeof fetch,
    )
    const result = await provider.nextTurn({
      scene: hotel,
      learnerText: 'I have a reservation.',
      history: [],
      completedGoalIds: [],
      turnIndex: 0,
    })
    expect(result).toMatchObject({
      provider: 'local',
      degraded: true,
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
