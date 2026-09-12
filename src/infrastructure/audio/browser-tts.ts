export type SpeechRate = 0.8 | 1 | 1.15

const SPEECH_RATES: SpeechRate[] = [0.8, 1, 1.15]
let speechGeneration = 0
let activePlayback: { generation: number; cancel: () => void } | undefined

export function normalizeSpeechRate(value: number): SpeechRate {
  return SPEECH_RATES.reduce((nearest, rate) =>
    Math.abs(rate - value) < Math.abs(nearest - value) ? rate : nearest,
  )
}

export function selectEnglishVoice(
  voices: SpeechSynthesisVoice[],
  locale = 'en-US',
): SpeechSynthesisVoice | undefined {
  const localEnglishVoices = voices.filter(
    (voice) =>
      voice.localService === true && voice.lang.toLowerCase().startsWith('en'),
  )
  const exact = localEnglishVoices.find(
    (voice) => voice.lang.toLowerCase() === locale.toLowerCase(),
  )
  return exact ?? localEnglishVoices[0]
}

async function loadVoices(synth: SpeechSynthesis, locale: string) {
  const voices = synth.getVoices()
  if (selectEnglishVoice(voices, locale)) return voices

  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      if (fallbackTimer) clearTimeout(fallbackTimer)
      synth.removeEventListener?.('voiceschanged', finish)
      resolve(synth.getVoices())
    }
    synth.addEventListener?.('voiceschanged', finish, { once: true })
    const fallbackTimer = setTimeout(finish, 250)
  })
}

export const browserTts = {
  stop() {
    speechGeneration += 1
    const playback = activePlayback
    activePlayback = undefined
    playback?.cancel()
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
  },
  async speak(
    text: string,
    options: { locale?: string; rate?: number } = {},
  ): Promise<void> {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      throw new Error('TTS_UNAVAILABLE')
    }
    this.stop()
    const generation = speechGeneration
    const synth = window.speechSynthesis
    const voice = selectEnglishVoice(
      await loadVoices(synth, options.locale ?? 'en-US'),
      options.locale ?? 'en-US',
    )
    if (generation !== speechGeneration) return
    if (!voice) throw new Error('LOCAL_ENGLISH_VOICE_UNAVAILABLE')
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = options.locale ?? 'en-US'
    utterance.rate = normalizeSpeechRate(options.rate ?? 1)
    utterance.voice = voice

    await new Promise<void>((resolve, reject) => {
      let settled = false
      const finish = (result: () => void) => {
        if (settled) return
        settled = true
        utterance.removeEventListener('end', handleEnd)
        utterance.removeEventListener('error', handleError)
        if (activePlayback?.generation === generation) {
          activePlayback = undefined
        }
        result()
      }
      const handleEnd = () => finish(resolve)
      const handleError = () =>
        finish(() => reject(new Error('TTS_PLAYBACK_FAILED')))
      activePlayback = {
        generation,
        cancel: () => finish(resolve),
      }
      utterance.addEventListener('end', handleEnd, { once: true })
      utterance.addEventListener('error', handleError, { once: true })
      if (generation !== speechGeneration) {
        finish(resolve)
        return
      }
      try {
        synth.speak(utterance)
      } catch (error) {
        finish(() => reject(error))
      }
    })
  },
}
