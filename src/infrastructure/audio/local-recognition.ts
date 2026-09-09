export interface SpeechRecognitionResultEventLike {
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>
}

export interface LocalSpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  processLocally: boolean
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null
  start(): void
  stop(): void
  abort(): void
}

export interface LocalSpeechRecognitionConstructor {
  new (): LocalSpeechRecognition
  available?: (options: {
    langs: string[]
    processLocally: true
  }) => Promise<'available' | 'downloadable' | 'downloading' | 'unavailable'>
  install?: (options: { langs: string[] }) => Promise<boolean>
}

declare global {
  interface Window {
    SpeechRecognition?: LocalSpeechRecognitionConstructor
    webkitSpeechRecognition?: LocalSpeechRecognitionConstructor
  }
}

export async function startLocalRecognition({
  locale = 'en-US',
  onTranscript,
  signal,
}: {
  locale?: string
  onTranscript: (transcript: string) => void
  signal?: AbortSignal
}): Promise<LocalSpeechRecognition | null> {
  if (typeof window === 'undefined' || signal?.aborted) return null
  const Recognition =
    window.SpeechRecognition ?? window.webkitSpeechRecognition
  if (!Recognition?.available) return null

  try {
    const availability = await Recognition.available({
      langs: [locale],
      processLocally: true,
    })
    if (availability !== 'available' || signal?.aborted) return null

    const recognition = new Recognition()
    if (!('processLocally' in recognition)) return null
    recognition.lang = locale
    recognition.continuous = true
    recognition.interimResults = true
    recognition.processLocally = true
    if (recognition.processLocally !== true) return null
    recognition.onresult = (event) => {
      if (signal?.aborted) return
      onTranscript(
        Array.from(event.results)
          .map((result) => result[0]?.transcript ?? '')
          .join(' ')
          .trim(),
      )
    }
    signal?.addEventListener('abort', () => recognition.abort(), {
      once: true,
    })
    if (signal?.aborted) return null
    recognition.start()
    return recognition
  } catch {
    return null
  }
}
