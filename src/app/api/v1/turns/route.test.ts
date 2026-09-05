import { describe, expect, it } from 'vitest'

import { POST } from './route'

function sessionInput(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    sceneId: 'travel-01',
    sceneVersion: 1,
    level: 'B1',
    turnIndex: 0,
    recentTurns: [],
    completedGoalIds: [],
    ...overrides,
  })
}

function browserRequest(form: FormData, headers: Record<string, string> = {}) {
  return new Request('https://speakmate.test/api/v1/turns', {
    method: 'POST',
    body: form,
    headers,
  })
}

function requestWith(form: FormData) {
  return { formData: async () => form } as Request
}

describe('POST /api/v1/turns', () => {
  it('serves a valid text-only turn locally without cloud secrets', async () => {
    const form = new FormData()
    form.set('transcript', 'Hello, I have a reservation under Chen.')
    form.set('session', sessionInput())
    form.set('idempotencyKey', '2e908fa5-9bcc-44b9-aad3-347f92710a50')

    const response = await POST(requestWith(form))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.provider).toBe('local')
    expect(body.requestId).toMatch(/^req_/)
  })

  it('rejects audio larger than 2 MB before contacting a provider', async () => {
    const form = new FormData()
    form.set(
      'audio',
      new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'turn.webm', {
        type: 'audio/webm',
      }),
    )
    form.set('session', sessionInput())
    form.set('idempotencyKey', '5e88d4fc-51d0-4d20-babf-697276aab7fb')

    const response = await POST(requestWith(form))
    const body = await response.json()

    expect(response.status).toBe(413)
    expect(body.code).toBe('AUDIO_TOO_LARGE')
    expect(body.fallbackAvailable).toBe(true)
  })

  it('requires either audio or a confirmed transcript', async () => {
    const form = new FormData()
    form.set('session', sessionInput())
    form.set('idempotencyKey', '83e9b2a0-4b65-4a2e-8e16-2a1b29b6dcb9')

    const response = await POST(requestWith(form))
    expect(response.status).toBe(400)
  })

  it('rejects cross-site browser submissions', async () => {
    const form = new FormData()
    form.set('transcript', 'Hello.')
    form.set('session', sessionInput())
    form.set('idempotencyKey', '772870f9-6004-44b8-8464-8dbfdb160e93')

    const response = await POST(
      browserRequest(form, {
        Origin: 'https://attacker.example',
        'Sec-Fetch-Site': 'cross-site',
      }),
    )

    expect(response.status).toBe(403)
    expect((await response.json()).code).toBe('CROSS_SITE_REQUEST')
  })

  it('enforces the selected scene turn limit', async () => {
    const form = new FormData()
    form.set('transcript', 'Hello.')
    form.set('session', sessionInput({ turnIndex: 99 }))
    form.set('idempotencyKey', 'fa10f108-4ee5-4dcb-a99f-8bdcc352519e')

    const response = await POST(
      browserRequest(form, { Origin: 'https://speakmate.test' }),
    )

    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('TURN_LIMIT_REACHED')
  })

  it('drops client-supplied goal ids that do not belong to the scene version', async () => {
    const form = new FormData()
    form.set('transcript', 'I am still deciding what to say.')
    form.set('session', sessionInput({ completedGoalIds: ['fake-1', 'fake-2', 'fake-3'] }))
    form.set('idempotencyKey', 'f42d5758-3daf-49b8-8446-f4f43385c532')

    const response = await POST(browserRequest(form, { Origin: 'https://speakmate.test' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.progress.completedGoalIds).toEqual([])
    expect(body.progress.shouldOfferCompletion).toBe(false)
  })

  it('rate limits repeated submissions from one forwarded client address', async () => {
    let response: Response | undefined
    for (let index = 0; index <= 20; index += 1) {
      response = await POST(
        browserRequest(new FormData(), {
          Origin: 'https://speakmate.test',
          'X-Forwarded-For': '203.0.113.42',
        }),
      )
    }

    expect(response?.status).toBe(429)
    expect(await response?.json()).toMatchObject({
      code: 'RATE_LIMITED',
      retryable: true,
    })
  })

  it('does not bypass the best-effort limiter when proxy IP headers are absent', async () => {
    let response: Response | undefined
    for (let index = 0; index <= 20; index += 1) {
      response = await POST(
        browserRequest(new FormData(), {
          Origin: 'https://speakmate.test',
          'User-Agent': 'no-forwarded-address-test',
        }),
      )
    }

    expect(response?.status).toBe(429)
  })
})
