import { readFileSync } from 'node:fs'

import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getSceneBySlug } from '@/content/scenes/catalog'
import { adaptScene } from '@/domain/scenes/adapt-scene'

import { PracticeStage } from './practice-stage'

const practiceState = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}))

const { routerReplace } = vi.hoisted(() => ({
  routerReplace: vi.fn(),
}))

vi.mock('./use-practice-session', () => ({
  usePracticeSession: () => practiceState.value,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: routerReplace }),
}))

const scene = adaptScene(getSceneBySlug('hotel-check-in')!, 'B1')

function setPracticeState(
  status: string,
  overrides: Record<string, unknown> = {},
) {
  practiceState.value = {
    sessionId: 'session-text',
    machine: { status, turnIndex: 0, draftTranscript: '', ...overrides },
    ready: true,
    ephemeral: false,
    turns: [],
    latestResult: null,
    aiReply: 'How can I help?',
    aiHint: '回应对方。',
    elapsedSeconds: 2,
    amplitude: 0,
    audio: null,
    completedGoalIds: [],
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    openKeyboard: vi.fn(),
    updateTranscript: vi.fn(),
    cancelReview: vi.fn(),
    retry: vi.fn(),
    submitTurn: vi.fn(),
    speakReply: vi.fn(),
    completeSession: vi.fn(),
  }
}

afterEach(() => {
  delete document.documentElement.dataset.interactionBusy
})

describe('PracticeStage audio review', () => {
  it('allows a recording to reach server-side speech recognition without local transcript', () => {
    setPracticeState('reviewing')
    practiceState.value = {
      ...practiceState.value,
      sessionId: 'session-audio',
      audio: { blob: new Blob(['audio'], { type: 'audio/webm' }) },
    }

    render(<PracticeStage scene={scene} sessionId="session-audio" />)

    expect(screen.getByText(/将先尝试云端识别/)).toBeVisible()
    expect(screen.getByRole('button', { name: '提交这一轮' })).toBeEnabled()
  })
})

describe('PracticeStage dock ownership', () => {
  it('renders the text review as the only practice dock', () => {
    setPracticeState('reviewing', { draftTranscript: 'Hello' })

    render(<PracticeStage scene={scene} sessionId="session-text" />)

    expect(
      screen.getByRole('region', { name: '确认你刚才说的话' }),
    ).toBeVisible()
    expect(
      screen.queryByRole('button', { name: '开始录音' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '提交这一轮' }),
    ).toBeEnabled()
  })

  it.each(['submitting', 'receiving']) (
    'renders only processing controls while %s',
    (status) => {
      setPracticeState(status, { draftTranscript: 'Hello' })

      render(<PracticeStage scene={scene} sessionId="session-text" />)

      expect(
        screen.queryByRole('region', { name: '语音输入' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: '提交这一轮' }),
      ).not.toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent(
        '正在理解并准备下一句',
      )
    },
  )

  it('locks completion persistence behind a disabled saving dock', () => {
    setPracticeState('completing')

    render(<PracticeStage scene={scene} sessionId="session-text" />)

    const saving = screen.getByRole('status')
    expect(saving).toHaveTextContent('正在保存练习…')
    expect(saving.parentElement).toHaveAttribute('aria-disabled', 'true')
    expect(document.documentElement.dataset.interactionBusy).toBe('true')
    expect(
      screen.queryByRole('region', { name: '语音输入' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '改用键盘输入' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '提交这一轮' }),
    ).not.toBeInTheDocument()
  })
})

describe('PracticeStage fixed-layer safety', () => {
  it('owns the interaction-busy flag only during guarded machine work', () => {
    setPracticeState('recording')
    const view = render(
      <PracticeStage scene={scene} sessionId="session-text" />,
    )

    expect(document.documentElement.dataset.interactionBusy).toBe('true')

    setPracticeState('ready')
    view.rerender(<PracticeStage scene={scene} sessionId="session-text" />)

    expect(document.documentElement).not.toHaveAttribute(
      'data-interaction-busy',
    )

    setPracticeState('receiving')
    view.rerender(<PracticeStage scene={scene} sessionId="session-text" />)
    expect(document.documentElement.dataset.interactionBusy).toBe('true')

    view.unmount()
    expect(document.documentElement).not.toHaveAttribute(
      'data-interaction-busy',
    )
  })

  it('keeps completion actions clear of the fixed practice dock', () => {
    const styles = readFileSync(
      'src/features/practice/practice-stage.module.css',
      'utf8',
    )

    expect(styles).toMatch(
      /\.completeButton\s*{[^}]*scroll-margin-bottom:\s*calc\(var\(--speech-dock-height\) \+ 24px\);/s,
    )
  })
})

describe('PracticeStage completion', () => {
  it('leaves only the deterministic report destination after a session completes', () => {
    setPracticeState('completed')

    render(<PracticeStage scene={scene} sessionId="session-text" />)

    expect(
      screen.getByRole('link', { name: '查看本次复盘' }),
    ).toHaveAttribute('href', '/session/session-text/report')
    expect(
      screen.getByRole('heading', { level: 1, name: '这次真的开口了。' }),
    ).toHaveAttribute('data-page-title')
    expect(
      screen.getByRole('heading', { level: 1, name: '这次真的开口了。' }),
    ).toHaveAttribute('tabindex', '-1')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '语音输入' })).not.toBeInTheDocument()
  })

  it('keeps a restored completed session out of the ready practice controls', () => {
    setPracticeState('ready')

    render(
      <PracticeStage scene={scene} sessionId="session-text" completed />,
    )

    expect(
      screen.getByRole('link', { name: '查看本次复盘' }),
    ).toHaveAttribute('href', '/session/session-text/report')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '语音输入' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '提交这一轮' })).not.toBeInTheDocument()
  })
})
