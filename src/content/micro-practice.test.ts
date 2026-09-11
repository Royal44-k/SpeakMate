import { expect, it } from 'vitest'
import { GET } from '@/app/content/v1/[category]/route'
import { buildMicroPractices } from './micro-practice-authoring'
import { projectMicroPractice } from './micro-practice'
import { createDialogue, advanceDialogue } from '@/domain/ai/graded-dialogue'
import { publicCategorySchema } from './public-category-schema'
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
