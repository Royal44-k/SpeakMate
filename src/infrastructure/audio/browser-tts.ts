export type SpeechRate = 0.8 | 1 | 1.15

const SPEECH_RATES: SpeechRate[] = [0.8, 1, 1.15]

export function normalizeSpeechRate(value: number): SpeechRate {
  return SPEECH_RATES.reduce((nearest, rate) =>
    Math.abs(rate - value) < Math.abs(nearest - value) ? rate : nearest,
  )
}

export function selectEnglishVoice(
  voices: SpeechSynthesisVoice[],
  locale = 'en-US',
): SpeechSynthesisVoice | undefined {
  const exact = voices.find((voice) => voice.lang.toLowerCase() === locale.toLowerCase())
  return exact ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('en'))
}

export const browserTts = {
  stop() {
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
    const synth = window.speechSynthesis
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = options.locale ?? 'en-US'
    utterance.rate = normalizeSpeechRate(options.rate ?? 1)
    utterance.voice = selectEnglishVoice(synth.getVoices(), utterance.lang) ?? null

    await new Promise<void>((resolve, reject) => {
      utterance.addEventListener('end', () => resolve(), { once: true })
      utterance.addEventListener('error', () => reject(new Error('TTS_PLAYBACK_FAILED')), { once: true })
      synth.speak(utterance)
    })
  },
}
