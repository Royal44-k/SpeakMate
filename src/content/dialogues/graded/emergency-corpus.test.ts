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

// Independent canonical fixtures: removal/misregistration, missing owned facts,
// unreachable nodes or an unearned terminal state must fail these consumers.
const scenes = [
  ['emergency-01', 'pharmacy-medicine', 'need'],
  ['emergency-02', 'describe-symptoms', 'feeling'],
  ['emergency-03', 'doctor-appointment', 'purpose'],
  ['emergency-04', 'emergency-call', 'event'],
  ['emergency-05', 'lost-property', 'item'],
  ['emergency-06', 'rental-repair', 'problem'],
] as const
const levels = ['A1', 'A2', 'B1', 'B2', 'C1'] as const

describe('emergency fix round1 premise regressions', () => {
  // The no-impact answer must survive all intervening answer combinations.
  for (const [variantId, mode, intervening] of [
    ['desk', 'standard', []],
    ['desk', 'extended', ['duration', 'change', 'record']],
    ['message', 'extended', ['support', 'change']],
  ] as const)
    for (let mask = 0; mask < 2 ** intervening.length; mask++)
      for (const format of [0, 1])
        it(`no-impact C1 ${variantId}/${mode}/${mask}/${format}`, async () => {
          const r = await localContentProvider.load({
            sceneId: 'emergency-02',
            level: 'C1',
          })
          expect(r.status).toBe('available')
          if (r.status !== 'available') return
          let run = createDialogue(r.pack, { variantId, mode })
          while (!run.snapshot.state.currentQuestionId?.endsWith('.format')) {
            expect(run.snapshot.state.outcome).toBe('active')
            const key = run.snapshot.state.currentQuestionId!.split('.').at(-1)!
            const index = (intervening as readonly string[]).indexOf(key)
            const slot =
              key === 'activity' ? 1 : index < 0 ? 0 : (mask >> index) & 1
            if (key === 'activity')
              expect(dialogueSuggestions(run.snapshot)[slot].text).toBe(
                'My routine has remained unchanged, so I would not invent a functional limitation just to make the account sound more substantial.',
              )
            run = advanceDialogue(run.snapshot, {
              text: dialogueSuggestions(run.snapshot)[slot].text,
            })
          }
          expect(
            run.snapshot.state.facts.find((f) => f.key === 'activity')?.value,
          ).toBe('unchanged')
          expect(run.reply).toBe(
            'How would you organise the timeline alongside an account of whether your routine changed?',
          )
          const answer = dialogueSuggestions(run.snapshot)[format]
          expect(answer.text).toBe(
            [
              'I would use chronology as the main thread, stating at the relevant point whether there was any effect on my routine.',
              'I would begin by saying whether my routine changed, then give a separate timeline so the two kinds of information remain distinguishable.',
            ][format],
          )
          run = advanceDialogue(run.snapshot, { text: answer.text })
          while (run.snapshot.state.outcome === 'active')
            run = advanceDialogue(run.snapshot, {
              text: dialogueSuggestions(run.snapshot)[0].text,
            })
          expect(
            run.snapshot.state.facts.find((f) => f.key === 'activity')?.value,
          ).toBe('unchanged')
          expect(run.snapshot.state.outcome).toBe('achieved')
          expect(dialogueSuggestions(run.snapshot)).toEqual([])
        })

  for (const [sceneId, level, slug, absentKey, expected] of [
    [
      'emergency-03',
      'A2',
      'doctor-appointment',
      'time',
      [
        'I would like to check the wording of my request.',
        'I would like to practise saying the request aloud.',
      ],
    ],
    [
      'emergency-06',
      'B1',
      'rental-repair',
      'request',
      [
        'I have drafted a report, but it has not been sent or accepted.',
        'I would like to prepare questions to ask before any visit is arranged.',
      ],
    ],
  ] as const)
    for (const variantId of ['desk', 'message'])
      for (const first of [0, 1])
        for (const second of [0, 1])
          for (const last of [0, 1])
            it(`short-next ${slug}/${variantId}/${first}/${second}/${last}`, async () => {
              const r = await localContentProvider.load({ sceneId, level })
              expect(r.status).toBe('available')
              if (r.status !== 'available') return
              let run = createDialogue(r.pack, { variantId, mode: 'short' })
              for (const slot of [first, second])
                run = advanceDialogue(run.snapshot, {
                  text: dialogueSuggestions(run.snapshot)[slot].text,
                })
              expect(run.snapshot.state.currentQuestionId).toBe(
                `${slug}.${level}.next`,
              )
              const omitted =
                slug === 'doctor-appointment'
                  ? variantId === 'message'
                  : variantId === 'desk'
              if (omitted)
                expect(
                  run.snapshot.state.facts.some((f) => f.key === absentKey),
                ).toBe(false)
              expect(dialogueSuggestions(run.snapshot)[last].text).toBe(
                expected[last],
              )
              run = advanceDialogue(run.snapshot, { text: expected[last] })
              if (omitted)
                expect(
                  run.snapshot.state.facts.some((f) => f.key === absentKey),
                ).toBe(false)
              expect(run.snapshot.state.outcome).toBe('achieved')
              expect(dialogueSuggestions(run.snapshot)).toEqual([])
            })

  for (const variantId of ['desk', 'message'])
    for (const middle of [0, 1])
      for (const name of [0, 1])
        it(`name-without-list A1 ${variantId}/${middle}/${name}`, async () => {
          const r = await localContentProvider.load({
            sceneId: 'emergency-01',
            level: 'A1',
          })
          expect(r.status).toBe('available')
          if (r.status !== 'available') return
          let run = createDialogue(r.pack, { variantId, mode: 'extended' })
          while (
            !run.snapshot.state.currentQuestionId?.endsWith('.uncertain')
          ) {
            expect(run.snapshot.state.outcome).toBe('active')
            const isRecord =
              run.snapshot.state.currentQuestionId!.endsWith('.record')
            run = advanceDialogue(run.snapshot, {
              text: dialogueSuggestions(run.snapshot)[isRecord ? 1 : middle]
                .text,
            })
          }
          expect(
            run.snapshot.state.facts.find((f) => f.key === 'record')?.value,
          ).toBe(variantId === 'desk' ? 'none' : undefined)
          expect(dialogueSuggestions(run.snapshot).map((a) => a.text)).toEqual([
            'Yes, I know the name.',
            'No, I do not know the name.',
          ])
          const answer = dialogueSuggestions(run.snapshot)[name]
          expect(answer.effects).toEqual([
            { key: 'uncertain', value: name === 0 ? 'known' : 'unknown' },
          ])
          run = advanceDialogue(run.snapshot, { text: answer.text })
          run = advanceDialogue(run.snapshot, {
            text: dialogueSuggestions(run.snapshot)[0].text,
          })
          expect(
            run.snapshot.state.facts.find((f) => f.key === 'record')?.value,
          ).toBe(variantId === 'desk' ? 'none' : undefined)
          expect(run.snapshot.state.outcome).toBe('achieved')
        })

  for (const mode of ['standard', 'extended'] as const)
    for (const prefix of [0, 1])
      for (const language of [0, 1])
        it(`language-not-underway C1 message/${mode}/${prefix}/${language}`, async () => {
          const r = await localContentProvider.load({
            sceneId: 'emergency-04',
            level: 'C1',
          })
          expect(r.status).toBe('available')
          if (r.status !== 'available') return
          let run = createDialogue(r.pack, { variantId: 'message', mode })
          while (!run.snapshot.state.currentQuestionId?.endsWith('.language')) {
            expect(run.snapshot.state.outcome).toBe('active')
            run = advanceDialogue(run.snapshot, {
              text: dialogueSuggestions(run.snapshot)[prefix].text,
            })
          }
          expect(
            run.snapshot.state.facts.some((f) =>
              ['language', 'contact'].includes(f.key),
            ),
          ).toBe(false)
          const answer = dialogueSuggestions(run.snapshot)[language]
          expect(answer.text).toBe(
            [
              'Could you clarify what language support is available here, so I do not assume a service you may not be able to provide?',
              'I do not know what language support is available here; could we keep to short, concrete questions that I can answer accurately?',
            ][language],
          )
          run = advanceDialogue(run.snapshot, { text: answer.text })
          while (run.snapshot.state.outcome === 'active')
            run = advanceDialogue(run.snapshot, {
              text: dialogueSuggestions(run.snapshot)[prefix].text,
            })
          expect(
            run.snapshot.state.facts.find((f) => f.key === 'language')?.value,
          ).toBe(language === 0 ? 'availability' : 'interim')
          expect(
            run.snapshot.state.facts.some((f) => f.key === 'contact'),
          ).toBe(false)
          expect(run.snapshot.state.outcome).toBe('achieved')
          expect(run.reply).toContain('no help was dispatched')
        })
})

describe('emergency corpus nonadjacent premise regressions', () => {
  for (const source of [0, 1])
    for (const people of [0, 1])
      for (const view of [0, 1])
        it(`call A1 ${source}/${people}/${view}: source and present view stay distinct after neutral choices`, async () => {
          const r = await localContentProvider.load({
            sceneId: 'emergency-04',
            level: 'A1',
          })
          expect(r.status).toBe('available')
          if (r.status !== 'available') return
          for (const event of [0, 1]) {
            let run = createDialogue(r.pack, {
              mode: 'extended',
              variantId: 'desk',
            })
            while (run.snapshot.state.outcome === 'active') {
              const key = run.snapshot.state
                .currentQuestionId!.split('.')
                .at(-1)!
              if (key === 'time')
                expect(run.reply).toBe('When did you learn about this?')
              const slot =
                key === 'event'
                  ? event
                  : key === 'source'
                    ? source
                    : key === 'people'
                      ? people
                      : key === 'view'
                        ? view
                        : 0
              run = advanceDialogue(run.snapshot, {
                text: dialogueSuggestions(run.snapshot)[slot].text,
              })
            }
            expect(
              run.snapshot.state.facts.find((f) => f.key === 'source')?.value,
            ).toBe(source === 0 ? 'saw' : 'told')
            expect(
              run.snapshot.state.facts.find((f) => f.key === 'view')?.value,
            ).toBe(view === 0 ? 'yes' : 'no')
            expect(run.snapshot.state.outcome).toBe('achieved')
            expect(run.reply).toContain('no help was dispatched')
          }
        })
  for (const observation of [0, 1])
    for (const impact of [0, 1])
      for (const entry of [0, 1])
        it(`rental C1 ${observation}/${impact}/${entry}: observation count and unagreed access survive visit proposals`, async () => {
          const r = await localContentProvider.load({
            sceneId: 'emergency-06',
            level: 'C1',
          })
          expect(r.status).toBe('available')
          if (r.status !== 'available') return
          for (const variantId of ['desk', 'message'])
            for (const visit of [0, 1]) {
              let run = createDialogue(r.pack, { mode: 'extended', variantId })
              while (run.snapshot.state.outcome === 'active') {
                const key = run.snapshot.state
                  .currentQuestionId!.split('.')
                  .at(-1)!
                if (key === 'impact')
                  expect(dialogueSuggestions(run.snapshot)[0].text).toBe(
                    'The noise interrupted my reading; that is the practical inconvenience I can describe with confidence.',
                  )
                const slot =
                  key === 'pattern'
                    ? observation
                    : key === 'impact'
                      ? impact
                      : key === 'entry'
                        ? entry
                        : key === 'visit'
                          ? visit
                          : 0
                run = advanceDialogue(run.snapshot, {
                  text: dialogueSuggestions(run.snapshot)[slot].text,
                })
              }
              expect(
                run.snapshot.state.facts.find((f) => f.key === 'pattern')
                  ?.value,
              ).toBe(observation === 0 ? 'recurring' : 'single')
              expect(
                run.snapshot.state.facts.find((f) => f.key === 'entry')?.value,
              ).toBe(entry === 0 ? 'present' : 'separate')
              expect(run.reply).toContain(
                'Requests are not appointments or permission to enter',
              )
              expect(run.snapshot.state.outcome).toBe('achieved')
            }
        })
  for (const feeling of [0, 1])
    for (const extra of [0, 1])
      it(`symptoms A1 ${feeling}/${extra}: additional discomfort never replaces the original feeling`, async () => {
        const r = await localContentProvider.load({
          sceneId: 'emergency-02',
          level: 'A1',
        })
        expect(r.status).toBe('available')
        if (r.status !== 'available') return
        let run = createDialogue(r.pack, {
          mode: 'short',
          variantId: 'message',
        })
        run = advanceDialogue(run.snapshot, {
          text: dialogueSuggestions(run.snapshot)[feeling].text,
        })
        expect(run.reply).toBe('Is there anything else you want to describe?')
        expect(dialogueSuggestions(run.snapshot).map((a) => a.text)).toEqual([
          'Yes, my neck hurts.',
          'No, nothing else.',
        ])
        run = advanceDialogue(run.snapshot, {
          text: dialogueSuggestions(run.snapshot)[extra].text,
        })
        run = advanceDialogue(run.snapshot, {
          text: dialogueSuggestions(run.snapshot)[0].text,
        })
        expect(
          run.snapshot.state.facts.find((f) => f.key === 'feeling')?.value,
        ).toBe(feeling === 0 ? 'head' : 'tired')
        expect(run.snapshot.state.outcome).toBe('achieved')
      })
  for (const record of [0, 1])
    for (const priority of [0, 1])
      it(`pharmacy A1 ${record}/${priority}: ordering a topic does not invent an absent medicine list`, async () => {
        const r = await localContentProvider.load({
          sceneId: 'emergency-01',
          level: 'A1',
        })
        expect(r.status).toBe('available')
        if (r.status !== 'available') return
        for (const middle of [0, 1]) {
          let run = createDialogue(r.pack, {
            mode: 'extended',
            variantId: 'desk',
          })
          while (run.snapshot.state.outcome === 'active') {
            const key = run.snapshot.state.currentQuestionId!.split('.').at(-1)!
            if (key === 'priority')
              expect(run.reply).toBe(
                'Which topic comes first: the box or medicine names?',
              )
            run = advanceDialogue(run.snapshot, {
              text: dialogueSuggestions(run.snapshot)[
                key === 'record'
                  ? record
                  : key === 'priority'
                    ? priority
                    : middle
              ].text,
            })
          }
          expect(
            run.snapshot.state.facts.find((f) => f.key === 'record')?.value,
          ).toBe(record === 0 ? 'list' : 'none')
          expect(run.snapshot.state.outcome).toBe('achieved')
          expect(dialogueSuggestions(run.snapshot)).toEqual([])
        }
      })
})

describe('original emergency and health communication corpus', () => {
  it('keeps the A1 report time compatible with the subsequent second-hand source answer', async () => {
    const r = await localContentProvider.load({
      sceneId: 'emergency-04',
      level: 'A1',
    })
    expect(r.status).toBe('available')
    if (r.status !== 'available') return
    expect(
      r.pack.questions.find((q) => q.objective === 'source')!.answers[1].text,
    ).toBe('No, someone told me.')
    expect(r.pack.questions.find((q) => q.objective === 'time')!.text).toBe(
      'When did you learn about this?',
    )
  })
  it('does not require a photo in a lost-property path that never establishes one', async () => {
    const r = await localContentProvider.load({
      sceneId: 'emergency-05',
      level: 'A1',
    })
    expect(r.status).toBe('available')
    if (r.status !== 'available') return
    expect(r.pack.variants[1].modes.extended.questionIds).not.toContain(
      'lost-property.A1.proof',
    )
    expect(
      r.pack.questions.find((q) => q.objective === 'candidate')!.answers[1]
        .text,
    ).toBe('I want to ask about its size.')
  })
  it('does not convert a single C1 rental observation into repeated interruptions', async () => {
    const r = await localContentProvider.load({
      sceneId: 'emergency-06',
      level: 'C1',
    })
    expect(r.status).toBe('available')
    if (r.status !== 'available') return
    expect(
      r.pack.questions.find((q) => q.objective === 'pattern')!.answers[1]
        .effects,
    ).toEqual([{ key: 'pattern', value: 'single' }])
    expect(
      r.pack.questions.find((q) => q.objective === 'impact')!.answers[0].text,
    ).toBe(
      'The noise interrupted my reading; that is the practical inconvenience I can describe with confidence.',
    )
  })
  it('preserves all six canonical identities and version boundaries', async () => {
    expect(
      gradedSceneManifest
        .filter((s) => s.category === 'emergency')
        .map((s) => s.sceneId),
    ).toEqual([
      'emergency-01',
      'emergency-02',
      'emergency-03',
      'emergency-04',
      'emergency-05',
      'emergency-06',
    ])
    expect(
      await localContentProvider.load({
        sceneId: 'rental-repair',
        level: 'A1',
      }),
    ).toEqual({ status: 'unavailable' })
    expect(
      await localContentProvider.load({
        sceneId: 'emergency-04',
        level: 'A1',
        contentVersion: 99,
      }),
    ).toEqual({ status: 'version-unavailable', requestedVersion: 99 })
  })
  it('delivers 360 separately authored questions rather than repeated level text', async () => {
    const texts: string[] = []
    for (const [sceneId] of scenes)
      for (const level of levels) {
        const r = await localContentProvider.load({ sceneId, level })
        if (r.status === 'available')
          texts.push(...r.pack.questions.map((q) => q.text))
      }
    expect(texts).toHaveLength(360)
    expect(new Set(texts).size).toBe(360)
  })
  for (const [sceneId, slug, opening] of scenes)
    for (const level of levels) {
      it(`${slug}/${level}: exposes twelve eligible owned pairs with meaningful effect distinctions`, async () => {
        const r = await localContentProvider.load({ sceneId, level })
        expect(r.status).toBe('available')
        if (r.status !== 'available') return
        expect(r.pack.sceneId).toBe(sceneId)
        expect(r.pack.category).toBe('emergency')
        expect(r.pack.questions).toHaveLength(12)
        expect(
          new Set(r.pack.questions.map((q) => q.intent)).size,
        ).toBeGreaterThanOrEqual(6)
        for (const q of r.pack.questions) {
          expect(q.id).toBe(`${slug}.${level}.${q.objective}`)
          expect(q.review.state).toBe('model-reviewed')
          expect(q.answers).toHaveLength(2)
          expect(q.answers[0].text).not.toBe(q.answers[1].text)
          expect(q.answers[0].effects[0].value).not.toBe(
            q.answers[1].effects[0].value,
          )
          for (const a of q.answers) {
            expect(a.acceptedForms).toEqual([a.text])
            expect(a.effects).toHaveLength(1)
            expect(a.effects[0].key).toBe(q.objective)
            expect(a.review.state).toBe('model-reviewed')
          }
        }
      })
      for (const variantId of ['desk', 'message'])
        for (const mode of ['short', 'standard', 'extended'] as const)
          for (const choice of [0, 1, 2])
            it(`${slug}/${level}/${variantId}/${mode}/${choice}: uses owned responses and closes simulated practice honestly`, async () => {
              const r = await localContentProvider.load({ sceneId, level })
              expect(r.status).toBe('available')
              if (r.status !== 'available') return
              let run = createDialogue(r.pack, { variantId, mode }),
                n = 0
              expect(run.snapshot.state.currentQuestionId).toBe(
                `${slug}.${level}.${opening}`,
              )
              const visited = new Set<string>()
              while (run.snapshot.state.outcome === 'active') {
                const id = run.snapshot.state.currentQuestionId!
                expect(visited.has(id)).toBe(false)
                visited.add(id)
                expect(run.reply).toBe(
                  r.pack.questions.find((q) => q.id === id)!.text,
                )
                const answer = dialogueSuggestions(run.snapshot)[
                  choice === 2 ? n % 2 : choice
                ]
                run = advanceDialogue(run.snapshot, {
                  text: answer.text,
                  suggestionId: answer.id,
                })
                expect(run.confirmation).toBe('exact')
                expect(
                  run.snapshot.state.facts.find(
                    (f) => f.key === answer.effects[0].key,
                  )?.value,
                ).toBe(answer.effects[0].value)
                expect(++n).toBeLessThanOrEqual(10)
              }
              expect(n).toBe(
                mode === 'short' ? 3 : mode === 'standard' ? 6 : 10,
              )
              expect(run.snapshot.state.outcome).toBe('achieved')
              expect(run.reply).not.toMatch(/[?？]/u)
              expect(run.reply).toContain('No real')
              expect(dialogueSuggestions(run.snapshot)).toEqual([])
              expect(
                dialogueSnapshotSchema.parse(
                  JSON.parse(JSON.stringify(run.snapshot)),
                ),
              ).toEqual(run.snapshot)
              expect(
                advanceDialogue(run.snapshot, { text: 'More please.' })
                  .snapshot,
              ).toEqual(run.snapshot)
            })
      it(`${slug}/${level}: reaches every bank node through all adjacent answer combinations`, async () => {
        const r = await localContentProvider.load({ sceneId, level })
        expect(r.status).toBe('available')
        if (r.status !== 'available') return
        const reachable = new Set<string>()
        for (const variantId of ['desk', 'message'])
          for (let edge = 0; edge < 9; edge++)
            for (const a of [0, 1])
              for (const b of [0, 1]) {
                let run = createDialogue(r.pack, {
                    variantId,
                    mode: 'extended',
                  }),
                  n = 0
                while (run.snapshot.state.outcome === 'active') {
                  reachable.add(run.snapshot.state.currentQuestionId!)
                  const pair = dialogueSuggestions(run.snapshot)
                  expect(pair).toHaveLength(2)
                  run = advanceDialogue(run.snapshot, {
                    text: pair[n === edge ? a : n === edge + 1 ? b : 0].text,
                  })
                  n++
                }
                expect(run.snapshot.state.outcome).toBe('achieved')
              }
        expect(reachable.size).toBe(12)
      })
      it(`${slug}/${level}: repair, editing, refusal and changes cannot fabricate confirmed details`, async () => {
        const r = await localContentProvider.load({ sceneId, level })
        expect(r.status).toBe('available')
        if (r.status !== 'available') return
        const initial = createDialogue(r.pack, {
          mode: 'short',
          variantId: 'desk',
        })
        const pair = dialogueSuggestions(initial.snapshot)
        const unknown = advanceDialogue(initial.snapshot, {
          text: 'My own unlisted explanation.',
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
    ['emergency-01', 'word', 'label'],
    ['emergency-02', 'phrase', 'comes and goes'],
    ['emergency-03', 'word', 'appointment'],
    ['emergency-04', 'sentence', 'I cannot see the entrance.'],
    ['emergency-05', 'phrase', 'last saw'],
    ['emergency-06', 'word', 'leak'],
  ] as const)
    it(`${sceneId}: provides a bounded ${kind} explanation`, async () => {
      const r = await localLearningAssistant.analyze({
        sceneId,
        kind,
        text,
        level: 'B1',
      })
      expect(r.status).toBe('exact')
      expect(r.entries).toHaveLength(1)
      expect(r.entries[0].examples.map((e) => e.level)).toEqual(levels)
    })
  it('does not turn partial word coverage into medical interpretation', async () => {
    expect(
      (
        await localLearningAssistant.analyze({
          sceneId: 'emergency-01',
          kind: 'sentence',
          text: 'Does the label prove this is safe for me?',
          level: 'B2',
        })
      ).status,
    ).toBe('partial')
    const r = await localLearningAssistant.analyze({
      sceneId: 'emergency-02',
      kind: 'sentence',
      text: 'Tell me which treatment I need.',
      level: 'C1',
    })
    expect(r.status).toBe('unknown')
    expect(r.capabilities).toEqual(['save', 'note', 'self-recall'])
  })
})
