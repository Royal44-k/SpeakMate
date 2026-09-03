import { z } from 'zod'

import type { ConversationInput, ConversationResult } from '@/domain/ai/contracts'

import { buildConversationMessages } from './prompt-builder'

export const ALLOWED_ASR_MODELS = [
  '@cf/openai/whisper',
  '@cf/openai/whisper-large-v3-turbo',
] as const
export const ALLOWED_LLM_MODELS = ['@cf/zai-org/glm-4.7-flash'] as const
const ALLOWED_MODELS = new Set<string>([...ALLOWED_ASR_MODELS, ...ALLOWED_LLM_MODELS])

export interface CloudflareAiConfig {
  accountId: string
  apiToken: string
  asrModel: (typeof ALLOWED_ASR_MODELS)[number]
  llmModel: (typeof ALLOWED_LLM_MODELS)[number]
}

export class CloudflareAiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly retryable = true,
  ) {
    super(message)
    this.name = 'CloudflareAiError'
  }
}

const conversationPayloadSchema = z.object({
  reply: z.object({
    text: z.string().min(1).max(800),
    hintZh: z.string().min(1).max(240),
    emotion: z.enum(['neutral', 'warm', 'firm', 'curious']),
  }),
  feedback: z.object({
    heard: z.string().max(500),
    corrected: z.string().max(500).nullable(),
    naturalAlternative: z.string().max(500).nullable(),
    explanationZh: z.string().min(1).max(500),
    issueTags: z.array(z.enum(['grammar', 'vocabulary', 'register', 'clarity', 'strategy'])).max(2),
  }),
  progress: z.object({
    completedGoalIds: z.array(z.string().max(100)),
    shouldOfferCompletion: z.boolean(),
  }),
})

export function assertAllowedModel(model: string): void {
  if (!ALLOWED_MODELS.has(model)) {
    throw new Error(`Model is not allowed in zero-billing mode: ${model}`)
  }
}

function endpoint(config: CloudflareAiConfig, model: string) {
  assertAllowedModel(model)
  return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(config.accountId)}/ai/run/${model}`
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  fetchImpl: typeof fetch,
  externalSignal?: AbortSignal,
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(new DOMException('Timed out', 'TimeoutError')), timeoutMs)
  const abort = () => controller.abort(externalSignal?.reason)
  externalSignal?.addEventListener('abort', abort, { once: true })
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal })
  } catch (error) {
    if (controller.signal.aborted) throw new CloudflareAiError('Cloudflare AI request timed out', undefined, true)
    throw error
  } finally {
    clearTimeout(timeout)
    externalSignal?.removeEventListener('abort', abort)
  }
}

async function parseEnvelope(response: Response) {
  if (!response.ok) {
    throw new CloudflareAiError(`Cloudflare AI returned ${response.status}`, response.status, response.status === 429 || response.status >= 500)
  }
  const body = await response.json() as { success?: boolean; result?: unknown; errors?: unknown }
  if (body.success === false || body.result === undefined) {
    throw new CloudflareAiError('Cloudflare AI returned an invalid envelope')
  }
  return body.result
}

export async function transcribeWithCloudflare(
  audio: Blob,
  config: CloudflareAiConfig,
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<string> {
  assertAllowedModel(config.asrModel)
  const response = await fetchWithTimeout(
    endpoint(config, config.asrModel),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        'Content-Type': audio.type || 'application/octet-stream',
      },
      body: audio,
    },
    12_000,
    fetchImpl,
    signal,
  )
  const result = await parseEnvelope(response) as { text?: unknown }
  if (typeof result.text !== 'string' || !result.text.trim()) {
    throw new CloudflareAiError('Cloudflare ASR returned no speech')
  }
  return result.text.trim().slice(0, 500)
}

function extractCompletion(result: unknown): string {
  if (typeof result === 'object' && result !== null) {
    const candidate = result as {
      response?: unknown
      choices?: Array<{ message?: { content?: unknown } }>
    }
    if (typeof candidate.response === 'string') return candidate.response
    const content = candidate.choices?.[0]?.message?.content
    if (typeof content === 'string') return content
  }
  throw new CloudflareAiError('Cloudflare LLM returned malformed output')
}

export async function generateWithCloudflare(
  input: ConversationInput,
  config: CloudflareAiConfig,
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<ConversationResult> {
  assertAllowedModel(config.llmModel)
  const baseMessages = buildConversationMessages(input)
  async function requestCompletion(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>) {
    const response = await fetchWithTimeout(
      endpoint(config, config.llmModel),
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          max_tokens: 420,
          response_format: { type: 'json_object' },
        }),
      },
      15_000,
      fetchImpl,
      signal,
    )
    return extractCompletion(await parseEnvelope(response))
  }

  function parsePayload(raw: string) {
    return conversationPayloadSchema.parse(JSON.parse(raw))
  }

  const firstRaw = await requestCompletion(baseMessages)
  let payload: z.infer<typeof conversationPayloadSchema>
  try {
    payload = parsePayload(firstRaw)
  } catch {
    const repairedRaw = await requestCompletion([
      ...baseMessages,
      { role: 'assistant', content: firstRaw.slice(0, 1_500) },
      { role: 'user', content: 'The previous response did not match the required JSON contract. Return one corrected JSON object only.' },
    ])
    try {
      payload = parsePayload(repairedRaw)
    } catch {
      throw new CloudflareAiError('Cloudflare LLM returned invalid structured output')
    }
  }
  const knownGoals = new Set(input.scene.goals.map((goal) => goal.id))
  return {
    ...payload,
    progress: {
      ...payload.progress,
      completedGoalIds: payload.progress.completedGoalIds.filter((id) => knownGoals.has(id)),
    },
    provider: 'cloudflare',
    degraded: false,
  }
}
