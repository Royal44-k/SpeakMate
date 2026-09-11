import { z } from 'zod'
import { CEFR_LEVELS, SCENE_CATEGORIES } from '@/domain/scenes/types'
import { dialogueSnapshotSchema } from '@/domain/ai/graded-dialogue'
import { normalizeAcceptedForm } from '@/content/dialogues/graded/schema'
import {
  microPracticeSchema,
  projectMicroPractice,
} from '@/content/micro-practice'
import { safeSourceHref } from '@/components/app-shell/learning-routes'
import {
  practicePresentationSchema,
  completionEvidenceSchema,
  practiceFlow,
} from '@/domain/practice/graded-evidence'

export const MAX_BACKUP_BYTES = 10 * 1024 * 1024
export const textSchema = z.string().max(20_000)
export const idSchema = z
  .string()
  .min(1)
  .max(1024)
  .refine(
    (value) =>
      !/[\s\u0000-\u001f]/u.test(value) &&
      !['__proto__', 'prototype', 'constructor'].includes(value),
    'INVALID_ID',
  )
export const isoSchema = z.iso.datetime({ offset: true })
export const daySchema = z.iso.date()
const nonnegative = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)
const positive = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER)
const strings = z.array(textSchema).max(1000)
const ids = z.array(idSchema).max(1000)
const level = z.enum(CEFR_LEVELS)
const category = z.enum(SCENE_CATEGORIES)
const minutes = z.union([z.literal(5), z.literal(10), z.literal(15)])
const record = <T extends z.ZodType>(schema: T) => z.array(schema).max(50_000)

export const provenanceSchema = z.strictObject({
  planId: idSchema,
  sourceTaskId: idSchema,
  planDate: daySchema,
  sourceNoteId: idSchema.optional(),
  returnTo: z
    .string()
    .max(2048)
    .refine((value) => {
      if (
        !value.startsWith('/') ||
        value.startsWith('//') ||
        /[\\\u0000-\u0020]/u.test(value)
      )
        return false
      const url = new URL(value, 'https://speakmate.invalid')
      return (
        url.origin === 'https://speakmate.invalid' &&
        /^\/(?:notebook|practice|scenes|me)?(?:\/[A-Za-z0-9_:-]+)*$/u.test(
          url.pathname,
        )
      )
    }, 'INVALID_RETURN_TO'),
})
export const profileSchema = z.strictObject({
  id: idSchema,
  email: z.email().max(320).optional(),
  level,
  goals: z.array(category).max(7),
  dailyMinutes: minutes,
  onboardingCompleted: z.boolean(),
  createdAt: isoSchema,
  updatedAt: isoSchema,
})
export const settingsSchema = z.strictObject({
  id: z.literal('settings'),
  speechRate: z.number().min(0.1).max(10),
  autoPlayAi: z.boolean(),
  feedbackExpanded: z.boolean(),
  appliedProfileStyle: idSchema.optional(),
  appliedGoalCover: idSchema.optional(),
  updatedAt: isoSchema,
})
export const favoriteSchema = z.strictObject({
  id: idSchema,
  expression: textSchema.min(1),
  translationZh: textSchema.optional(),
  sceneId: idSchema.optional(),
  turnId: idSchema.optional(),
  createdAt: isoSchema,
  updatedAt: isoSchema,
})

// Historical snapshot boundary: validate stored shapes, never today's catalog IDs/content limits.
// Future corpus snapshot versions extend this schema explicitly, not the scene catalog lookup.
export const adaptedSceneSnapshotSchema = z.strictObject({
  id: idSchema,
  slug: idSchema,
  version: positive,
  category,
  titleZh: textSchema,
  titleEn: textSchema,
  summaryZh: textSchema,
  learnerRole: textSchema,
  aiRole: textSchema,
  estimatedMinutes: z.union([
    z.literal(3),
    z.literal(5),
    z.literal(8),
    z.literal(10),
  ]),
  recommendedTurns: positive,
  goals: z
    .array(
      z.strictObject({
        id: idSchema,
        labelZh: textSchema,
        completionSignal: textSchema,
        completionKeywords: strings,
      }),
    )
    .max(1000),
  keywords: strings,
  exampleExpressions: strings,
  openingLines: strings,
  level,
  constraints: z.strictObject({
    minAiWords: nonnegative,
    maxAiWords: positive,
    followUpStyle: textSchema,
    feedbackFocus: textSchema,
    strategy: textSchema,
    speechRate: z.number().min(0.1).max(10),
  }),
  safetyNote: textSchema.optional(),
  image: z.strictObject({
    key: textSchema,
    altZh: textSchema,
    focalPoint: z.string().regex(/^\d+(?:\.\d+)?% \d+(?:\.\d+)?%$/u),
  }),
  status: z.enum(['published', 'archived']),
})
export const conversationSnapshotSchema = z.strictObject({
  reply: z.strictObject({
    text: textSchema,
    hintZh: textSchema,
    emotion: z.enum(['neutral', 'warm', 'firm', 'curious']),
  }),
  feedback: z.strictObject({
    heard: textSchema,
    corrected: textSchema.nullable(),
    naturalAlternative: textSchema.nullable(),
    explanationZh: textSchema,
    issueTags: z
      .array(
        z.enum(['grammar', 'vocabulary', 'register', 'clarity', 'strategy']),
      )
      .max(1000),
  }),
  progress: z.strictObject({
    completedGoalIds: ids,
    shouldOfferCompletion: z.boolean(),
  }),
  provider: z.enum(['cloudflare', 'local']),
  degraded: z.boolean(),
})
export const notebookSourceSchema = z.strictObject({
  id: idSchema,
  kind: z.enum(['manual', 'favorite', 'turn', 'scene']),
  originalText: textSchema,
  translationZh: textSchema.optional(),
  sceneId: idSchema.optional(),
  sceneTitleZh: textSchema.optional(),
  level: level.optional(),
  sessionId: idSchema.optional(),
  turnId: idSchema.optional(),
  questionId: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-zA-Z0-9._:-]+$/)
    .optional(),
  learnerText: textSchema.optional(),
  correctedText: textSchema.optional(),
  naturalText: textSchema.optional(),
  explanationZh: textSchema.optional(),
  createdAt: isoSchema,
})
const simulationStep = z.strictObject({
  text: textSchema.min(1).refine((value) => !!value.trim()),
  completedAt: isoSchema,
})
export const simulationSchema = z.strictObject({
  schemaVersion: z.literal(1),
  noteIds: z.tuple([idSchema]),
  source: z.strictObject({
    noteId: idSchema,
    sourceId: idSchema,
    snapshot: notebookSourceSchema,
    noteText: textSchema.min(1),
    noteKind: z.enum(['word', 'phrase', 'sentence']),
  }),
  returnTo: z
    .string()
    .max(2000)
    .refine(
      (value) =>
        safeSourceHref(value) === value &&
        /^\/notebook(?:\/note\?id=[a-zA-Z0-9._:-]+)?$/u.test(value),
      'INVALID_SIMULATION_RETURN',
    ),
  descriptor: microPracticeSchema,
  target: z.strictObject({
    coverage: z.enum(['exact', 'partial']),
    text: textSchema.min(1),
    kind: z.enum(['word', 'phrase', 'sentence']),
    meaningZh: textSchema.min(1),
    example: textSchema.min(1),
    substitution: textSchema.min(1),
  }),
  recall: simulationStep.optional(),
  composition: simulationStep.optional(),
})
export const sessionSchema = z
  .strictObject({
    id: idSchema,
    profileId: idSchema,
    sceneId: idSchema,
    sceneVersion: positive,
    sceneSnapshot: adaptedSceneSnapshotSchema.optional(),
    level,
    status: z.enum(['active', 'completed', 'abandoned']),
    startedAt: isoSchema,
    updatedAt: isoSchema,
    completedAt: isoSchema.optional(),
    completedGoals: ids,
    openingText: textSchema.optional(),
    provenance: provenanceSchema.optional(),
    gradedDialogue: dialogueSnapshotSchema.optional(),
    presentation: practicePresentationSchema.optional(),
    completionEvidence: completionEvidenceSchema.optional(),
    simulation: simulationSchema.optional(),
  })
  .superRefine((session, ctx) => {
    if (session.simulation) {
      const sim = session.simulation
      const snap = session.gradedDialogue
      let valid =
        !!snap &&
        sim.noteIds[0] === sim.source.noteId &&
        sim.source.sourceId === sim.source.snapshot.id &&
        sim.source.snapshot.sceneId === session.sceneId &&
        sim.source.snapshot.level === session.level
      if (sim.composition && !sim.recall) valid = false
      if (session.status === 'completed' && !session.completionEvidence)
        valid = false
      const dates = [
        session.startedAt,
        sim.recall?.completedAt,
        sim.composition?.completedAt,
        session.updatedAt,
      ].filter((value): value is string => !!value)
      if (
        dates.some(
          (value, index) =>
            index > 0 && Date.parse(value) < Date.parse(dates[index - 1]),
        )
      )
        valid = false
      if (
        snap &&
        (snap.state.turns.length > 0 || session.status === 'completed') &&
        !sim.composition
      )
        valid = false
      if (
        sim.target.coverage === 'exact' &&
        (sim.target.text !== sim.source.noteText ||
          sim.target.kind !== sim.source.noteKind)
      )
        valid = false
      if (
        sim.target.coverage === 'partial' &&
        (sim.target.kind !== 'word' ||
          !normalizeAcceptedForm(sim.source.noteText)
            .split(/[^a-z'-]+/u)
            .includes(normalizeAcceptedForm(sim.target.text)))
      )
        valid = false
      try {
        if (
          !snap ||
          snap.state.mode !== 'short' ||
          JSON.stringify(projectMicroPractice(snap.pack, sim.descriptor)) !==
            JSON.stringify(snap.pack)
        )
          valid = false
      } catch {
        valid = false
      }
      if (!valid)
        ctx.addIssue({
          code: 'custom',
          message: 'SIMULATION_EVIDENCE_MISMATCH',
        })
    }
    const evidence = session.completionEvidence
    if (session.presentation && !session.gradedDialogue)
      ctx.addIssue({
        code: 'custom',
        message: 'PRESENTATION_REQUIRES_GRADED_SNAPSHOT',
      })
    if (evidence) {
      const snapshot = session.gradedDialogue
      const flow = snapshot ? practiceFlow(snapshot) : undefined
      if (
        !snapshot ||
        session.status !== 'completed' ||
        evidence.confirmedAt !== session.completedAt ||
        evidence.sessionId !== session.id ||
        evidence.sceneId !== session.sceneId ||
        evidence.sceneVersion !== session.sceneVersion ||
        evidence.level !== session.level ||
        evidence.contentVersion !== snapshot.pack.contentVersion ||
        evidence.engineVersion !== snapshot.state.engineVersion ||
        evidence.mode !== snapshot.state.mode ||
        evidence.variantId !== snapshot.state.variantId ||
        evidence.outcome !== snapshot.state.outcome ||
        evidence.basis !== flow?.basis ||
        evidence.submittedTurns !== flow?.submittedTurns ||
        evidence.expressionTurns !== flow?.expressionTurns ||
        evidence.requiredUserTurns !== flow?.requiredUserTurns
      )
        ctx.addIssue({
          code: 'custom',
          message: 'COMPLETION_EVIDENCE_MISMATCH',
        })
    }
    const pack = session.gradedDialogue?.pack
    if (
      pack &&
      (pack.sceneId !== session.sceneId || pack.level !== session.level)
    )
      ctx.addIssue({
        code: 'custom',
        message:
          'GRADED_SNAPSHOT_MISMATCH: 保存的语料场景或等级与练习记录不一致。',
      })
  })
export const turnSchema = z.strictObject({
  id: idSchema,
  sessionId: idSchema,
  index: nonnegative,
  learnerText: textSchema,
  aiText: textSchema,
  feedback: z
    .strictObject({
      corrected: textSchema,
      natural: textSchema,
      explanationZh: textSchema,
      tags: strings,
    })
    .optional(),
  degraded: z.boolean().optional(),
  result: conversationSnapshotSchema.optional(),
  createdAt: isoSchema,
})
export const notebookSchema = z.strictObject({
  id: idSchema,
  aliasIds: ids.optional(),
  profileId: idSchema,
  kind: z.enum(['word', 'phrase', 'sentence']),
  text: textSchema.min(1),
  normalizedText: textSchema.min(1),
  translationZh: textSchema.optional(),
  notes: textSchema,
  tags: strings,
  sources: z.array(notebookSourceSchema).max(1000),
  favoriteIds: ids,
  createdAt: isoSchema,
  updatedAt: isoSchema,
  deletedAt: isoSchema.optional(),
})
export const reviewSchema = z.strictObject({
  id: idSchema,
  profileId: idSchema,
  noteId: idSchema,
  eventId: idSchema,
  rating: z.enum(['remember', 'vague', 'forgot']),
  reviewedAt: isoSchema,
  dateKey: daySchema,
  previousReviewId: idSchema.optional(),
  scheduleStep: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
  ]),
  intervalDays: z.union([
    z.literal(1),
    z.literal(3),
    z.literal(7),
    z.literal(14),
    z.literal(30),
  ]),
  nextReviewAt: isoSchema,
  nextReviewDateKey: daySchema,
})
export const simulationSelectionSchema = z.strictObject({
  schemaVersion: z.literal(1),
  noteId: idSchema,
  sourceId: idSchema,
  sourceLevel: level,
  descriptorId: idSchema,
  descriptorVersion: z.union([z.literal(1), z.literal(2)]),
  sourceContentVersion: positive,
})
const target = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('simulation-choice') }),
  z.strictObject({
    kind: z.literal('warmup'),
    noteIds: ids,
    starterExpressionIds: ids,
    requiredRecallCount: positive,
  }),
  z.strictObject({
    kind: z.literal('scene'),
    sceneId: idSchema,
    sceneVersion: positive,
    requiredUserTurns: positive,
    selection: z
      .strictObject({
        schemaVersion: z.literal(1),
        level,
        mode: z.enum(['short', 'standard', 'extended']),
        variantId: idSchema,
        contentVersion: positive,
      })
      .optional(),
  }),
  z.strictObject({
    kind: z.literal('simulation'),
    noteIds: ids,
    requiredUserTurns: z.union([z.literal(3), z.literal(4), z.literal(5)]),
    selection: simulationSelectionSchema.optional(),
  }),
])
export const planSchema = z.strictObject({
  id: idSchema,
  profileId: idSchema,
  dateKey: daySchema,
  snapshot: z.strictObject({
    level,
    interests: z.array(category).max(7),
    dailyMinutes: minutes,
  }),
  tasks: z
    .array(
      z.strictObject({
        id: idSchema,
        slot: z.enum(['warmup', 'scene', 'consolidation', 'extension']),
        optional: z.boolean(),
        enabled: z.boolean(),
        status: z.enum(['not-started', 'started', 'completed']),
        swapUsed: z.boolean(),
        purposeZh: textSchema,
        estimatedMinutes: z.number().positive().max(1440),
        completionConditionZh: textSchema,
        target,
        source: z.strictObject({
          reason: z.enum([
            'due-notes',
            'favorites',
            'starter',
            'interests',
            'today-expressions',
          ]),
          noteIds: ids,
          sceneId: idSchema.optional(),
        }),
        progress: nonnegative,
        startedAt: isoSchema.optional(),
        completedAt: isoSchema.optional(),
        completionEventId: idSchema.optional(),
      }),
    )
    .min(3)
    .max(4),
  createdAt: isoSchema,
  updatedAt: isoSchema,
})
const eventBase = {
  id: idSchema,
  profileId: idSchema,
  occurredAt: isoSchema,
  dateKey: daySchema,
  provenance: provenanceSchema.optional(),
}
export const eventSchema = z.discriminatedUnion('type', [
  z.strictObject({
    ...eventBase,
    type: z.literal('turn-completed'),
    sessionId: idSchema,
    turnId: idSchema,
  }),
  z.strictObject({
    ...eventBase,
    type: z.literal('session-completed'),
    sessionId: idSchema,
    evidence: completionEvidenceSchema.optional(),
  }),
  z.strictObject({
    ...eventBase,
    type: z.literal('warmup-completed'),
    runId: idSchema,
    recalledNoteIds: ids,
    recalledStarterExpressionIds: ids,
    recallResponses: z
      .array(
        z.strictObject({
          id: idSchema,
          kind: z.enum(['note', 'starter']),
          text: textSchema.refine((value) => !!value.trim()),
        }),
      )
      .min(1)
      .max(1000)
      .optional(),
  }),
  z.strictObject({
    ...eventBase,
    type: z.literal('simulation-completed'),
    runId: idSchema,
    noteIds: ids,
    sessionId: idSchema,
    recallCompleted: z.boolean(),
    compositionText: textSchema,
    completedUserTurns: nonnegative,
    evidence: completionEvidenceSchema.optional(),
    selection: simulationSelectionSchema.optional(),
  }),
  z.strictObject({
    ...eventBase,
    type: z.literal('review-completed'),
    noteId: idSchema,
    reviewId: idSchema,
  }),
  z.strictObject({
    ...eventBase,
    type: z.literal('notebook-added'),
    noteId: idSchema,
  }),
  z.strictObject({
    ...eventBase,
    type: z.literal('daily-plan-completed'),
    planId: idSchema,
  }),
  z.strictObject({
    ...eventBase,
    type: z.literal('foreground-time-recorded'),
    runId: idSchema,
    segmentId: idSchema,
    startedAt: isoSchema,
    endedAt: isoSchema,
    durationMs: nonnegative,
  }),
  z.strictObject({
    ...eventBase,
    type: z.literal('reward-redeemed'),
    rewardId: idSchema,
  }),
])
export const ledgerSchema = z.strictObject({
  id: idSchema,
  profileId: idSchema,
  eventId: idSchema,
  ruleId: idSchema,
  ruleVersion: positive,
  delta: z
    .number()
    .int()
    .min(-Number.MAX_SAFE_INTEGER)
    .max(Number.MAX_SAFE_INTEGER),
  createdAt: isoSchema,
})
export const unlockSchema = z.strictObject({
  id: idSchema,
  profileId: idSchema,
  rewardId: idSchema,
  eventId: idSchema,
  unlockedAt: isoSchema,
})
export const outboxSchema = z.strictObject({
  id: idSchema,
  entityType: z.enum(['profile', 'session', 'turn', 'favorite']),
  entityId: idSchema,
  operation: z.enum(['upsert', 'delete']),
  createdAt: isoSchema,
})
const base = {
  exportedAt: isoSchema,
  profile: profileSchema.optional(),
  sessions: record(sessionSchema),
  turns: record(turnSchema),
  favorites: record(favoriteSchema),
  settings: settingsSchema.optional(),
}
export const backupV1Schema = z.strictObject({
  schemaVersion: z.literal(1),
  ...base,
})
export const backupV2Schema = z.strictObject({
  schemaVersion: z.literal(2),
  ...base,
  notebook: record(notebookSchema),
  reviews: record(reviewSchema),
  dailyPlans: record(planSchema),
  learningEvents: record(eventSchema),
  pointsLedger: record(ledgerSchema),
  rewardUnlocks: record(unlockSchema),
  outbox: record(outboxSchema).default([]),
})
export const backupSchema = z.discriminatedUnion('schemaVersion', [
  backupV1Schema,
  backupV2Schema,
])
