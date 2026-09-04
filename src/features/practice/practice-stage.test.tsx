import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { getSceneBySlug } from '@/content/scenes/catalog'
import { adaptScene } from '@/domain/scenes/adapt-scene'

import { PracticeStage } from './practice-stage'

const practiceState = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}))

vi.mock('./use-practice-session', () => ({
  usePracticeSession: () => practiceState.value,
}))

describe('PracticeStage audio review', () => {
  it('allows a recording to reach server-side speech recognition without local transcript', () => {
    practiceState.value = {
      sessionId: 'session-audio',
      machine: { status: 'reviewing', turnIndex: 0, draftTranscript: '' },
      ready: true,
      ephemeral: false,
      turns: [],
      latestResult: null,
      aiReply: 'How can I help?',
      aiHint: '回应对方。',
      elapsedSeconds: 2,
      amplitude: 0,
      audio: { blob: new Blob(['audio'], { type: 'audio/webm' }) },
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
    const scene = adaptScene(getSceneBySlug('hotel-check-in')!, 'B1')

    render(<PracticeStage scene={scene} sessionId="session-audio" />)

    expect(screen.getByText(/将先尝试云端识别/)).toBeVisible()
    expect(screen.getByRole('button', { name: '提交这一轮' })).toBeEnabled()
  })
})
