import { describe, expect, it } from 'vitest'

import { POST } from './route'

function sessionInput() {
  return JSON.stringify({
    sceneId: 'travel-01',
    sceneVersion: 1,
    level: 'B1',
    turnIndex: 0,
    recentTurns: [],
    completedGoalIds: [],
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
    form.set('audio', new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'turn.webm', { type: 'audio/webm' }))
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
})
