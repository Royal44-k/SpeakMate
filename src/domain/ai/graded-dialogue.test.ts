import { describe, expect, it } from 'vitest'
import { localContentProvider } from '@/content/dialogues/graded/provider'
import { gradedPackSchema } from '@/content/dialogues/graded/schema'
import {
  createDialogue,
  advanceDialogue,
  dialogueSuggestions,
  dialogueSnapshotSchema,
} from './graded-dialogue'

describe('graded coffee contract and state machine', () => {
  it('keeps the existing canonical scene identity instead of storing its slug as an ID', async () => {
    const loaded = await localContentProvider.load({
      sceneId: 'dining-01',
      level: 'A1',
    })
    expect(loaded.status).toBe('available')
    if (loaded.status === 'available')
      expect(loaded.pack.sceneId).toBe('dining-01')
  })
  for (const level of ['A1', 'A2', 'B1', 'B2', 'C1'] as const) {
    it(`${level}: validates twelve owned pairs and explicit rationale`, async () => {
      const result = await localContentProvider.load({
        sceneId: 'dining-01',
        level,
      })
      if (result.status !== 'available') throw Error('pilot unavailable')
      const pack = gradedPackSchema.parse(result.pack)
      expect(pack.questions).toHaveLength(12)
      expect(new Set(pack.questions.map((q) => q.id)).size).toBe(12)
      expect(
        new Set(pack.questions.map((q) => q.intent)).size,
      ).toBeGreaterThanOrEqual(6)
      expect(pack.rationale.canDoZh.length).toBeGreaterThan(10)
      expect(
        pack.questions.every(
          (q) => q.answers.length === 2 && q.review.state === 'model-reviewed',
        ),
      ).toBe(true)
      expect(
        pack.questions.every((q) =>
          q.answers.every(
            (a) =>
              a.acceptedForms.includes(a.text) &&
              a.review.state === 'model-reviewed',
          ),
        ),
      ).toBe(true)
      expect(
        gradedPackSchema.safeParse({ ...pack, engineVersion: 99 }).success,
      ).toBe(false)
    })
    for (const [mode, count] of [
      ['short', 3],
      ['standard', 6],
      ['extended', 10],
    ] as const) {
      for (const choice of [0, 1]) {
        for (const variantId of ['counter', 'planned']) {
          it(`${level}/${mode}/${choice}/${variantId}: reaches real outcomes with coherent suggestions`, async () => {
            const loaded = await localContentProvider.load({
              sceneId: 'dining-01',
              level,
            })
            if (loaded.status !== 'available') throw Error('missing')
            let run = createDialogue(loaded.pack, { mode, variantId })
            expect(run.reply).toBe(run.snapshot.pack.questions[0].text)
            expect(run.snapshot.state.askedQuestionIds).toHaveLength(1)
            for (let turn = 0; turn < count; turn++) {
              const suggestions = dialogueSuggestions(run.snapshot)
              expect(suggestions).toHaveLength(2)
              const answer = suggestions[choice]
              run = advanceDialogue(run.snapshot, {
                text: answer.text,
                suggestionId: answer.id,
              })
              expect(run.snapshot.state.completedObjectives).toHaveLength(
                turn + 1,
              )
            }
            expect(run.snapshot.state.outcome).toBe('achieved')
            expect(run.snapshot.state.turns).toHaveLength(count)
            expect(new Set(run.snapshot.state.askedQuestionIds).size).toBe(
              count,
            )
            expect(run.reply).not.toContain('?')
            expect(dialogueSuggestions(run.snapshot)).toEqual([])
            expect(
              advanceDialogue(run.snapshot, { text: 'Another coffee' }),
            ).toEqual(run)
            expect(
              dialogueSnapshotSchema.safeParse(
                JSON.parse(JSON.stringify(run.snapshot)),
              ).success,
            ).toBe(true)
          })
        }
      }
    }
  }

  async function start(mode: 'short' | 'standard' | 'extended' = 'standard') {
    const loaded = await localContentProvider.load({
      sceneId: 'dining-01',
      level: 'A1',
    })
    if (loaded.status !== 'available') throw Error('missing')
    return createDialogue(loaded.pack, { mode, variantId: 'counter' })
  }
  it('does not trust edited suggestion IDs, unrelated keywords or negated text', async () => {
    for (const text of [
      'I do not want an Americano.',
      'Small, to go, cash.',
      'Do not order that.',
    ]) {
      const run = await start()
      const next = advanceDialogue(run.snapshot, {
        text,
        suggestionId: dialogueSuggestions(run.snapshot)[0].id,
      })
      expect(next.snapshot.state.facts).toEqual([])
      expect(next.snapshot.state.turns[0].text).toBe(text)
      expect(next.confirmation).toBe('unknown')
      expect(next.snapshot.state.currentQuestionId).toBe(
        run.snapshot.state.currentQuestionId,
      )
    }
  })
  it('normalizes case, space and boundary punctuation without deleting meaning', async () => {
    const run = await start()
    const next = advanceDialogue(run.snapshot, {
      text: '  AN AMERICANO, PLEASE!!! ',
    })
    expect(next.confirmation).toBe('exact')
    expect(next.snapshot.state.facts[0].value).toBe('americano')
  })
  it('handles clarification, struggle, off-topic, refusal and exhausted turns honestly', async () => {
    for (const action of ['clarify', 'struggle', 'off-topic'] as const) {
      let run = await start('short')
      const opening = run.snapshot.state.currentQuestionId
      run = advanceDialogue(run.snapshot, { text: 'Help', action })
      expect(run.snapshot.state.currentQuestionId).toBe(opening)
      expect(run.snapshot.state.completedObjectives).toEqual([])
      run = advanceDialogue(run.snapshot, { text: 'Unlisted answer' })
      run = advanceDialogue(run.snapshot, { text: 'Unlisted answer' })
      expect(run.snapshot.state.outcome).toBe('partial')
      expect(run.reply).not.toContain('?')
    }
    const declined = advanceDialogue((await start()).snapshot, {
      text: 'No thanks',
      action: 'refuse',
    })
    expect(declined.snapshot.state.outcome).toBe('declined')
    expect(declined.snapshot.state.completedObjectives).toEqual([])
    expect(declined.reply).not.toContain('?')
  })
  it('changes supported previous evidence without erasing independent outcomes', async () => {
    let run = await start()
    const openingId = run.snapshot.state.currentQuestionId!
    const secondChoice = dialogueSuggestions(run.snapshot)[1].text
    run = advanceDialogue(run.snapshot, {
      text: dialogueSuggestions(run.snapshot)[0].text,
    })
    run = advanceDialogue(run.snapshot, {
      text: dialogueSuggestions(run.snapshot)[0].text,
    })
    run = advanceDialogue(run.snapshot, {
      text: secondChoice,
      action: 'change',
      questionId: openingId,
    })
    expect(run.snapshot.state.facts.map((f) => f.value)).toEqual([
      'filter',
      'small',
    ])
    expect(run.snapshot.state.completedObjectives).toHaveLength(2)
    expect(run.snapshot.state.currentQuestionId).toContain('service')
  })
  it('pins a detached immutable pack, rejects broken state and never replaces an old version', async () => {
    const loaded = await localContentProvider.load({
      sceneId: 'dining-01',
      level: 'A1',
    })
    if (loaded.status !== 'available') throw Error('missing')
    const run = createDialogue(loaded.pack, {
      mode: 'short',
      variantId: 'counter',
    })
    const original = run.reply
    loaded.pack.questions[0].text = 'Changed catalog'
    expect(run.snapshot.pack.questions[0].text).toBe(original)
    expect(Object.isFrozen(run.snapshot.pack.questions[0])).toBe(true)
    const bad = JSON.parse(JSON.stringify(run.snapshot))
    bad.state.currentQuestionId = 'missing'
    expect(() => advanceDialogue(bad, { text: 'hello' })).toThrow(/DIALOGUE/)
    bad.state.engineVersion = 99
    expect(dialogueSnapshotSchema.safeParse(bad).success).toBe(false)
    expect(
      await localContentProvider.load({
        sceneId: 'dining-01',
        level: 'A1',
        contentVersion: 99,
      }),
    ).toEqual({ status: 'version-unavailable', requestedVersion: 99 })
    expect(
      await localContentProvider.load({ sceneId: 'unlisted', level: 'A1' }),
    ).toEqual({ status: 'unavailable' })
  })

  it('invalidates only transitive dependents after a supported change and respects branch eligibility', async () => {
    const loaded = await localContentProvider.load({
      sceneId: 'dining-01',
      level: 'A1',
    })
    if (loaded.status !== 'available') throw Error('missing')
    const pack = loaded.pack
    // Test-only applicability fixture, not additional released coffee language.
    pack.questions[3].requires = [{ key: 'drink', value: 'americano' }]
    pack.questions[4].requires = [{ key: 'milk', value: 'oat' }]
    pack.variants[1].modes.standard.questionIds = [
      ...pack.variants[0].modes.standard.questionIds,
    ]
    pack.variants[1].modes.extended.questionIds = [
      'drink',
      'size',
      'service',
      'milk',
      'sweetener',
      'payment',
      'timing',
      'cup',
      'receipt',
      'name',
    ].map((key) => `coffee.A1.${key}`)
    let run = createDialogue(pack, { mode: 'extended', variantId: 'counter' })
    for (const choice of [0, 0, 0, 1, 0])
      run = advanceDialogue(run.snapshot, {
        text: dialogueSuggestions(run.snapshot)[choice].text,
      })
    expect(run.snapshot.state.completedObjectives).toEqual([
      'drink',
      'size',
      'service',
      'milk',
      'sweetener',
    ])
    run = advanceDialogue(run.snapshot, {
      action: 'change',
      questionId: 'coffee.A1.drink',
      text: 'A filter coffee, please.',
    })
    expect(run.snapshot.state.completedObjectives).toEqual([
      'drink',
      'size',
      'service',
    ])
    expect(run.snapshot.state.facts.map((f) => f.key)).toEqual([
      'drink',
      'size',
      'service',
    ])
    expect(run.snapshot.state.currentQuestionId).toBe('coffee.A1.payment')
    expect(dialogueSuggestions(run.snapshot).map((a) => a.text)).toEqual([
      'Cash, please.',
      'Card, please.',
    ])
  })

  it('permits explicit multi-fact forms only in their authored question and never counts an extra unasked objective', async () => {
    const loaded = await localContentProvider.load({
      sceneId: 'dining-01',
      level: 'A1',
    })
    if (loaded.status !== 'available') throw Error('missing')
    const pack = loaded.pack
    pack.questions[0].answers[0].acceptedForms.push(
      'An Americano with an extra shot, please.',
    )
    pack.questions[0].answers[0].effects.push({ key: 'shot', value: 'extra' })
    const opening = createDialogue(pack, {
      mode: 'short',
      variantId: 'counter',
    })
    const matched = advanceDialogue(opening.snapshot, {
      text: 'An Americano with an extra shot, please.',
    })
    expect(matched.snapshot.state.facts.map((f) => f.key)).toEqual([
      'drink',
      'shot',
    ])
    expect(matched.snapshot.state.completedObjectives).toEqual(['drink'])
    const unrelated = advanceDialogue(matched.snapshot, {
      text: 'An Americano with an extra shot, please.',
    })
    expect(unrelated.confirmation).toBe('unknown')
    expect(unrelated.snapshot.state.completedObjectives).toEqual(['drink'])
  })

  it('rejects false completion, malformed references, oversized history and draft new dialogues', async () => {
    const run = await start()
    const corruptions = [
      (s: typeof run.snapshot) => {
        s.state.completedObjectives = ['milk']
      },
      (s: typeof run.snapshot) => {
        s.state.facts = [
          {
            key: 'drink',
            value: 'filter',
            questionId: 'coffee.A1.drink',
            answerId: 'missing',
            turnIndex: 0,
          },
        ]
      },
      (s: typeof run.snapshot) => {
        s.state.outcome = 'achieved'
      },
      (s: typeof run.snapshot) => {
        s.state.turns = Array.from({ length: 21 }, () => ({
          action: 'answer',
          text: 'unknown',
        }))
      },
      (s: typeof run.snapshot) => {
        s.pack.variants[0].modes.short.questionIds[0] = 'missing'
      },
    ]
    for (const corrupt of corruptions) {
      const snapshot = JSON.parse(JSON.stringify(run.snapshot))
      corrupt(snapshot)
      expect(dialogueSnapshotSchema.safeParse(snapshot).success).toBe(false)
    }
    const draft = JSON.parse(JSON.stringify(run.snapshot.pack))
    draft.questions[0].review.state = 'draft'
    expect(() =>
      createDialogue(draft, { mode: 'short', variantId: 'counter' }),
    ).toThrow(/UNREVIEWED/)
  })

  it('rejects cross-question fact overwrites and cyclic applicability before creating a dialogue', async () => {
    const run = await start()
    const overwritten = JSON.parse(JSON.stringify(run.snapshot.pack))
    overwritten.questions[1].answers[0].effects = [
      { key: 'drink', value: 'filter' },
    ]
    expect(gradedPackSchema.safeParse(overwritten).success).toBe(false)
    const cyclic = JSON.parse(JSON.stringify(run.snapshot.pack))
    cyclic.questions[0].requires = [{ key: 'size', value: 'small' }]
    cyclic.questions[1].requires = [{ key: 'drink', value: 'americano' }]
    expect(gradedPackSchema.safeParse(cyclic).success).toBe(false)
  })

  it('finishes the eligible branch without requiring an inapplicable objective or skipping an unresolved parent', async () => {
    const original = await start()
    const pack = JSON.parse(JSON.stringify(original.snapshot.pack))
    pack.questions[3].requires = [{ key: 'drink', value: 'americano' }]
    let run = createDialogue(pack, { mode: 'standard', variantId: 'counter' })
    const unresolved = advanceDialogue(run.snapshot, { text: 'I am unsure.' })
    expect(unresolved.snapshot.state.outcome).toBe('active')
    expect(unresolved.snapshot.state.completedObjectives).toEqual([])
    for (const choice of [1, 0, 0, 0, 0])
      run = advanceDialogue(run.snapshot, {
        text: dialogueSuggestions(run.snapshot)[choice].text,
      })
    expect(run.snapshot.state.outcome).toBe('achieved')
    expect(run.snapshot.state.completedObjectives).toEqual([
      'drink',
      'size',
      'service',
      'sweetener',
      'payment',
    ])
    expect(run.snapshot.state.askedQuestionIds).not.toContain('coffee.A1.milk')
  })
})
