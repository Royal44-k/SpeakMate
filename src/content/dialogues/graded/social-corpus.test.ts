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

// Editorial regression fixtures, not an automatic CEFR or language-quality
// test. These concrete A1 tasks deliberately replace abstract evidence and
// trade-off tasks. Expected wording/effects are independent of the catalog.
const a1FixRows = {
  'social-05': [
    [
      'position',
      'Do you want some quiet time at the event?',
      'yes',
      'Yes, I want some quiet time.',
      'no',
      'No, I like lots of music.',
    ],
    [
      'reason',
      'What do you enjoy at an event?',
      'talk',
      'I like talking to people.',
      'music',
      'I like listening to music.',
    ],
    [
      'example',
      'Was the last event you went to quiet or loud?',
      'quiet',
      'It was quiet.',
      'loud',
      'It was loud.',
    ],
    [
      'priority',
      'Do you like games or drawing at events?',
      'games',
      'I like games.',
      'drawing',
      'I like drawing.',
    ],
    [
      'other',
      'Do you understand my idea, or do you need an example?',
      'yes',
      'Yes, I understand your idea.',
      'help',
      'Please give me an example.',
    ],
    [
      'proposal',
      'What can we put in a quiet corner?',
      'chairs',
      'We can put some chairs there.',
      'books',
      'We can put some books there.',
    ],
    [
      'tradeoff',
      'What is difficult for you in a noisy room?',
      'hear',
      'I cannot hear my friends.',
      'think',
      'I cannot think well.',
    ],
    [
      'evidence',
      'What do you want to ask about the event?',
      'time',
      'What time does it start?',
      'place',
      'Where is it?',
    ],
    [
      'limit',
      'Do you like trying new activities?',
      'new',
      'Yes, I like trying new things.',
      'familiar',
      'No, I like my usual activities.',
    ],
    [
      'close',
      'How can you end our chat?',
      'go',
      'Thanks for the chat. I must go.',
      'think',
      'Thanks. I want to think about it.',
    ],
    [
      'meaning',
      'What does lively mean here?',
      'active',
      'It means busy and fun.',
      'ask',
      'I do not know. Please explain.',
    ],
    [
      'tone',
      'Am I speaking too fast for you?',
      'slow',
      'Yes, please slow down.',
      'fine',
      'No, this speed is OK.',
    ],
  ],
  'social-06': [
    [
      'acknowledge',
      'What are you sorry for?',
      'late',
      'I am sorry. I did not give your book back on Friday.',
      'message',
      'I am sorry I did not call you.',
    ],
    [
      'impact',
      'What might Robin need now?',
      'need',
      'Robin may need the book.',
      'news',
      'Robin may want news about the book.',
    ],
    [
      'explain',
      'Do you want to say why?',
      'forgot',
      'I forgot the date. I am sorry.',
      'simple',
      'No, I just want to say sorry.',
    ],
    [
      'repair',
      'What can you offer to do?',
      'bring',
      'I can bring the book today. Is that OK?',
      'meet',
      'When can we meet? I can bring the book.',
    ],
    [
      'contact',
      'Will you send a text or ask to call?',
      'text',
      'I will send a text.',
      'call',
      'I will ask to call.',
    ],
    [
      'permission',
      'Can you visit Robin without asking?',
      'ask',
      'No. I will ask first.',
      'wait',
      'No. I will wait for an invitation.',
    ],
    [
      'prevent',
      'How can you remember the date next time?',
      'note',
      'I can write it down.',
      'alarm',
      'I can set an alarm.',
    ],
    [
      'response',
      'What if Robin is upset?',
      'time',
      'I can give Robin time.',
      'noask',
      'I will not ask Robin to forgive me.',
    ],
    [
      'scope',
      'What will you say about borrowing books again?',
      'date',
      'I will ask about the date before I borrow again.',
      'pause',
      'I will not borrow more books for now.',
    ],
    [
      'close',
      'How will you end your message?',
      'sorry',
      'I am sorry about your book.',
      'thanks',
      'Thank you for reading this.',
    ],
    [
      'space',
      'Does Robin have to answer today?',
      'later',
      'No. Robin can answer later.',
      'book',
      'No. Robin can answer only about the book.',
    ],
    [
      'confirm',
      'Later, how can you check Robin has the book?',
      'handover',
      'I can give it to Robin myself.',
      'ask',
      "I can ask, 'Do you have your book?'",
    ],
  ],
} as const

describe('social fix round1 source and premise regressions', () => {
  for (const level of ['B1', 'C1'] as const)
    for (const variantId of ['conversation', 'consideration'])
      for (const mode of ['short', 'standard', 'extended'] as const)
        for (const prefix of [0, 1, 2])
          for (const exitSlot of [0, 1])
            it(`networking ${level}/${variantId}/${mode}/${prefix}/${exitSlot}: closes after learner answers, not an invented Morgan disclosure`, async () => {
              const r = await localContentProvider.load({
                sceneId: 'social-02',
                level,
              })
              expect(r.status).toBe('available')
              if (r.status !== 'available') return
              let run = createDialogue(r.pack, { variantId, mode }),
                turn = 0
              while (!run.snapshot.state.currentQuestionId?.endsWith('.exit')) {
                expect(run.snapshot.state.outcome).toBe('active')
                const a = dialogueSuggestions(run.snapshot)[
                  prefix === 2 ? turn % 2 : prefix
                ]
                run = advanceDialogue(run.snapshot, { text: a.text })
                turn++
              }
              const expected =
                level === 'B1'
                  ? [
                      'Thanks for the chat. I am going to catch the talk now.',
                      'I have enjoyed meeting you. I need a break, so I will leave it there for today.',
                    ]
                  : [
                      'It has been a pleasure meeting you. I will let you get on and head to the next session.',
                      'Thank you for the conversation. I am going to take a little time to think about my next steps.',
                    ]
              const a = dialogueSuggestions(run.snapshot)[exitSlot]
              expect(a.text).toBe(expected[exitSlot])
              run = advanceDialogue(run.snapshot, { text: a.text })
              expect(run.snapshot.state.outcome).toBe('achieved')
            })
  for (const level of ['A1', 'A2'] as const)
    for (const [variantId, mode, reasonSlots] of [
      ['conversation', 'extended', [0, 1]],
      ['consideration', 'short', [0]],
      ['consideration', 'extended', [0, 1]],
    ] as const)
      for (const decline of [0, 1])
        for (const reason of reasonSlots)
          for (const repair of [0, 1])
            it(`refusal ${level}/${variantId}/${mode}/${decline}/${reason}/${repair}: repairs a separately quoted date, not an already clear no`, async () => {
              const r = await localContentProvider.load({
                sceneId: 'social-04',
                level,
              })
              expect(r.status).toBe('available')
              if (r.status !== 'available') return
              let run = createDialogue(r.pack, { variantId, mode })
              const initial = dialogueSuggestions(run.snapshot)[decline]
              run = advanceDialogue(run.snapshot, { text: initial.text })
              while (
                !run.snapshot.state.currentQuestionId?.endsWith('.clarity')
              ) {
                expect(run.snapshot.state.outcome).toBe('active')
                const slot = run.snapshot.state.currentQuestionId?.endsWith(
                  '.reason',
                )
                  ? reason
                  : 0
                run = advanceDialogue(run.snapshot, {
                  text: dialogueSuggestions(run.snapshot)[slot].text,
                })
              }
              expect(
                run.snapshot.state.facts.find((f) => f.key === 'decline')
                  ?.value,
              ).toBe(initial.effects[0].value)
              expect(run.reply).toBe(
                level === 'A1'
                  ? "A different example says, 'I cannot come this weekend.' Can you name one day?"
                  : "Here is a separate example: 'I cannot come next week.' How could you make the day clear?",
              )
              const a = dialogueSuggestions(run.snapshot)[repair]
              expect(a.text).toBe(
                level === 'A1'
                  ? ['I cannot come on Saturday.', 'I cannot come on Sunday.'][
                      repair
                    ]
                  : [
                      'I cannot come next Tuesday.',
                      'I cannot come next Thursday.',
                    ][repair],
              )
              expect(a.effects).toEqual([
                {
                  key: 'clarity',
                  value: (level === 'A1'
                    ? ['saturday', 'sunday']
                    : ['tuesday', 'thursday'])[repair],
                },
              ])
              run = advanceDialogue(run.snapshot, { text: a.text })
              expect(
                run.snapshot.state.facts.find((f) => f.key === 'decline')
                  ?.value,
              ).toBe(initial.effects[0].value)
              expect(
                run.snapshot.state.completedObjectives.filter(
                  (id) => id === 'decline',
                ),
              ).toHaveLength(1)
              expect(run.snapshot.state.completedObjectives).toContain(
                'clarity',
              )
            })
  for (const sceneId of ['social-05', 'social-06'] as const)
    for (const variantId of ['conversation', 'consideration'])
      for (const mode of ['short', 'standard', 'extended'] as const)
        for (const slot of [0, 1])
          it(`A1 ${sceneId}/${variantId}/${mode}/${slot}: uses concrete reviewed steps and future checks`, async () => {
            const r = await localContentProvider.load({ sceneId, level: 'A1' })
            expect(r.status).toBe('available')
            if (r.status !== 'available') return
            // Check all twelve separately authored Q/A/effect fixtures, not
            // sentence length or a generated expected manifest.
            for (const [
              key,
              question,
              valueA,
              textA,
              valueB,
              textB,
            ] of a1FixRows[sceneId]) {
              const q = r.pack.questions.find((q) => q.objective === key)!
              expect(q.text).toBe(question)
              expect(q.answers.map((a) => a.text)).toEqual([textA, textB])
              expect(q.answers.map((a) => a.effects)).toEqual([
                [{ key, value: valueA }],
                [{ key, value: valueB }],
              ])
            }
            let run = createDialogue(r.pack, { variantId, mode })
            while (run.snapshot.state.outcome === 'active') {
              const q = run.snapshot.pack.questions.find(
                (q) => q.id === run.snapshot.state.currentQuestionId,
              )!
              const row = a1FixRows[sceneId].find(
                (row) => row[0] === q.objective,
              )!
              expect(run.reply).toBe(row[1])
              const a = dialogueSuggestions(run.snapshot)[slot]
              run = advanceDialogue(run.snapshot, { text: a.text })
              expect(
                run.snapshot.state.facts.find((f) => f.key === row[0])?.value,
              ).toBe(row[slot === 0 ? 2 : 4])
            }
            expect(run.snapshot.state.outcome).toBe('achieved')
            expect(run.reply).toContain(
              sceneId === 'social-05'
                ? 'whether or not our views match'
                : 'The book has not been returned',
            )
          })
  for (const mode of ['standard', 'extended'] as const)
    for (const alternative of [0, 1])
      for (const contact of [0, 1])
        it(`C1 refusal/${mode}/${alternative}/${contact}: accepted pause wording actually stops further dinner invitations`, async () => {
          const r = await localContentProvider.load({
            sceneId: 'social-04',
            level: 'C1',
          })
          expect(r.status).toBe('available')
          if (r.status !== 'available') return
          let run = createDialogue(r.pack, { variantId: 'conversation', mode })
          while (!run.snapshot.state.currentQuestionId?.endsWith('.contact')) {
            expect(run.snapshot.state.outcome).toBe('active')
            const slot = run.snapshot.state.currentQuestionId?.endsWith(
              '.alternative',
            )
              ? alternative
              : 0
            run = advanceDialogue(run.snapshot, {
              text: dialogueSuggestions(run.snapshot)[slot].text,
            })
          }
          expect(
            run.snapshot.state.facts.find((f) => f.key === 'alternative')
              ?.value,
          ).toBe(alternative === 0 ? 'nooffer' : 'offer')
          const a = dialogueSuggestions(run.snapshot)[contact]
          expect(a.text).toBe(
            contact === 0
              ? 'I would be glad to receive future invitations, without that placing any expectation on my answer to them.'
              : 'I would ask Casey not to send me any more dinner invitations for now; I will bring it up again if that changes.',
          )
          run = advanceDialogue(run.snapshot, { text: a.text })
          expect(
            run.snapshot.state.facts.find((f) => f.key === 'contact')?.value,
          ).toBe(contact === 0 ? 'open' : 'pause')
          expect(
            run.snapshot.state.facts.find((f) => f.key === 'alternative')
              ?.value,
          ).toBe(alternative === 0 ? 'nooffer' : 'offer')
        })
})

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
            A1: 'Later, how can you check Robin has the book?',
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
