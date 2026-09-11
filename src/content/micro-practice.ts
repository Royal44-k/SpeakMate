import { z } from 'zod'
import { CEFR_LEVELS } from '@/domain/scenes/types'
import {
  gradedPackSchema,
  type GradedPack,
  reviewSchema,
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
export const microPracticeSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    id,
    version: z.literal(1),
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
  })
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
  const path = {
    questionIds: desc.questionIds,
    achievedClosing: desc.achievedClosing,
    partialClosing: desc.partialClosing,
  }
  return gradedPackSchema.parse({
    ...pack,
    questions: desc.questionIds.map((id) =>
      pack.questions.find((question) => question.id === id),
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
