export const MIN_RECORDING_MS = 800
export const MAX_RECORDING_MS = 30_000
export const MAX_AUDIO_BYTES = 2 * 1024 * 1024
export const TARGET_AUDIO_BITS_PER_SECOND = 48_000

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/mp4',
  'audio/webm',
  'audio/ogg;codecs=opus',
]

export type RecordingValidation =
  | { ok: true }
  | { ok: false; code: 'TOO_SHORT' | 'TOO_LONG' | 'TOO_LARGE' | 'NO_SPEECH'; message: string }

export interface RecordingMetadata {
  durationMs: number
  size: number
  peakAmplitude?: number
}

export interface RecordedAudio {
  blob: Blob
  durationMs: number
  mimeType: string
  amplitudeSamples: number[]
}

export interface BrowserRecorder {
  start(): Promise<void>
  stop(): Promise<RecordedAudio>
  cancel(): void
  isRecording(): boolean
}

export interface BrowserRecorderOptions {
  onAmplitude?: (amplitude: number) => void
  onAutoStop?: () => void
}

export function selectSupportedMimeType(
  isSupported: (type: string) => boolean,
): string | undefined {
  return MIME_CANDIDATES.find(isSupported)
}

export function validateRecording(input: RecordingMetadata): RecordingValidation {
  if (input.durationMs < MIN_RECORDING_MS) {
    return { ok: false, code: 'TOO_SHORT', message: '录音太短，请说完一句完整的话。' }
  }
  if (input.durationMs > MAX_RECORDING_MS) {
    return { ok: false, code: 'TOO_LONG', message: '每次录音最长 30 秒。' }
  }
  if (input.size > MAX_AUDIO_BYTES) {
    return { ok: false, code: 'TOO_LARGE', message: '录音文件超过 2 MB，请缩短后重试。' }
  }
  if (input.peakAmplitude !== undefined && input.peakAmplitude < 0.012) {
    return { ok: false, code: 'NO_SPEECH', message: '没有听到清晰语音，请靠近麦克风再试一次。' }
  }
  return { ok: true }
}

function stopTracks(stream?: MediaStream) {
  stream?.getTracks().forEach((track) => track.stop())
}

export function createRecorder(
  options: BrowserRecorderOptions = {},
): BrowserRecorder {
  let stream: MediaStream | undefined
  let recorder: MediaRecorder | undefined
  let startedAt = 0
  let chunks: Blob[] = []
  let autoStopTimer: ReturnType<typeof setTimeout> | undefined
  let amplitudeTimer: ReturnType<typeof setInterval> | undefined
  let audioContext: AudioContext | undefined
  let analyser: AnalyserNode | undefined
  let stopPromise: Promise<RecordedAudio> | undefined
  let resolveStop: ((audio: RecordedAudio) => void) | undefined
  let rejectStop: ((reason: unknown) => void) | undefined
  const amplitudeSamples: number[] = []

  function cleanup() {
    if (autoStopTimer) clearTimeout(autoStopTimer)
    if (amplitudeTimer) clearInterval(amplitudeTimer)
    stopTracks(stream)
    void audioContext?.close().catch(() => undefined)
    stream = undefined
    recorder = undefined
    analyser = undefined
    audioContext = undefined
    autoStopTimer = undefined
    amplitudeTimer = undefined
  }

  function sampleAmplitude() {
    if (!analyser) return
    const data = new Uint8Array(analyser.fftSize)
    analyser.getByteTimeDomainData(data)
    const mean = data.reduce((sum, value) => sum + Math.abs(value - 128), 0) / data.length
    const normalized = Math.min(1, mean / 32)
    amplitudeSamples.push(normalized)
    options.onAmplitude?.(normalized)
  }

  return {
    async start() {
      if (recorder?.state === 'recording') return
      if (!globalThis.navigator?.mediaDevices?.getUserMedia || !globalThis.MediaRecorder) {
        throw new Error('RECORDING_UNSUPPORTED')
      }

      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      })
      const mimeType = selectSupportedMimeType((type) => MediaRecorder.isTypeSupported(type))
      recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: TARGET_AUDIO_BITS_PER_SECOND,
      })
      chunks = []
      amplitudeSamples.length = 0
      startedAt = performance.now()

      try {
        audioContext = new AudioContext()
        analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        audioContext.createMediaStreamSource(stream).connect(analyser)
        amplitudeTimer = setInterval(sampleAmplitude, 100)
      } catch {
        // Recording still works when an amplitude meter is unavailable.
      }

      stopPromise = new Promise<RecordedAudio>((resolve, reject) => {
        resolveStop = resolve
        rejectStop = reject
      })
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      })
      recorder.addEventListener('error', () => {
        rejectStop?.(new Error('RECORDING_FAILED'))
        cleanup()
      })
      recorder.addEventListener('stop', () => {
        const durationMs = Math.min(MAX_RECORDING_MS, Math.round(performance.now() - startedAt))
        const type = recorder?.mimeType || mimeType || 'audio/webm'
        const blob = new Blob(chunks, { type })
        const validation = validateRecording({
          durationMs,
          size: blob.size,
          peakAmplitude: amplitudeSamples.length > 0
            ? Math.max(...amplitudeSamples)
            : undefined,
        })
        cleanup()
        if (!validation.ok) {
          rejectStop?.(Object.assign(new Error(validation.message), { code: validation.code }))
          return
        }
        resolveStop?.({ blob, durationMs, mimeType: type, amplitudeSamples: [...amplitudeSamples] })
      }, { once: true })

      recorder.start(200)
      autoStopTimer = setTimeout(() => {
        if (recorder?.state === 'recording') {
          recorder.stop()
          options.onAutoStop?.()
        }
      }, MAX_RECORDING_MS)
    },
    async stop() {
      if (!recorder || !stopPromise) throw new Error('NOT_RECORDING')
      if (recorder.state === 'recording') recorder.stop()
      return stopPromise
    },
    cancel() {
      if (recorder?.state === 'recording') recorder.stop()
      rejectStop?.(new DOMException('Recording cancelled', 'AbortError'))
      cleanup()
    },
    isRecording() {
      return recorder?.state === 'recording'
    },
  }
}
