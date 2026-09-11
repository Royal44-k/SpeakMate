import { describe, expect, it } from 'vitest'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import { localContentProvider } from '@/content/dialogues/graded/provider'
import { createDialogue } from '@/domain/ai/graded-dialogue'
import { presentGradedPractice } from './graded-presenter'

async function fixture() {
  const repository = createMemoryRepositories()
  const profile = await repository.profiles.ensureGuestProfile()
  const content = await localContentProvider.load({
    sceneId: 'dining-01',
    level: 'A1',
  })
  if (content.status !== 'available') throw new Error('missing')
  const start = createDialogue(content.pack, {
    mode: 'standard',
    variantId: 'counter',
  })
  const at = '2026-09-10T01:00:00.000Z'
  const { record } = await repository.practice.commit({
    kind: 'create',
    session: {
      id: 'source-session',
      profileId: profile.id,
      sceneId: content.pack.sceneId,
      sceneVersion: 1,
      level: 'A1',
      status: 'active',
      startedAt: at,
      updatedAt: at,
      completedGoals: [],
      openingText: start.reply,
      gradedDialogue: start.snapshot,
    },
  })
  return { repository, record, at }
}
describe('pinned per-block practice source presentation', () => {
  it('attributes the learner and reference to the answered question, the assistant to the next question', async () => {
    const { repository, record, at } = await fixture()
    const before = record.session.gradedDialogue!
    const question = before.pack.questions.find(
      (question) => question.id === before.state.currentQuestionId,
    )!
    const saved = await repository.practice.commit({
      kind: 'advance',
      expected: record.session,
      turnId: 'turn-one',
      input: { text: question.answers[0].text },
      at,
    })
    const view = presentGradedPractice(saved.record.session, saved.record.turns)
    expect(view.opening[0].source.questionId).toBe(question.id)
    expect(view.history[0].learner.source.questionId).toBe(question.id)
    expect(view.history[0].references[0].source.questionId).toBe(question.id)
    expect(view.history[0].feedback.source.questionId).toBe(question.id)
    expect(view.history[0].assistant.at(-1)!.source.questionId).toBe(
      saved.record.session.gradedDialogue!.state.currentQuestionId,
    )
    expect(view.currentQuestion!.answers[0].source.questionId).toBe(
      view.currentQuestion!.id,
    )
    expect(view.presentation.counterpartZh).toBe('本地情境练习')
  })
  it('keeps change targets distinct and repair prefixes generic during historical replay', async () => {
    const { repository, record, at } = await fixture()
    const question = record.session.gradedDialogue!.pack.questions[0]
    let saved = await repository.practice.commit({
      kind: 'advance',
      expected: record.session,
      turnId: 'turn-one',
      input: { text: question.answers[0].text },
      at,
    })
    saved = await repository.practice.commit({
      kind: 'advance',
      expected: saved.record.session,
      turnId: 'turn-change',
      input: {
        action: 'change',
        questionId: question.id,
        text: question.answers[1].text,
      },
      at,
    })
    saved = await repository.practice.commit({
      kind: 'advance',
      expected: saved.record.session,
      turnId: 'turn-repair',
      input: { action: 'clarify', text: '' },
      at,
    })
    const view = presentGradedPractice(saved.record.session, saved.record.turns)
    expect(view.history[1].learner.source.questionId).toBe(question.id)
    expect(view.history[1].assistant[0].source.questionId).toBeUndefined()
    expect(view.history[2].assistant[0].source.questionId).toBeUndefined()
    expect(view.history[2].assistant.at(-1)!.source.questionId).toBe(
      saved.record.session.gradedDialogue!.state.currentQuestionId,
    )
    expect(view.history[0].learner.source.questionId).toBe(question.id)
  })
  it('never assigns the last answered question to a terminal closing', async () => {
    const { repository, record, at } = await fixture()
    const stopped = await repository.practice.commit({
      kind: 'advance',
      expected: record.session,
      turnId: 'stop',
      input: { action: 'refuse', text: '' },
      at,
    })
    const view = presentGradedPractice(
      stopped.record.session,
      stopped.record.turns,
    )
    expect(view.currentQuestion).toBeUndefined()
    expect(view.history[0].assistant[0].source.questionId).toBeUndefined()
    expect(view.canAnswer).toBe(false)
    expect(view.canFinish).toBe(false)
  })
})
