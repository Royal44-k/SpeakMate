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
import { localContentProvider } from '@/content/dialogues/graded/provider'
import type { PreparedPractice } from '@/domain/practice/prepared-practice'
import type { AdaptedScene } from '@/domain/scenes/types'

const recorderHarness = vi.hoisted(() => ({
  recorder: null as BrowserRecorder | null,
}))

vi.mock('@/infrastructure/audio/browser-recorder', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/infrastructure/audio/browser-recorder')
    >()
  return {
    ...actual,
    createRecorder: () => {
      if (!recorderHarness.recorder) throw new Error('RECORDER_NOT_CONFIGURED')
      return recorderHarness.recorder
    },
  }
})

let scene: AdaptedScene & PreparedPractice
const repositories = createIndexedDbRepositories()
beforeEach(async () => {
  await repositories.clearLearnerData()
  const content = await localContentProvider.load({
    sceneId: 'dining-01',
    level: 'C1',
  })
  if (content.status !== 'available') throw new Error('fixture missing')
  scene = {
    ...adaptScene(getSceneBySlug('coffee-order')!, 'C1'),
    pack: content.pack,
    mode: 'short',
    variantId: 'counter',
  }
  window.history.replaceState(
    null,
    '',
    '/session?id=new&scene=coffee-order&level=C1&mode=short',
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
  it('retries a failed initial save with the exact same creation candidate', async () => {
    const commit = vi
      .spyOn(repositories.practice, 'commit')
      .mockRejectedValueOnce(new Error('QuotaExceededError'))
    const practice = renderHook(() =>
      usePracticeSession(scene, 'new', repositories),
    )
    await waitFor(() =>
      expect(practice.result.current.machine.status).toBe('recoverable-error'),
    )
    const first = commit.mock.calls[0][0]
    act(() => practice.result.current.retryInitialization())
    await waitFor(() => expect(practice.result.current.ready).toBe(true))
    expect(commit.mock.calls[1][0]).toEqual(first)
    expect(await repositories.sessions.list()).toHaveLength(1)
  })
  it('pins the selected short path and exact engine opening instead of the legacy catalog opening', async () => {
    const practice = renderHook(() => usePracticeSession(scene, 'new'))
    await waitFor(() => expect(practice.result.current.ready).toBe(true))
    const saved = await repositories.sessions.get(
      practice.result.current.sessionId,
    )
    expect(saved?.gradedDialogue?.state).toMatchObject({
      mode: 'short',
      variantId: 'counter',
      turns: [],
    })
    expect(saved?.openingText).toBe(saved?.gradedDialogue?.state.reply)
    expect(saved?.openingText).not.toBe(scene.openingLines[0])
  })
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
    expect(window.location.pathname).toBe('/session')
    expect(new URLSearchParams(window.location.search).get('id')).toBe(id)
    expect(new URLSearchParams(window.location.search).get('mode')).toBe(
      'short',
    )
    first.unmount()
    window.history.replaceState(
      null,
      '',
      '/session?id=new&scene=coffee-order&level=C1&mode=short',
    )
    const second = renderHook(() => usePracticeSession(scene, 'new'), {
      wrapper,
    })
    await waitFor(() => expect(second.result.current.ready).toBe(true))
    expect(second.result.current.sessionId).not.toBe(id)
    expect(second.result.current.aiReply).toBe(opening) // Same explicitly selected variant, not an invented rotation.
    expect(await repositories.sessions.list()).toHaveLength(2)
    expect(await repositories.sessions.get(id)).toBeDefined()
  })

  it('persists confirmed text through the local graded engine without an API request', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    vi.spyOn(browserTts, 'speak').mockResolvedValue()
    const practice = renderHook(() => usePracticeSession(scene, 'new'))
    await waitFor(() => expect(practice.result.current.ready).toBe(true))

    act(() => practice.result.current.openKeyboard())
    act(() =>
      practice.result.current.updateTranscript('A small latte, please.'),
    )
    await act(async () => practice.result.current.submitTurn())

    await waitFor(() =>
      expect(practice.result.current.machine.turnIndex).toBe(1),
    )
    const savedTurns = await repositories.turns.listBySession(
      practice.result.current.sessionId,
    )
    expect(savedTurns).toHaveLength(1)
    expect(savedTurns[0].learnerText).toBe('A small latte, please.')
    expect(savedTurns[0].result).toBeUndefined()
    expect(
      practice.result.current.record?.session.gradedDialogue?.state.turns[0],
    ).toMatchObject({ action: 'answer', text: 'A small latte, please.' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('uses edited suggestion text and restores terminal partial without accepting another turn', async () => {
    vi.spyOn(browserTts, 'speak').mockResolvedValue()
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const practice = renderHook(() => usePracticeSession(scene, 'new'))
    await waitFor(() => expect(practice.result.current.ready).toBe(true))
    const id = practice.result.current.sessionId
    const answer = practice.result.current.suggestions[0]
    act(() => practice.result.current.chooseSuggestion(answer.id, answer.text))
    act(() =>
      practice.result.current.updateTranscript(
        'I did not say that; these are different words.',
      ),
    )
    await act(async () => practice.result.current.submitTurn())
    expect(practice.result.current.view?.history[0].confirmation).toBe(
      'unknown',
    )
    await act(async () => practice.result.current.submitAction('clarify'))
    await act(async () => practice.result.current.submitAction('struggle'))
    expect(practice.result.current.view).toMatchObject({
      outcome: 'partial',
      canAnswer: false,
      canFinish: true,
    })
    expect(practice.result.current.record?.session.status).toBe('active')
    await act(async () => practice.result.current.submitAction('clarify'))
    act(() => practice.result.current.openKeyboard())
    expect(practice.result.current.turns).toHaveLength(3)
    expect(practice.result.current.machine.status).toBe('ready')
    practice.unmount()
    const changedToday = {
      ...scene,
      pack: { ...scene.pack, contentVersion: 2 },
    }
    const restored = renderHook(() => usePracticeSession(changedToday, id))
    await waitFor(() => expect(restored.result.current.ready).toBe(true))
    expect(
      restored.result.current.record?.session.gradedDialogue?.pack
        .contentVersion,
    ).toBe(1)
    expect(restored.result.current.view?.canAnswer).toBe(false)
    await act(async () => restored.result.current.completeSession())
    expect(restored.result.current.record?.session.status).toBe('completed')
    expect(
      restored.result.current.record?.session.completionEvidence?.outcome,
    ).toBe('partial')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('keeps the same attempted turn and draft after storage failure for an exact retry', async () => {
    vi.spyOn(browserTts, 'speak').mockResolvedValue()
    const practice = renderHook(() =>
      usePracticeSession(scene, 'new', repositories),
    )
    await waitFor(() => expect(practice.result.current.ready).toBe(true))
    const commit = vi.spyOn(repositories.practice, 'commit')
    commit.mockRejectedValueOnce(new DOMException('Full', 'QuotaExceededError'))
    act(() => practice.result.current.openKeyboard())
    act(() => practice.result.current.updateTranscript('Uncollected words'))
    await act(async () => practice.result.current.submitTurn())
    const first = commit.mock.calls[0][0]
    expect(practice.result.current.machine.draftTranscript).toBe(
      'Uncollected words',
    )
    expect(practice.result.current.turns).toHaveLength(0)
    await act(async () => practice.result.current.submitTurn())
    expect(commit.mock.calls[1][0]).toEqual(first)
    expect(practice.result.current.turns).toHaveLength(1)
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
    await (
      await getDatabase()
    ).put('settings', {
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
    await (
      await getDatabase()
    ).put('settings', {
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

  it('does not continue a late microphone permission request after unmount', async () => {
    let resolvePermission!: () => void
    const recorderStart = new Promise<void>((resolve) => {
      resolvePermission = resolve
    })
    const cancel = vi.fn()
    const recognitionStart = vi.fn()
    class Recognition {
      static available = vi.fn().mockResolvedValue('available')
      continuous = false
      interimResults = false
      lang = ''
      processLocally = false
      onresult = null
      start = recognitionStart
      stop = vi.fn()
      abort = vi.fn()
    }
    window.SpeechRecognition = Recognition
    recorderHarness.recorder = {
      start: vi.fn().mockReturnValue(recorderStart),
      stop: vi.fn(),
      cancel,
      isRecording: () => false,
    }
    const practice = renderHook(() => usePracticeSession(scene, 'new'))
    await waitFor(() => expect(practice.result.current.ready).toBe(true))
    const interval = vi.spyOn(globalThis, 'setInterval')

    const pending = practice.result.current.startRecording()
    practice.unmount()
    resolvePermission()
    await pending
    await Promise.resolve()

    expect(cancel).toHaveBeenCalledOnce()
    expect(interval).not.toHaveBeenCalled()
    expect(recognitionStart).not.toHaveBeenCalled()
  })

  it('exposes a readable status when manual local speech is unavailable', async () => {
    await (
      await getDatabase()
    ).put('settings', {
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
