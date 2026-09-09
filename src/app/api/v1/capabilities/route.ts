import { NextResponse } from 'next/server'

import { MAX_AUDIO_BYTES } from '@/infrastructure/audio/browser-recorder'

export function GET() {
  return NextResponse.json({
    cloudAsr: false,
    cloudConversation: false,
    emailSync: false,
    maxAudioBytes: MAX_AUDIO_BYTES,
    textFallback: true,
  })
}
