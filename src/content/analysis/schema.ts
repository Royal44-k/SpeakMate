import { z } from 'zod'
import { CEFR_LEVELS } from '@/domain/scenes/types'
import { reviewSchema } from '@/content/dialogues/graded/schema'

const prose = z.string().min(1).max(2000)
export const analysisKindSchema = z.enum(['word', 'phrase', 'sentence'])
export const analysisEntrySchema = z.strictObject({
  id: prose,
  contentVersion: z.literal(1),
  kind: analysisKindSchema,
  forms: z.array(prose).min(1).max(8),
  sceneId: prose,
  intents: z.array(prose).min(1).max(12),
  questionIds: z.array(prose).max(12).optional(),
  meaningZh: prose,
  grammarZh: prose,
  registerZh: prose,
  errorsZh: prose,
  examples: z
    .array(
      z.strictObject({
        level: z.enum(CEFR_LEVELS),
        text: prose,
        substitution: prose,
      }),
    )
    .min(1)
    .max(10),
  sourceBasis: z.array(prose).min(1).max(4),
  review: reviewSchema,
})
export type AnalysisEntry = z.infer<typeof analysisEntrySchema>
export type AnalysisKind = z.infer<typeof analysisKindSchema>
