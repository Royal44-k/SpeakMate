import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  startLocalRecognition,
  type LocalSpeechRecognitionConstructor,
} from './local-recognition'

describe('local speech recognition', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    delete window.SpeechRecognition
    delete window.webkitSpeechRecognition
  })

  it.each(['downloadable', 'downloading', 'unavailable'] as const)(
    'does not start recognition when the English package is %s',
    async (availability) => {
      const start = vi.fn()
      const install = vi.fn()
      class Recognition {
        static available = vi.fn().mockResolvedValue(availability)
        static install = install
        continuous = false
        interimResults = false
        lang = ''
        processLocally = false
        onresult = null
        start = start
        stop = vi.fn()
        abort = vi.fn()
      }
      window.SpeechRecognition = Recognition

      await expect(
        startLocalRecognition({ locale: 'en-US', onTranscript: vi.fn() }),
      ).resolves.toBeNull()
      expect(start).not.toHaveBeenCalled()
      expect(install).not.toHaveBeenCalled()
    },
  )

  it('starts only after verified local availability and forces processLocally', async () => {
    const start = vi.fn()
    class Recognition {
      static available = vi.fn().mockResolvedValue('available')
      continuous = false
      interimResults = false
      lang = ''
      processLocally = false
      onresult = null
      start = start
      stop = vi.fn()
      abort = vi.fn()
    }
    window.SpeechRecognition = Recognition

    const recognition = await startLocalRecognition({
      locale: 'en-US',
      onTranscript: vi.fn(),
    })

    expect(recognition).toMatchObject({
      continuous: true,
      interimResults: true,
      lang: 'en-US',
      processLocally: true,
    })
    expect(Recognition.available).toHaveBeenCalledWith({
      langs: ['en-US'],
      processLocally: true,
    })
    expect(start).toHaveBeenCalledOnce()
  })

  it('rejects an implementation that cannot prove instance processLocally support', async () => {
    const start = vi.fn()
    class Recognition {
      static available = vi.fn().mockResolvedValue('available')
      continuous = false
      interimResults = false
      lang = ''
      onresult = null
      start = start
      stop = vi.fn()
      abort = vi.fn()
    }
    window.SpeechRecognition =
      Recognition as unknown as LocalSpeechRecognitionConstructor

    await expect(
      startLocalRecognition({ locale: 'en-US', onTranscript: vi.fn() }),
    ).resolves.toBeNull()
    expect(start).not.toHaveBeenCalled()
  })

  it('rejects an implementation that ignores processLocally assignment', async () => {
    const start = vi.fn()
    class Recognition {
      static available = vi.fn().mockResolvedValue('available')
      continuous = false
      interimResults = false
      lang = ''
      onresult = null
      get processLocally() {
        return false
      }
      set processLocally(_value: boolean) {}
      start = start
      stop = vi.fn()
      abort = vi.fn()
    }
    window.SpeechRecognition =
      Recognition as unknown as LocalSpeechRecognitionConstructor

    await expect(
      startLocalRecognition({ locale: 'en-US', onTranscript: vi.fn() }),
    ).resolves.toBeNull()
    expect(start).not.toHaveBeenCalled()
  })

  it('does not start after an availability probe is cancelled', async () => {
    let resolveAvailability!: (value: 'available') => void
    const availability = new Promise<'available'>((resolve) => {
      resolveAvailability = resolve
    })
    const start = vi.fn()
    class Recognition {
      static available = vi.fn().mockReturnValue(availability)
      continuous = false
      interimResults = false
      lang = ''
      processLocally = false
      onresult = null
      start = start
      stop = vi.fn()
      abort = vi.fn()
    }
    window.SpeechRecognition = Recognition
    const controller = new AbortController()

    const recognition = startLocalRecognition({
      locale: 'en-US',
      onTranscript: vi.fn(),
      signal: controller.signal,
    })
    controller.abort()
    resolveAvailability('available')

    await expect(recognition).resolves.toBeNull()
    expect(start).not.toHaveBeenCalled()
  })

  it('ignores transcript callbacks after cancellation and aborts the recognizer', async () => {
    const onTranscript = vi.fn()
    const abort = vi.fn()
    class Recognition {
      static available = vi.fn().mockResolvedValue('available')
      continuous = false
      interimResults = false
      lang = ''
      processLocally = false
      onresult: ((event: never) => void) | null = null
      start = vi.fn()
      stop = vi.fn()
      abort = abort
    }
    window.SpeechRecognition =
      Recognition as unknown as LocalSpeechRecognitionConstructor
    const controller = new AbortController()
    const recognition = await startLocalRecognition({
      onTranscript,
      signal: controller.signal,
    })

    controller.abort()
    recognition?.onresult?.({
      results: [{ 0: { transcript: 'late transcript' }, isFinal: true }],
    })

    expect(abort).toHaveBeenCalledOnce()
    expect(onTranscript).not.toHaveBeenCalled()
  })
})
