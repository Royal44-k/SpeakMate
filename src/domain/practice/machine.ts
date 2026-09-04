export type PracticeStatus =
  | 'idle'
  | 'requesting-permission'
  | 'recording'
  | 'reviewing'
  | 'submitting'
  | 'receiving'
  | 'ready'
  | 'completing'
  | 'completed'
  | 'recoverable-error'
  | 'text-only'

export interface PracticeState {
  status: PracticeStatus
  turnIndex: number
  draftTranscript?: string
  errorCode?: string
  errorMessage?: string
  retryStatus?: 'reviewing' | 'ready' | 'text-only'
}

export type PracticeEvent =
  | { type: 'START_SESSION' }
  | { type: 'PRESS_RECORD' }
  | { type: 'PERMISSION_GRANTED' }
  | { type: 'PERMISSION_DENIED' }
  | { type: 'RECORDING_READY'; transcript?: string }
  | { type: 'ENTER_TEXT'; transcript?: string }
  | { type: 'UPDATE_TRANSCRIPT'; transcript: string }
  | { type: 'CANCEL' }
  | { type: 'SUBMIT'; hasAudio?: boolean }
  | { type: 'SUBMISSION_ACCEPTED' }
  | { type: 'RESULT_RECEIVED' }
  | { type: 'COMPLETE' }
  | { type: 'SESSION_COMPLETED' }
  | { type: 'FAIL'; code: string; message: string }
  | { type: 'RETRY' }
  | { type: 'RESET' }

export const INITIAL_PRACTICE_STATE: PracticeState = {
  status: 'idle',
  turnIndex: 0,
}

function illegal(state: PracticeState, event: PracticeEvent): never {
  throw new Error(`Illegal practice transition: ${event.type} from ${state.status}`)
}

export function transitionPractice(
  state: PracticeState,
  event: PracticeEvent,
): PracticeState {
  if (event.type === 'RESET') return { ...INITIAL_PRACTICE_STATE }

  if (event.type === 'FAIL' && state.status !== 'completed') {
    const retryStatus = state.draftTranscript?.trim()
      ? 'reviewing'
      : state.status === 'submitting' || state.status === 'receiving'
        ? 'reviewing'
      : state.status === 'text-only'
        ? 'text-only'
        : 'ready'
    return {
      ...state,
      status: 'recoverable-error',
      errorCode: event.code,
      errorMessage: event.message,
      retryStatus,
    }
  }

  switch (state.status) {
    case 'idle':
      if (event.type === 'START_SESSION') return { ...state, status: 'ready' }
      if (event.type === 'PRESS_RECORD') return { ...state, status: 'requesting-permission' }
      if (event.type === 'ENTER_TEXT') return { ...state, status: 'reviewing', draftTranscript: event.transcript ?? '' }
      if (event.type === 'COMPLETE') return { ...state, status: 'completing' }
      return illegal(state, event)
    case 'ready':
      if (event.type === 'PRESS_RECORD') return { ...state, status: 'requesting-permission' }
      if (event.type === 'ENTER_TEXT') return { ...state, status: 'reviewing', draftTranscript: event.transcript ?? '' }
      if (event.type === 'COMPLETE') return { ...state, status: 'completing' }
      return illegal(state, event)
    case 'requesting-permission':
      if (event.type === 'PERMISSION_GRANTED') return { ...state, status: 'recording', errorCode: undefined, errorMessage: undefined }
      if (event.type === 'PERMISSION_DENIED') return { ...state, status: 'text-only', errorCode: 'MICROPHONE_DENIED', errorMessage: '无法使用麦克风，你仍可输入英文继续练习。' }
      if (event.type === 'CANCEL') return { ...state, status: 'ready' }
      return illegal(state, event)
    case 'recording':
      if (event.type === 'RECORDING_READY') return { ...state, status: 'reviewing', draftTranscript: event.transcript ?? '' }
      if (event.type === 'CANCEL') return { ...state, status: 'ready' }
      return illegal(state, event)
    case 'reviewing':
      if (event.type === 'UPDATE_TRANSCRIPT') return { ...state, draftTranscript: event.transcript }
      if (event.type === 'SUBMIT' && (state.draftTranscript?.trim() || event.hasAudio)) {
        return { ...state, status: 'submitting' }
      }
      if (event.type === 'CANCEL') return { ...state, status: 'ready', draftTranscript: undefined }
      return illegal(state, event)
    case 'submitting':
      if (event.type === 'SUBMISSION_ACCEPTED') return { ...state, status: 'receiving' }
      return illegal(state, event)
    case 'receiving':
      if (event.type === 'RESULT_RECEIVED') {
        return {
          status: 'ready',
          turnIndex: state.turnIndex + 1,
        }
      }
      return illegal(state, event)
    case 'text-only':
      if (event.type === 'ENTER_TEXT') return { ...state, status: 'reviewing', draftTranscript: event.transcript ?? '' }
      if (event.type === 'PRESS_RECORD') return { ...state, status: 'requesting-permission' }
      if (event.type === 'COMPLETE') return { ...state, status: 'completing' }
      return illegal(state, event)
    case 'recoverable-error':
      if (event.type === 'RETRY') {
        return {
          ...state,
          status: state.retryStatus ?? 'ready',
          errorCode: undefined,
          errorMessage: undefined,
          retryStatus: undefined,
        }
      }
      if (event.type === 'ENTER_TEXT') return { ...state, status: 'reviewing', draftTranscript: event.transcript ?? state.draftTranscript ?? '' }
      if (event.type === 'CANCEL') return { status: 'ready', turnIndex: state.turnIndex }
      return illegal(state, event)
    case 'completing':
      if (event.type === 'SESSION_COMPLETED') return { ...state, status: 'completed' }
      return illegal(state, event)
    case 'completed':
      return illegal(state, event)
  }
}
