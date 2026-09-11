import { expect, it } from 'vitest'
import { GET } from '@/app/content/v1/[category]/route'
import { buildMicroPractices } from './micro-practice-authoring'
import { projectMicroPractice, microPracticeSchema } from './micro-practice'
import { createDialogue, advanceDialogue } from '@/domain/ai/graded-dialogue'
import { publicCategorySchema } from './public-category-schema'
it.each([
  [
    'restaurant.phrase.on-the-side',
    'A1',
    'Chilli on the side, please.',
    'separate',
  ],
  [
    'restaurant.phrase.on-the-side',
    'A2',
    'Could I have the chilli on the side?',
    'separate',
  ],
  [
    'restaurant.sentence.no-chilli',
    'B1',
    'I would like no chilli because I prefer the dish mild.',
    'no',
  ],
  [
    'restaurant.sentence.no-chilli',
    'B2',
    'Please leave the chilli out; the other ingredients can stay as they are.',
    'no',
  ],
  [
    'restaurant.sentence.no-chilli',
    'C1',
    'It is the chilli I would like omitted, not a request to simplify the entire dish.',
    'no',
  ],
])(
  'actually confirms the %s target meaning at source level %s',
  async (entryId, level, expression, effect) => {
    const data = await (
      await GET(new Request('https://local.test'), {
        params: Promise.resolve({ category: 'dining' }),
      })
    ).json()
    const descriptor = data.microPractices.find(
      (d: { id: string }) => d.id === `micro.${entryId}.${level}`,
    )
    const original = data.packs.find(
      (p: { sceneId: string; level: string }) =>
        p.sceneId === 'dining-02' && p.level === level,
    )
    const unchanged = structuredClone(original)
    const pack = projectMicroPractice(original, descriptor)
    let snapshot = createDialogue(pack, {
      mode: 'short',
      variantId: 'visit',
    }).snapshot
    for (let i = 0; i < 2; i++)
      snapshot = advanceDialogue(snapshot, {
        text: pack.questions[i].answers[0].text,
      }).snapshot
    const result = advanceDialogue(snapshot, { text: expression })
    expect(result.confirmation).toBe('exact')
    expect(result.snapshot.state.facts).toContainEqual(
      expect.objectContaining({ key: 'chilli', value: effect }),
    )
    expect(result.snapshot.state.currentQuestionId).toBeNull()
    expect(result.snapshot.state.outcome).toBe('achieved')
    expect(original).toEqual(unchanged)
    expect(original.questions).toHaveLength(12)
  },
)
it.each(['travel', 'dining', 'daily', 'work', 'social', 'study', 'emergency'])(
  'covers every actual declared %s association without modifying normal packs',
  async (category) => {
    const data = await (
      await GET(new Request('https://local.test'), {
        params: Promise.resolve({ category }),
      })
    ).json()
    const before = structuredClone(data.packs)
    const descriptors = buildMicroPractices(data.packs, data.analyses)
    expect(descriptors).toHaveLength(
      category === 'dining' ? 101 : category === 'work' ? 26 : 30,
    )
    for (const desc of descriptors) {
      const original = data.packs.find(
        (p: { sceneId: string; level: string }) =>
          p.sceneId === desc.sceneId && p.level === desc.level,
      )
      const pack = projectMicroPractice(original, desc)
      for (let branch = 0; branch < 2 ** desc.questionIds.length; branch++) {
        let value = createDialogue(pack, {
          mode: 'short',
          variantId: desc.sourceVariantId,
        }).snapshot
        for (let i = 0; i < desc.questionIds.length; i++) {
          const question = pack.questions.find(
            (q) => q.id === value.state.currentQuestionId,
          )!
          value = advanceDialogue(value, {
            text: question.answers[(branch >> i) & 1].text,
          }).snapshot
        }
        expect(value.state.outcome).toBe('achieved')
        expect(value.state.currentQuestionId).toBeNull()
      }
    }
    expect(data.packs).toEqual(before)
  },
  20000,
)
it('strictly bounds five v2 overrides while retaining legacy v1 reads and every normal question', async () => {
  const data = publicCategorySchema.parse(
    await (
      await GET(new Request('https://local.test'), {
        params: Promise.resolve({ category: 'dining' }),
      })
    ).json(),
  )
  const revised = data.microPractices.filter((d) => d.version === 2)
  expect(revised).toHaveLength(5)
  for (const descriptor of revised) {
    if (descriptor.version !== 2) throw Error('fixture')
    const original = data.packs.find(
      (p) => p.sceneId === descriptor.sceneId && p.level === descriptor.level,
    )!
    const { targetQuestionOverride: override, ...rest } = descriptor
    const legacy = { ...rest, version: 1 as const }
    expect(microPracticeSchema.safeParse(legacy).success).toBe(true)
    expect(projectMicroPractice(original, legacy).questions.at(-1)).toEqual(
      original.questions.find((q) => q.id === override.id),
    )
    expect(
      publicCategorySchema.safeParse({
        ...data,
        microPractices: data.microPractices.map((d) =>
          d.id === descriptor.id ? legacy : d,
        ),
      }).success,
    ).toBe(false)
    const bad = [
      rest,
      { ...descriptor, version: 1 },
      {
        ...descriptor,
        analysisEntryId: 'restaurant.word.portion',
        id: `micro.restaurant.word.portion.${descriptor.level}`,
      },
      ...['id', 'intent', 'objective'].map((field) => ({
        ...descriptor,
        targetQuestionOverride: { ...override, [field]: 'other' },
      })),
      {
        ...descriptor,
        targetQuestionOverride: {
          ...override,
          requires: [{ key: 'meal', value: 'tomato' }],
        },
      },
      {
        ...descriptor,
        targetQuestionOverride: {
          ...override,
          review: { ...override.review, state: 'draft' },
        },
      },
      {
        ...descriptor,
        targetQuestionOverride: {
          ...override,
          answers: override.answers.map((a) => ({
            ...a,
            effects: [{ key: 'meal', value: 'tomato' }],
          })),
        },
      },
      {
        ...descriptor,
        targetQuestionOverride: {
          ...override,
          answers: override.answers.map((a) => ({
            ...a,
            effects: override.answers[0].effects,
          })),
        },
      },
      {
        ...descriptor,
        targetQuestionOverride: {
          ...override,
          answers: override.answers.map((a) => ({
            ...a,
            review: { ...a.review, state: 'draft' },
          })),
        },
      },
    ]
    for (const value of bad)
      expect(microPracticeSchema.safeParse(value).success).toBe(false)
    const projected = projectMicroPractice(original, descriptor)
    expect(projectMicroPractice(projected, descriptor)).toEqual(projected)
    const target = projected.questions.at(-1)!
    for (const answer of target.answers)
      for (const form of answer.acceptedForms) {
        let snap = createDialogue(projected, {
          mode: 'short',
          variantId: descriptor.sourceVariantId,
        }).snapshot
        for (const q of projected.questions.slice(0, 2))
          snap = advanceDialogue(snap, { text: q.answers[1].text }).snapshot
        const outcome = advanceDialogue(snap, { text: form })
        expect(outcome.confirmation).toBe('exact')
        expect(outcome.snapshot.state.facts).toContainEqual(
          expect.objectContaining(answer.effects[0]),
        )
      }
  }
})
it('publishes independently reviewed descriptors and projects only a new pinned pack, with every branch finishing at the real cap', async () => {
  const data = await (
    await GET(new Request('https://local.test'), {
      params: Promise.resolve({ category: 'study' }),
    })
  ).json()
  expect(data.microPractices).toHaveLength(30)
  const desc = data.microPractices.find(
    (d: { id: string }) => d.id === 'micro.study.for-example.A2',
  )
  expect(desc.questionIds).toHaveLength(5)
  const original = data.packs.find(
    (p: { sceneId: string; level: string }) =>
      p.sceneId === desc.sceneId && p.level === desc.level,
  )
  const projected = projectMicroPractice(original, desc)
  expect(original.questions).toHaveLength(12)
  expect(projected.questions).toHaveLength(5)
  for (let branch = 0; branch < 32; branch++) {
    let value = createDialogue(projected, {
      mode: 'short',
      variantId: desc.sourceVariantId,
    }).snapshot
    for (let i = 0; i < 5; i++) {
      const q = projected.questions.find(
        (q) => q.id === value.state.currentQuestionId,
      )!
      value = advanceDialogue(value, {
        text: q.answers[(branch >> i) & 1].text,
      }).snapshot
    }
    expect(value.state.outcome).toBe('achieved')
    expect(value.state.currentQuestionId).toBeNull()
  }
  expect(() =>
    projectMicroPractice(original, { ...desc, sourceContentVersion: 999 }),
  ).toThrow()
  expect(() =>
    projectMicroPractice(original, {
      ...desc,
      questionIds: desc.questionIds.slice(0, -1),
    }),
  ).toThrow()
  expect(
    publicCategorySchema.safeParse({
      ...data,
      microPractices: data.microPractices.slice(1),
    }).success,
  ).toBe(false)
})
