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

// Hand-derived from Task3D, never from the manifest being tested.
const scenes = [
  ['daily-01', 'ask-directions', 'destination'],
  ['daily-02', 'taxi-ride', 'destination'],
  ['daily-03', 'bank-card-problem', 'problem'],
  ['daily-04', 'collect-parcel', 'object'],
  ['daily-05', 'haircut-request', 'length'],
  ['daily-06', 'phone-repair', 'fault'],
] as const
const levels = ['A1', 'A2', 'B1', 'B2', 'C1'] as const
describe('daily-life corpus', () => {
  // Editorial prerequisite regression through the real selected snapshot/path.
  // It protects the supplied listening experience, not a natural-language score.
  for (const level of levels)
    for (const variantId of ['visit', 'planning'])
      for (const formatChoice of [0, 1])
        for (const repairChoice of [0, 1])
          it(`directions/${level}/${variantId}/${formatChoice}/${repairChoice}: prior street-name speech precedes hearing repair for either requested format`, async () => {
            const result = await localContentProvider.load({
              sceneId: 'daily-01',
              level,
            })
            expect(result.status).toBe('available')
            if (result.status !== 'available') return
            let run = createDialogue(result.pack, {
              mode: 'extended',
              variantId,
            })
            const initialSituation = run.snapshot.pack.variants.find(
              (variant) => variant.id === variantId,
            )!.situationZh
            for (let turn = 0; turn < 6; turn++) {
              const choice =
                run.snapshot.state.currentQuestionId ===
                `ask-directions.${level}.format`
                  ? formatChoice
                  : turn % 2
              run = advanceDialogue(run.snapshot, {
                text: dialogueSuggestions(run.snapshot)[choice].text,
              })
            }
            expect(run.snapshot.state.currentQuestionId).toBe(
              `ask-directions.${level}.repeat`,
            )
            expect(
              run.snapshot.state.facts.find((fact) => fact.key === 'format')
                ?.value,
            ).toBe(formatChoice === 0 ? 'map' : 'spoken')
            expect(initialSituation).toContain(
              '开场前，工作人员已指着地图上的两条街名，连着读过一遍：“Mill Road, Hill Road.”',
            )
            run = advanceDialogue(run.snapshot, {
              text: dialogueSuggestions(run.snapshot)[repairChoice].text,
            })
            expect(
              run.snapshot.state.facts.find((fact) => fact.key === 'repeat')
                ?.value,
            ).toBe(repairChoice === 0 ? 'repeat' : 'spell')
          })
  it('pins supported corpus versions and counts only 360 newly authored daily questions', async () => {
    const ids = new Set<string>()
    let answers = 0
    for (const [sceneId] of scenes)
      for (const level of levels) {
        const r = await localContentProvider.load({
          sceneId,
          level,
          contentVersion: 1,
        })
        expect(r.status).toBe('available')
        if (r.status === 'available')
          for (const q of r.pack.questions) {
            ids.add(q.id)
            answers += q.answers.length
          }
      }
    expect(ids.size).toBe(360)
    expect(answers).toBe(720)
    expect(
      await localContentProvider.load({
        sceneId: 'daily-06',
        level: 'C1',
        contentVersion: 2,
      }),
    ).toEqual({ status: 'version-unavailable', requestedVersion: 2 })
  })
  it('registers all six canonical daily scenes without using slugs as IDs', async () => {
    expect(
      gradedSceneManifest
        .filter((s) => s.category === 'daily')
        .map((s) => s.sceneId),
    ).toEqual(scenes.map((s) => s[0]))
    for (const [, slug] of scenes)
      expect(
        await localContentProvider.load({ sceneId: slug, level: 'A1' }),
      ).toEqual({ status: 'unavailable' })
  })
  for (const [sceneId, slug, openingKey] of scenes)
    for (const level of levels) {
      it(`${sceneId}/${level}: twelve distinct owned reviewed pairs and six intents`, async () => {
        const r = await localContentProvider.load({ sceneId, level })
        expect(r.status).toBe('available')
        if (r.status !== 'available') return
        expect(r.pack).toMatchObject({
          sceneId,
          category: 'daily',
          level,
          contentVersion: 1,
        })
        expect(r.pack.questions).toHaveLength(12)
        expect(r.pack.questions[0].id).toBe(`${slug}.${level}.${openingKey}`)
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
        for (const variantId of ['visit', 'planning'])
          for (const choice of [0, 1, 2])
            it(`${sceneId}/${level}/${variantId}/${mode}/${choice}: real answers achieve selected objectives then stop`, async () => {
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
                const a = q.answers[choice === 2 ? i % 2 : choice]
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
      it(`${sceneId}/${level}: every bank node and every adjacent answer pair remain reachable`, async () => {
        const r = await localContentProvider.load({ sceneId, level })
        expect(r.status).toBe('available')
        if (r.status !== 'available') return
        const reached = new Set<string>()
        for (const variantId of ['visit', 'planning']) {
          let run = createDialogue(r.pack, { mode: 'extended', variantId })
          for (let i = 0; i < 10; i++) {
            reached.add(run.snapshot.state.currentQuestionId!)
            for (const a of dialogueSuggestions(run.snapshot)) {
              const next = advanceDialogue(run.snapshot, { text: a.text })
              expect(next.confirmation).toBe('exact')
              if (i < 9)
                for (const b of dialogueSuggestions(next.snapshot)) {
                  const after = advanceDialogue(next.snapshot, { text: b.text })
                  expect(after.confirmation).toBe('exact')
                  expect(
                    after.snapshot.state.facts.some((f) => f.answerId === a.id),
                  ).toBe(true)
                  expect(
                    after.snapshot.state.facts.some((f) => f.answerId === b.id),
                  ).toBe(true)
                }
            }
            run = advanceDialogue(run.snapshot, {
              text: dialogueSuggestions(run.snapshot)[0].text,
            })
          }
        }
        expect(reached.size).toBe(12)
      })
      it(`${sceneId}/${level}: changing the initial choice replaces its fact and consumes time`, async () => {
        const r = await localContentProvider.load({ sceneId, level })
        expect(r.status).toBe('available')
        if (r.status !== 'available') return
        let run = createDialogue(r.pack, {
          mode: 'extended',
          variantId: 'visit',
        })
        const q = run.snapshot.state.currentQuestionId!
        const pair = dialogueSuggestions(run.snapshot)
        run = advanceDialogue(run.snapshot, { text: pair[0].text })
        run = advanceDialogue(run.snapshot, {
          text: dialogueSuggestions(run.snapshot)[0].text,
        })
        const independent = run.snapshot.state.facts[1]
        run = advanceDialogue(run.snapshot, {
          action: 'change',
          questionId: q,
          text: pair[1].text,
        })
        expect(
          run.snapshot.state.facts.find((f) => f.questionId === q)?.answerId,
        ).toBe(pair[1].id)
        expect(run.snapshot.state.facts).toContainEqual(independent)
        while (run.snapshot.state.outcome === 'active')
          run = advanceDialogue(run.snapshot, {
            text: dialogueSuggestions(run.snapshot)[0].text,
          })
        expect(run.snapshot.state.outcome).toBe('partial')
        expect(run.snapshot.state.completedObjectives).toHaveLength(9)
      })
      it(`${sceneId}/${level}: unlisted edited suggestions and repairs remain unconfirmed; refusal terminates`, async () => {
        const r = await localContentProvider.load({ sceneId, level })
        expect(r.status).toBe('available')
        if (r.status !== 'available') return
        const start = () =>
          createDialogue(r.pack, { mode: 'short', variantId: 'visit' })
        for (const action of ['clarify', 'struggle', 'off-topic'] as const) {
          let run = advanceDialogue(start().snapshot, { action, text: 'Help' })
          for (let i = 0; i < 2; i++)
            run = advanceDialogue(run.snapshot, {
              text: 'Unlisted response',
              suggestionId: dialogueSuggestions(run.snapshot)[0].id,
            })
          expect(run.snapshot.state.outcome).toBe('partial')
          expect(run.snapshot.state.facts).toEqual([])
        }
        const refused = advanceDialogue(start().snapshot, {
          action: 'refuse',
          text: 'Stop',
        })
        expect(refused.snapshot.state.outcome).toBe('declined')
        expect(dialogueSuggestions(refused.snapshot)).toEqual([])
      })
    }
  for (const [sceneId, kind, text] of [
    ['daily-01', 'phrase', 'step-free'],
    ['daily-02', 'phrase', 'drop off'],
    ['daily-03', 'word', 'declined'],
    ['daily-04', 'word', 'parcel'],
    ['daily-05', 'word', 'trim'],
    ['daily-06', 'sentence', 'Please give me an estimate first.'],
  ] as const)
    it(`${sceneId}: bounded ${kind} analysis for ${text}`, async () => {
      const r = await localLearningAssistant.analyze({
        sceneId,
        kind,
        text,
        level: 'B1',
      })
      expect(r.status).toBe('exact')
      expect(r.entries).toHaveLength(1)
      expect(r.entries[0]?.examples).toHaveLength(5)
    })
  // These assertions preserve independently named scene outcomes. They do not
  // certify the English; the complete paired-branch reading is recorded separately.
  for (const level of levels)
    for (const primary of [0, 1])
      for (const intermediate of [0, 1, 2, 3]) {
        for (const [sceneId, slug, key, wantA, wantB, lastKey, variantId] of [
          [
            'daily-02',
            'taxi-ride',
            'route',
            'ask-free',
            'no-request',
            'fare',
            'visit',
          ],
          [
            'daily-04',
            'collect-parcel',
            'wait',
            'wait',
            'return-request',
            'next',
            'planning',
          ],
          [
            'daily-06',
            'phone-repair',
            'loan',
            'ask',
            'no',
            'update',
            'planning',
          ],
        ] as const)
          it(`${sceneId}/${level}/${primary}/${intermediate}: request or no-request is preserved through later independent choices`, async () => {
            const r = await localContentProvider.load({ sceneId, level })
            expect(r.status).toBe('available')
            if (r.status !== 'available') return
            let run = createDialogue(r.pack, { mode: 'extended', variantId })
            let n = 0
            while (run.snapshot.state.outcome === 'active') {
              const current = run.snapshot.state.currentQuestionId!
              if (current === `${slug}.${level}.${lastKey}`) {
                expect(
                  run.snapshot.state.facts.find((f) => f.key === key)?.value,
                ).toBe(primary === 0 ? wantA : wantB)
              }
              const choice =
                current === `${slug}.${level}.${key}`
                  ? primary
                  : (intermediate >> (n++ % 2)) & 1
              run = advanceDialogue(run.snapshot, {
                text: dialogueSuggestions(run.snapshot)[choice].text,
              })
            }
            expect(
              run.snapshot.state.facts.find((f) => f.key === key)?.value,
            ).toBe(primary === 0 ? wantA : wantB)
            expect(run.snapshot.state.outcome).toBe('achieved')
            expect(
              run.snapshot.state.facts.some((f) =>
                /approved|authorised|collected|paid/u.test(f.value),
              ),
            ).toBe(false)
          })
        it(`hair/${level}/${primary}/${intermediate}: latest length survives no-wash and either finishing choice`, async () => {
          const r = await localContentProvider.load({
            sceneId: 'daily-05',
            level,
          })
          expect(r.status).toBe('available')
          if (r.status !== 'available') return
          let run = createDialogue(r.pack, {
            mode: 'extended',
            variantId: 'visit',
          })
          const first = dialogueSuggestions(run.snapshot)
          run = advanceDialogue(run.snapshot, { text: first[1 - primary].text })
          run = advanceDialogue(run.snapshot, {
            text: dialogueSuggestions(run.snapshot)[intermediate & 1].text,
          })
          run = advanceDialogue(run.snapshot, {
            action: 'change',
            questionId: `haircut-request.${level}.length`,
            text: first[primary].text,
          })
          while (run.snapshot.state.outcome === 'active') {
            const current = run.snapshot.state.currentQuestionId
            const choice =
              current === `haircut-request.${level}.wash`
                ? 1
                : (intermediate >> 1) & 1
            if (current === `haircut-request.${level}.check`) {
              expect(
                run.snapshot.state.facts.find((f) => f.key === 'length')?.value,
              ).toBe(primary === 0 ? 'trim' : 'shorter')
              expect(
                run.snapshot.state.facts.find((f) => f.key === 'wash')?.value,
              ).toBe('no')
              expect(
                run.snapshot.state.facts.find((f) => f.key === 'dry')?.value,
              ).toBe(intermediate >> 1 === 0 ? 'styled' : 'natural')
            }
            run = advanceDialogue(run.snapshot, {
              text: dialogueSuggestions(run.snapshot)[choice].text,
            })
          }
          expect(run.snapshot.state.outcome).toBe('partial')
          expect(
            run.snapshot.state.facts.find((f) => f.key === 'length')?.value,
          ).toBe(primary === 0 ? 'trim' : 'shorter')
        })
        it(`bank/${level}/${primary}/${intermediate}: retained-card history asks about contact, never assumes another usable card`, async () => {
          const r = await localContentProvider.load({
            sceneId: 'daily-03',
            level,
          })
          expect(r.status).toBe('available')
          if (r.status !== 'available') return
          let run = createDialogue(r.pack, {
            mode: 'extended',
            variantId: 'visit',
          })
          run = advanceDialogue(run.snapshot, {
            text: dialogueSuggestions(run.snapshot)[1].text,
          })
          for (let i = 0; i < 3; i++)
            run = advanceDialogue(run.snapshot, {
              text: dialogueSuggestions(run.snapshot)[
                (intermediate >> (i % 2)) & 1
              ].text,
            })
          expect(run.snapshot.state.currentQuestionId).toBe(
            `bank-card-problem.${level}.attempts`,
          )
          expect(
            run.snapshot.pack.questions.find(
              (q) => q.id === run.snapshot.state.currentQuestionId,
            )?.intent,
          ).toBe('report-contact')
          run = advanceDialogue(run.snapshot, {
            text: dialogueSuggestions(run.snapshot)[primary].text,
          })
          expect(
            run.snapshot.state.facts.find((f) => f.key === 'problem')?.value,
          ).toBe('retained')
          expect(
            run.snapshot.state.facts.find((f) => f.key === 'attempts')?.value,
          ).toBe(primary === 0 ? 'no' : 'unsure')
        })
      }
  it('does not turn a partial word match into whole-sentence analysis or ask for real identifiers', async () => {
    expect(
      (
        await localLearningAssistant.analyze({
          sceneId: 'daily-04',
          kind: 'sentence',
          text: 'The parcel was somehow singing.',
          level: 'B1',
        })
      ).status,
    ).toBe('partial')
    const r = await localLearningAssistant.analyze({
      sceneId: 'daily-03',
      kind: 'sentence',
      text: 'Here is my secret code.',
      level: 'A2',
    })
    expect(r.status).toBe('unknown')
    expect(r.capabilities).toEqual(['save', 'note', 'self-recall'])
  })
})
