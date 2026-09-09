import { z } from 'zod'
import { CEFR_LEVELS, SCENE_CATEGORIES } from '@/domain/scenes/types'

const id = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-zA-Z0-9._:-]+$/)
const prose = z.string().min(1).max(2000)
export const reviewSchema = z.strictObject({
  state: z.enum(['draft', 'model-reviewed']),
  record: prose,
})
export const factSchema = z.strictObject({ key: id, value: id })
export const answerSchema = z.strictObject({
  id,
  text: prose,
  acceptedForms: z.array(prose).min(1).max(12),
  effects: z.array(factSchema).min(1).max(4),
  review: reviewSchema,
})
export const questionSchema = z.strictObject({
  id,
  text: prose,
  intent: id,
  objective: id,
  hintZh: prose,
  requires: z.array(factSchema).max(4),
  answers: z.tuple([answerSchema, answerSchema]),
  sourceBasis: z.array(prose).min(1).max(4),
  review: reviewSchema,
})
export const modeSchema = z.enum(['short', 'standard', 'extended'])
const pathSchema = z.strictObject({
  questionIds: z.array(id).min(1).max(20),
  achievedClosing: prose,
  partialClosing: prose,
})
export const gradedPackSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    engineVersion: z.literal(1),
    contentVersion: z.number().int().positive().max(10000),
    sceneId: id,
    category: z.enum(SCENE_CATEGORIES),
    level: z.enum(CEFR_LEVELS),
    author: prose,
    rationale: z.strictObject({
      canDoZh: prose,
      complexityZh: prose,
      scaffoldingZh: prose,
      registerZh: prose,
      sourceBasis: z.array(prose).min(1).max(4),
    }),
    questions: z.array(questionSchema).min(1).max(24),
    variants: z
      .array(
        z.strictObject({
          id,
          situationZh: prose,
          modes: z.strictObject({
            short: pathSchema,
            standard: pathSchema,
            extended: pathSchema,
          }),
          review: reviewSchema,
        }),
      )
      .min(1)
      .max(6),
    repairs: z.strictObject({
      clarify: prose,
      struggle: prose,
      offTopic: prose,
      unknown: prose,
      changed: prose,
      refusedClosing: prose,
    }),
  })
  .superRefine((pack, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message })
    const questions = new Map(pack.questions.map((q) => [q.id, q]))
    if (questions.size !== pack.questions.length) fail('DUPLICATE_QUESTION')
    if (
      new Set(pack.questions.map((q) => q.objective)).size !==
      pack.questions.length
    )
      fail('DUPLICATE_OBJECTIVE')
    if (new Set(pack.variants.map((v) => v.id)).size !== pack.variants.length)
      fail('DUPLICATE_VARIANT')
    const answerIds = pack.questions.flatMap((q) => q.answers.map((a) => a.id))
    if (new Set(answerIds).size !== answerIds.length) fail('DUPLICATE_ANSWER')
    const owners = new Map<string, string>()
    for (const q of pack.questions)
      for (const answer of q.answers)
        for (const effect of answer.effects) {
          if (owners.has(effect.key) && owners.get(effect.key) !== q.id)
            fail('FACT_HAS_MULTIPLE_OWNERS')
          owners.set(effect.key, q.id)
        }
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const checkDependencies = (questionId: string) => {
      if (visiting.has(questionId)) {
        fail('CYCLIC_APPLICABILITY')
        return
      }
      if (visited.has(questionId)) return
      visiting.add(questionId)
      for (const requirement of questions.get(questionId)?.requires ?? []) {
        const owner = owners.get(requirement.key)
        if (owner) checkDependencies(owner)
      }
      visiting.delete(questionId)
      visited.add(questionId)
    }
    for (const q of pack.questions) checkDependencies(q.id)
    for (const q of pack.questions) {
      const forms = q.answers.flatMap((a) =>
        a.acceptedForms.map(normalizeAcceptedForm),
      )
      if (new Set(forms).size !== forms.length) fail('AMBIGUOUS_ACCEPTED_FORM')
      for (const a of q.answers) {
        if (!a.acceptedForms.includes(a.text)) fail('MISSING_AUTHORED_FORM')
        if (new Set(a.effects.map((f) => f.key)).size !== a.effects.length)
          fail('DUPLICATE_EFFECT')
      }
      if (
        q.requires.some(
          (f) =>
            !pack.questions.some(
              (other) =>
                other !== q &&
                other.answers.some((a) =>
                  a.effects.some((e) => e.key === f.key && e.value === f.value),
                ),
            ),
        )
      )
        fail('UNKNOWN_REQUIREMENT')
    }
    const reachable = new Set<string>()
    for (const variant of pack.variants)
      for (const path of Object.values(variant.modes)) {
        if (new Set(path.questionIds).size !== path.questionIds.length)
          fail('REPEATED_PATH_QUESTION')
        for (const questionId of path.questionIds) {
          if (!questions.has(questionId)) fail('UNKNOWN_PATH_QUESTION')
          reachable.add(questionId)
          for (const requirement of questions.get(questionId)?.requires ?? []) {
            const ownerIndex = path.questionIds.indexOf(
              owners.get(requirement.key) ?? '',
            )
            if (
              ownerIndex < 0 ||
              ownerIndex >= path.questionIds.indexOf(questionId)
            )
              fail('PATH_DEPENDENCY_NOT_EARLIER')
          }
        }
        if (/[?？]/u.test(path.achievedClosing + path.partialClosing))
          fail('CLOSING_HAS_QUESTION')
      }
    if (pack.questions.some((q) => !reachable.has(q.id)))
      fail('UNREACHABLE_BANK_QUESTION')
    if (/[?？]/u.test(pack.repairs.refusedClosing)) fail('CLOSING_HAS_QUESTION')
  })

/** Deliberately does not remove internal punctuation, contractions or negation. */
export function normalizeAcceptedForm(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/gu, ' ')
    .replace(/^[.!?,;:]+|[.!?,;:]+$/gu, '')
    .trim()
}

export type GradedPack = z.infer<typeof gradedPackSchema>
export type GradedQuestion = z.infer<typeof questionSchema>
export type GradedAnswer = z.infer<typeof answerSchema>
export type DialogueMode = z.infer<typeof modeSchema>
