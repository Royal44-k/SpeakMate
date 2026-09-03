import { describe, expect, it, vi } from 'vitest'

import { browserTts, normalizeSpeechRate, selectEnglishVoice } from './browser-tts'

describe('browser TTS helpers', () => {
  it('only allows the three approved speech rates', () => {
    expect(normalizeSpeechRate(0.81)).toBe(0.8)
    expect(normalizeSpeechRate(1.1)).toBe(1.15)
  })

  it('prefers the requested English locale then any English voice', () => {
    const voices = [
      { lang: 'zh-CN', name: 'Mandarin' },
      { lang: 'en-US', name: 'US English' },
      { lang: 'en-GB', name: 'UK English' },
    ] as SpeechSynthesisVoice[]
    expect(selectEnglishVoice(voices, 'en-GB')?.name).toBe('UK English')
    expect(selectEnglishVoice(voices, 'en-AU')?.name).toBe('US English')
  })

  it('cancels any current playback before recording or route exit', () => {
    const cancel = vi.fn()
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { cancel },
    })
    browserTts.stop()
    expect(cancel).toHaveBeenCalledOnce()
  })
})
