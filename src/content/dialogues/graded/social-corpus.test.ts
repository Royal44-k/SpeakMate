import { describe, expect, it } from 'vitest'
import { localContentProvider } from './provider'
import { gradedSceneManifest } from './manifest'
import { localLearningAssistant } from '@/content/analysis/provider'
import {
  createDialogue,
  advanceDialogue,
  dialogueSuggestions,
  dialogueSnapshotSchema,
} from '@/domain/ai/graded-dialogue'

const scenes = [
  ['social-01', 'first-small-talk', 'name'],
  ['social-02', 'networking-event', 'purpose'],
  ['social-03', 'make-invitation', 'activity'],
  ['social-04', 'polite-refusal', 'decline'],
  ['social-05', 'discuss-opinions', 'position'],
  ['social-06', 'apology-repair', 'acknowledge'],
] as const
const levels = ['A1', 'A2', 'B1', 'B2', 'C1'] as const

describe('original social corpus', () => {
  // These source-aware cases protect the specific authoring risks: changing
  // a preference must not establish a different fact or perform a real action.
  for (const level of levels)
    for (const first of [0, 1])
      for (const second of [0, 1]) {
        it(`invitation remains hypothetical ${level}/${first}/${second}`, async () => {
          const r = await localContentProvider.load({
            sceneId: 'social-03',
            level,
          })
          expect(r.status).toBe('available')
          if (r.status !== 'available') return
          let run = createDialogue(r.pack, {
            mode: 'extended',
            variantId: 'consideration',
          })
          let alternative: string | undefined
          while (run.snapshot.state.outcome === 'active') {
            const q = run.snapshot.pack.questions.find(
              (q) => q.id === run.snapshot.state.currentQuestionId,
            )!
            const a = dialogueSuggestions(run.snapshot)[
              q.objective === 'alternative'
                ? first
                : q.objective === 'silence'
                  ? second
                  : 0
            ]
            if (q.objective === 'alternative') alternative = a.effects[0].value
            run = advanceDialogue(run.snapshot, { text: a.text })
          }
          expect(run.snapshot.state.outcome).toBe('achieved')
          expect(
            run.snapshot.state.facts.find((f) => f.key === 'alternative')
              ?.value,
          ).toBe(alternative)
          expect(run.reply).toContain('Nothing has been sent or accepted')
          expect(
            run.snapshot.state.facts.some((f) =>
              ['attending', 'accepted', 'sent'].includes(f.key),
            ),
          ).toBe(false)
        })
        it(`ordinary refusal and privacy remain answer choices ${level}/${first}/${second}`, async () => {
          const r = await localContentProvider.load({
            sceneId: 'social-04',
            level,
          })
          expect(r.status).toBe('available')
          if (r.status !== 'available') return
          let run = createDialogue(r.pack, {
            mode: 'extended',
            variantId: 'conversation',
          })
          const original = dialogueSuggestions(run.snapshot)[first]
          run = advanceDialogue(run.snapshot, { text: original.text })
          expect(run.snapshot.state.outcome).toBe('active')
          let noReason: string | undefined
          while (run.snapshot.state.outcome === 'active') {
            const q = run.snapshot.pack.questions.find(
              (q) => q.id === run.snapshot.state.currentQuestionId,
            )!
            const slot =
              q.objective === 'reason'
                ? 1
                : q.objective === 'alternative'
                  ? second
                  : 0
            const a = dialogueSuggestions(run.snapshot)[slot]
            if (q.objective === 'reason') noReason = a.effects[0].value
            if (q.objective === 'alternative')
              expect(
                run.snapshot.state.facts.find((f) => f.key === 'reason')?.value,
              ).toBe(noReason)
            run = advanceDialogue(run.snapshot, { text: a.text })
          }
          expect(run.snapshot.state.outcome).toBe('achieved')
          expect(
            run.snapshot.state.facts.find((f) => f.key === 'decline')?.value,
          ).toBe(original.effects[0].value)
          expect(
            run.snapshot.state.facts.find((f) => f.key === 'reason')?.value,
          ).toBe(noReason)
          expect(run.reply).toContain(
            'no alternative plan or future contact has been agreed',
          )
        })
        it(`opinion disagreement and unanswered clarification ${level}/${first}/${second}`, async () => {
          const r = await localContentProvider.load({
            sceneId: 'social-05',
            level,
          })
          expect(r.status).toBe('available')
          if (r.status !== 'available') return
          let run = createDialogue(r.pack, {
            mode: 'extended',
            variantId: 'consideration',
          })
          const position = dialogueSuggestions(run.snapshot)[first]
          run = advanceDialogue(run.snapshot, { text: position.text })
          while (run.snapshot.state.outcome === 'active') {
            const q = run.snapshot.pack.questions.find(
              (q) => q.id === run.snapshot.state.currentQuestionId,
            )!
            if (level === 'B1' && q.objective === 'close')
              expect(q.answers[0].text).toBe(
                'We may still prefer different things, and that is fine. Thanks for talking.',
              )
            const a = dialogueSuggestions(run.snapshot)[
              q.objective === 'other' ? second : 0
            ]
            run = advanceDialogue(run.snapshot, { text: a.text })
          }
          expect(run.snapshot.state.outcome).toBe('achieved')
          expect(
            run.snapshot.state.facts.find((f) => f.key === 'position')?.value,
          ).toBe(position.effects[0].value)
          expect(run.reply).toContain('whether or not our views match')
          expect(
            run.snapshot.state.facts.some((f) =>
              ['agreement', 'explanation-received'].includes(f.key),
            ),
          ).toBe(false)
        })
        it(`apology preparation is not receipt or forgiveness ${level}/${first}/${second}`, async () => {
          const r = await localContentProvider.load({
            sceneId: 'social-06',
            level,
          })
          expect(r.status).toBe('available')
          if (r.status !== 'available') return
          let run = createDialogue(r.pack, {
            mode: 'extended',
            variantId: 'consideration',
          })
          const confirmationQuestions = {
            A1: 'How would you know the book had been received?',
            A2: 'For a future return, how could you check that Robin received the book?',
            B1: 'What would count as knowing the book was back with Robin?',
            B2: 'What would establish receipt rather than merely show that you had planned a return?',
            C1: 'What evidence would let you say the return had actually happened rather than merely been arranged?',
          }
          let reached = false
          while (run.snapshot.state.outcome === 'active') {
            const q = run.snapshot.pack.questions.find(
              (q) => q.id === run.snapshot.state.currentQuestionId,
            )!
            if (q.objective === 'confirm') {
              reached = true
              expect(run.reply).toBe(confirmationQuestions[level])
            }
            const a = dialogueSuggestions(run.snapshot)[
              q.objective === 'repair'
                ? first
                : q.objective === 'permission'
                  ? second
                  : 0
            ]
            run = advanceDialogue(run.snapshot, { text: a.text })
          }
          expect(reached).toBe(true)
          expect(run.snapshot.state.outcome).toBe('achieved')
          expect(run.reply).toContain(
            'The book has not been returned, no message has been sent',
          )
          expect(
            run.snapshot.state.facts.some((f) =>
              ['received', 'returned', 'forgiven'].includes(f.key),
            ),
          ).toBe(false)
        })
      }
  it('registers six canonical scenes and 360 new questions with 720 owned answers', async () => {
    expect(
      gradedSceneManifest
        .filter((s) => (s.category as string) === 'social')
        .map((s) => s.sceneId),
    ).toEqual([
      'social-01',
      'social-02',
      'social-03',
      'social-04',
      'social-05',
      'social-06',
    ])
    const ids = new Set<string>(),
      texts = new Set<string>()
    let answers = 0
    for (const [sceneId, slug] of scenes) {
      expect(
        await localContentProvider.load({ sceneId: slug, level: 'A1' }),
      ).toEqual({ status: 'unavailable' })
      for (const level of levels) {
        const r = await localContentProvider.load({ sceneId, level })
        expect(r.status).toBe('available')
        if (r.status !== 'available') continue
        for (const q of r.pack.questions) {
          ids.add(q.id)
          texts.add(q.text)
          answers += q.answers.length
        }
      }
    }
    expect(ids.size).toBe(360)
    expect(texts.size).toBe(360)
    expect(answers).toBe(720)
    expect(
      await localContentProvider.load({
        sceneId: 'social-06',
        level: 'C1',
        contentVersion: 2,
      }),
    ).toEqual({ status: 'version-unavailable', requestedVersion: 2 })
  })
  for (const [sceneId, slug, opening] of scenes)
    for (const level of levels) {
      it(`${sceneId}/${level}: owns twelve reviewed substantive pairs and six intents`, async () => {
        const r = await localContentProvider.load({ sceneId, level })
        expect(r.status).toBe('available')
        if (r.status !== 'available') return
        expect(r.pack).toMatchObject({
          sceneId,
          category: 'social',
          level,
          contentVersion: 1,
        })
        expect(r.pack.questions).toHaveLength(12)
        expect(r.pack.questions[0].id).toBe(`${slug}.${level}.${opening}`)
        expect(
          new Set(r.pack.questions.map((q) => q.intent)).size,
        ).toBeGreaterThanOrEqual(6)
        for (const q of r.pack.questions) {
          expect(q.review.state).toBe('model-reviewed')
          expect(q.answers[0].effects).not.toEqual(q.answers[1].effects)
          for (const a of q.answers) {
            expect(a.acceptedForms).toEqual([a.text])
            expect(a.review.state).toBe('model-reviewed')
          }
        }
      })
      for (const variantId of ['conversation', 'consideration'])
        for (const [mode, turns] of [
          ['short', 3],
          ['standard', 6],
          ['extended', 10],
        ] as const)
          for (const choice of [0, 1, 2]) {
            it(`${sceneId}/${level}/${variantId}/${mode}/${choice}: confirms selected facts and terminates honestly`, async () => {
              const r = await localContentProvider.load({ sceneId, level })
              expect(r.status).toBe('available')
              if (r.status !== 'available') return
              let run = createDialogue(r.pack, { variantId, mode })
              const expected: { key: string; value: string }[] = []
              for (let n = 0; n < turns; n++) {
                expect(run.snapshot.state.outcome).toBe('active')
                const q = run.snapshot.pack.questions.find(
                  (q) => q.id === run.snapshot.state.currentQuestionId,
                )!
                expect(run.reply).toBe(q.text)
                const pair = dialogueSuggestions(run.snapshot)
                expect(pair).toEqual(q.answers)
                const a = pair[choice === 2 ? n % 2 : choice]
                expected.push(...a.effects)
                run = advanceDialogue(run.snapshot, {
                  text: a.text,
                  suggestionId: a.id,
                })
                expect(run.confirmation).toBe('exact')
              }
              expect(run.snapshot.state.outcome).toBe('achieved')
              expect(
                run.snapshot.state.facts.map(({ key, value }) => ({
                  key,
                  value,
                })),
              ).toEqual(expected)
              expect(run.snapshot.state.completedObjectives).toHaveLength(turns)
              expect(run.reply).not.toMatch(/[?？]/u)
              expect(dialogueSuggestions(run.snapshot)).toEqual([])
              expect(
                dialogueSnapshotSchema.parse(
                  JSON.parse(JSON.stringify(run.snapshot)),
                ),
              ).toEqual(run.snapshot)
              expect(
                advanceDialogue(run.snapshot, { text: 'One more thing.' })
                  .snapshot,
              ).toEqual(run.snapshot)
            })
          }
      it(`${sceneId}/${level}: reaches every bank node and preserves both adjacent answer branches`, async () => {
        const r = await localContentProvider.load({ sceneId, level })
        expect(r.status).toBe('available')
        if (r.status !== 'available') return
        const reached = new Set<string>()
        for (const variantId of ['conversation', 'consideration'])
          for (let edge = 0; edge < 9; edge++)
            for (const a of [0, 1])
              for (const b of [0, 1]) {
                let run = createDialogue(r.pack, {
                  variantId,
                  mode: 'extended',
                })
                for (let n = 0; n < 10; n++) {
                  reached.add(run.snapshot.state.currentQuestionId!)
                  const answer = dialogueSuggestions(run.snapshot)[
                    n === edge ? a : n === edge + 1 ? b : 0
                  ]
                  const before = run.snapshot.state.facts
                  run = advanceDialogue(run.snapshot, { text: answer.text })
                  for (const fact of before)
                    expect(run.snapshot.state.facts).toContainEqual(fact)
                }
                expect(run.snapshot.state.outcome).toBe('achieved')
              }
        expect(reached.size).toBe(12)
      })
      it(`${sceneId}/${level}: unknown, repair, change and refusal cannot invent success`, async () => {
        const r = await localContentProvider.load({ sceneId, level })
        expect(r.status).toBe('available')
        if (r.status !== 'available') return
        const initial = createDialogue(r.pack, {
          variantId: 'conversation',
          mode: 'short',
        })
        const pair = dialogueSuggestions(initial.snapshot)
        const unknown = advanceDialogue(initial.snapshot, {
          text: 'An uncovered personal story.',
          suggestionId: pair[0].id,
        })
        expect(unknown.confirmation).toBe('unknown')
        expect(unknown.snapshot.state.facts).toEqual([])
        for (const action of ['clarify', 'struggle', 'off-topic'] as const) {
          let run = advanceDialogue(initial.snapshot, { text: '', action })
          for (let n = 0; n < 2; n++)
            run = advanceDialogue(run.snapshot, {
              text: dialogueSuggestions(run.snapshot)[0].text,
            })
          expect(run.snapshot.state.outcome).toBe('partial')
          expect(dialogueSuggestions(run.snapshot)).toEqual([])
        }
        let changed = advanceDialogue(initial.snapshot, { text: pair[0].text })
        changed = advanceDialogue(changed.snapshot, {
          action: 'change',
          questionId: initial.snapshot.state.currentQuestionId!,
          text: pair[1].text,
        })
        expect(changed.snapshot.state.facts[0].value).toBe(
          pair[1].effects[0].value,
        )
        changed = advanceDialogue(changed.snapshot, {
          text: dialogueSuggestions(changed.snapshot)[0].text,
        })
        expect(changed.snapshot.state.outcome).toBe('partial')
        const refused = advanceDialogue(initial.snapshot, {
          text: '',
          action: 'refuse',
        })
        expect(refused.snapshot.state.outcome).toBe('declined')
        expect(dialogueSuggestions(refused.snapshot)).toEqual([])
      })
    }
  for (const [sceneId, kind, text] of [
    ['social-01', 'word', 'neighbour'],
    ['social-02', 'phrase', 'keep in touch'],
    ['social-03', 'word', 'invitation'],
    ['social-04', 'sentence', "I'd rather not say."],
    ['social-05', 'phrase', 'see your point'],
    ['social-06', 'word', 'apology'],
  ] as const)
    it(`${sceneId}: returns bounded ${kind} analysis`, async () => {
      const r = await localLearningAssistant.analyze({
        sceneId,
        kind,
        text,
        level: 'B1',
      })
      expect(r.status).toBe('exact')
      expect(r.entries).toHaveLength(1)
      expect(r.entries[0].examples.map((e) => e.level)).toEqual([
        'A1',
        'A2',
        'B1',
        'B2',
        'C1',
      ])
    })
  it('does not turn a matched word or unknown social sentence into full interpretation', async () => {
    const partial = await localLearningAssistant.analyze({
      sceneId: 'social-03',
      kind: 'sentence',
      text: 'The invitation surprised my neighbour.',
      level: 'B2',
    })
    expect(partial.status).toBe('partial')
    const unknown = await localLearningAssistant.analyze({
      sceneId: 'social-04',
      kind: 'sentence',
      text: 'My reasons are complicated.',
      level: 'C1',
    })
    expect(unknown.status).toBe('unknown')
    expect(unknown.entries).toEqual([])
    expect(unknown.capabilities).toEqual(['save', 'note', 'self-recall'])
  })
})
