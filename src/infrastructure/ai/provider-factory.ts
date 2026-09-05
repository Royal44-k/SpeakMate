import type { ConversationProvider } from '@/domain/ai/contracts'
import { localCoach } from '@/domain/ai/local-coach'

import {
  ALLOWED_ASR_MODELS,
  ALLOWED_LLM_MODELS,
  generateWithCloudflare,
  type CloudflareAiConfig,
} from './cloudflare-client'

export type AiMode = 'local' | 'cloudflare' | 'auto'

export interface AiEnvironment {
  AI_MODE?: string
  AI_SHARED_RATE_LIMIT_READY?: string
  CLOUDFLARE_ACCOUNT_ID?: string
  CLOUDFLARE_API_TOKEN?: string
  CLOUDFLARE_ASR_MODEL?: string
  CLOUDFLARE_LLM_MODEL?: string
}

export interface ResolvedAiEnvironment {
  mode: AiMode
  cloudflare?: CloudflareAiConfig
  configurationError?: string
}

export function resolveAiEnvironment(
  env: AiEnvironment,
): ResolvedAiEnvironment {
  const mode: AiMode = ['local', 'cloudflare', 'auto'].includes(
    env.AI_MODE ?? '',
  )
    ? (env.AI_MODE as AiMode)
    : 'auto'
  if (mode === 'local') return { mode: 'local' }
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) {
    return mode === 'cloudflare'
      ? { mode, configurationError: 'Cloudflare AI credentials are missing' }
      : { mode: 'local' }
  }
  if (env.AI_SHARED_RATE_LIMIT_READY !== 'true') {
    const configurationError =
      'Cloud AI requires a shared or platform-level quota guard'
    return mode === 'cloudflare'
      ? { mode, configurationError }
      : { mode: 'local', configurationError }
  }
  const asrModel = env.CLOUDFLARE_ASR_MODEL ?? ALLOWED_ASR_MODELS[0]
  const llmModel = env.CLOUDFLARE_LLM_MODEL ?? ALLOWED_LLM_MODELS[0]
  const asrAllowed = ALLOWED_ASR_MODELS.includes(
    asrModel as (typeof ALLOWED_ASR_MODELS)[number],
  )
  const llmAllowed = ALLOWED_LLM_MODELS.includes(
    llmModel as (typeof ALLOWED_LLM_MODELS)[number],
  )
  if (!asrAllowed || !llmAllowed) {
    const invalidModel = !asrAllowed ? asrModel : llmModel
    const configurationError = `Model is not allowed in zero-billing mode: ${invalidModel}`
    return mode === 'auto'
      ? { mode: 'local', configurationError }
      : { mode: 'cloudflare', configurationError }
  }
  return {
    mode,
    cloudflare: {
      accountId: env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: env.CLOUDFLARE_API_TOKEN,
      asrModel: asrModel as CloudflareAiConfig['asrModel'],
      llmModel: llmModel as CloudflareAiConfig['llmModel'],
    },
  }
}

export function createConversationProvider(
  env: AiEnvironment,
  fetchImpl: typeof fetch = fetch,
): ConversationProvider {
  const resolved = resolveAiEnvironment(env)
  if (resolved.mode === 'local' || !resolved.cloudflare) {
    if (resolved.mode === 'cloudflare') {
      return {
        kind: 'cloudflare',
        async nextTurn() {
          throw new Error(
            resolved.configurationError ?? 'Cloudflare AI is not configured',
          )
        },
      }
    }
    return localCoach
  }

  return {
    kind: 'cloudflare',
    async nextTurn(input, signal) {
      try {
        return await generateWithCloudflare(
          input,
          resolved.cloudflare!,
          fetchImpl,
          signal,
        )
      } catch (error) {
        if (resolved.mode === 'auto') return localCoach.nextTurn(input, signal)
        throw error
      }
    },
  }
}
