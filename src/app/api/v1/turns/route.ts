import { NextResponse } from 'next/server'
import { z } from 'zod'

import { SCENE_CATALOG } from '@/content/scenes/catalog'
import { adaptScene } from '@/domain/scenes/adapt-scene'
import { MAX_AUDIO_BYTES } from '@/infrastructure/audio/browser-recorder'
import { transcribeWithCloudflare } from '@/infrastructure/ai/cloudflare-client'
import {
  createConversationProvider,
  resolveAiEnvironment,
  type AiEnvironment,
} from '@/infrastructure/ai/provider-factory'

export const runtime = 'nodejs'

const sessionSchema = z.object({
  sceneId: z.string().min(1).max(100),
  sceneVersion: z.number().int().positive(),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']),
  turnIndex: z.number().int().min(0).max(100),
  recentTurns: z.array(z.object({
    speaker: z.enum(['ai', 'learner']),
    text: z.string().max(500),
  })).max(8),
  completedGoalIds: z.array(z.string().max(100)).max(20),
})

const idempotencySchema = z.string().uuid()
const supportedAudioTypes = new Set([
  'audio/webm',
  'audio/mp4',
  'audio/ogg',
  'audio/mpeg',
  'audio/wav',
  'application/octet-stream',
])
const successCache = new Map<string, unknown>()
const rateBuckets = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 20
const RATE_WINDOW_MS = 60_000

function isBlobLike(value: FormDataEntryValue | null): value is File {
  return typeof value === 'object' && value !== null &&
    typeof (value as Blob).size === 'number' &&
    typeof (value as Blob).arrayBuffer === 'function'
}

function requestId() {
  return `req_${globalThis.crypto.randomUUID()}`
}

function requestIsSameOrigin(request: Request): boolean {
  const fetchSite = request.headers?.get?.('sec-fetch-site')
  if (fetchSite === 'cross-site') return false
  const origin = request.headers?.get?.('origin')
  if (!origin || !request.url) return true
  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}

function rateLimitExceeded(request: Request): boolean {
  const forwarded = request.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim()
  if (!forwarded) return false
  const now = Date.now()
  const current = rateBuckets.get(forwarded)
  if (!current || current.resetAt <= now) {
    rateBuckets.set(forwarded, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  current.count += 1
  return current.count > RATE_LIMIT
}

function currentAiEnvironment(): AiEnvironment {
  return {
    AI_MODE: process.env.AI_MODE,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ASR_MODEL: process.env.CLOUDFLARE_ASR_MODEL,
    CLOUDFLARE_LLM_MODEL: process.env.CLOUDFLARE_LLM_MODEL,
  }
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  id: string,
  retryable = false,
) {
  return NextResponse.json({
    code,
    message,
    requestId: id,
    retryable,
    fallbackAvailable: true,
  }, { status })
}

export async function POST(request: Request) {
  const startedAt = performance.now()
  const id = requestId()
  if (!requestIsSameOrigin(request)) {
    return errorResponse(403, 'CROSS_SITE_REQUEST', '请求来源不受信任。', id)
  }
  if (rateLimitExceeded(request)) {
    return errorResponse(429, 'RATE_LIMITED', '请求过于频繁，请稍后再试。', id, true)
  }
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return errorResponse(400, 'INVALID_INPUT', '请求格式不正确。', id)
  }

  const audioValue = form.get('audio')
  const audio = isBlobLike(audioValue) && audioValue.size > 0 ? audioValue : undefined
  let transcript = typeof form.get('transcript') === 'string'
    ? String(form.get('transcript')).trim().slice(0, 501)
    : ''
  const rawSession = form.get('session')
  const rawIdempotencyKey = form.get('idempotencyKey')

  if (!audio && !transcript) {
    return errorResponse(400, 'INVALID_INPUT', '请录音，或输入一句英文后再提交。', id)
  }
  if (transcript.length > 500) {
    return errorResponse(400, 'INVALID_INPUT', '本轮文字不能超过 500 个字符。', id)
  }
  if (audio && audio.size > MAX_AUDIO_BYTES) {
    return errorResponse(413, 'AUDIO_TOO_LARGE', '录音超过 2 MB，请缩短后重试。', id)
  }
  if (audio && audio.type && !supportedAudioTypes.has(audio.type.split(';')[0])) {
    return errorResponse(415, 'UNSUPPORTED_AUDIO', '当前录音格式不受支持，请改用键盘输入。', id)
  }

  let parsedSession: z.infer<typeof sessionSchema>
  let idempotencyKey: string
  try {
    if (typeof rawSession !== 'string') throw new Error('missing session')
    parsedSession = sessionSchema.parse(JSON.parse(rawSession))
    idempotencyKey = idempotencySchema.parse(rawIdempotencyKey)
  } catch {
    return errorResponse(400, 'INVALID_INPUT', '会话信息不完整，请刷新后重试。', id)
  }

  const cached = successCache.get(idempotencyKey)
  if (cached) return NextResponse.json(cached)

  const definition = SCENE_CATALOG.find((scene) =>
    scene.id === parsedSession.sceneId && scene.version === parsedSession.sceneVersion,
  )
  if (!definition) {
    return errorResponse(400, 'INVALID_INPUT', '场景版本不存在，请返回场景库重新进入。', id)
  }
  if (parsedSession.turnIndex >= definition.recommendedTurns) {
    return errorResponse(400, 'TURN_LIMIT_REACHED', '本场景已达到建议轮数，请先完成复盘。', id)
  }
  const scene = adaptScene(definition, parsedSession.level)
  const env = currentAiEnvironment()
  const resolved = resolveAiEnvironment(env)

  if (resolved.mode === 'cloudflare' && resolved.configurationError) {
    return errorResponse(503, 'AI_CONFIGURATION_ERROR', '智能反馈配置暂时不可用。', id, true)
  }

  if (!transcript && audio) {
    if (!resolved.cloudflare || resolved.mode === 'local') {
      return errorResponse(422, 'NO_SPEECH', '当前为基础反馈模式，请输入英文确认内容。', id)
    }
    try {
      transcript = await transcribeWithCloudflare(audio, resolved.cloudflare)
    } catch {
      return errorResponse(503, 'AI_UNAVAILABLE', '暂时没有听清，请重试或改用键盘输入。', id, true)
    }
  }

  try {
    const provider = createConversationProvider(env)
    const result = await provider.nextTurn({
      scene,
      learnerText: transcript,
      history: parsedSession.recentTurns,
      completedGoalIds: parsedSession.completedGoalIds,
      turnIndex: parsedSession.turnIndex,
    })
    const responseBody = {
      ...result,
      requestId: id,
      latencyMs: Math.round(performance.now() - startedAt),
    }
    successCache.set(idempotencyKey, responseBody)
    if (successCache.size > 100) successCache.delete(successCache.keys().next().value!)
    return NextResponse.json(responseBody)
  } catch {
    return errorResponse(503, 'AI_UNAVAILABLE', '智能反馈暂时不可用，请稍后重试。', id, true)
  }
}
