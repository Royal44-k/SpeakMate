import type {
  ConversationHistoryItem,
  ConversationResult,
} from '@/domain/ai/contracts'
import type { AdaptedScene } from '@/domain/scenes/types'

export interface TurnSubmission {
  scene: AdaptedScene
  transcript: string
  audio?: Blob
  turnIndex: number
  history: ConversationHistoryItem[]
  completedGoalIds: string[]
  idempotencyKey: string
}

export interface TurnApiResult extends ConversationResult {
  requestId: string
  latencyMs: number
}

export class TurnApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly retryable: boolean,
  ) {
    super(message)
    this.name = 'TurnApiError'
  }
}

export async function submitTurn(
  submission: TurnSubmission,
  signal?: AbortSignal,
): Promise<TurnApiResult> {
  const form = new FormData()
  if (submission.audio) {
    const extension = submission.audio.type.includes('mp4') ? 'm4a' : 'webm'
    form.set('audio', submission.audio, `turn.${extension}`)
  }
  if (submission.transcript)
    form.set('transcript', submission.transcript.slice(0, 500))
  form.set(
    'session',
    JSON.stringify({
      sceneId: submission.scene.id,
      sceneVersion: submission.scene.version,
      sceneSnapshot: submission.scene,
      level: submission.scene.level,
      turnIndex: submission.turnIndex,
      recentTurns: submission.history.slice(-8),
      completedGoalIds: submission.completedGoalIds,
    }),
  )
  form.set('idempotencyKey', submission.idempotencyKey)

  const response = await fetch('/api/v1/turns', {
    method: 'POST',
    body: form,
    signal,
  })
  const body = (await response.json()) as
    TurnApiResult | { code?: string; message?: string; retryable?: boolean }
  if (!response.ok) {
    throw new TurnApiError(
      'message' in body && body.message
        ? body.message
        : '这一轮暂时没有处理成功。',
      'code' in body && body.code ? body.code : 'AI_UNAVAILABLE',
      'retryable' in body && Boolean(body.retryable),
    )
  }
  return body as TurnApiResult
}
