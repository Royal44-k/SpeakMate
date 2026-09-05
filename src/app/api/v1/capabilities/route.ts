import { NextResponse } from 'next/server'

import { MAX_AUDIO_BYTES } from '@/infrastructure/audio/browser-recorder'
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
    cloudAsr: Boolean(resolved.cloudflare && resolved.mode !== 'local'),
    cloudConversation: Boolean(
      resolved.cloudflare && resolved.mode !== 'local',
    ),
    emailSync: Boolean(
      process.env.NEXT_PUBLIC_SYNC_ENABLED === 'true' &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    maxAudioBytes: MAX_AUDIO_BYTES,
    textFallback: true,
  })
}
