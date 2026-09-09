import { afterEach, describe, expect, it, vi } from 'vitest'

import { browserTts, normalizeSpeechRate, selectEnglishVoice } from './browser-tts'

describe('browser TTS helpers', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('only allows the three approved speech rates', () => {
    expect(normalizeSpeechRate(0.81)).toBe(0.8)
    expect(normalizeSpeechRate(1.1)).toBe(1.15)
  })

  it('prefers the requested English locale then any English voice', () => {
    const voices = [
      { lang: 'zh-CN', name: 'Mandarin', localService: true },
      { lang: 'en-US', name: 'Remote US English', localService: false },
      { lang: 'en-US', name: 'US English', localService: true },
      { lang: 'en-GB', name: 'UK English', localService: true },
    ] as SpeechSynthesisVoice[]
    expect(selectEnglishVoice(voices, 'en-GB')?.name).toBe('UK English')
    expect(selectEnglishVoice(voices, 'en-AU')?.name).toBe('US English')
  })

  it('does not invoke the browser default voice when no local English voice exists', async () => {
    const speak = vi.fn()
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        cancel: vi.fn(),
        getVoices: () => [
          { lang: 'en-US', name: 'Remote English', localService: false },
          { lang: 'zh-CN', name: 'Local Mandarin', localService: true },
        ],
        speak,
      },
    })

    await expect(browserTts.speak('Hello')).rejects.toThrow(
      'LOCAL_ENGLISH_VOICE_UNAVAILABLE',
    )
    expect(speak).not.toHaveBeenCalled()
  })

  it('waits for voiceschanged before reporting that no local voice exists', async () => {
    let voices: SpeechSynthesisVoice[] = [
      {
        lang: 'en-US',
        name: 'Remote English',
        localService: false,
      } as SpeechSynthesisVoice,
    ]
    const localVoice = {
      lang: 'en-US',
      name: 'Device English',
      localService: true,
    } as SpeechSynthesisVoice
    const synth = new EventTarget() as EventTarget & SpeechSynthesis
    synth.cancel = vi.fn()
    synth.getVoices = () => voices
    const speak = vi.fn((utterance: SpeechSynthesisUtterance) => {
      queueMicrotask(() => utterance.dispatchEvent(new Event('end')))
    })
    synth.speak = speak
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: synth,
    })
    class Utterance extends EventTarget {
      lang = ''
      rate = 1
      voice: SpeechSynthesisVoice | null = null
      constructor(readonly text: string) {
        super()
      }
    }
    vi.stubGlobal('SpeechSynthesisUtterance', Utterance)

    const pending = browserTts.speak('Hello')
    voices = [localVoice]
    synth.dispatchEvent(new Event('voiceschanged'))
    await pending

    expect(speak).toHaveBeenCalledOnce()
    expect(speak.mock.calls[0][0].voice).toBe(localVoice)
  })

  it('does not start late playback after stop cancels voice discovery', async () => {
    let voices: SpeechSynthesisVoice[] = []
    const synth = new EventTarget() as EventTarget & SpeechSynthesis
    synth.cancel = vi.fn()
    synth.getVoices = () => voices
    synth.speak = vi.fn((utterance: SpeechSynthesisUtterance) => {
      queueMicrotask(() => utterance.dispatchEvent(new Event('end')))
    })
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: synth,
    })
    class Utterance extends EventTarget {
      lang = ''
      rate = 1
      voice: SpeechSynthesisVoice | null = null
      constructor(readonly text: string) {
        super()
      }
    }
    vi.stubGlobal('SpeechSynthesisUtterance', Utterance)

    const pending = browserTts.speak('Hello')
    browserTts.stop()
    voices = [
      {
        lang: 'en-US',
        name: 'Device English',
        localService: true,
      } as SpeechSynthesisVoice,
    ]
    synth.dispatchEvent(new Event('voiceschanged'))
    await pending

    expect(synth.speak).not.toHaveBeenCalled()
  })

  it('settles active playback when stop cancels the utterance', async () => {
    const localVoice = {
      lang: 'en-US',
      name: 'Device English',
      localService: true,
    } as SpeechSynthesisVoice
    const synth = new EventTarget() as EventTarget & SpeechSynthesis
    synth.cancel = vi.fn()
    synth.getVoices = () => [localVoice]
    synth.speak = vi.fn()
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: synth,
    })
    class Utterance extends EventTarget {
      lang = ''
      rate = 1
      voice: SpeechSynthesisVoice | null = null
      constructor(readonly text: string) {
        super()
      }
    }
    vi.stubGlobal('SpeechSynthesisUtterance', Utterance)

    let settled = false
    const pending = browserTts.speak('Hello').then(() => {
      settled = true
    })
    await Promise.resolve()
    browserTts.stop()
    await Promise.race([
      pending,
      new Promise<void>((resolve) => setTimeout(resolve, 25)),
    ])

    expect(synth.speak).toHaveBeenCalledOnce()
    expect(settled).toBe(true)
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
