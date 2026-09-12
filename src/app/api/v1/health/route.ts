import { NextResponse } from 'next/server'
import packageJson from '../../../../../package.json'

import { resolveAiEnvironment } from '@/infrastructure/ai/provider-factory'

export function GET() {
  const resolved = resolveAiEnvironment({
    AI_MODE: process.env.AI_MODE,
    AI_SHARED_RATE_LIMIT_READY: process.env.AI_SHARED_RATE_LIMIT_READY,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ASR_MODEL: process.env.CLOUDFLARE_ASR_MODEL,
    CLOUDFLARE_LLM_MODEL: process.env.CLOUDFLARE_LLM_MODEL,
  })
  return NextResponse.json({
    status: 'ok',
    version: packageJson.version,
    mode:
      process.env.NEXT_PUBLIC_RECOVERY_ONLY === 'true'
        ? 'recovery-readonly'
        : 'local-learning',
    aiMode: resolved.cloudflare ? resolved.mode : 'local',
    buildSha: (
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.SPEAKMATE_RELEASE_SHA ||
      'local'
    ).slice(0, 12),
  })
}
