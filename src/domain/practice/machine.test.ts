import { describe, expect, it } from 'vitest'

import {
  INITIAL_PRACTICE_STATE,
  transitionPractice,
  type PracticeState,
} from './machine'

describe('transitionPractice', () => {
  it('lets the retained review dock edit and resubmit after an API failure', () => {
    const failed = transitionPractice(
      { status: 'receiving', turnIndex: 1, draftTranscript: 'Hello.' },
      { type: 'FAIL', code: 'RATE_LIMITED', message: '稍后重试。' },
    )
    const edited = transitionPractice(failed, {
      type: 'UPDATE_TRANSCRIPT',
      transcript: 'Could I have a latte?',
    })
    expect(edited.draftTranscript).toBe('Could I have a latte?')
    expect(transitionPractice(edited, { type: 'SUBMIT' }).status).toBe(
      'submitting',
    )
    expect(transitionPractice(failed, { type: 'SUBMIT' }).status).toBe(
      'submitting',
    )
  })
  it('moves from idle through a successful recorded turn', () => {
    let state = transitionPractice(INITIAL_PRACTICE_STATE, {
      type: 'PRESS_RECORD',
    })
    expect(state.status).toBe('requesting-permission')

    state = transitionPractice(state, { type: 'PERMISSION_GRANTED' })
    expect(state.status).toBe('recording')

    state = transitionPractice(state, {
      type: 'RECORDING_READY',
      transcript: 'I have a reservation.',
    })
    expect(state.status).toBe('reviewing')
    expect(state.draftTranscript).toBe('I have a reservation.')

    state = transitionPractice(state, { type: 'SUBMIT' })
    state = transitionPractice(state, { type: 'SUBMISSION_ACCEPTED' })
    state = transitionPractice(state, { type: 'RESULT_RECEIVED' })

    expect(state).toMatchObject({ status: 'ready', turnIndex: 1 })
  })

  it('uses text-only mode when microphone permission is denied', () => {
    const requesting = transitionPractice(INITIAL_PRACTICE_STATE, {
      type: 'PRESS_RECORD',
    })
    const denied = transitionPractice(requesting, { type: 'PERMISSION_DENIED' })

    expect(denied.status).toBe('text-only')
    expect(denied.errorCode).toBe('MICROPHONE_DENIED')
  })

  it('submits a recorded turn even when browser speech recognition returns no transcript', () => {
    let state = transitionPractice(INITIAL_PRACTICE_STATE, {
      type: 'PRESS_RECORD',
    })
    state = transitionPractice(state, { type: 'PERMISSION_GRANTED' })
    state = transitionPractice(state, {
      type: 'RECORDING_READY',
      transcript: '',
    })

    expect(
      transitionPractice(state, { type: 'SUBMIT', hasAudio: true }).status,
    ).toBe('submitting')
  })

  it('returns an audio-only failed submission to editable review state', () => {
    const failed = transitionPractice(
      { status: 'receiving', turnIndex: 0, draftTranscript: '' },
      { type: 'FAIL', code: 'NO_SPEECH', message: '请输入英文内容。' },
    )

    expect(transitionPractice(failed, { type: 'RETRY' }).status).toBe(
      'reviewing',
    )
  })

  it('retains a safe retry target after a recoverable failure', () => {
    const submitting: PracticeState = {
      status: 'submitting',
      turnIndex: 2,
      draftTranscript: 'Could you check the booking?',
    }

    const failed = transitionPractice(submitting, {
      type: 'FAIL',
      code: 'AI_UNAVAILABLE',
      message: '网络开了个小差。',
    })

    expect(failed.status).toBe('recoverable-error')
    expect(transitionPractice(failed, { type: 'RETRY' }).status).toBe(
      'reviewing',
    )
  })

  it('returns a failed completion save to a retryable ready state', () => {
    const completing = transitionPractice(
      { status: 'ready', turnIndex: 3 },
      { type: 'COMPLETE' },
    )
    const failed = transitionPractice(completing, {
      type: 'FAIL',
      code: 'STORAGE_UNAVAILABLE',
      message: '暂时无法保存完成状态。',
    })

    expect(failed.status).toBe('recoverable-error')
    expect(transitionPractice(failed, { type: 'RETRY' })).toMatchObject({
      status: 'ready',
      turnIndex: 3,
    })
  })

  it('throws on illegal transitions instead of silently corrupting a session', () => {
    const recording: PracticeState = { status: 'recording', turnIndex: 0 }
    expect(() =>
      transitionPractice(recording, { type: 'START_SESSION' }),
    ).toThrow(/START_SESSION.*recording/)
  })
})
