import { act, render, screen, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { localContentProvider } from '@/content/dialogues/graded/provider'
import { SCENE_METADATA } from '@/content/scenes/metadata'
import { createDialogue } from '@/domain/ai/graded-dialogue'
import { presentGradedPractice } from '@/domain/practice/graded-presenter'
import type { PreparedPractice } from '@/domain/practice/prepared-practice'
import { PracticeStage } from './practice-stage'
import type { usePracticeSession } from './use-practice-session'

type StageFixture = ReturnType<typeof usePracticeSession> & {
  view: NonNullable<ReturnType<typeof usePracticeSession>['view']>
  record: NonNullable<ReturnType<typeof usePracticeSession>['record']>
}
const state = vi.hoisted(() => ({ value: {} as StageFixture }))
vi.mock('./use-practice-session', () => ({
  usePracticeSession: () => state.value,
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }))
let scene: PreparedPractice
beforeEach(async () => {
  const result = await localContentProvider.load({
    sceneId: 'dining-01',
    level: 'C1',
  })
  if (result.status !== 'available') throw new Error('fixture')
  scene = {
    ...SCENE_METADATA.find((item) => item.id === 'dining-01')!,
    level: 'C1',
    pack: result.pack,
    mode: 'short',
    variantId: 'counter',
  }
  const start = createDialogue(scene.pack, {
    mode: scene.mode,
    variantId: scene.variantId,
  })
  const session = {
    id: 'session-text',
    profileId: 'guest',
    sceneId: scene.id,
    sceneVersion: 1,
    level: scene.level,
    status: 'active' as const,
    startedAt: '2026-09-10T00:00:00.000Z',
    updatedAt: '2026-09-10T00:00:00.000Z',
    completedGoals: [],
    openingText: start.reply,
    gradedDialogue: start.snapshot,
  }
  const view = presentGradedPractice(session, [])
  state.value = {
    foreground: { error: '', retry: vi.fn() },
    sessionId: session.id,
    record: { session, turns: [], status: 'ready' },
    view,
    machine: { status: 'ready', turnIndex: 0, draftTranscript: '' },
    ready: true,
    reloading: false,
    turns: [],
    aiReply: start.reply,
    aiHint: view.currentQuestion!.hintZh,
    suggestions: view.currentQuestion!.answers,
    audio: null,
    amplitude: 0,
    elapsedSeconds: 2,
    feedbackExpanded: false,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    openKeyboard: vi.fn(),
    updateTranscript: vi.fn(),
    cancelReview: vi.fn(),
    retry: vi.fn(),
    reloadSession: vi.fn(),
    submitTurn: vi.fn(),
    submitAction: vi.fn(),
    speakReply: vi.fn().mockResolvedValue(undefined),
    completeSession: vi.fn(),
    stopSession: vi.fn(),
    discardPending: vi.fn(),
    chooseSuggestion: vi.fn(),
    beginChange: vi.fn(),
  } as unknown as StageFixture
})
afterEach(() => {
  delete document.documentElement.dataset.interactionBusy
  vi.unstubAllGlobals()
})

describe('graded practice stage', () => {
  it('reserves the actual expanded input dock height instead of hiding content at enlarged text', () => {
    let resize: () => void = () => undefined
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resize = callback
        }
        observe() {}
        disconnect() {}
      },
    )
    const view = render(
      <PracticeStage scene={scene} sessionId="session-text" />,
    )
    const dock = view.container.querySelector<HTMLElement>(
      '[data-practice-dock]',
    )
    expect(dock).not.toBeNull()
    Object.defineProperty(dock, 'getBoundingClientRect', {
      value: () => ({ height: 450 }),
    })
    act(() => resize())
    expect(
      document.documentElement.style.getPropertyValue('--practice-dock-space'),
    ).toBe('474px')
    view.unmount()
    expect(document.documentElement.style.getPropertyValue('--practice-dock-space')).toBe('')
  })
  it('shows full selected material before its exact question and only the current pair', () => {
    render(<PracticeStage scene={scene} sessionId="session-text" />)
    expect(screen.getByText(state.value.view.situationZh)).toBeVisible()
    expect(
      screen.getByText(state.value.view.currentQuestion!.text),
    ).toBeVisible()
    fireEvent.click(screen.getByText('本题参考表达'))
    for (const answer of state.value.suggestions)
      expect(screen.getByText(answer.text)).toBeVisible()
    expect(screen.getByText(/帮助和改答也占用轮次/)).toBeVisible()
    expect(screen.getByRole('button', { name: '停止本次练习' })).toBeEnabled()
    expect(screen.queryByText('这句话表达得很清楚')).not.toBeInTheDocument()
  })
  it('renders partial terminal confirmation with no question, input or automatic completion', () => {
    state.value.view = {
      ...state.value.view,
      canAnswer: false,
      canFinish: true,
      currentQuestion: undefined,
      outcome: 'partial',
      flow: {
        submittedTurns: 3,
        requiredUserTurns: 3,
        expressionTurns: 1,
        basis: 'path-cap',
      },
    }
    render(<PracticeStage scene={scene} sessionId="session-text" />)
    expect(screen.getByText(/本轮已到上限，仍有目标未确认/)).toBeVisible()
    expect(
      screen.queryByRole('button', { name: '改用键盘输入' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '确认结束并保存复盘' }),
    ).toBeEnabled()
    expect(state.value.completeSession).not.toHaveBeenCalled()
  })
  it('does not offer completion for an ineligible repair-only terminal', () => {
    state.value.view = {
      ...state.value.view,
      canAnswer: false,
      canFinish: false,
      currentQuestion: undefined,
      outcome: 'partial',
    }
    render(<PracticeStage scene={scene} sessionId="session-text" />)
    expect(
      screen.queryByRole('button', { name: '确认结束并保存复盘' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '开始录音' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '停止本次练习' })).toBeEnabled()
  })
  it('keeps local recording preview until nonempty English is confirmed and releases its URL', () => {
    const revoke = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: () => 'blob:local-preview',
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revoke,
    })
    state.value.machine.status = 'reviewing'
    state.value.audio = {
      blob: new Blob(['audio']),
      durationMs: 1000,
      mimeType: 'audio/webm',
      amplitudeSamples: [],
    }
    const rendered = render(
      <PracticeStage scene={scene} sessionId="session-text" />,
    )
    expect(screen.getByText(/录音仅用于本机回听/)).toBeVisible()
    expect(screen.getByRole('button', { name: '提交这一轮' })).toBeDisabled()
    expect(screen.getByLabelText('回听本次录音')).toHaveAttribute(
      'src',
      'blob:local-preview',
    )
    rendered.unmount()
    expect(revoke).toHaveBeenCalledWith('blob:local-preview')
  })
  it('preserves typed controls when local speech is unavailable', () => {
    state.value.speechError =
      '这台设备没有可用的本地英语音色，请直接阅读文字继续练习。'
    render(<PracticeStage scene={scene} sessionId="session-text" />)
    expect(screen.getByText(state.value.speechError)).toBeVisible()
    expect(screen.getByRole('button', { name: '改用键盘输入' })).toBeEnabled()
  })
  it.each(['submitting', 'receiving', 'completing'] as const)(
    'owns only a disabled processing dock while %s',
    (status) => {
      state.value.machine.status = status
      const rendered = render(
        <PracticeStage scene={scene} sessionId="session-text" />,
      )
      expect(
        screen.queryByRole('button', { name: '提交这一轮' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('region', { name: '语音输入' }),
      ).not.toBeInTheDocument()
      expect(document.documentElement.dataset.interactionBusy).toBe('true')
      rendered.unmount()
      expect(document.documentElement.dataset.interactionBusy).toBeUndefined()
    },
  )
  it('uses the graded feedback preference without fabricated correctness', () => {
    state.value.feedbackExpanded = true
    const source = {
      sceneId: scene.id,
      level: scene.level,
      sessionId: 'session-text',
    }
    state.value.view.history = [
      {
        turnId: 'one',
        input: { action: 'answer', text: 'Different words' },
        learner: { text: 'Different words', source },
        assistant: [],
        references: [],
        confirmation: 'unknown',
        feedback: { text: '未收录不代表说错。', source },
      },
    ]
    render(<PracticeStage scene={scene} sessionId="session-text" />)
    expect(screen.getByText('未收录不代表说错。')).toBeVisible()
    expect(screen.getByText('未匹配本地参考表达')).toBeVisible()
    expect(screen.queryByText('这句话表达得很清楚')).not.toBeInTheDocument()
  })
  it('keeps completed sessions read-only with a canonical report target', () => {
    state.value.record.session.status = 'completed'
    state.value.machine.status = 'completed'
    render(<PracticeStage scene={scene} sessionId="session-text" />)
    expect(screen.getByRole('link', { name: '查看本次复盘' })).toHaveAttribute(
      'href',
      '/session/report?id=session-text',
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute(
      'data-page-title',
    )
  })
})
