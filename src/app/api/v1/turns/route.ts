import { NextResponse } from 'next/server'
import { z } from 'zod'

import { SCENE_CATALOG } from '@/content/scenes/catalog'
import { localCoach } from '@/domain/ai/local-coach'
import { adaptScene } from '@/domain/scenes/adapt-scene'
import type { AdaptedScene } from '@/domain/scenes/types'
import { MAX_AUDIO_BYTES } from '@/infrastructure/audio/browser-recorder'
import { transcribeWithCloudflare } from '@/infrastructure/ai/cloudflare-client'
import {
  createConversationProvider,
  resolveAiEnvironment,
  type AiEnvironment,
} from '@/infrastructure/ai/provider-factory'

export const runtime = 'nodejs'

const boundedText = (max: number) => z.string().trim().min(1).max(max)
const sceneSnapshotSchema = z
  .object({
    id: boundedText(100),
    slug: boundedText(100),
    version: z.number().int().positive(),
    category: z.enum([
      'travel',
      'dining',
      'daily',
      'work',
      'social',
      'study',
      'emergency',
    ]),
    titleZh: boundedText(100),
    titleEn: boundedText(120),
    summaryZh: boundedText(300),
    learnerRole: boundedText(160),
    aiRole: boundedText(160),
    estimatedMinutes: z.union([
      z.literal(3),
      z.literal(5),
      z.literal(8),
      z.literal(10),
    ]),
    recommendedTurns: z.number().int().min(1).max(20),
    goals: z
      .array(
        z
          .object({
            id: boundedText(100),
            labelZh: boundedText(160),
            completionSignal: boundedText(240),
            completionKeywords: z.array(boundedText(80)).min(1).max(12),
          })
          .strict(),
      )
      .min(1)
      .max(8),
    keywords: z.array(boundedText(80)).min(1).max(20),
    exampleExpressions: z.array(boundedText(300)).min(1).max(10),
    openingLines: z.array(boundedText(300)).min(1).max(6),
    constraints: z
      .object({
        minAiWords: z.number().int().min(1).max(80),
        maxAiWords: z.number().int().min(1).max(120),
        followUpStyle: boundedText(300),
        feedbackFocus: boundedText(300),
        strategy: boundedText(300),
        speechRate: z.number().min(0.5).max(1.5),
      })
      .strict(),
    safetyNote: z.string().trim().max(500).optional(),
    image: z
      .object({
        key: boundedText(100),
        altZh: boundedText(200),
        focalPoint: z.string().regex(/^\d{1,3}% \d{1,3}%$/),
      })
      .strict(),
    status: z.enum(['published', 'archived']),
    level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']),
  })
  .strict()

const sessionSchema = z.object({
  sceneId: z.string().min(1).max(100),
  sceneVersion: z.number().int().positive(),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']),
  turnIndex: z.number().int().min(0).max(100),
  recentTurns: z
    .array(
      z.object({
        speaker: z.enum(['ai', 'learner']),
        text: z.string().max(500),
      }),
    )
    .max(8),
  completedGoalIds: z.array(z.string().max(100)).max(20),
  sceneSnapshot: sceneSnapshotSchema.optional(),
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
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Blob).size === 'number' &&
    typeof (value as Blob).arrayBuffer === 'function'
  )
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
  const now = Date.now()
  if (rateBuckets.size > 500) {
    for (const [key, bucket] of rateBuckets) {
      if (bucket.resetAt <= now) rateBuckets.delete(key)
    }
  }
  const forwarded = request.headers
    ?.get?.('x-forwarded-for')
    ?.split(',')[0]
    ?.trim()
  const direct = request.headers?.get?.('x-real-ip')?.trim()
  const agent =
    request.headers?.get?.('user-agent')?.slice(0, 120) ?? 'unknown-client'
  const clientKey = forwarded || direct || `anonymous:${agent}`
  const current = rateBuckets.get(clientKey)
  if (!current || current.resetAt <= now) {
    rateBuckets.set(clientKey, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  current.count += 1
  return current.count > RATE_LIMIT
}

function currentAiEnvironment(): AiEnvironment {
  return {
    AI_MODE: process.env.AI_MODE,
    AI_SHARED_RATE_LIMIT_READY: process.env.AI_SHARED_RATE_LIMIT_READY,
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
  return NextResponse.json(
    {
      code,
      message,
      requestId: id,
      retryable,
      fallbackAvailable: true,
    },
    { status },
  )
}

export async function POST(request: Request) {
  const startedAt = performance.now()
  const id = requestId()
  if (!requestIsSameOrigin(request)) {
    return errorResponse(403, 'CROSS_SITE_REQUEST', '请求来源不受信任。', id)
  }
  if (rateLimitExceeded(request)) {
    return errorResponse(
      429,
      'RATE_LIMITED',
      '请求过于频繁，请稍后再试。',
      id,
      true,
    )
  }
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return errorResponse(400, 'INVALID_INPUT', '请求格式不正确。', id)
  }

  const audioValue = form.get('audio')
  const audio =
    isBlobLike(audioValue) && audioValue.size > 0 ? audioValue : undefined
  let transcript =
    typeof form.get('transcript') === 'string'
      ? String(form.get('transcript')).trim().slice(0, 501)
      : ''
  const rawSession = form.get('session')
  const rawIdempotencyKey = form.get('idempotencyKey')

  if (!audio && !transcript) {
    return errorResponse(
      400,
      'INVALID_INPUT',
      '请录音，或输入一句英文后再提交。',
      id,
    )
  }
  if (transcript.length > 500) {
    return errorResponse(
      400,
      'INVALID_INPUT',
      '本轮文字不能超过 500 个字符。',
      id,
    )
  }
  if (audio && audio.size > MAX_AUDIO_BYTES) {
    return errorResponse(
      413,
      'AUDIO_TOO_LARGE',
      '录音超过 2 MB，请缩短后重试。',
      id,
    )
  }
  if (
    audio &&
    audio.type &&
    !supportedAudioTypes.has(audio.type.split(';')[0])
  ) {
    return errorResponse(
      415,
      'UNSUPPORTED_AUDIO',
      '当前录音格式不受支持，请改用键盘输入。',
      id,
    )
  }

  let parsedSession: z.infer<typeof sessionSchema>
  let idempotencyKey: string
  try {
    if (typeof rawSession !== 'string' || rawSession.length > 50_000)
      throw new Error('missing or oversized session')
    parsedSession = sessionSchema.parse(JSON.parse(rawSession))
    idempotencyKey = idempotencySchema.parse(rawIdempotencyKey)
  } catch {
    return errorResponse(
      400,
      'INVALID_INPUT',
      '会话信息不完整，请刷新后重试。',
      id,
    )
  }

  const cached = successCache.get(idempotencyKey)
  if (cached) return NextResponse.json(cached)

  const definition = SCENE_CATALOG.find(
    (scene) =>
      scene.id === parsedSession.sceneId &&
      scene.version === parsedSession.sceneVersion,
  )
  const snapshot = parsedSession.sceneSnapshot as AdaptedScene | undefined
  const validSnapshot =
    snapshot &&
    snapshot.id === parsedSession.sceneId &&
    snapshot.version === parsedSession.sceneVersion &&
    snapshot.level === parsedSession.level
      ? snapshot
      : undefined
  if (!definition && !validSnapshot) {
    return errorResponse(
      400,
      'INVALID_INPUT',
      '场景版本不存在，请返回场景库重新进入。',
      id,
    )
  }
  const scene = definition
    ? adaptScene(definition, parsedSession.level)
    : validSnapshot!
  if (parsedSession.turnIndex >= scene.recommendedTurns) {
    return errorResponse(
      400,
      'TURN_LIMIT_REACHED',
      '本场景已达到建议轮数，请先完成复盘。',
      id,
    )
  }
  const validGoalIds = new Set(scene.goals.map((goal) => goal.id))
  const completedGoalIds = parsedSession.completedGoalIds.filter((goalId) =>
    validGoalIds.has(goalId),
  )
  const env = currentAiEnvironment()
  const resolved = resolveAiEnvironment(env)

  if (resolved.mode === 'cloudflare' && resolved.configurationError) {
    return errorResponse(
      503,
      'AI_CONFIGURATION_ERROR',
      '智能反馈配置暂时不可用。',
      id,
      true,
    )
  }

  if (!transcript && audio) {
    if (!resolved.cloudflare || resolved.mode === 'local') {
      return errorResponse(
        422,
        'NO_SPEECH',
        '当前为基础反馈模式，请输入英文确认内容。',
        id,
      )
    }
    try {
      transcript = await transcribeWithCloudflare(audio, resolved.cloudflare)
    } catch {
      return errorResponse(
        503,
        'AI_UNAVAILABLE',
        '暂时没有听清，请重试或改用键盘输入。',
        id,
        true,
      )
    }
  }

  try {
    const provider = definition ? createConversationProvider(env) : localCoach
    const result = await provider.nextTurn({
      scene,
      learnerText: transcript,
      history: parsedSession.recentTurns,
      completedGoalIds,
      turnIndex: parsedSession.turnIndex,
    })
    const responseBody = {
      ...result,
      requestId: id,
      latencyMs: Math.round(performance.now() - startedAt),
    }
    successCache.set(idempotencyKey, responseBody)
    if (successCache.size > 100)
      successCache.delete(successCache.keys().next().value!)
    return NextResponse.json(responseBody)
  } catch {
    return errorResponse(
      503,
      'AI_UNAVAILABLE',
      '智能反馈暂时不可用，请稍后重试。',
      id,
      true,
    )
  }
}
