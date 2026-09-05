import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  bindRecordingInterruptionHandlers,
  createRecorder,
  MAX_AUDIO_BYTES,
  MAX_RECORDING_MS,
  MIN_RECORDING_MS,
  selectSupportedMimeType,
  validateRecording,
} from './browser-recorder'

describe('browser recorder guards', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('selects the first browser-supported compact audio format', () => {
    const supported = new Set(['audio/webm;codecs=opus', 'audio/mp4'])
    expect(selectSupportedMimeType((type) => supported.has(type))).toBe(
      'audio/webm;codecs=opus',
    )
  })

  it('enforces the 0.8 second, 30 second and 2 MB boundaries', () => {
    expect(
      validateRecording({ durationMs: MIN_RECORDING_MS - 1, size: 1_000 }),
    ).toMatchObject({ code: 'TOO_SHORT' })
    expect(
      validateRecording({ durationMs: MAX_RECORDING_MS + 1, size: 1_000 }),
    ).toMatchObject({ code: 'TOO_LONG' })
    expect(
      validateRecording({ durationMs: 1_000, size: MAX_AUDIO_BYTES + 1 }),
    ).toMatchObject({ code: 'TOO_LARGE' })
    expect(validateRecording({ durationMs: 1_000, size: 10_000 })).toEqual({
      ok: true,
    })
  })

  it('does not submit a silent recording', () => {
    expect(
      validateRecording({
        durationMs: 1_200,
        size: 10_000,
        peakAmplitude: 0.004,
      }),
    ).toMatchObject({ code: 'NO_SPEECH' })
  })

  it('cancels an active recording when the page is hidden or the audio track ends', () => {
    const page = new EventTarget()
    const track = new EventTarget()
    const onInterrupted = vi.fn()
    const detach = bindRecordingInterruptionHandlers(
      { page, tracks: [track], isHidden: () => true },
      onInterrupted,
    )

    page.dispatchEvent(new Event('visibilitychange'))
    track.dispatchEvent(new Event('ended'))
    expect(onInterrupted).toHaveBeenCalledOnce()

    detach()
    page.dispatchEvent(new Event('pagehide'))
    expect(onInterrupted).toHaveBeenCalledOnce()
  })

  it('releases the microphone when MediaRecorder initialization fails', async () => {
    const stop = vi.fn()
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi
          .fn()
          .mockResolvedValue({ getTracks: () => [{ stop }] }),
      },
    })
    vi.stubGlobal(
      'MediaRecorder',
      class {
        static isTypeSupported() {
          return true
        }
        constructor() {
          throw new Error('recorder init failed')
        }
      },
    )

    await expect(createRecorder().start()).rejects.toThrow(
      'recorder init failed',
    )
    expect(stop).toHaveBeenCalledOnce()
  })

  it('releases the microphone when MediaRecorder.start fails', async () => {
    const stop = vi.fn()
    const track = new EventTarget() as EventTarget & { stop: () => void }
    track.stop = stop
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi
          .fn()
          .mockResolvedValue({ getTracks: () => [track] }),
      },
    })
    vi.stubGlobal(
      'MediaRecorder',
      class extends EventTarget {
        static isTypeSupported() {
          return true
        }
        state = 'inactive'
        mimeType = 'audio/webm'
        start() {
          throw new Error('recorder start failed')
        }
      },
    )

    await expect(createRecorder().start()).rejects.toThrow(
      'recorder start failed',
    )
    expect(stop).toHaveBeenCalledOnce()
  })
})
