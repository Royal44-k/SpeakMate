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

// Independent Task3E identities and opening objectives. Missing registration,
// lost answer evidence, early completion and incorrect versions must fail here.
const scenes = [
  ['work-01', 'work-introduction', 'role'],
  ['work-02', 'daily-standup', 'done'],
  ['work-03', 'progress-update', 'status'],
  ['work-04', 'deadline-negotiation', 'need'],
  ['work-05', 'meeting-disagreement', 'position'],
  ['work-06', 'job-interview', 'interest'],
] as const
const levels = ['A1', 'A2', 'B1', 'B2', 'C1'] as const

describe('original workplace corpus', () => {
  it('loads six canonical work scenes and 360 new questions, not legacy triples', async () => {
    expect(
      gradedSceneManifest
        .filter((s) => s.category === 'work')
        .map((s) => s.sceneId),
    ).toEqual([
      'work-01',
      'work-02',
      'work-03',
      'work-04',
      'work-05',
      'work-06',
    ])
    const ids = new Set<string>()
    const texts = new Set<string>()
    let answers = 0
    for (const [sceneId, slug] of scenes) {
      expect(
        await localContentProvider.load({ sceneId: slug, level: 'A1' }),
      ).toEqual({ status: 'unavailable' })
      for (const level of levels) {
        const r = await localContentProvider.load({
          sceneId,
          level,
          contentVersion: 1,
        })
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
        sceneId: 'work-06',
        level: 'C1',
        contentVersion: 2,
      }),
    ).toEqual({ status: 'version-unavailable', requestedVersion: 2 })
  })
  for (const [sceneId, slug, opening] of scenes)
    for (const level of levels) {
      it(`${sceneId}/${level}: twelve owned paired questions and genuine intent coverage`, async () => {
        const r = await localContentProvider.load({ sceneId, level })
        expect(r.status).toBe('available')
        if (r.status !== 'available') return
        expect(r.pack).toMatchObject({
          sceneId,
          category: 'work',
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
          expect(q.answers).toHaveLength(2)
          expect(q.answers[0].effects).not.toEqual(q.answers[1].effects)
          for (const a of q.answers) {
            expect(a.acceptedForms).toEqual([a.text])
            expect(a.review.state).toBe('model-reviewed')
          }
        }
      })
      for (const variantId of ['team', 'handover'])
        for (const [mode, turns] of [
          ['short', 3],
          ['standard', 6],
          ['extended', 10],
        ] as const)
          for (const choice of [0, 1, 2])
            it(`${sceneId}/${level}/${variantId}/${mode}/${choice}: answers achieve exactly the selected objectives then stop`, async () => {
              const r = await localContentProvider.load({ sceneId, level })
              expect(r.status).toBe('available')
              if (r.status !== 'available') return
              let run = createDialogue(r.pack, { variantId, mode })
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
      it(`${sceneId}/${level}: all bank nodes and adjacent four-way pairs remain reachable`, async () => {
        const r = await localContentProvider.load({ sceneId, level })
        expect(r.status).toBe('available')
        if (r.status !== 'available') return
        const seen = new Set<string>()
        for (const variantId of ['team', 'handover']) {
          let run = createDialogue(r.pack, { variantId, mode: 'extended' })
          for (let i = 0; i < 10; i++) {
            seen.add(run.snapshot.state.currentQuestionId!)
            for (const a of dialogueSuggestions(run.snapshot)) {
              const next = advanceDialogue(run.snapshot, { text: a.text })
              expect(next.confirmation).toBe('exact')
              for (const b of dialogueSuggestions(next.snapshot)) {
                const after = advanceDialogue(next.snapshot, { text: b.text })
                expect(
                  after.snapshot.state.facts.some((f) => f.answerId === a.id),
                ).toBe(true)
                expect(
                  after.snapshot.state.facts.some((f) => f.answerId === b.id),
                ).toBe(true)
              }
            }
            run = advanceDialogue(run.snapshot, {
              text: dialogueSuggestions(run.snapshot)[i % 2].text,
            })
          }
        }
        expect(seen.size).toBe(12)
      })
      it(`${sceneId}/${level}: changed choice preserves independent evidence and repairs do not invent completion`, async () => {
        const r = await localContentProvider.load({ sceneId, level })
        expect(r.status).toBe('available')
        if (r.status !== 'available') return
        const start = () =>
          createDialogue(r.pack, { variantId: 'team', mode: 'short' })
        let run = start()
        const id = run.snapshot.state.currentQuestionId!
        const pair = dialogueSuggestions(run.snapshot)
        run = advanceDialogue(run.snapshot, { text: pair[0].text })
        run = advanceDialogue(run.snapshot, {
          text: dialogueSuggestions(run.snapshot)[0].text,
        })
        const independent = run.snapshot.state.facts[1]
        run = advanceDialogue(run.snapshot, {
          action: 'change',
          questionId: id,
          text: pair[1].text,
        })
        expect(run.snapshot.state.outcome).toBe('partial')
        expect(run.snapshot.state.facts).toContainEqual(independent)
        expect(
          run.snapshot.state.facts.find((f) => f.questionId === id)?.answerId,
        ).toBe(pair[1].id)
        for (const action of ['clarify', 'struggle', 'off-topic'] as const) {
          run = advanceDialogue(start().snapshot, { action, text: 'Help' })
          for (let i = 0; i < 2; i++)
            run = advanceDialogue(run.snapshot, {
              text: 'Unlisted answer',
              suggestionId: dialogueSuggestions(run.snapshot)[0].id,
            })
          expect(run.snapshot.state.outcome).toBe('partial')
          expect(run.snapshot.state.facts).toEqual([])
        }
        run = advanceDialogue(start().snapshot, {
          action: 'refuse',
          text: 'Stop',
        })
        expect(run.snapshot.state.outcome).toBe('declined')
        expect(dialogueSuggestions(run.snapshot)).toEqual([])
      })
    }
  // These literal outcomes distinguish requests from agreements and team claims
  // from individual ownership across intervening independent answers.
  for (const level of levels)
    for (const variantId of ['team', 'handover'])
      for (const primary of [0, 1])
        for (const middle of [0, 1, 2, 3])
          for (const [sceneId, slug, key, valueA, valueB] of [
            ['work-02', 'daily-standup', 'owner', 'mine', 'team'],
            ['work-03', 'progress-update', 'forecast', 'estimate', 'unknown'],
            [
              'work-04',
              'deadline-negotiation',
              'need',
              'extension-request',
              'scope-request',
            ],
            [
              'work-05',
              'meeting-disagreement',
              'trial',
              'pilot-proposal',
              'no-pilot',
            ],
          ] as const)
            it(`${sceneId}/${level}/${variantId}/${primary}/${middle}: ownership forecast or proposal is not silently upgraded`, async () => {
              const r = await localContentProvider.load({ sceneId, level })
              expect(r.status).toBe('available')
              if (r.status !== 'available') return
              let run = createDialogue(r.pack, { variantId, mode: 'extended' })
              let n = 0
              while (run.snapshot.state.outcome === 'active') {
                const choice =
                  run.snapshot.state.currentQuestionId ===
                  `${slug}.${level}.${key}`
                    ? primary
                    : (middle >> (n++ % 2)) & 1
                run = advanceDialogue(run.snapshot, {
                  text: dialogueSuggestions(run.snapshot)[choice].text,
                })
              }
              expect(
                run.snapshot.state.facts.find((f) => f.key === key)?.value,
              ).toBe(primary === 0 ? valueA : valueB)
              expect(run.snapshot.state.outcome).toBe('achieved')
              expect(
                run.snapshot.state.facts.some((f) =>
                  /approved|agreed-deadline|guaranteed/u.test(f.value),
                ),
              ).toBe(false)
            })
  for (const [sceneId, kind, text] of [
    ['work-01', 'phrase', 'responsible for'],
    ['work-02', 'word', 'blocker'],
    ['work-03', 'word', 'forecast'],
    ['work-04', 'phrase', 'trade-off'],
    ['work-05', 'sentence', 'Could we test that assumption?'],
    ['work-06', 'phrase', 'contributed to'],
  ] as const)
    it(`${sceneId}: bounded ${kind} analysis`, async () => {
      const r = await localLearningAssistant.analyze({
        sceneId,
        kind,
        text,
        level: 'B1',
        ...(sceneId === 'work-05'
          ? { questionId: 'meeting-disagreement.C1.assumption' }
          : {}),
      })
      expect(r.status).toBe('exact')
      expect(r.entries).toHaveLength(1)
      expect(r.entries[0]?.examples).toHaveLength(5)
    })
  for (const level of levels)
    for (const variantId of ['team', 'handover'])
      for (const combination of [0, 1, 2, 3, 4, 5, 6, 7])
        it(`interview/${level}/${variantId}/${combination}: either event supports either individual task and later difficulty`, async () => {
          const r = await localContentProvider.load({
            sceneId: 'work-06',
            level,
          })
          expect(r.status).toBe('available')
          if (r.status !== 'available') return
          let run = createDialogue(r.pack, { variantId, mode: 'extended' })
          const expected: Record<string, string> = {}
          while (run.snapshot.state.outcome === 'active') {
            const q = run.snapshot.pack.questions.find(
              (q) => q.id === run.snapshot.state.currentQuestionId,
            )!
            const bit = ['experience', 'contribution', 'difficulty'].indexOf(
              q.objective,
            )
            const answer = dialogueSuggestions(run.snapshot)[
              bit < 0 ? 0 : (combination >> bit) & 1
            ]
            if (bit >= 0) expected[q.objective] = answer.id
            run = advanceDialogue(run.snapshot, { text: answer.text })
          }
          expect(run.snapshot.state.outcome).toBe('achieved')
          for (const key of ['experience', 'contribution', 'difficulty'])
            expect(
              run.snapshot.state.facts.find((f) => f.key === key)?.answerId,
            ).toBe(expected[key])
        })
  it('keeps uncovered and partial analysis honest', async () => {
    expect(
      (
        await localLearningAssistant.analyze({
          sceneId: 'work-03',
          kind: 'sentence',
          text: 'The forecast has purple wings.',
          level: 'C1',
        })
      ).status,
    ).toBe('partial')
    const r = await localLearningAssistant.analyze({
      sceneId: 'work-06',
      kind: 'sentence',
      text: 'Invent a qualification for me.',
      level: 'B2',
    })
    expect(r.status).toBe('unknown')
    expect(r.capabilities).toEqual(['save', 'note', 'self-recall'])
    for (const questionId of [undefined, 'meeting-disagreement.C1.goal'])
      expect(
        (
          await localLearningAssistant.analyze({
            sceneId: 'work-05',
            kind: 'sentence',
            text: 'Could we test that assumption?',
            level: 'C1',
            questionId,
          })
        ).status,
      ).toBe('unknown')
  })
})
