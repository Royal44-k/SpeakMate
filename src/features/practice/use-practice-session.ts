'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createDialogue, type DialogueInput } from '@/domain/ai/graded-dialogue'
import {
  INITIAL_PRACTICE_STATE,
  transitionPractice,
  type PracticeState,
} from '@/domain/practice/machine'
import type { PreparedPractice } from '@/domain/practice/prepared-practice'
import type { PracticeSession } from '@/domain/practice/types'
import { presentGradedPractice } from '@/domain/practice/graded-presenter'
import { practiceFlow } from '@/domain/practice/graded-evidence'
import { browserTts } from '@/infrastructure/audio/browser-tts'
import {
  startLocalRecognition,
  type LocalSpeechRecognition,
} from '@/infrastructure/audio/local-recognition'
import {
  createRecorder,
  type BrowserRecorder,
  type RecordedAudio,
} from '@/infrastructure/audio/browser-recorder'
import {
  createIndexedDbRepositories,
  type Repositories,
} from '@/infrastructure/persistence/repositories'
import type {
  PracticeChange,
  PracticeRecord,
} from '@/infrastructure/persistence/practice-repository'
import {
  DEFAULT_LEARNER_SETTINGS,
  loadLearnerSettings,
} from '@/infrastructure/persistence/learner-settings'
import { replaceCreatedSessionId } from '@/components/app-shell/learning-routes'

const createId = (prefix: string) =>
  `${prefix}_${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
function errorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : ''
  if (/STALE|CONFLICT/.test(code))
    return '这次练习已在别处变化。文字仍保留，请读取最新题目并重新确认后提交；不会自动把旧答案交给新问题。'
  if (/NOT_RESUMABLE|DIALOGUE|INVALID|TERMINAL/.test(code))
    return '保存的内容或状态不支持这次操作。记录已保留，请返回查看或重试读取。'
  if (/SETTLEMENT/.test(code))
    return '此任务的完成结算尚未接通，未标记完成，也未发放积分。'
  return '本机保存暂时失败，文字仍保留。请重试；不会另建临时会话或清除记录。'
}

/** One pinned record; all lifecycle writes use the existing guarded repository. */
export function usePracticeSession(
  scene: PreparedPractice,
  requestedId: string,
  repositories?: Repositories,
) {
  const [repository] = useState(
    () => repositories ?? createIndexedDbRepositories(),
  )
  const [record, setRecord] = useState<PracticeRecord>()
  const recordRef = useRef<PracticeRecord | undefined>(undefined)
  const [machine, setMachine] = useState<PracticeState>(INITIAL_PRACTICE_STATE)
  const [ready, setReady] = useState(false)
  const [settings, setSettings] = useState(DEFAULT_LEARNER_SETTINGS)
  const [settingsError, setSettingsError] = useState('')
  const [addressError, setAddressError] = useState('')
  const [speechError, setSpeechError] = useState<string | null>(null)
  const [audio, setAudio] = useState<RecordedAudio | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [amplitude, setAmplitude] = useState(0)
  const [changeQuestionId, setChangeQuestionId] = useState<string>()
  const suggestionRef = useRef<string | undefined>(undefined)
  const recorderRef = useRef<BrowserRecorder | null>(null)
  const recognitionRef = useRef<LocalSpeechRecognition | null>(null)
  const recognitionControllerRef = useRef<AbortController | null>(null)
  const transcriptRef = useRef('')
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const finishingRef = useRef(false)
  const submittingRef = useRef(false)
  const mountedRef = useRef(false)
  const initializationRef = useRef<Promise<PracticeRecord> | null>(null)
  const creationRef = useRef<PracticeSession | undefined>(undefined)
  const [initializationAttempt, setInitializationAttempt] = useState(0)
  const pendingRef = useRef<PracticeChange | undefined>(undefined)
  const recoveryReadRef = useRef(0)
  const [reloading, setReloading] = useState(false)
  const invalidateRecoveryRead = useCallback(() => {
    recoveryReadRef.current += 1
    setReloading(false)
  }, [])

  const clearElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current)
    elapsedTimerRef.current = null
  }, [])
  const releaseAudio = useCallback(() => {
    clearElapsedTimer()
    const recorder = recorderRef.current
    recorderRef.current = null
    recorder?.cancel()
    recognitionControllerRef.current?.abort()
    recognitionRef.current?.abort()
    recognitionRef.current = null
    browserTts.stop()
  }, [clearElapsedTimer])
  const applyRecord = useCallback(
    (next: PracticeRecord, preserveDraft = false) => {
      recordRef.current = next
      setRecord(next)
      setMachine((current) => {
        const draft = preserveDraft ? current.draftTranscript : undefined
        return {
          status:
            next.session.status === 'completed'
              ? 'completed'
              : draft
                ? 'reviewing'
                : 'ready',
          turnIndex: next.turns.length,
          ...(draft ? { draftTranscript: draft } : {}),
        }
      })
    },
    [],
  )

  useEffect(() => {
    let active = true
    mountedRef.current = true
    initializationRef.current ??= (async () => {
      if (requestedId !== 'new') {
        const saved = await repository.practice.read(requestedId)
        if (!saved || saved.status !== 'ready')
          throw new Error('PRACTICE_NOT_RESUMABLE')
        return saved
      }
      const profile = await repository.profiles.ensureGuestProfile()
      const start = createDialogue(scene.pack, {
        mode: scene.mode,
        variantId: scene.variantId,
      })
      const timestamp = new Date().toISOString()
      creationRef.current ??= {
        id: createId('session'),
        profileId: profile.id,
        sceneId: scene.id,
        sceneVersion: scene.version,
        level: scene.level,
        status: 'active' as const,
        startedAt: timestamp,
        updatedAt: timestamp,
        completedGoals: [],
        openingText: start.reply,
        gradedDialogue: start.snapshot,
        ...(scene.presentation ? { presentation: scene.presentation } : {}),
      }
      return (
        await repository.practice.commit({
          kind: 'create',
          session: creationRef.current,
        })
      ).record
    })()
    void initializationRef.current
      .then((saved) => {
        if (!active) return
        applyRecord(saved)
        if (requestedId === 'new') {
          try {
            replaceCreatedSessionId(saved.session.id)
          } catch {
            setAddressError(
              '练习已保存，但地址未更新。请使用本页的已保存练习入口继续；不要重新新建。',
            )
          }
        }
        setReady(true)
      })
      .catch((error) => {
        if (active)
          setMachine((current) =>
            transitionPractice(current, {
              type: 'FAIL',
              code: 'STORAGE_UNAVAILABLE',
              message: errorMessage(error),
            }),
          )
      })
    // A settings failure must not rerun creation or swap repositories.
    void loadLearnerSettings()
      .then((saved) => {
        if (active) setSettings(saved)
      })
      .catch(() => {
        if (active)
          setSettingsError(
            '设置暂时无法读取，使用本地默认设置；这不会另建或替换练习。',
          )
      })
    return () => {
      active = false
      mountedRef.current = false
      recoveryReadRef.current += 1
      releaseAudio()
    }
  }, [
    applyRecord,
    releaseAudio,
    repository,
    requestedId,
    scene,
    initializationAttempt,
  ])

  const canAnswer = () =>
    ready &&
    recordRef.current?.session.status === 'active' &&
    (!recordRef.current.session.simulation ||
      !!recordRef.current.session.simulation.composition) &&
    recordRef.current.session.gradedDialogue?.state.outcome === 'active'
  const speak = useCallback(
    async (text: string) => {
      setSpeechError(null)
      try {
        await browserTts.speak(text, { rate: settings.speechRate })
      } catch (error) {
        if (mountedRef.current)
          setSpeechError(
            error instanceof Error &&
              error.message === 'LOCAL_ENGLISH_VOICE_UNAVAILABLE'
              ? '这台设备没有可用的本地英语音色，请直接阅读文字继续练习。'
              : '本地朗读暂时不可用，请直接阅读文字继续练习。',
          )
      }
    },
    [settings.speechRate],
  )

  const finishRecording = useCallback(async () => {
    const recorder = recorderRef.current
    if (finishingRef.current || !recorder) return
    finishingRef.current = true
    clearElapsedTimer()
    recognitionRef.current?.stop()
    recognitionControllerRef.current?.abort()
    try {
      const recording = await recorder.stop()
      if (!mountedRef.current || recorderRef.current !== recorder) return
      setAudio(recording)
      setMachine((current) =>
        transitionPractice(current, {
          type: 'RECORDING_READY',
          transcript: transcriptRef.current,
        }),
      )
    } catch (error) {
      if (mountedRef.current && recorderRef.current === recorder)
        setMachine((current) =>
          transitionPractice(current, {
            type: 'FAIL',
            code: 'RECORDING_FAILED',
            message:
              error instanceof Error ? error.message : '录音没有成功，请重试。',
          }),
        )
    } finally {
      if (recorderRef.current === recorder) {
        recorderRef.current = null
        recognitionRef.current = null
        setAmplitude(0)
      }
      finishingRef.current = false
    }
  }, [clearElapsedTimer])

  async function startRecording() {
    if (
      !canAnswer() ||
      submittingRef.current ||
      recorderRef.current ||
      !['ready', 'recoverable-error', 'permission-denied'].includes(
        machine.status,
      )
    )
      return
    invalidateRecoveryRead()
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
        recognitionControllerRef.current?.abort()
        recognitionRef.current?.abort()
        recorderRef.current = null
        recognitionRef.current = null
        setAmplitude(0)
        setAudio(null)
        setMachine((current) =>
          ['recording', 'requesting-permission'].includes(current.status)
            ? transitionPractice(current, { type: 'CANCEL' })
            : current,
        )
      },
    })
    recorderRef.current = recorder
    const controller = new AbortController()
    recognitionControllerRef.current?.abort()
    recognitionControllerRef.current = controller
    try {
      await recorder.start()
      if (!mountedRef.current) {
        controller.abort()
        return
      }
      if (recorderRef.current !== recorder) {
        recorder.cancel()
        controller.abort()
        return
      }
      setMachine((current) =>
        transitionPractice(current, { type: 'PERMISSION_GRANTED' }),
      )
      elapsedTimerRef.current = setInterval(
        () => setElapsedSeconds((seconds) => Math.min(30, seconds + 1)),
        1000,
      )
      void startLocalRecognition({
        locale: 'en-US',
        signal: controller.signal,
        onTranscript: (transcript) => {
          transcriptRef.current = transcript
        },
      }).then((recognition) => {
        if (controller.signal.aborted || recorderRef.current !== recorder) {
          recognition?.abort()
          return
        }
        recognitionRef.current = recognition
      })
    } catch (error) {
      controller.abort()
      if (!mountedRef.current || recorderRef.current !== recorder) return
      recorderRef.current = null
      const denied =
        error instanceof DOMException &&
        ['NotAllowedError', 'SecurityError'].includes(error.name)
      const unsupported =
        error instanceof Error && error.message === 'RECORDING_UNSUPPORTED'
      setMachine((current) =>
        transitionPractice(
          current,
          denied || unsupported
            ? { type: 'PERMISSION_DENIED' }
            : {
                type: 'FAIL',
                code: 'RECORDING_UNAVAILABLE',
                message: '当前浏览器无法录音，请改用键盘输入。',
              },
        ),
      )
    }
  }
  function openKeyboard() {
    if (!canAnswer() || submittingRef.current) return
    if (recorderRef.current) {
      releaseAudio()
      setMachine((current) => transitionPractice(current, { type: 'CANCEL' }))
    }
    setMachine((current) =>
      current.status === 'reviewing'
        ? current
        : transitionPractice(current, {
            type: 'ENTER_TEXT',
            transcript: current.draftTranscript ?? '',
          }),
    )
  }

  async function commit(change: PracticeChange) {
    if (submittingRef.current) return
    invalidateRecoveryRead()
    submittingRef.current = true
    setMachine((current) => ({
      ...current,
      status: change.kind === 'finish' ? 'completing' : 'submitting',
      errorMessage: undefined,
    }))
    pendingRef.current = change
    try {
      const saved = await repository.practice.commit(change)
      if (!mountedRef.current) return
      applyRecord(saved.record)
      pendingRef.current = undefined
      setAudio(null)
      transcriptRef.current = ''
      setChangeQuestionId(undefined)
      suggestionRef.current = undefined
      if (change.kind === 'advance' && settings.autoPlayAi)
        void speak(saved.record.session.gradedDialogue!.state.reply)
      return true
    } catch (error) {
      if (mountedRef.current)
        setMachine((current) =>
          transitionPractice(current, {
            type: 'FAIL',
            code:
              error instanceof Error ? error.message : 'STORAGE_UNAVAILABLE',
            message: errorMessage(error),
          }),
        )
    } finally {
      submittingRef.current = false
    }
  }
  async function submitTurn() {
    if (!canAnswer()) return
    const text = machine.draftTranscript ?? ''
    if (!text.trim()) return
    const input: DialogueInput = changeQuestionId
      ? {
          action: 'change',
          questionId: changeQuestionId,
          text,
          ...(suggestionRef.current
            ? { suggestionId: suggestionRef.current }
            : {}),
        }
      : {
          action: 'answer',
          text,
          ...(suggestionRef.current
            ? { suggestionId: suggestionRef.current }
            : {}),
        }
    const pending = pendingRef.current
    const attempt =
      pending?.kind === 'advance' &&
      JSON.stringify(pending.input) === JSON.stringify(input)
        ? pending
        : {
            kind: 'advance' as const,
            expected: recordRef.current!.session,
            turnId: createId('turn'),
            input,
            at: new Date().toISOString(),
          }
    await commit(attempt)
  }
  async function submitAction(
    action: 'clarify' | 'struggle' | 'off-topic' | 'refuse',
  ) {
    if (
      !canAnswer() ||
      machine.draftTranscript?.trim() ||
      audio ||
      recorderRef.current ||
      [
        'recording',
        'requesting-permission',
        'submitting',
        'completing',
      ].includes(machine.status)
    )
      return
    const pending = pendingRef.current
    await commit(
      pending?.kind === 'advance' && pending.input.action === action
        ? pending
        : {
            kind: 'advance',
            expected: recordRef.current!.session,
            turnId: createId('turn'),
            input: { action, text: '' },
            at: new Date().toISOString(),
          },
    )
  }
  async function completeSession() {
    const current = recordRef.current
    if (
      !current ||
      current.session.status !== 'active' ||
      !practiceFlow(current.session.gradedDialogue!).basis
    )
      return
    await commit(
      pendingRef.current?.kind === 'finish'
        ? pendingRef.current
        : {
            kind: 'finish',
            expected: current.session,
            at: new Date().toISOString(),
          },
    )
  }
  async function stopSession() {
    const current = recordRef.current
    if (!current || current.session.status !== 'active') return
    releaseAudio()
    await commit(
      pendingRef.current?.kind === 'stop'
        ? pendingRef.current
        : {
            kind: 'stop',
            expected: current.session,
            at: new Date().toISOString(),
          },
    )
  }
  async function reloadSession() {
    if (!recordRef.current || submittingRef.current) return
    const expected = recordRef.current
    const generation = ++recoveryReadRef.current
    const ownsRead = () =>
      mountedRef.current &&
      generation === recoveryReadRef.current &&
      recordRef.current === expected
    setReloading(true)
    try {
      const next = await repository.practice.read(expected.session.id)
      if (!ownsRead()) return
      if (!next || next.status !== 'ready')
        throw new Error('PRACTICE_NOT_RESUMABLE')
      pendingRef.current = undefined
      setChangeQuestionId(undefined)
      suggestionRef.current = undefined
      // Read the latest React draft, not the closure from the recovery click.
      applyRecord(next, true)
    } catch (error) {
      if (ownsRead())
        setMachine((current) =>
          transitionPractice(current, {
            type: 'FAIL',
            code: 'STORAGE_UNAVAILABLE',
            message: errorMessage(error),
          }),
        )
    } finally {
      if (mountedRef.current && generation === recoveryReadRef.current)
        setReloading(false)
    }
  }
  function cancelReview() {
    invalidateRecoveryRead()
    setAudio(null)
    transcriptRef.current = ''
    pendingRef.current = undefined
    setChangeQuestionId(undefined)
    suggestionRef.current = undefined
    setMachine((current) => transitionPractice(current, { type: 'CANCEL' }))
  }
  const view = useMemo(
    () =>
      record?.status === 'ready'
        ? presentGradedPractice(record.session, record.turns)
        : undefined,
    [record],
  )
  const target = changeQuestionId
    ? record?.session.gradedDialogue?.pack.questions.find(
        (question) => question.id === changeQuestionId,
      )
    : undefined
  return {
    sessionId: record?.session.id ?? requestedId,
    record,
    view,
    machine,
    ready,
    reloading,
    settingsError,
    addressError,
    feedbackExpanded: settings.feedbackExpanded,
    speechError,
    turns: record?.turns ?? [],
    aiReply: record?.session.gradedDialogue?.state.reply ?? '',
    aiHint: view?.currentQuestion?.hintZh ?? '',
    elapsedSeconds,
    amplitude,
    audio,
    changeQuestionId,
    targetQuestion: target,
    suggestions: target?.answers ?? view?.currentQuestion?.answers ?? [],
    startRecording,
    stopRecording: finishRecording,
    openKeyboard,
    updateTranscript: (text: string) => {
      if (!submittingRef.current)
        setMachine((current) =>
          transitionPractice(current, {
            type: 'UPDATE_TRANSCRIPT',
            transcript: text.slice(0, 20000),
          }),
        )
    },
    chooseSuggestion: (id: string, text: string) => {
      if (!canAnswer() || submittingRef.current) return
      invalidateRecoveryRead()
      suggestionRef.current = id
      setMachine((current) => ({
        ...current,
        status: 'reviewing',
        draftTranscript: text,
      }))
    },
    beginChange: (questionId: string) => {
      if (!canAnswer() || submittingRef.current) return
      const snapshot = recordRef.current!.session.gradedDialogue!
      const question = snapshot.pack.questions.find(
        (question) => question.id === questionId,
      )
      if (
        !question ||
        !snapshot.state.completedObjectives.includes(question.objective)
      )
        return
      invalidateRecoveryRead()
      setChangeQuestionId(questionId)
      suggestionRef.current = undefined
      setMachine((current) => ({
        ...current,
        status: 'reviewing',
        draftTranscript: '',
      }))
    },
    cancelReview,
    retry: () =>
      setMachine((current) => transitionPractice(current, { type: 'RETRY' })),
    reloadSession,
    submitTurn,
    submitAction,
    completeSession,
    submitSimulationStep: async (text: string) => {
      const current = recordRef.current
      if (
        !current?.session.simulation ||
        current.session.simulation.composition ||
        current.session.status !== 'active'
      )
        return false
      const kind = current.session.simulation.recall ? 'compose' : 'recall'
      const pending = pendingRef.current
      return !!(await commit(
        pending?.kind === kind && pending.text === text.trim()
          ? pending
          : {
              kind,
              expected: current.session,
              text: text.trim(),
              at: new Date().toISOString(),
            },
      ))
    },
    stopSession,
    retryInitialization: () => {
      if (ready) return
      initializationRef.current = null
      setMachine(INITIAL_PRACTICE_STATE)
      setInitializationAttempt((value) => value + 1)
    },
    discardPending: () => {
      invalidateRecoveryRead()
      releaseAudio()
      setAudio(null)
      transcriptRef.current = ''
    },
    speakReply: () =>
      speak(recordRef.current?.session.gradedDialogue?.state.reply ?? ''),
  }
}
