import { z } from 'zod'
import {
  gradedPackSchema,
  modeSchema,
  normalizeAcceptedForm,
  type GradedPack,
  type GradedQuestion,
  type GradedAnswer,
  type DialogueMode,
} from '@/content/dialogues/graded/schema'

const id = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-zA-Z0-9._:-]+$/)
const text = z.string().max(20000)
const commonInput = { text, suggestionId: id.optional() }
export const dialogueInputSchema = z.discriminatedUnion('action', [
  z.strictObject({ action: z.literal('answer'), ...commonInput }),
  z.strictObject({
    action: z.literal('change'),
    ...commonInput,
    questionId: id,
  }),
  z.strictObject({
    action: z.enum(['clarify', 'struggle', 'off-topic', 'refuse']),
    ...commonInput,
  }),
])
type StoredInput = z.infer<typeof dialogueInputSchema>
export type DialogueInput = { text: string; suggestionId?: string } & (
  | { action?: 'answer' }
  | { action: 'change'; questionId: string }
  | { action: 'clarify' | 'struggle' | 'off-topic' | 'refuse' }
)
const confirmationSchema = z.enum(['none', 'exact', 'unknown', 'repair'])
const stateSchema = z.strictObject({
  engineVersion: z.literal(1),
  contentVersion: z.number().int().positive().max(10000),
  mode: modeSchema,
  variantId: id,
  currentQuestionId: id.nullable(),
  facts: z
    .array(
      z.strictObject({
        key: id,
        value: id,
        questionId: id,
        answerId: id,
        turnIndex: z.number().int().min(0).max(19),
      }),
    )
    .max(96),
  completedObjectives: z.array(id).max(24),
  completedIntents: z.array(id).max(24),
  askedQuestionIds: z.array(id).max(24),
  turns: z.array(dialogueInputSchema).max(20),
  outcome: z.enum(['active', 'achieved', 'partial', 'declined']),
  reply: z.string().min(1).max(6000),
  confirmation: confirmationSchema,
})
const snapshotShape = z.strictObject({
  schemaVersion: z.literal(1),
  pack: gradedPackSchema,
  state: stateSchema,
})
export type DialogueSnapshot = z.infer<typeof snapshotShape>
export type DialogueState = DialogueSnapshot['state']
export type DialogueResult = {
  snapshot: DialogueSnapshot
  reply: string
  confirmation: DialogueState['confirmation']
  hintZh: string | null
}

function eligible(question: GradedQuestion, state: DialogueState): boolean {
  return question.requires.every((required) =>
    state.facts.some(
      (f) => f.key === required.key && f.value === required.value,
    ),
  )
}
function pathFor(pack: GradedPack, mode: DialogueMode, variantId: string) {
  const variant = pack.variants.find((v) => v.id === variantId)
  if (!variant) throw new Error('DIALOGUE_INVALID_VARIANT: 未收录此轮变体。')
  return variant.modes[mode]
}
function nextQuestion(
  pack: GradedPack,
  state: DialogueState,
): GradedQuestion | undefined {
  const path = pathFor(pack, state.mode, state.variantId)
  return path.questionIds
    .map((id) => pack.questions.find((q) => q.id === id)!)
    .find(
      (q) =>
        !state.completedObjectives.includes(q.objective) && eligible(q, state),
    )
}
function recalculate(pack: GradedPack, state: DialogueState) {
  // Remove only evidence whose declared applicability no longer holds, including transitive dependents.
  let changed: boolean
  do {
    const before = state.facts.length
    state.facts = state.facts.filter((f) =>
      eligible(
        pack.questions.find((q) => q.id === f.questionId)!,
        state,
      ),
    )
    changed = before !== state.facts.length
  } while (changed)
  const completed = pack.questions.filter((q) =>
    q.answers.some((a) =>
      a.effects.every((e) =>
        state.facts.some(
          (f) =>
            f.key === e.key &&
            f.value === e.value &&
            f.questionId === q.id &&
            f.answerId === a.id,
        ),
      ),
    ),
  )
  state.completedObjectives = completed.map((q) => q.objective)
  state.completedIntents = [...new Set(completed.map((q) => q.intent))]
}
function settle(pack: GradedPack, state: DialogueState, prefix = '') {
  const path = pathFor(pack, state.mode, state.variantId)
  const selected = path.questionIds
    .map((id) => pack.questions.find((q) => q.id === id)!)
    .filter((q) => eligible(q, state))
  const completed =
    selected.length > 0 &&
    selected.every((q) => state.completedObjectives.includes(q.objective))
  const next = nextQuestion(pack, state)
  if (completed || state.turns.length >= path.questionIds.length || !next) {
    state.outcome = completed ? 'achieved' : 'partial'
    state.currentQuestionId = null
    state.reply = completed ? path.achievedClosing : path.partialClosing
  } else {
    state.currentQuestionId = next.id
    if (!state.askedQuestionIds.includes(next.id))
      state.askedQuestionIds.push(next.id)
    state.reply = prefix ? `${prefix}\n${next.text}` : next.text
  }
}
function initialState(
  pack: GradedPack,
  mode: DialogueMode,
  variantId: string,
): DialogueState {
  const state: DialogueState = {
    engineVersion: 1,
    contentVersion: pack.contentVersion,
    mode,
    variantId,
    currentQuestionId: null,
    facts: [],
    completedObjectives: [],
    completedIntents: [],
    askedQuestionIds: [],
    turns: [],
    outcome: 'active',
    reply: '',
    confirmation: 'none',
  }
  settle(pack, state)
  return state
}
function matchingAnswer(
  q: GradedQuestion,
  input: StoredInput,
): GradedAnswer | undefined {
  // The suggestion ID is advisory only. Matching always depends on the submitted text.
  return q.answers.find((a) =>
    a.acceptedForms.some(
      (form) =>
        normalizeAcceptedForm(form) === normalizeAcceptedForm(input.text),
    ),
  )
}
function step(
  pack: GradedPack,
  previous: DialogueState,
  input: StoredInput,
): DialogueState {
  if (previous.outcome !== 'active')
    throw new Error('DIALOGUE_TERMINAL_HISTORY')
  const state: DialogueState = structuredClone(previous)
  const current = pack.questions.find((q) => q.id === state.currentQuestionId)!
  const turnIndex = state.turns.length
  state.turns.push(input)
  if (input.action === 'refuse') {
    state.outcome = 'declined'
    state.currentQuestionId = null
    state.confirmation = 'repair'
    state.reply = pack.repairs.refusedClosing
    return state
  }
  if (
    input.action === 'clarify' ||
    input.action === 'struggle' ||
    input.action === 'off-topic'
  ) {
    state.confirmation = 'repair'
    const repair =
      input.action === 'off-topic'
        ? pack.repairs.offTopic
        : pack.repairs[input.action]
    settle(pack, state, `${repair}\n${current.hintZh}`)
    return state
  }
  const targetId = input.action === 'change' ? input.questionId : current.id
  const target = pack.questions.find((q) => q.id === targetId)
  const canAnswer =
    target &&
    eligible(target, state) &&
    (input.action !== 'change' ||
      state.completedObjectives.includes(target.objective))
  const answer = canAnswer ? matchingAnswer(target, input) : undefined
  if (answer && target) {
    // Keep evidence insertion order stable when replacing an earlier choice.
    const replacingKeys = new Set(answer.effects.map((e) => e.key))
    state.facts = state.facts.filter(
      (f) => f.questionId !== target.id || replacingKeys.has(f.key),
    )
    for (const effect of answer.effects) {
      const fact = {
        ...effect,
        questionId: target.id,
        answerId: answer.id,
        turnIndex,
      }
      const index = state.facts.findIndex((f) => f.key === effect.key)
      if (index < 0) state.facts.push(fact)
      else state.facts[index] = fact
    }
    recalculate(pack, state)
    state.confirmation = 'exact'
    settle(pack, state, input.action === 'change' ? pack.repairs.changed : '')
  } else {
    state.confirmation = 'unknown'
    settle(pack, state, pack.repairs.unknown)
  }
  return state
}

export const dialogueSnapshotSchema = snapshotShape.superRefine(
  (snapshot, ctx) => {
    try {
      let expected = initialState(
        snapshot.pack,
        snapshot.state.mode,
        snapshot.state.variantId,
      )
      for (const input of snapshot.state.turns)
        expected = step(snapshot.pack, expected, input)
      // Parsed objects have schema-defined key order; no catalog lookup is involved.
      if (
        JSON.stringify(stateSchema.parse(expected)) !==
        JSON.stringify(snapshot.state)
      )
        throw Error('DIALOGUE_STATE_MISMATCH')
    } catch {
      ctx.addIssue({
        code: 'custom',
        message:
          'DIALOGUE_STATE_INVALID: 对话版本、问题引用或事实证据不一致；未恢复该记录。',
      })
    }
  },
)

function freezeDeep<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) freezeDeep(item)
    Object.freeze(value)
  }
  return value
}
function result(snapshot: DialogueSnapshot): DialogueResult {
  freezeDeep(snapshot)
  return {
    snapshot,
    reply: snapshot.state.reply,
    confirmation: snapshot.state.confirmation,
    hintZh:
      snapshot.pack.questions.find(
        (q) => q.id === snapshot.state.currentQuestionId,
      )?.hintZh ?? null,
  }
}
function parseSnapshot(snapshot: DialogueSnapshot): DialogueSnapshot {
  const parsed = dialogueSnapshotSchema.safeParse(snapshot)
  if (!parsed.success)
    throw new Error(`DIALOGUE_INVALID: ${parsed.error.message}`)
  return parsed.data
}
export function createDialogue(
  pack: GradedPack,
  options: { mode: DialogueMode; variantId: string },
): DialogueResult {
  const selected = gradedPackSchema.parse(pack)
  const variant = selected.variants.find((v) => v.id === options.variantId)
  if (
    !variant ||
    variant.review.state !== 'model-reviewed' ||
    selected.questions.some(
      (q) =>
        q.review.state !== 'model-reviewed' ||
        q.answers.some((a) => a.review.state !== 'model-reviewed'),
    )
  )
    throw new Error('DIALOGUE_UNREVIEWED: 此内容尚未完成逐项模型辅助阅读。')
  return result({
    schemaVersion: 1,
    pack: selected,
    state: initialState(
      selected,
      modeSchema.parse(options.mode),
      options.variantId,
    ),
  })
}
export function advanceDialogue(
  snapshot: DialogueSnapshot,
  input: DialogueInput,
): DialogueResult {
  const parsed = parseSnapshot(snapshot)
  if (parsed.state.outcome !== 'active') return result(parsed)
  const acceptedInput = dialogueInputSchema.parse({
    ...input,
    action: input.action ?? 'answer',
  })
  return result({
    ...parsed,
    state: step(parsed.pack, parsed.state, acceptedInput),
  })
}
export function dialogueSuggestions(
  snapshot: DialogueSnapshot,
): GradedAnswer[] {
  const parsed = parseSnapshot(snapshot)
  if (parsed.state.outcome !== 'active') return []
  const q = parsed.pack.questions.find(
    (q) => q.id === parsed.state.currentQuestionId,
  )
  return q && eligible(q, parsed.state) ? q.answers : []
}
