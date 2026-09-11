import { z } from 'zod'
import { CEFR_LEVELS } from '@/domain/scenes/types'
import type { DialogueSnapshot } from '@/domain/ai/graded-dialogue'

const id = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-zA-Z0-9._:-]+$/)
export const practicePresentationSchema = z.strictObject({
  schemaVersion: z.literal(1),
  counterpartZh: z
    .string()
    .min(1)
    .max(120)
    .refine((value) => !!value.trim()),
  frameZh: z
    .string()
    .min(1)
    .max(500)
    .refine((value) => !!value.trim()),
})
export type PracticePresentation = z.infer<typeof practicePresentationSchema>
export const completionEvidenceSchema = z.strictObject({
  schemaVersion: z.literal(1),
  ruleVersion: z.literal(1),
  sessionId: id,
  sceneId: id,
  sceneVersion: z.number().int().positive().max(10000),
  level: z.enum(CEFR_LEVELS),
  contentVersion: z.number().int().positive().max(10000),
  engineVersion: z.literal(1),
  mode: z.enum(['short', 'standard', 'extended']),
  variantId: id,
  requiredUserTurns: z.number().int().min(1).max(20),
  submittedTurns: z.number().int().min(1).max(20),
  expressionTurns: z.number().int().min(1).max(20),
  outcome: z.enum(['achieved', 'partial']),
  basis: z.enum(['path-cap', 'achieved']),
  confirmedAt: z.iso.datetime({ offset: true }),
})
export type PracticeCompletionEvidence = z.infer<
  typeof completionEvidenceSchema
>

/** Rule v1 describes completed learning work, never language correctness. */
export function practiceFlow(snapshot: DialogueSnapshot) {
  const state = snapshot.state
  const requiredUserTurns = snapshot.pack.variants.find(
    (variant) => variant.id === state.variantId,
  )!.modes[state.mode].questionIds.length
  const submittedTurns = state.turns.length
  const expressionTurns = state.turns.filter(
    (input) =>
      (input.action === 'answer' || input.action === 'change') &&
      input.text.trim().length > 0,
  ).length
  const basis =
    expressionTurns > 0 &&
    (state.outcome === 'partial' || state.outcome === 'achieved')
      ? submittedTurns === requiredUserTurns
        ? ('path-cap' as const)
        : state.outcome === 'achieved'
          ? ('achieved' as const)
          : undefined
      : undefined
  return { requiredUserTurns, submittedTurns, expressionTurns, basis }
}
