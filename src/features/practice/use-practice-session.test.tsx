import { StrictMode, type ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getSceneBySlug } from '@/content/scenes/catalog'
import { adaptScene } from '@/domain/scenes/adapt-scene'
import { browserTts } from '@/infrastructure/audio/browser-tts'
import type { BrowserRecorder } from '@/infrastructure/audio/browser-recorder'
import { getDatabase } from '@/infrastructure/persistence/db'
import { createIndexedDbRepositories } from '@/infrastructure/persistence/repositories'
import { usePracticeSession } from './use-practice-session'

const recorderHarness = vi.hoisted(() => ({
  recorder: null as BrowserRecorder | null,
}))

vi.mock('@/infrastructure/audio/browser-recorder', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/infrastructure/audio/browser-recorder')>()
  return {
    ...actual,
    createRecorder: () => {
      if (!recorderHarness.recorder) throw new Error('RECORDER_NOT_CONFIGURED')
      return recorderHarness.recorder
    },
  }
})

const scene = adaptScene(getSceneBySlug('coffee-order')!, 'C1')
const repositories = createIndexedDbRepositories()
beforeEach(async () => {
  await repositories.clearLearnerData()
  window.history.replaceState(
    null,
    '',
    '/session/new?scene=coffee-order&level=C1',
  )
})

afterEach(() => {
  recorderHarness.recorder = null
  delete window.SpeechRecognition
  delete window.webkitSpeechRecognition
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('practice session lifecycle', () => {
  it('creates exactly one session in StrictMode, and a second new round preserves the first', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StrictMode>{children}</StrictMode>
    )
    const first = renderHook(() => usePracticeSession(scene, 'new'), {
      wrapper,
    })
    await waitFor(() => expect(first.result.current.ready).toBe(true))
    const id = first.result.current.sessionId
    const opening = first.result.current.aiReply
    expect(await repositories.sessions.list()).toHaveLength(1)
    expect(window.location.pathname).toBe(`/session/${id}`)
    first.unmount()
    window.history.replaceState(
      null,
      '',
      '/session/new?scene=coffee-order&level=C1',
    )
    const second = renderHook(() => usePracticeSession(scene, 'new'), {
      wrapper,
    })
    await waitFor(() => expect(second.result.current.ready).toBe(true))
    expect(second.result.current.sessionId).not.toBe(id)
    expect(second.result.current.aiReply).not.toBe(opening)
    expect(await repositories.sessions.list()).toHaveLength(2)
    expect(await repositories.sessions.get(id)).toBeDefined()
  })

  it('persists confirmed text through the local coach without an API request', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    vi.spyOn(browserTts, 'speak').mockResolvedValue()
    const practice = renderHook(() => usePracticeSession(scene, 'new'))
    await waitFor(() => expect(practice.result.current.ready).toBe(true))

    act(() => practice.result.current.openKeyboard())
    act(() => practice.result.current.updateTranscript('A small latte, please.'))
    await act(async () => practice.result.current.submitTurn())

    await waitFor(() =>
      expect(practice.result.current.machine.turnIndex).toBe(1),
    )
    const savedTurns = await repositories.turns.listBySession(
      practice.result.current.sessionId,
    )
    expect(savedTurns).toHaveLength(1)
    expect(savedTurns[0].learnerText).toBe('A small latte, please.')
    expect(savedTurns[0].result?.provider).toBe('local')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('keeps audio-only input at confirmation without upload or ASR fallback', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    recorderHarness.recorder = {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue({
        blob: new Blob(['local preview'], { type: 'audio/webm' }),
        durationMs: 1_200,
        mimeType: 'audio/webm',
        amplitudeSamples: [0.2],
      }),
      cancel: vi.fn(),
      isRecording: () => true,
    }
    const practice = renderHook(() => usePracticeSession(scene, 'new'))
    await waitFor(() => expect(practice.result.current.ready).toBe(true))

    await act(async () => practice.result.current.startRecording())
    await act(async () => practice.result.current.stopRecording())
    expect(practice.result.current.machine).toMatchObject({
      status: 'reviewing',
      draftTranscript: '',
    })

    await act(async () => practice.result.current.submitTurn())

    expect(practice.result.current.machine.status).toBe('reviewing')
    expect(practice.result.current.audio).not.toBeNull()
    expect(
      await repositories.turns.listBySession(practice.result.current.sessionId),
    ).toHaveLength(0)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('does not autoplay a reply when the persisted setting is off', async () => {
    await (await getDatabase()).put('settings', {
      id: 'settings',
      speechRate: 0.8,
      autoPlayAi: false,
      feedbackExpanded: false,
      updatedAt: '2026-09-09T00:00:00.000Z',
    })
    const speak = vi.spyOn(browserTts, 'speak').mockResolvedValue()
    const practice = renderHook(() => usePracticeSession(scene, 'new'))
    await waitFor(() => expect(practice.result.current.ready).toBe(true))

    act(() => practice.result.current.openKeyboard())
    act(() => practice.result.current.updateTranscript('No sugar, please.'))
    await act(async () => practice.result.current.submitTurn())
    await waitFor(() =>
      expect(practice.result.current.machine.turnIndex).toBe(1),
    )

    expect(speak).not.toHaveBeenCalled()
  })

  it('uses the persisted speech rate for manual reply playback', async () => {
    await (await getDatabase()).put('settings', {
      id: 'settings',
      speechRate: 0.8,
      autoPlayAi: false,
      feedbackExpanded: true,
      updatedAt: '2026-09-09T00:00:00.000Z',
    })
    const speak = vi.spyOn(browserTts, 'speak').mockResolvedValue()
    const practice = renderHook(() => usePracticeSession(scene, 'new'))
    await waitFor(() => expect(practice.result.current.ready).toBe(true))

    await act(async () => practice.result.current.speakReply())

    expect(speak).toHaveBeenCalledWith(practice.result.current.aiReply, {
      rate: 0.8,
    })
    expect(practice.result.current.feedbackExpanded).toBe(true)
  })

  it('does not start recognition when local availability resolves after unmount', async () => {
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
    recorderHarness.recorder = {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn(),
      cancel: vi.fn(),
      isRecording: () => true,
    }
    const practice = renderHook(() => usePracticeSession(scene, 'new'))
    await waitFor(() => expect(practice.result.current.ready).toBe(true))

    let pending!: Promise<void>
    await act(async () => {
      pending = practice.result.current.startRecording()
      await Promise.resolve()
    })
    expect(Recognition.available).toHaveBeenCalledOnce()
    expect(practice.result.current.machine.status).toBe('recording')
    practice.unmount()
    resolveAvailability('available')
    await pending

    expect(start).not.toHaveBeenCalled()
  })

  it('exposes a readable status when manual local speech is unavailable', async () => {
    await (await getDatabase()).put('settings', {
      id: 'settings',
      speechRate: 1,
      autoPlayAi: false,
      feedbackExpanded: false,
      updatedAt: '2026-09-09T00:00:00.000Z',
    })
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        cancel: vi.fn(),
        getVoices: () => [
          { lang: 'en-US', name: 'Remote English', localService: false },
        ],
      },
    })
    const practice = renderHook(() => usePracticeSession(scene, 'new'))
    await waitFor(() => expect(practice.result.current.ready).toBe(true))

    await act(async () => practice.result.current.speakReply())

    expect(practice.result.current.speechError).toContain(
      '没有可用的本地英语音色',
    )
    expect(practice.result.current.machine.status).toBe('ready')
  })
})
