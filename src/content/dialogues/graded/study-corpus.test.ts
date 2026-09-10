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
  ['study-01', 'class-introduction', 'name'],
  ['study-02', 'ask-teacher', 'focus'],
  ['study-03', 'group-project', 'role'],
  ['study-04', 'presentation-qa', 'topic'],
  ['study-05', 'seminar-discussion', 'notice'],
  ['study-06', 'office-hours', 'aim'],
] as const
const levels = ['A1', 'A2', 'B1', 'B2', 'C1'] as const
describe('study fix round1', () => {
  // A habitual example is not an explanation of the habit/current-action
  // distinction. Protect that nonadjacent language premise, not just traversal.
  for (const variantId of ['tutorial', 'workshop'])
    for (const prefix of [0, 1])
      for (const contrast of [0, 1])
        for (const apply of [0, 1])
          for (const scope of [0, 1])
            it(`unresolved understanding ${variantId}/${prefix}/${contrast}/${apply}/${scope}: scope neither upgrades help nor invents a no-help request`, async () => {
              const r = await localContentProvider.load({
                sceneId: 'study-02',
                level: 'B1',
              })
              expect(r.status).toBe('available')
              if (r.status !== 'available') return
              let run = createDialogue(r.pack, { mode: 'extended', variantId })
              while (
                !run.snapshot.state.currentQuestionId?.endsWith('.contrast')
              ) {
                expect(run.snapshot.state.outcome).toBe('active')
                run = advanceDialogue(run.snapshot, {
                  text: dialogueSuggestions(run.snapshot)[prefix].text,
                })
              }
              const contrastText = [
                'The first is a habit, while the second describes what is happening now.',
                'I can see the verb changes, but I need help connecting that change to the time.',
              ][contrast]
              expect(dialogueSuggestions(run.snapshot)[contrast].text).toBe(
                contrastText,
              )
              run = advanceDialogue(run.snapshot, { text: contrastText })
              expect(run.snapshot.state.currentQuestionId).toBe(
                'ask-teacher.B1.apply',
              )
              const applyText = [
                'I walk to class every morning.',
                'I cook dinner on Fridays.',
              ][apply]
              expect(dialogueSuggestions(run.snapshot)[apply].text).toBe(
                applyText,
              )
              run = advanceDialogue(run.snapshot, { text: applyText })
              expect(run.snapshot.state.currentQuestionId).toBe(
                'ask-teacher.B1.scope',
              )
              const expectedContrast = contrast === 0 ? 'time' : 'help'
              expect(
                run.snapshot.state.facts.find((f) => f.key === 'contrast')
                  ?.value,
              ).toBe(expectedContrast)
              const scopeAnswer = dialogueSuggestions(run.snapshot)[scope]
              expect(scopeAnswer.text).toBe(
                [
                  'No, these two examples do not cover all the uses. I would need to study more examples.',
                  'Not yet. I would want to ask about verbs such as “know” first.',
                ][scope],
              )
              expect(scopeAnswer.effects).toEqual([
                { key: 'scope', value: scope === 0 ? 'limited' : 'question' },
              ])
              run = advanceDialogue(run.snapshot, { text: scopeAnswer.text })
              expect(
                run.snapshot.state.facts.find((f) => f.key === 'contrast')
                  ?.value,
              ).toBe(expectedContrast)
              run = advanceDialogue(run.snapshot, {
                text: dialogueSuggestions(run.snapshot)[prefix].text,
              })
              expect(run.snapshot.state.outcome).toBe('achieved')
              expect(run.reply).toContain(
                'Requests for explanation remain requests',
              )
              expect(dialogueSuggestions(run.snapshot)).toEqual([])
            })
})
describe('original study corpus', () => {
  // Editorial fixtures catch concrete missing premises, not CEFR proficiency.
  for (const level of ['B1', 'B2', 'C1'] as const)
    it(`${level}: classroom pace requests have actual spoken steps`, async () => {
      const r = await localContentProvider.load({ sceneId: 'study-01', level })
      expect(r.status).toBe('available')
      if (r.status !== 'available') return
      for (const v of r.pack.variants)
        expect(v.situationZh).toContain(
          'First choose a card. Next think about your idea. Then speak.',
        )
    })
  for (const level of ['B1', 'C1'] as const)
    for (const variantId of ['tutorial', 'workshop'])
      for (const slot of [0, 1])
        it(`${level}/${variantId}/${slot}: teacher short mode introduces its own closing example`, async () => {
          const r = await localContentProvider.load({
            sceneId: 'study-02',
            level,
          })
          expect(r.status).toBe('available')
          if (r.status !== 'available') return
          let run = createDialogue(r.pack, { mode: 'short', variantId })
          for (let n = 0; n < 2; n++)
            run = advanceDialogue(run.snapshot, {
              text: dialogueSuggestions(run.snapshot)[slot].text,
            })
          expect(
            run.snapshot.state.askedQuestionIds.some((id) =>
              id.endsWith('.contrast'),
            ),
          ).toBe(false)
          expect(run.reply).toBe(
            level === 'B1'
              ? 'For a pattern such as “I read every day”, how could you check your understanding?'
              : 'How would you summarise the difference between observing higher scores after practice and proving that practice caused the rise?',
          )
        })
  for (const level of ['B2', 'C1'] as const)
    for (const prefix of [0, 1])
      for (const strategy of [0, 1])
        it(`${level}/${prefix}/${strategy}: office workshop introduces separate editing sample before revision`, async () => {
          const r = await localContentProvider.load({
            sceneId: 'study-06',
            level,
          })
          expect(r.status).toBe('available')
          if (r.status !== 'available') return
          let run = createDialogue(r.pack, {
            mode: 'extended',
            variantId: 'workshop',
          })
          while (!run.snapshot.state.currentQuestionId?.endsWith('.strategy')) {
            expect(run.snapshot.state.outcome).toBe('active')
            run = advanceDialogue(run.snapshot, {
              text: dialogueSuggestions(run.snapshot)[prefix].text,
            })
          }
          const ids = run.snapshot.state.askedQuestionIds
          expect(
            ids.indexOf(`office-hours.${level}.diagnose`),
          ).toBeGreaterThanOrEqual(0)
          expect(ids.indexOf(`office-hours.${level}.diagnose`)).toBeLessThan(
            ids.indexOf(`office-hours.${level}.strategy`),
          )
          const sample = r.pack.questions.find(
            (q) => q.objective === 'diagnose',
          )!.text
          expect(sample).toContain(
            level === 'B2'
              ? 'The garden is beside the classroom. It is noisy.'
              : 'books were added to welcome visitors',
          )
          run = advanceDialogue(run.snapshot, {
            text: dialogueSuggestions(run.snapshot)[strategy].text,
          })
          expect(
            run.snapshot.state.facts.some((f) =>
              ['revised', 'checked', 'grade'].includes(f.key),
            ),
          ).toBe(false)
          expect(
            run.snapshot.state.facts.find((f) => f.key === 'access')?.value,
          ).toBe(
            level === 'B2'
              ? prefix === 0
                ? 'local'
                : 'alternative'
              : prefix === 0
                ? 'examples'
                : 'request',
          )
        })
  for (const hasMaterials of [0, 1])
    for (const credit of [0, 1])
      it(`project A2/${hasMaterials}/${credit}: plans credit and checks without assuming completed work or missing materials`, async () => {
        const r = await localContentProvider.load({
          sceneId: 'study-03',
          level: 'A2',
        })
        expect(r.status).toBe('available')
        if (r.status !== 'available') return
        let run = createDialogue(r.pack, {
          mode: 'extended',
          variantId: 'tutorial',
        })
        while (!run.snapshot.state.currentQuestionId?.endsWith('.credit')) {
          const slot = run.snapshot.state.currentQuestionId?.endsWith(
            '.resource',
          )
            ? hasMaterials
            : 0
          run = advanceDialogue(run.snapshot, {
            text: dialogueSuggestions(run.snapshot)[slot].text,
          })
        }
        expect(run.reply).toBe(
          'How would you like to show who contributes to the poster?',
        )
        expect(dialogueSuggestions(run.snapshot)[1].text).toBe(
          'We could write our names beside the parts we make.',
        )
        run = advanceDialogue(run.snapshot, {
          text: dialogueSuggestions(run.snapshot)[credit].text,
        })
        expect(dialogueSuggestions(run.snapshot)[0].text).toBe(
          'Let us check that we have all the materials.',
        )
        expect(
          run.snapshot.state.facts.find((f) => f.key === 'resource')?.value,
        ).toBe(hasMaterials === 0 ? 'pencil' : 'nothing')
      })
  it('authors 360 distinct questions across study levels instead of duplicating level text', async () => {
    const questions = []
    for (const [sceneId] of scenes)
      for (const level of levels) {
        const r = await localContentProvider.load({ sceneId, level })
        if (r.status === 'available')
          questions.push(...r.pack.questions.map((q) => q.text))
      }
    expect(questions).toHaveLength(360)
    expect(new Set(questions).size).toBe(360)
  })
  it('registers six canonical study scenes without treating slugs as data IDs', async () => {
    expect(
      gradedSceneManifest
        .filter((s) => s.category === 'study')
        .map((s) => s.sceneId),
    ).toEqual(scenes.map((s) => s[0]))
    expect(
      await localContentProvider.load({
        sceneId: 'class-introduction',
        level: 'A1',
      }),
    ).toEqual({ status: 'unavailable' })
    expect(
      await localContentProvider.load({
        sceneId: 'study-01',
        level: 'A1',
        contentVersion: 99,
      }),
    ).toEqual({ status: 'version-unavailable', requestedVersion: 99 })
  })
  for (const [sceneId, slug, opening] of scenes)
    for (const level of levels) {
      it(`${slug}/${level}: provides twelve distinct owned pairs and six real intent labels`, async () => {
        const r = await localContentProvider.load({ sceneId, level })
        expect(r.status).toBe('available')
        if (r.status !== 'available') return
        expect(r.pack.sceneId).toBe(sceneId)
        expect(r.pack.category).toBe('study')
        expect(r.pack.questions).toHaveLength(12)
        expect(new Set(r.pack.questions.map((q) => q.text)).size).toBe(12)
        expect(
          new Set(r.pack.questions.map((q) => q.intent)).size,
        ).toBeGreaterThanOrEqual(6)
        for (const q of r.pack.questions) {
          expect(q.id).toBe(`${slug}.${level}.${q.objective}`)
          expect(q.review.state).toBe('model-reviewed')
          expect(q.answers).toHaveLength(2)
          expect(q.answers[0].text).not.toBe(q.answers[1].text)
          for (const a of q.answers) {
            expect(a.acceptedForms).toEqual([a.text])
            expect(a.effects).toHaveLength(1)
            expect(a.effects[0].key).toBe(q.objective)
            expect(a.review.state).toBe('model-reviewed')
          }
        }
      })
      for (const variantId of ['tutorial', 'workshop'])
        for (const mode of ['short', 'standard', 'extended'] as const)
          for (const choice of [0, 1, 2])
            it(`${slug}/${level}/${variantId}/${mode}/${choice}: confirms only owned answers and ends`, async () => {
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
                const q = r.pack.questions.find((q) => q.id === id)!
                expect(run.reply).toBe(q.text)
                const a = dialogueSuggestions(run.snapshot)[
                  choice === 2 ? n % 2 : choice
                ]
                run = advanceDialogue(run.snapshot, {
                  text: a.text,
                  suggestionId: a.id,
                })
                expect(run.confirmation).toBe('exact')
                expect(
                  run.snapshot.state.facts.find(
                    (f) => f.key === a.effects[0].key,
                  )?.value,
                ).toBe(a.effects[0].value)
                n++
                expect(n).toBeLessThanOrEqual(10)
              }
              expect(n).toBe(
                mode === 'short' ? 3 : mode === 'standard' ? 6 : 10,
              )
              expect(run.snapshot.state.outcome).toBe('achieved')
              expect(run.reply).not.toMatch(/[?？]/u)
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
      it(`${slug}/${level}: covers every bank node and adjacent answer combination`, async () => {
        const r = await localContentProvider.load({ sceneId, level })
        expect(r.status).toBe('available')
        if (r.status !== 'available') return
        const reachable = new Set<string>()
        for (const variantId of ['tutorial', 'workshop'])
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
      it(`${slug}/${level}: edited suggestions and repair/change never fabricate completion`, async () => {
        const r = await localContentProvider.load({ sceneId, level })
        expect(r.status).toBe('available')
        if (r.status !== 'available') return
        const initial = createDialogue(r.pack, {
          mode: 'short',
          variantId: 'tutorial',
        })
        const pair = dialogueSuggestions(initial.snapshot)
        const unknown = advanceDialogue(initial.snapshot, {
          text: 'An unlisted explanation of my own.',
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
    ['study-01', 'word', 'partner'],
    ['study-02', 'phrase', 'for example'],
    ['study-03', 'word', 'role'],
    ['study-04', 'sentence', 'The chart shows ten students.'],
    ['study-05', 'word', 'evidence'],
    ['study-06', 'phrase', 'work on'],
  ] as const)
    it(`${sceneId}: provides bounded ${kind} analysis`, async () => {
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
  it('keeps uncovered study text partial or unknown', async () => {
    const partial = await localLearningAssistant.analyze({
      sceneId: 'study-05',
      kind: 'sentence',
      text: 'That evidence worries me.',
      level: 'B2',
    })
    expect(partial.status).toBe('partial')
    const unknown = await localLearningAssistant.analyze({
      sceneId: 'study-02',
      kind: 'sentence',
      text: 'This is my own interpretation.',
      level: 'C1',
    })
    expect(unknown.status).toBe('unknown')
    expect(unknown.capabilities).toEqual(['save', 'note', 'self-recall'])
  })
})
