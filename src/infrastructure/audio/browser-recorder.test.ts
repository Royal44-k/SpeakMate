import { describe, expect, it } from 'vitest'

import {
  MAX_AUDIO_BYTES,
  MAX_RECORDING_MS,
  MIN_RECORDING_MS,
  selectSupportedMimeType,
  validateRecording,
} from './browser-recorder'

describe('browser recorder guards', () => {
  it('selects the first browser-supported compact audio format', () => {
    const supported = new Set(['audio/webm;codecs=opus', 'audio/mp4'])
    expect(selectSupportedMimeType((type) => supported.has(type))).toBe('audio/webm;codecs=opus')
  })

  it('enforces the 0.8 second, 30 second and 2 MB boundaries', () => {
    expect(validateRecording({ durationMs: MIN_RECORDING_MS - 1, size: 1_000 })).toMatchObject({ code: 'TOO_SHORT' })
    expect(validateRecording({ durationMs: MAX_RECORDING_MS + 1, size: 1_000 })).toMatchObject({ code: 'TOO_LONG' })
    expect(validateRecording({ durationMs: 1_000, size: MAX_AUDIO_BYTES + 1 })).toMatchObject({ code: 'TOO_LARGE' })
    expect(validateRecording({ durationMs: 1_000, size: 10_000 })).toEqual({ ok: true })
  })

  it('does not submit a silent recording', () => {
    expect(validateRecording({ durationMs: 1_200, size: 10_000, peakAmplitude: 0.004 })).toMatchObject({ code: 'NO_SPEECH' })
  })
})
