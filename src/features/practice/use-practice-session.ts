'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { ConversationResult } from '@/domain/ai/contracts'
import { localCoach } from '@/domain/ai/local-coach'
import {
  INITIAL_PRACTICE_STATE,
  transitionPractice,
  type PracticeState,
} from '@/domain/practice/machine'
import type { PracticeSession, PracticeTurn } from '@/domain/practice/types'
import type { AdaptedScene } from '@/domain/scenes/types'
import { browserTts } from '@/infrastructure/audio/browser-tts'
import {
  createRecorder,
  type BrowserRecorder,
  type RecordedAudio,
} from '@/infrastructure/audio/browser-recorder'
import {
  createIndexedDbRepositories,
  createMemoryRepositories,
  type Repositories,
} from '@/infrastructure/persistence/repositories'

import { submitTurn as submitTurnToApi, TurnApiError } from './turn-api-client'

interface SpeechRecognitionResultEventLike {
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>
}

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null
  start(): void
  stop(): void
  abort(): void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

function createId(prefix: string) {
  return `${prefix}_${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
}

export function usePracticeSession(scene: AdaptedScene, requestedId: string) {
  const [machine, setMachine] = useState<PracticeState>(INITIAL_PRACTICE_STATE)
  const [turns, setTurns] = useState<PracticeTurn[]>([])
  const [latestResult, setLatestResult] = useState<ConversationResult | null>(
    null,
  )
  const [aiReply, setAiReply] = useState(scene.openingLines[0])
  const [aiHint, setAiHint] = useState('先听对方说什么，再用自己的话回应。')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [amplitude, setAmplitude] = useState(0)
  const [audio, setAudio] = useState<RecordedAudio | null>(null)
  const [sessionId, setSessionId] = useState(requestedId)
  const [completedGoalIds, setCompletedGoalIds] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  const [ephemeral, setEphemeral] = useState(false)
  const [initialRepositories] = useState(createIndexedDbRepositories)
  const repositoriesRef = useRef<Repositories>(initialRepositories)
  const recorderRef = useRef<BrowserRecorder | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const transcriptRef = useRef('')
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const finishingRef = useRef(false)
  const sessionRef = useRef<PracticeSession | null>(null)
  const initializationRef = useRef<Promise<{
    session: PracticeSession
    savedTurns: PracticeTurn[]
    ephemeral: boolean
  }> | null>(null)
  const submittingRef = useRef(false)
  const mountedRef = useRef(false)
  const idempotencyRef = useRef<{ fingerprint: string; key: string } | null>(
    null,
  )

  const clearElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current)
    elapsedTimerRef.current = null
  }, [])

  useEffect(() => {
    let active = true
    mountedRef.current = true
    sessionRef.current = null
    transcriptRef.current = ''
    idempotencyRef.current = null
    async function loadWith(repositories: Repositories) {
      const profile = await repositories.profiles.ensureGuestProfile()
      let session =
        requestedId === 'new'
          ? undefined
          : await repositories.sessions.get(requestedId)
      if (!session) {
        if (requestedId !== 'new') throw new Error('SESSION_NOT_FOUND')
        const timestamp = new Date().toISOString()
        const previous = (await repositories.sessions.list()).filter(
          (item) => item.sceneId === scene.id && item.level === scene.level,
        )
        session = {
          id: createId('session'),
          profileId: profile.id,
          sceneId: scene.id,
          sceneVersion: scene.version,
          sceneSnapshot: scene,
          level: scene.level,
          status: 'active',
          startedAt: timestamp,
          updatedAt: timestamp,
          completedGoals: [],
          openingText:
            scene.openingLines[previous.length % scene.openingLines.length],
        }
        await repositories.sessions.save(session)
      }
      const savedTurns = await repositories.turns.listBySession(session.id)
      return { session, savedTurns }
    }
    initializationRef.current ??= loadWith(repositoriesRef.current)
      .then((loaded) => ({ ...loaded, ephemeral: false }))
      .catch(async (error: unknown) => {
        if (requestedId !== 'new') throw error
        const memoryRepositories = createMemoryRepositories()
        repositoriesRef.current = memoryRepositories
        return { ...(await loadWith(memoryRepositories)), ephemeral: true }
      })
    void initializationRef.current
      .then(({ session, savedTurns, ephemeral }) => {
        if (!active) return
        sessionRef.current = session
        setSessionId(session.id)
        setCompletedGoalIds(session.completedGoals)
        setTurns(savedTurns)
        const lastTurn = savedTurns.at(-1)
        setAiReply(
          lastTurn?.aiText ?? session.openingText ?? scene.openingLines[0],
        )
        setAiHint(
          lastTurn?.result?.reply.hintZh ??
            '先听对方说什么，再用自己的话回应。',
        )
        setLatestResult(
          lastTurn?.result ??
            (lastTurn?.feedback
              ? {
                  reply: {
                    text: lastTurn.aiText,
                    hintZh: '继续上次的话题。',
                    emotion: 'neutral',
                  },
                  feedback: {
                    heard: lastTurn.learnerText,
                    corrected: lastTurn.feedback.corrected,
                    naturalAlternative: lastTurn.feedback.natural,
                    explanationZh: lastTurn.feedback.explanationZh,
                    issueTags: lastTurn.feedback
                      .tags as ConversationResult['feedback']['issueTags'],
                  },
                  progress: {
                    completedGoalIds: session.completedGoals,
                    shouldOfferCompletion:
                      savedTurns.length >= scene.recommendedTurns ||
                      session.completedGoals.length >= scene.goals.length,
                  },
                  provider: 'local',
                  degraded: lastTurn.degraded ?? true,
                }
              : null),
        )
        setMachine({ status: 'ready', turnIndex: savedTurns.length })
        setEphemeral(ephemeral)
        if (requestedId === 'new' && !ephemeral) {
          const url = new URL(window.location.href)
          const previousRoute = `${url.pathname}${url.search}`
          url.pathname = `/session/${session.id}`
          const nextRoute = `${url.pathname}${url.search}`
          try {
            const stack: unknown = JSON.parse(
              window.sessionStorage.getItem('speakmate-route-stack') ?? '[]',
            )
            if (Array.isArray(stack) && stack.at(-1) === previousRoute) {
              window.sessionStorage.setItem(
                'speakmate-route-stack',
                JSON.stringify([...stack.slice(0, -1), nextRoute]),
              )
            }
          } catch {
            /* Session history is optional; IndexedDB keeps the actual record. */
          }
          window.history.replaceState(window.history.state, '', nextRoute)
        }
        setReady(true)
      })
      .catch(() => {
        if (!active) return
        setMachine((current) =>
          transitionPractice(current, {
            type: 'FAIL',
            code: 'STORAGE_UNAVAILABLE',
            message: '无法准备本次练习，请刷新页面后重试。',
          }),
        )
        setReady(true)
      })
    return () => {
      active = false
      mountedRef.current = false
      clearElapsedTimer()
      recorderRef.current?.cancel()
      recognitionRef.current?.abort()
      browserTts.stop()
    }
  }, [clearElapsedTimer, requestedId, scene])

  const finishRecording = useCallback(async () => {
    if (finishingRef.current || !recorderRef.current) return
    finishingRef.current = true
    clearElapsedTimer()
    recognitionRef.current?.stop()
    try {
      const recording = await recorderRef.current.stop()
      setAudio(recording)
      setMachine((current) =>
        transitionPractice(current, {
          type: 'RECORDING_READY',
          transcript: transcriptRef.current,
        }),
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '录音没有成功，请重试。'
      setMachine((current) =>
        transitionPractice(current, {
          type: 'FAIL',
          code: 'RECORDING_FAILED',
          message,
        }),
      )
    } finally {
      recorderRef.current = null
      recognitionRef.current = null
      finishingRef.current = false
      setAmplitude(0)
    }
  }, [clearElapsedTimer])

  const startRecording = useCallback(async () => {
    if (!ready || machine.turnIndex >= scene.recommendedTurns) return
    browserTts.stop()
    transcriptRef.current = ''
    setElapsedSeconds(0)
    setMachine((current) =>
      transitionPractice(current, { type: 'PRESS_RECORD' }),
    )
    const recorder = createRecorder({
      onAmplitude: setAmplitude,
      onAutoStop: () => void finishRecording(),
      onInterrupted: () => {
        clearElapsedTimer()
        recognitionRef.current?.abort()
        recorderRef.current = null
        recognitionRef.current = null
        setAmplitude(0)
        setAudio(null)
        setMachine((current) => {
          if (
            current.status !== 'recording' &&
            current.status !== 'requesting-permission'
          )
            return current
          return transitionPractice(current, { type: 'CANCEL' })
        })
      },
    })
    recorderRef.current = recorder
    try {
      await recorder.start()
      const Recognition =
        window.SpeechRecognition ?? window.webkitSpeechRecognition
      if (Recognition) {
        const recognition = new Recognition()
        recognition.lang = 'en-US'
        recognition.continuous = true
        recognition.interimResults = true
        recognition.onresult = (event) => {
          transcriptRef.current = Array.from(event.results)
            .map((result) => result[0]?.transcript ?? '')
            .join(' ')
            .trim()
        }
        recognitionRef.current = recognition
        try {
          recognition.start()
        } catch {
          recognitionRef.current = null
        }
      }
      setMachine((current) =>
        transitionPractice(current, { type: 'PERMISSION_GRANTED' }),
      )
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSeconds((seconds) => Math.min(30, seconds + 1))
      }, 1_000)
    } catch (error) {
      recorderRef.current = null
      const denied =
        error instanceof DOMException &&
        ['NotAllowedError', 'SecurityError'].includes(error.name)
      const unsupported =
        error instanceof Error && error.message === 'RECORDING_UNSUPPORTED'
      setMachine((current) =>
        transitionPractice(current, {
          type: denied || unsupported ? 'PERMISSION_DENIED' : 'FAIL',
          ...(denied || unsupported
            ? {}
            : {
                code: 'RECORDING_UNAVAILABLE',
                message: '当前浏览器无法录音，请改用键盘输入。',
              }),
        } as Parameters<typeof transitionPractice>[1]),
      )
    }
  }, [
    clearElapsedTimer,
    finishRecording,
    ready,
    machine.turnIndex,
    scene.recommendedTurns,
  ])

  const openKeyboard = useCallback(() => {
    if (!ready || machine.turnIndex >= scene.recommendedTurns) return
    if (machine.status === 'recording') {
      recorderRef.current?.cancel()
      recognitionRef.current?.abort()
      clearElapsedTimer()
      setMachine((current) => transitionPractice(current, { type: 'CANCEL' }))
    }
    setMachine((current) =>
      transitionPractice(current, {
        type: 'ENTER_TEXT',
        transcript: current.draftTranscript ?? '',
      }),
    )
  }, [
    clearElapsedTimer,
    machine.status,
    machine.turnIndex,
    ready,
    scene.recommendedTurns,
  ])

  const submitTurn = useCallback(async () => {
    if (
      !ready ||
      submittingRef.current ||
      machine.turnIndex >= scene.recommendedTurns
    )
      return
    const learnerText = machine.draftTranscript?.trim() ?? ''
    if (!learnerText && !audio) return
    submittingRef.current = true
    const turnIndex = machine.turnIndex
    setMachine((current) =>
      transitionPractice(current, { type: 'SUBMIT', hasAudio: Boolean(audio) }),
    )
    setMachine((current) =>
      transitionPractice(current, { type: 'SUBMISSION_ACCEPTED' }),
    )
    try {
      const history = [
        {
          speaker: 'ai' as const,
          text: sessionRef.current?.openingText ?? scene.openingLines[0],
        },
        ...turns.flatMap((turn) => [
          { speaker: 'learner' as const, text: turn.learnerText },
          { speaker: 'ai' as const, text: turn.aiText },
        ]),
      ]
      const completedGoalIds = sessionRef.current?.completedGoals ?? []
      const fingerprint = `${sessionId}:${turnIndex}:${learnerText || `audio:${audio?.blob.size ?? 0}`}`
      if (idempotencyRef.current?.fingerprint !== fingerprint) {
        idempotencyRef.current = {
          fingerprint,
          key:
            globalThis.crypto?.randomUUID?.() ??
            '00000000-0000-4000-8000-000000000000',
        }
      }
      let result: ConversationResult
      try {
        result = await submitTurnToApi({
          scene,
          transcript: learnerText,
          audio: audio?.blob,
          turnIndex,
          history,
          completedGoalIds,
          idempotencyKey: idempotencyRef.current.key,
        })
      } catch (error) {
        if (
          error instanceof TurnApiError &&
          (!error.retryable || error.code === 'RATE_LIMITED')
        )
          throw error
        if (!learnerText) throw error
        result = await localCoach.nextTurn({
          scene,
          learnerText,
          history,
          completedGoalIds,
          turnIndex,
        })
      }
      const now = new Date().toISOString()
      const persistedLearnerText = result.feedback.heard.trim() || learnerText
      const turn: PracticeTurn = {
        id: `${sessionId}:turn:${turnIndex}`,
        sessionId,
        index: turnIndex,
        learnerText: persistedLearnerText,
        aiText: result.reply.text,
        feedback: {
          corrected: result.feedback.corrected ?? persistedLearnerText,
          natural: result.feedback.naturalAlternative ?? persistedLearnerText,
          explanationZh: result.feedback.explanationZh,
          tags: result.feedback.issueTags,
        },
        degraded: result.degraded,
        result,
        createdAt: now,
      }
      if (!sessionRef.current) throw new Error('SESSION_NOT_READY')
      const updatedSession: PracticeSession = {
        ...sessionRef.current,
        completedGoals: result.progress.completedGoalIds,
        updatedAt: now,
      }
      await repositoriesRef.current.saveTurnAndSession(turn, updatedSession)
      sessionRef.current = updatedSession
      setCompletedGoalIds(updatedSession.completedGoals)
      setTurns((items) =>
        [...items.filter((item) => item.id !== turn.id), turn].sort(
          (a, b) => a.index - b.index,
        ),
      )
      setLatestResult(result)
      setAiReply(result.reply.text)
      setAiHint(result.reply.hintZh)
      setAudio(null)
      idempotencyRef.current = null
      setMachine((current) =>
        transitionPractice(current, { type: 'RESULT_RECEIVED' }),
      )
      if (mountedRef.current)
        void browserTts
          .speak(result.reply.text, { rate: scene.constraints.speechRate })
          .catch(() => undefined)
    } catch (error) {
      const noSpeech =
        error instanceof TurnApiError && error.code === 'NO_SPEECH'
      setMachine((current) =>
        transitionPractice(current, {
          type: 'FAIL',
          code: error instanceof TurnApiError ? error.code : 'AI_UNAVAILABLE',
          message: noSpeech
            ? '当前基础模式不能自动转写这段录音，请输入英文内容后继续。'
            : error instanceof TurnApiError
              ? error.message
              : '这一轮暂时没有处理成功，请重试或修改文字。',
        }),
      )
    } finally {
      submittingRef.current = false
    }
  }, [
    audio,
    machine.draftTranscript,
    machine.turnIndex,
    scene,
    sessionId,
    turns,
    ready,
  ])

  const completeSession = useCallback(async () => {
    setMachine((current) => transitionPractice(current, { type: 'COMPLETE' }))
    try {
      if (!sessionRef.current) throw new Error('SESSION_NOT_READY')
      const now = new Date().toISOString()
      const completedSession: PracticeSession = {
        ...sessionRef.current,
        status: 'completed',
        completedAt: now,
        updatedAt: now,
      }
      await repositoriesRef.current.sessions.save(completedSession)
      sessionRef.current = completedSession
      setMachine((current) =>
        transitionPractice(current, { type: 'SESSION_COMPLETED' }),
      )
    } catch {
      setMachine((current) =>
        transitionPractice(current, {
          type: 'FAIL',
          code: 'STORAGE_UNAVAILABLE',
          message: '暂时无法保存完成状态，请返回后重试。',
        }),
      )
    }
  }, [])

  const cancelReview = useCallback(() => {
    setAudio(null)
    transcriptRef.current = ''
    idempotencyRef.current = null
    setMachine((current) => transitionPractice(current, { type: 'CANCEL' }))
  }, [])

  return {
    sessionId,
    machine,
    ready,
    ephemeral,
    turns,
    completedGoalIds,
    latestResult,
    aiReply,
    aiHint,
    elapsedSeconds,
    amplitude,
    audio,
    startRecording,
    stopRecording: finishRecording,
    openKeyboard,
    updateTranscript: (transcript: string) =>
      setMachine((current) =>
        transitionPractice(current, { type: 'UPDATE_TRANSCRIPT', transcript }),
      ),
    cancelReview,
    retry: () =>
      setMachine((current) => transitionPractice(current, { type: 'RETRY' })),
    submitTurn,
    speakReply: () =>
      browserTts.speak(aiReply, { rate: scene.constraints.speechRate }),
    completeSession,
  }
}
