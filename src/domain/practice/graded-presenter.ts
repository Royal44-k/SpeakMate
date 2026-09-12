import type { PracticeSession, PracticeTurn } from './types'
import {
  advanceDialogue,
  createDialogue,
  dialogueSnapshotSchema,
  type DialogueSnapshot,
} from '@/domain/ai/graded-dialogue'
import type { CefrLevel } from '@/domain/scenes/types'
import { practiceFlow } from './graded-evidence'

export interface PracticeCaptureSource {
  sceneId: string
  level: CefrLevel
  sessionId: string
  turnId?: string
  questionId?: string
}
export interface PracticeTextBlock {
  text: string
  source: PracticeCaptureSource
}
export function presentGradedPractice(
  session: PracticeSession,
  turns: PracticeTurn[],
) {
  const snapshot = dialogueSnapshotSchema.parse(session.gradedDialogue)
  const source = (
    turnId?: string,
    questionId?: string,
  ): PracticeCaptureSource => ({
    sceneId: snapshot.pack.sceneId,
    level: snapshot.pack.level,
    sessionId: session.id,
    ...(turnId ? { turnId } : {}),
    ...(questionId ? { questionId } : {}),
  })
  const block = (
    text: string,
    turnId?: string,
    questionId?: string,
  ): PracticeTextBlock => ({ text, source: source(turnId, questionId) })
  function replyBlocks(
    current: DialogueSnapshot,
    turnId?: string,
  ): PracticeTextBlock[] {
    const question = current.pack.questions.find(
      (question) => question.id === current.state.currentQuestionId,
    )
    const reply = current.state.reply
    if (!question) return [block(reply, turnId)]
    if (reply === question.text) return [block(reply, turnId, question.id)]
    if (reply.endsWith(`\n${question.text}`))
      return [
        block(reply.slice(0, -question.text.length - 1), turnId),
        block(question.text, turnId, question.id),
      ]
    // Do not fabricate question attribution for an unexpected mixed block.
    return [block(reply, turnId)]
  }
  let replay = createDialogue(snapshot.pack, snapshot.state).snapshot
  const opening = replyBlocks(replay)
  const history = snapshot.state.turns.map((input, index) => {
    const turn = turns[index]
    if (
      !turn ||
      turn.index !== index ||
      turn.sessionId !== session.id ||
      turn.learnerText !== input.text
    )
      throw new Error('PRACTICE_SOURCE_INCOHERENT')
    const expression = input.action === 'answer' || input.action === 'change'
    const targetId = expression
      ? input.action === 'change'
        ? input.questionId
        : replay.state.currentQuestionId
      : undefined
    const target = snapshot.pack.questions.find(
      (question) => question.id === targetId,
    )
    replay = advanceDialogue(replay, input).snapshot
    if (turn.aiText !== replay.state.reply)
      throw new Error('PRACTICE_SOURCE_INCOHERENT')
    const confirmation = replay.state.confirmation
    const feedbackText =
      confirmation === 'exact'
        ? '这次文字与本地已收录的参考表达匹配；这不是全面语法、语义或口语能力评估。'
        : confirmation === 'unknown'
          ? '这次文字未匹配到该问题的本地参考表达；未收录不代表说错，也不会自动确认交际目标。'
          : '这是一次帮助或停止操作，不算一次非空表达，也不代表表达正确。'
    return {
      turnId: turn.id,
      input,
      confirmation,
      learner: block(input.text, turn.id, target?.id),
      assistant: replyBlocks(replay, turn.id),
      references:
        target?.answers.map((answer) => ({
          id: answer.id,
          ...block(answer.text, turn.id, target.id),
        })) ?? [],
      feedback: block(feedbackText, turn.id, target?.id),
    }
  })
  if (turns.length !== history.length)
    throw new Error('PRACTICE_SOURCE_INCOHERENT')
  const question = snapshot.pack.questions.find(
    (question) => question.id === snapshot.state.currentQuestionId,
  )
  const currentQuestion =
    question &&
    snapshot.state.outcome === 'active' &&
    session.status === 'active'
      ? {
          id: question.id,
          text: question.text,
          hintZh: question.hintZh,
          source: source(undefined, question.id),
          answers: question.answers.map((answer) => ({
            id: answer.id,
            ...block(answer.text, undefined, question.id),
          })),
        }
      : undefined
  const flow = practiceFlow(snapshot)
  return {
    opening,
    history,
    currentQuestion,
    flow,
    outcome: snapshot.state.outcome,
    canAnswer: !!currentQuestion,
    canFinish:
      session.status === 'active' &&
      !!flow.basis &&
      (!session.simulation || !!session.simulation.composition),
    situationZh: snapshot.pack.variants.find(
      (variant) => variant.id === snapshot.state.variantId,
    )!.situationZh,
    presentation: session.presentation ?? {
      schemaVersion: 1 as const,
      counterpartZh: '本地情境练习',
      frameZh:
        '这是保存的历史分级练习。以下是已编写的本地情境问答，不推断当时未保存的角色。',
    },
  }
}
