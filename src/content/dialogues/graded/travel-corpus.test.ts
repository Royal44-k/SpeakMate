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

// Independent brief-derived identities. Missing/misregistered travel packs must fail.
const scenes = [
  'travel-01',
  'travel-02',
  'travel-03',
  'travel-04',
  'travel-05',
  'travel-06',
] as const
const levels = ['A1', 'A2', 'B1', 'B2', 'C1'] as const
describe('travel corpus', () => {
  for (const sceneId of scenes)
    for (const level of levels) {
      // Removing an alternate bank node or letting either adjacent answer invalidate
      // the following owned pair must fail. This checks execution, not naturalness.
      it(`${sceneId}/${level}: both answers remain applicable at every adjacent edge`, async () => {
        const r = await localContentProvider.load({ sceneId, level })
        if (r.status !== 'available') throw new Error('missing travel pack')
        const reached = new Set<string>()
        for (const variantId of ['counter', 'assistance']) {
          let base = createDialogue(r.pack, { mode: 'extended', variantId })
          for (let position = 0; position < 10; position++) {
            reached.add(base.snapshot.state.currentQuestionId!)
            for (const firstChoice of [0, 1]) {
              const first = dialogueSuggestions(base.snapshot)[firstChoice]
              const next = advanceDialogue(base.snapshot, { text: first.text })
              expect(next.confirmation).toBe('exact')
              if (position < 9) {
                expect(dialogueSuggestions(next.snapshot)).toHaveLength(2)
                for (const secondChoice of [0, 1]) {
                  const second = dialogueSuggestions(next.snapshot)[
                    secondChoice
                  ]
                  const after = advanceDialogue(next.snapshot, {
                    text: second.text,
                  })
                  expect(after.confirmation).toBe('exact')
                  expect(after.snapshot.state.completedObjectives).toHaveLength(
                    position + 2,
                  )
                  expect(
                    after.snapshot.state.facts.some(
                      (f) => f.answerId === first.id,
                    ),
                  ).toBe(true)
                  expect(
                    after.snapshot.state.facts.some(
                      (f) => f.answerId === second.id,
                    ),
                  ).toBe(true)
                }
              }
            }
            base = advanceDialogue(base.snapshot, {
              text: dialogueSuggestions(base.snapshot)[0].text,
            })
          }
        }
        expect(reached.size).toBe(12)
      })
      it(`${sceneId}/${level}: changes consume a submission without erasing independent facts`, async () => {
        const r = await localContentProvider.load({ sceneId, level })
        if (r.status !== 'available') throw new Error('missing travel pack')
        let run = createDialogue(r.pack, {
          mode: 'extended',
          variantId: 'counter',
        })
        const questionId = run.snapshot.state.currentQuestionId!
        const second = dialogueSuggestions(run.snapshot)[1]
        run = advanceDialogue(run.snapshot, {
          text: dialogueSuggestions(run.snapshot)[0].text,
        })
        run = advanceDialogue(run.snapshot, {
          text: dialogueSuggestions(run.snapshot)[0].text,
        })
        const independent = run.snapshot.state.facts[1]
        run = advanceDialogue(run.snapshot, {
          action: 'change',
          questionId,
          text: second.text,
        })
        expect(
          run.snapshot.state.facts.find((f) => f.questionId === questionId)
            ?.answerId,
        ).toBe(second.id)
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
      it(`${sceneId}/${level}: supplies twelve owned, eligible original pairs`, async () => {
        const r = await localContentProvider.load({ sceneId, level })
        expect(r.status).toBe('available')
        if (r.status !== 'available') return
        expect(r.pack.sceneId).toBe(sceneId)
        expect(r.pack.category).toBe('travel')
        expect(r.pack.level).toBe(level)
        expect(r.pack.questions).toHaveLength(12)
        expect(
          new Set(r.pack.questions.map((q) => q.intent)).size,
        ).toBeGreaterThanOrEqual(6)
        for (const q of r.pack.questions) {
          expect(q.review.state).toBe('model-reviewed')
          expect(q.answers).toHaveLength(2)
          expect(q.answers[0].effects).not.toEqual(q.answers[1].effects)
          for (const a of q.answers) {
            expect(a.review.state).toBe('model-reviewed')
            expect(a.acceptedForms).toEqual([a.text])
          }
        }
      })
      for (const [mode, turns] of [
        ['short', 3],
        ['standard', 6],
        ['extended', 10],
      ] as const)
        for (const variantId of ['counter', 'assistance'])
          for (const choice of [0, 1, 2]) {
            it(`${sceneId}/${level}/${variantId}/${mode}/${choice}: advances and terminates honestly`, async () => {
              const r = await localContentProvider.load({ sceneId, level })
              expect(r.status).toBe('available')
              if (r.status !== 'available') return
              let run = createDialogue(r.pack, { mode, variantId })
              for (let i = 0; i < turns; i++) {
                const q = run.snapshot.pack.questions.find(
                  (q) => q.id === run.snapshot.state.currentQuestionId,
                )!
                expect(run.reply).toBe(q.text)
                expect(dialogueSuggestions(run.snapshot)).toEqual(q.answers)
                const a = dialogueSuggestions(run.snapshot)[
                  choice === 2 ? i % 2 : choice
                ]
                run = advanceDialogue(run.snapshot, {
                  text: a.text,
                  suggestionId: a.id,
                })
                expect(run.confirmation).toBe('exact')
                expect(run.snapshot.state.completedObjectives).toHaveLength(
                  i + 1,
                )
              }
              expect(run.snapshot.state.outcome).toBe('achieved')
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
      it(`${sceneId}/${level}: explicit repairs and refusal cannot confirm unlisted answers`, async () => {
        const r = await localContentProvider.load({ sceneId, level })
        expect(r.status).toBe('available')
        if (r.status !== 'available') return
        const start = () =>
          createDialogue(r.pack, { mode: 'short', variantId: 'counter' })
        for (const action of ['clarify', 'struggle', 'off-topic'] as const) {
          let run = advanceDialogue(start().snapshot, { action, text: 'Help' })
          for (let i = 0; i < 2; i++)
            run = advanceDialogue(run.snapshot, {
              text: 'Unlisted answer',
              suggestionId: dialogueSuggestions(run.snapshot)[0].id,
            })
          expect(run.snapshot.state.outcome).toBe('partial')
          expect(run.snapshot.state.facts).toEqual([])
          expect(dialogueSuggestions(run.snapshot)).toEqual([])
        }
        const declined = advanceDialogue(start().snapshot, {
          action: 'refuse',
          text: 'Stop',
        })
        expect(declined.snapshot.state.outcome).toBe('declined')
        expect(declined.reply).not.toMatch(/[?？]/u)
      })
    }
  // A reviewed wording contract, not an automatic natural-language quality check.
  // Waiting until the stated time does not create an early-access request.
  for (const [level, question, hint, answers] of [
    [
      'A2',
      'Would you like information about bag storage before you go to your room?',
      '询问进入房间前的储物选择，不预设申请提前入住。',
      [
        'Yes, is there somewhere I could leave my bag?',
        'No, I would rather keep it with me.',
      ],
    ],
    [
      'B1',
      'Would it help to discuss where you could leave your bag before going to your room?',
      '储物选择不依赖是否提出提前入住申请。',
      [
        'Yes, I would like to know whether a storage option exists and how it works.',
        'No, I would rather keep the bag with me until I go to my room.',
      ],
    ],
    [
      'B2',
      'Would you like to look into bag storage for the time before you enter your room?',
      '说明进入房间前的储物偏好，不推断提前入住申请状态。',
      [
        'Yes, I would like to check the storage conditions before deciding whether to leave my bag.',
        'No, I would prefer to keep the bag with me until I enter the room.',
      ],
    ],
    [
      'C1',
      'Would it be helpful to go over the storage options for your bag before you head to your room?',
      '储物与进入房间前的安排有关，不预设存在待定的提前入住请求。',
      [
        'Yes, please explain the storage arrangements, particularly how I would collect the bag when I need it.',
        'No, I would rather keep the bag with me, as there are a few things I may need before I go to my room.',
      ],
    ],
  ] as const)
    for (let intermediate = 0; intermediate < 8; intermediate++)
      for (const luggageChoice of [0, 1]) {
        it(`hotel/${level}/${intermediate}/${luggageChoice}: wait/no-request remains compatible with storage after intermediate alternatives`, async () => {
          const result = await localContentProvider.load({
            sceneId: 'travel-05',
            level,
          })
          if (result.status !== 'available')
            throw new Error('missing hotel pack')
          let run = createDialogue(result.pack, {
            mode: 'extended',
            variantId: 'assistance',
          })
          for (let i = 0; i < 4; i++)
            run = advanceDialogue(run.snapshot, {
              text: dialogueSuggestions(run.snapshot)[0].text,
            })
          expect(run.snapshot.state.currentQuestionId).toBe(
            `hotel-check-in.${level}.early`,
          )
          run = advanceDialogue(run.snapshot, {
            text: dialogueSuggestions(run.snapshot)[1].text,
          })
          for (const [i, key] of ['breakfast', 'payment', 'key'].entries()) {
            expect(run.snapshot.state.currentQuestionId).toBe(
              `hotel-check-in.${level}.${key}`,
            )
            run = advanceDialogue(run.snapshot, {
              text: dialogueSuggestions(run.snapshot)[(intermediate >> i) & 1]
                .text,
            })
          }
          expect(
            run.snapshot.state.facts.find((f) => f.key === 'early')?.value,
          ).toBe('wait')
          expect(run.snapshot.state.currentQuestionId).toBe(
            `hotel-check-in.${level}.luggage`,
          )
          expect(run.reply).toBe(question)
          expect(run.hintZh).toBe(hint)
          expect(dialogueSuggestions(run.snapshot).map((a) => a.text)).toEqual(
            answers,
          )
          run = advanceDialogue(run.snapshot, {
            text: dialogueSuggestions(run.snapshot)[luggageChoice].text,
          })
          run = advanceDialogue(run.snapshot, {
            text: dialogueSuggestions(run.snapshot)[0].text,
          })
          expect(run.snapshot.state.outcome).toBe('achieved')
          expect(
            run.snapshot.state.facts.find((f) => f.key === 'early')?.value,
          ).toBe('wait')
        })
      }
  it('registers six canonical IDs and no slug aliases', async () => {
    expect(
      gradedSceneManifest.filter((m) => String(m.category) === 'travel'),
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
      'airport-check-in',
      'security-screening',
      'flight-connection',
      'immigration-interview',
      'hotel-check-in',
      'hotel-room-problem',
    ])
      expect(await localContentProvider.load({ sceneId, level: 'A1' })).toEqual(
        { status: 'unavailable' },
      )
  })
  for (const level of levels)
    for (const variantId of ['counter', 'assistance'])
      for (const laterChoice of [0, 1]) {
        for (const [sceneId, pendingKey, pendingChoice, expected] of [
          [
            'travel-01',
            'bag',
            1,
            {
              A1: 'ask',
              A2: 'confirm',
              B1: 'explain',
              B2: 'review',
              C1: 'clarify',
            }[level],
          ],
          ['travel-05', 'early', 0, 'ask'],
          ['travel-06', 'wait', 1, 'sooner'],
        ] as const) {
          it(`${sceneId}/${level}/${variantId}/${laterChoice}: leaves the unresolved request pending across later choices`, async () => {
            const r = await localContentProvider.load({ sceneId, level })
            if (r.status !== 'available') throw new Error('missing travel pack')
            let run = createDialogue(r.pack, { mode: 'extended', variantId })
            while (
              !run.snapshot.state.currentQuestionId?.endsWith(`.${pendingKey}`)
            )
              run = advanceDialogue(run.snapshot, {
                text: dialogueSuggestions(run.snapshot)[0].text,
              })
            run = advanceDialogue(run.snapshot, {
              text: dialogueSuggestions(run.snapshot)[pendingChoice].text,
            })
            const evidence = run.snapshot.state.facts.find(
              (f) => f.key === pendingKey,
            )
            expect(evidence?.value).toBe(expected)
            while (run.snapshot.state.outcome === 'active') {
              run = advanceDialogue(run.snapshot, {
                text: dialogueSuggestions(run.snapshot)[laterChoice].text,
              })
              expect(
                run.snapshot.state.facts.find((f) => f.key === pendingKey),
              ).toEqual(evidence)
            }
            expect(run.snapshot.state.outcome).toBe('achieved')
            expect(dialogueSuggestions(run.snapshot)).toEqual([])
            expect(run.reply).not.toMatch(/[?？]/u)
          })
        }
      }
  it.each([
    ['travel-01', 'luggage'],
    ['travel-03', 'connection'],
    ['travel-05', 'reservation'],
  ])(
    'bounds %s word matches and rejects an unrelated intent',
    async (sceneId, text) => {
      const result = await localLearningAssistant.analyze({
        sceneId,
        level: 'B2',
        kind: 'sentence',
        text: `An invented sentence includes ${text} somewhere.`,
      })
      expect(result.status).toBe('partial')
      expect(result.explanationZh).toContain('不代表整句')
      expect(result.capabilities).toEqual(['save', 'note', 'self-recall'])
      const wrongScene = await localLearningAssistant.analyze({
        sceneId: 'travel-02',
        level: 'A1',
        kind: 'word',
        text,
      })
      expect(wrongScene.status).toBe('unknown')
      const wrongIntent = await localLearningAssistant.analyze({
        sceneId,
        intent: 'invented-intent',
        level: 'A1',
        kind: 'word',
        text,
      })
      expect(wrongIntent.status).not.toBe('exact')
    },
  )
  it('has 360 different questions, not recycled level text', async () => {
    const texts: string[] = []
    for (const sceneId of scenes)
      for (const level of levels) {
        const r = await localContentProvider.load({ sceneId, level })
        if (r.status === 'available')
          texts.push(...r.pack.questions.map((q) => q.text))
      }
    expect(texts).toHaveLength(360)
    expect(new Set(texts).size).toBe(360)
  })
  it.each([
    ['travel-01', 'word', 'luggage'],
    ['travel-02', 'phrase', 'take out'],
    ['travel-03', 'word', 'connection'],
    ['travel-04', 'phrase', 'purpose of visit'],
    ['travel-05', 'word', 'reservation'],
    ['travel-06', 'sentence', 'The air conditioning is not working.'],
  ] as const)(
    '%s: provides bounded %s analysis',
    async (sceneId, kind, text) => {
      const r = await localLearningAssistant.analyze({
        sceneId,
        level: 'A1',
        kind,
        text,
      })
      expect(r.status).toBe('exact')
      expect(r.entries[0].sceneId).toBe(sceneId)
      expect(r.entries[0].examples.map((e) => e.level)).toEqual(levels)
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
