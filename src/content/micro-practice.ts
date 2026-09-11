import { z } from 'zod'
import { CEFR_LEVELS } from '@/domain/scenes/types'
import {
  gradedPackSchema,
  type GradedPack,
  reviewSchema,
  questionSchema,
} from './dialogues/graded/schema'
const id = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-zA-Z0-9._:-]+$/)
const closing = z
  .string()
  .min(1)
  .max(2000)
  .refine((value) => !/[?？]/u.test(value))
/** Current publication/creation policy; legacy v1 snapshots remain readable. */
export function currentMicroVersion(entryId: string, level: string): 1 | 2 {
  return (entryId === 'restaurant.phrase.on-the-side' &&
    ['A1', 'A2'].includes(level)) ||
    (entryId === 'restaurant.sentence.no-chilli' &&
      ['B1', 'B2', 'C1'].includes(level))
    ? 2
    : 1
}
const descriptorFields = {
  schemaVersion: z.literal(1),
  id,
  analysisEntryId: id,
  sceneId: id,
  level: z.enum(CEFR_LEVELS),
  sourceContentVersion: z.number().int().positive().max(10000),
  sourceVariantId: id,
  targetQuestionIds: z.array(id).min(1).max(3),
  questionIds: z.array(id).min(3).max(5),
  achievedClosing: closing,
  partialClosing: closing,
  review: reviewSchema,
}
export const microPracticeSchema = z
  .discriminatedUnion('version', [
    z.strictObject({ ...descriptorFields, version: z.literal(1) }),
    z.strictObject({
      ...descriptorFields,
      version: z.literal(2),
      targetQuestionOverride: questionSchema,
    }),
  ])
  .superRefine((value, ctx) => {
    if (
      value.id !== `micro.${value.analysisEntryId}.${value.level}` ||
      value.review.state !== 'model-reviewed' ||
      new Set(value.questionIds).size !== value.questionIds.length ||
      new Set(value.targetQuestionIds).size !==
        value.targetQuestionIds.length ||
      value.targetQuestionIds.some((id) => !value.questionIds.includes(id))
    )
      ctx.addIssue({ code: 'custom', message: 'MICRO_DESCRIPTOR_INVALID' })
    if (value.version === 2) {
      const q = value.targetQuestionOverride
      const values =
        value.analysisEntryId === 'restaurant.phrase.on-the-side'
          ? ['separate', 'mixed']
          : ['no', 'add']
      if (
        currentMicroVersion(value.analysisEntryId, value.level) !== 2 ||
        value.sceneId !== 'dining-02' ||
        q.id !== `restaurant-order.${value.level}.chilli` ||
        value.targetQuestionIds.length !== 1 ||
        value.targetQuestionIds[0] !== q.id ||
        q.intent !== 'customize' ||
        q.objective !== 'chilli' ||
        q.requires.length !== 0 ||
        q.review.state !== 'model-reviewed' ||
        q.answers.some(
          (answer, index) =>
            answer.review.state !== 'model-reviewed' ||
            answer.effects.length !== 1 ||
            answer.effects[0].key !== 'chilli' ||
            answer.effects[0].value !== values[index],
        )
      )
        ctx.addIssue({ code: 'custom', message: 'MICRO_OVERRIDE_INVALID' })
    }
  })
export type MicroPracticeDescriptor = z.infer<typeof microPracticeSchema>
/** Only new session creation calls this. A resumed session always uses its existing snapshot. */
export function projectMicroPractice(
  source: GradedPack,
  descriptor: MicroPracticeDescriptor,
): GradedPack {
  const desc = microPracticeSchema.parse(descriptor)
  const pack = gradedPackSchema.parse(source)
  const variant = pack.variants.find(
    (variant) => variant.id === desc.sourceVariantId,
  )
  if (
    !variant ||
    pack.sceneId !== desc.sceneId ||
    pack.level !== desc.level ||
    pack.contentVersion !== desc.sourceContentVersion
  )
    throw Error('MICRO_SOURCE_MISMATCH')
  if (desc.version === 2) {
    const replacement = desc.targetQuestionOverride
    const original = pack.questions.find((q) => q.id === replacement.id)
    if (
      !original ||
      original.intent !== replacement.intent ||
      original.objective !== replacement.objective ||
      JSON.stringify(original.requires) !==
        JSON.stringify(replacement.requires) ||
      replacement.answers.some((a) =>
        a.effects.some(
          (e) =>
            !original.answers.some((answer) =>
              answer.effects.some((effect) => effect.key === e.key),
            ),
        ),
      )
    )
      throw Error('MICRO_OVERRIDE_SOURCE_MISMATCH')
  }
  const path = {
    questionIds: desc.questionIds,
    achievedClosing: desc.achievedClosing,
    partialClosing: desc.partialClosing,
  }
  return gradedPackSchema.parse({
    ...pack,
    questions: desc.questionIds.map((id) =>
      desc.version === 2 && desc.targetQuestionOverride.id === id
        ? desc.targetQuestionOverride
        : pack.questions.find((question) => question.id === id),
    ),
    variants: [
      {
        ...variant,
        modes: { short: path, standard: path, extended: path },
        review: desc.review,
      },
    ],
  })
}
