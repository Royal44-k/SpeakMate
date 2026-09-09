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

// Independent brief-derived identities/counts: removing or misregistering any pack must fail.
const scenes = [
  'dining-02',
  'dining-03',
  'dining-04',
  'dining-05',
  'dining-06',
] as const
const levels = ['A1', 'A2', 'B1', 'B2', 'C1'] as const
describe('remaining dining corpus', () => {
  for (const sceneId of scenes)
    for (const level of levels) {
      it(`${sceneId}/${level}: loads twelve reviewed substantive owned pairs`, async () => {
        const loaded = await localContentProvider.load({ sceneId, level })
        expect(loaded.status).toBe('available')
        if (loaded.status !== 'available') return
        expect(loaded.pack.sceneId).toBe(sceneId)
        expect(loaded.pack.level).toBe(level)
        expect(loaded.pack.category).toBe('dining')
        expect(loaded.pack.questions).toHaveLength(12)
        expect(
          new Set(loaded.pack.questions.map((q) => q.intent)).size,
        ).toBeGreaterThanOrEqual(6)
        expect(new Set(loaded.pack.questions.map((q) => q.text)).size).toBe(12)
        for (const q of loaded.pack.questions) {
          expect(q.review.state).toBe('model-reviewed')
          expect(q.answers).toHaveLength(2)
          expect(q.answers[0].effects).not.toEqual(q.answers[1].effects)
          for (const a of q.answers)
            expect(a.review.state).toBe('model-reviewed')
        }
      })
      for (const [mode, count] of [
        ['short', 3],
        ['standard', 6],
        ['extended', 10],
      ] as const)
        for (const variantId of ['visit', 'planning'])
          for (const choice of [0, 1, 2]) {
            it(`${sceneId}/${level}/${variantId}/${mode}/${choice}: reaches distinct outcomes and stops`, async () => {
              const loaded = await localContentProvider.load({ sceneId, level })
              expect(loaded.status).toBe('available')
              if (loaded.status !== 'available') return
              let run = createDialogue(loaded.pack, { mode, variantId })
              const seen = new Set<string>()
              for (let i = 0; i < count; i++) {
                const q = run.snapshot.pack.questions.find(
                  (q) => q.id === run.snapshot.state.currentQuestionId,
                )!
                expect(run.reply).toBe(q.text)
                expect(seen.has(q.id)).toBe(false)
                seen.add(q.id)
                const pair = dialogueSuggestions(run.snapshot)
                expect(pair).toEqual(q.answers)
                const answer = pair[choice === 2 ? i % 2 : choice]
                run = advanceDialogue(run.snapshot, {
                  text: answer.text,
                  suggestionId: answer.id,
                })
                expect(run.confirmation).toBe('exact')
                expect(run.snapshot.state.completedObjectives).toHaveLength(
                  i + 1,
                )
              }
              expect(run.snapshot.state.outcome).toBe('achieved')
              expect(run.snapshot.state.turns).toHaveLength(count)
              expect(run.reply).not.toMatch(/[?？]/u)
              expect(dialogueSuggestions(run.snapshot)).toEqual([])
              expect(advanceDialogue(run.snapshot, { text: 'again' })).toEqual(
                run,
              )
              expect(
                dialogueSnapshotSchema.safeParse(
                  JSON.parse(JSON.stringify(run.snapshot)),
                ).success,
              ).toBe(true)
            })
          }
      it(`${sceneId}/${level}: repairs, refusal and edited IDs do not invent completion`, async () => {
        const loaded = await localContentProvider.load({ sceneId, level })
        expect(loaded.status).toBe('available')
        if (loaded.status !== 'available') return
        const start = () =>
          createDialogue(loaded.pack, { mode: 'short', variantId: 'visit' })
        for (const action of ['clarify', 'struggle', 'off-topic'] as const) {
          let run = advanceDialogue(start().snapshot, { action, text: 'Help' })
          expect(run.snapshot.state.completedObjectives).toEqual([])
          for (let i = 0; i < 2; i++)
            run = advanceDialogue(run.snapshot, {
              text: 'unlisted words',
              suggestionId: dialogueSuggestions(run.snapshot)[0].id,
            })
          expect(run.snapshot.state.outcome).toBe('partial')
          expect(run.snapshot.state.facts).toEqual([])
          expect(dialogueSuggestions(run.snapshot)).toEqual([])
        }
        const refused = advanceDialogue(start().snapshot, {
          action: 'refuse',
          text: 'Stop',
        })
        expect(refused.snapshot.state.outcome).toBe('declined')
        expect(refused.reply).not.toMatch(/[?？]/u)
      })
      it(`${sceneId}/${level}: a changed product/request preserves other evidence and consumes time`, async () => {
        const loaded = await localContentProvider.load({ sceneId, level })
        expect(loaded.status).toBe('available')
        if (loaded.status !== 'available') return
        let run = createDialogue(loaded.pack, {
          mode: 'extended',
          variantId: 'visit',
        })
        const first = run.snapshot.state.currentQuestionId!
        const secondForm = dialogueSuggestions(run.snapshot)[1]
        run = advanceDialogue(run.snapshot, {
          text: dialogueSuggestions(run.snapshot)[0].text,
        })
        run = advanceDialogue(run.snapshot, {
          text: dialogueSuggestions(run.snapshot)[0].text,
        })
        const independent = run.snapshot.state.facts[1]
        run = advanceDialogue(run.snapshot, {
          action: 'change',
          questionId: first,
          text: secondForm.text,
        })
        expect(
          run.snapshot.state.facts.find((f) => f.questionId === first)
            ?.answerId,
        ).toBe(secondForm.id)
        expect(
          run.snapshot.state.facts.find(
            (f) => f.questionId === independent.questionId,
          ),
        ).toEqual(independent)
        while (run.snapshot.state.outcome === 'active')
          run = advanceDialogue(run.snapshot, {
            text: dialogueSuggestions(run.snapshot)[0].text,
          })
        expect(run.snapshot.state.outcome).toBe('partial')
        expect(run.snapshot.state.completedObjectives).toHaveLength(9)
        expect(dialogueSuggestions(run.snapshot)).toEqual([])
      })
    }
  it('the new corpus does not count recycled question text across units', async () => {
    const text: string[] = []
    for (const sceneId of scenes)
      for (const level of levels) {
        const loaded = await localContentProvider.load({ sceneId, level })
        expect(loaded.status).toBe('available')
        if (loaded.status === 'available')
          text.push(...loaded.pack.questions.map((q) => q.text))
      }
    expect(text).toHaveLength(300)
    expect(new Set(text).size).toBe(300)
  })
  it('the price enquiry never reopens a discount request after the final-price boundary', async () => {
    for (const level of levels)
      for (const variantId of ['visit', 'planning']) {
        const loaded = await localContentProvider.load({
          sceneId: 'dining-06',
          level,
        })
        if (loaded.status !== 'available') throw new Error('missing dining-06')
        let run = createDialogue(loaded.pack, { variantId, mode: 'standard' })
        const intents: string[] = []
        for (let i = 0; i < 6; i++) {
          const q = run.snapshot.pack.questions.find(
            (q) => q.id === run.snapshot.state.currentQuestionId,
          )!
          intents.push(q.intent)
          run = advanceDialogue(run.snapshot, {
            text: dialogueSuggestions(run.snapshot)[0].text,
          })
        }
        expect(intents.slice(3)).toEqual([
          'negotiate',
          'respect-refusal',
          'alternative',
        ])
      }
  })
  it('registers canonical IDs only and explicitly rejects unsupported corpus versions', async () => {
    expect(
      gradedSceneManifest.filter((m) => m.category === 'dining'),
    ).toHaveLength(6)
    for (const sceneId of scenes)
      expect(
        await localContentProvider.load({
          sceneId,
          level: 'A1',
          contentVersion: 99,
        }),
      ).toEqual({ status: 'version-unavailable', requestedVersion: 99 })
    for (const sceneId of [
      'restaurant-order',
      'food-allergy',
      'return-item',
      'supermarket-help',
      'price-discount',
    ])
      expect(await localContentProvider.load({ sceneId, level: 'A1' })).toEqual(
        { status: 'unavailable' },
      )
  })
  it.each([
    ['dining-02', 'phrase', 'on the side', undefined],
    ['dining-02', 'sentence', 'No chilli, please.', undefined],
    ['dining-03', 'phrase', 'allergic to', undefined],
    ['dining-03', 'sentence', 'I have a peanut allergy.', undefined],
    ['dining-04', 'phrase', 'proof of purchase', undefined],
    ['dining-04', 'sentence', 'A refund, please.', undefined],
    ['dining-05', 'phrase', 'price per kilo', undefined],
    [
      'dining-05',
      'sentence',
      'Please show me.',
      'supermarket-help.A1.navigation',
    ],
    ['dining-06', 'phrase', 'within my budget', undefined],
    ['dining-06', 'sentence', 'I will leave without buying.', undefined],
  ] as const)(
    'curated phrases and sentences: %s/%s/%s',
    async (sceneId, kind, text, questionId) => {
      const result = await localLearningAssistant.analyze({
        sceneId,
        kind,
        text,
        level: 'A1',
        questionId,
      })
      expect(result.status).toBe('exact')
      expect(result.entries[0].examples.map((e) => e.level)).toEqual([
        'A1',
        'A2',
        'B1',
        'B2',
        'C1',
      ])
      if (questionId)
        expect(
          (
            await localLearningAssistant.analyze({
              sceneId,
              kind,
              text,
              level: 'A1',
            })
          ).status,
        ).toBe('unknown')
    },
  )
  it.each([
    ['dining-02', 'portion'],
    ['dining-03', 'ingredient'],
    ['dining-04', 'refund'],
    ['dining-05', 'aisle'],
    ['dining-06', 'discount'],
  ])(
    '%s: returns bounded context analysis, not a general parser',
    async (sceneId, text) => {
      const exact = await localLearningAssistant.analyze({
        sceneId,
        level: 'A1',
        kind: 'word',
        text,
      })
      expect(exact.status).toBe('exact')
      expect(exact.entries[0].sceneId).toBe(sceneId)
      const partial = await localLearningAssistant.analyze({
        sceneId,
        level: 'B2',
        kind: 'sentence',
        text: `I invented a sentence about ${text}.`,
      })
      expect(partial.status).toBe('partial')
      expect(partial.explanationZh).not.toContain('咖啡')
      expect(
        (
          await localLearningAssistant.analyze({
            sceneId,
            level: 'C1',
            kind: 'sentence',
            text: 'The moon hums softly.',
          })
        ).status,
      ).toBe('unknown')
    },
  )
})
