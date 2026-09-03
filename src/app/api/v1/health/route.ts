import { NextResponse } from 'next/server'

import { resolveAiEnvironment } from '@/infrastructure/ai/provider-factory'

export function GET() {
  const resolved = resolveAiEnvironment({
    AI_MODE: process.env.AI_MODE,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ASR_MODEL: process.env.CLOUDFLARE_ASR_MODEL,
    CLOUDFLARE_LLM_MODEL: process.env.CLOUDFLARE_LLM_MODEL,
  })
  return NextResponse.json({
    status: 'ok',
    version: '2.0.0',
    aiMode: resolved.cloudflare ? resolved.mode : 'local',
    buildSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? 'local',
  })
}
