import { expect, it } from 'vitest'
import { localLearningAssistant } from './provider'

it('returns scoped exact word, phrase and sentence entries, not a fabricated parse', async () => {
  for (const [kind, text] of [
    ['word', 'black'],
    ['phrase', 'to go'],
    ['sentence', 'An Americano, please.'],
  ] as const) {
    const result = await localLearningAssistant.analyze({
      sceneId: 'dining-01',
      intent: 'order',
      kind,
      text,
      level: 'A1',
    })
    expect(result.status).toBe('exact')
    expect(result.entries[0].meaningZh).toBeTruthy()
    expect(result.entries[0].grammarZh).toBeTruthy()
    expect(result.entries[0].errorsZh).toBeTruthy()
    expect(result.entries[0].examples.length).toBeGreaterThan(0)
    expect(result.entries[0].sourceBasis.length).toBeGreaterThan(0)
  }
  const partial = await localLearningAssistant.analyze({
    sceneId: 'dining-01',
    kind: 'sentence',
    text: 'The black cat drinks coffee.',
    level: 'A1',
  })
  expect(partial.status).toBe('partial')
  expect(partial.explanationZh).toContain('不代表整句')
  expect(
    (
      await localLearningAssistant.analyze({
        sceneId: 'other',
        kind: 'word',
        text: 'black',
        level: 'A1',
      })
    ).status,
  ).not.toBe('exact')
  const unknown = await localLearningAssistant.analyze({
    sceneId: 'dining-01',
    kind: 'sentence',
    text: 'Stars dissolve sideways.',
    level: 'C1',
  })
  expect(unknown.status).toBe('unknown')
  expect(unknown.entries).toEqual([])
  expect(unknown.capabilities).toEqual(['save', 'note', 'self-recall'])
})

it('does not claim exact meaning for an unresolved pronoun and rejects draft analyses', async () => {
  const result = await localLearningAssistant.analyze({
    sceneId: 'dining-01',
    kind: 'phrase',
    text: 'leave it out',
    level: 'B1',
  })
  expect(result.status).not.toBe('exact')
  const scoped = await localLearningAssistant.analyze({
    sceneId: 'dining-01',
    intent: 'preference',
    questionId: 'coffee.B1.sweetener',
    kind: 'phrase',
    text: 'leave it out',
    level: 'B1',
  })
  expect(scoped.status).toBe('exact')
  expect(scoped.entries[0].review.state).toBe('model-reviewed')
})
