import { describe, expect, it } from 'vitest'

import {
  INITIAL_PRACTICE_STATE,
  transitionPractice,
  type PracticeState,
} from './machine'

describe('transitionPractice', () => {
  it('moves from idle through a successful recorded turn', () => {
    let state = transitionPractice(INITIAL_PRACTICE_STATE, { type: 'PRESS_RECORD' })
    expect(state.status).toBe('requesting-permission')

    state = transitionPractice(state, { type: 'PERMISSION_GRANTED' })
    expect(state.status).toBe('recording')

    state = transitionPractice(state, { type: 'RECORDING_READY', transcript: 'I have a reservation.' })
    expect(state.status).toBe('reviewing')
    expect(state.draftTranscript).toBe('I have a reservation.')

    state = transitionPractice(state, { type: 'SUBMIT' })
    state = transitionPractice(state, { type: 'SUBMISSION_ACCEPTED' })
    state = transitionPractice(state, { type: 'RESULT_RECEIVED' })

    expect(state).toMatchObject({ status: 'ready', turnIndex: 1 })
  })

  it('uses text-only mode when microphone permission is denied', () => {
    const requesting = transitionPractice(INITIAL_PRACTICE_STATE, { type: 'PRESS_RECORD' })
    const denied = transitionPractice(requesting, { type: 'PERMISSION_DENIED' })

    expect(denied.status).toBe('text-only')
    expect(denied.errorCode).toBe('MICROPHONE_DENIED')
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
    expect(transitionPractice(failed, { type: 'RETRY' }).status).toBe('reviewing')
  })

  it('throws on illegal transitions instead of silently corrupting a session', () => {
    const recording: PracticeState = { status: 'recording', turnIndex: 0 }
    expect(() => transitionPractice(recording, { type: 'START_SESSION' })).toThrow(
      /START_SESSION.*recording/,
    )
  })
})
