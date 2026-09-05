import type {
  CefrLevel,
  LevelConstraint,
  LevelContent,
  SceneCategory,
  SceneDefinition,
} from '@/domain/scenes/types'

export interface SceneSeed {
  slug: string
  titleZh: string
  titleEn: string
  summaryZh: string
  learnerRole: string
  aiRole: string
  minutes?: 3 | 5 | 8 | 10
  turns?: number
  goalsZh: [string, string, string]
  goalKeywords: [
    [string, ...string[]],
    [string, ...string[]],
    [string, ...string[]],
  ]
  keywords: [string, string, string, ...string[]]
  expressions: {
    basic: [string, string]
    standard: [string, string]
    advanced: [string, string]
  }
  openings: {
    basic: string
    standard: string
    advanced: string
  }
  imageAltZh: string
  imageKey?: string
}

const CONSTRAINTS: LevelContent<LevelConstraint> = {
  A1: {
    minAiWords: 4,
    maxAiWords: 9,
    followUpStyle: 'Ask one concrete fact at a time.',
    feedbackFocus: 'clarity, basic word order, and one core sentence pattern',
    strategy: 'single-step prompts with visible sentence support',
    speechRate: 0.78,
  },
  A2: {
    minAiWords: 6,
    maxAiWords: 14,
    followUpStyle: 'Offer a choice or one gentle follow-up.',
    feedbackFocus: 'tense, polite requests, and common collocations',
    strategy: 'guided choices followed by a short reason',
    speechRate: 0.86,
  },
  B1: {
    minAiWords: 8,
    maxAiWords: 20,
    followUpStyle: 'Ask for a reason, plan, or comparison.',
    feedbackFocus: 'cohesion, connectors, and moving the task forward',
    strategy: 'multi-turn task completion with one realistic complication',
    speechRate: 0.94,
  },
  B2: {
    minAiWords: 10,
    maxAiWords: 26,
    followUpStyle: 'Introduce negotiation, disagreement, or a change of plan.',
    feedbackFocus: 'register, collocation, tact, and persuasion',
    strategy: 'negotiation with trade-offs and courteous challenge',
    speechRate: 1,
  },
  C1: {
    minAiWords: 12,
    maxAiWords: 42,
    followUpStyle:
      'Use implicit intent, layered constraints, and pressure questions.',
    feedbackFocus:
      'precision, style, strategy, and cross-cultural appropriateness',
    strategy:
      'implicit intent, competing priorities, and high-pressure follow-up',
    speechRate: 1.06,
  },
}

function levelKeywords(words: SceneSeed['keywords']): LevelContent<string[]> {
  const [
    first,
    second,
    third,
    fourth = 'confirm',
    fifth = 'clarify',
    sixth = 'option',
  ] = words

  return {
    A1: [first, second, third],
    A2: [first, second, third, fourth],
    B1: [first, second, third, fourth, fifth],
    B2: [second, third, fourth, fifth, sixth],
    C1: [third, fourth, fifth, sixth, 'trade-off'],
  }
}

function levelExpressions(
  expressions: SceneSeed['expressions'],
): LevelContent<string[]> {
  return {
    A1: [...expressions.basic],
    A2: [expressions.basic[1], expressions.standard[0]],
    B1: [...expressions.standard],
    B2: [expressions.standard[1], expressions.advanced[0]],
    C1: [...expressions.advanced],
  }
}

function levelOpenings(
  openings: SceneSeed['openings'],
): LevelContent<string[]> {
  return {
    A1: [openings.basic],
    A2: [openings.basic, openings.standard],
    B1: [openings.standard],
    B2: [openings.standard, openings.advanced],
    C1: [openings.advanced],
  }
}

export function defineScenes(
  category: SceneCategory,
  imageKey: string,
  seeds: readonly SceneSeed[],
): SceneDefinition[] {
  const safetyNote =
    category === 'emergency'
      ? '本场景仅用于语言练习，不构成医疗、法律或安全建议；紧急情况请联系当地专业服务。'
      : undefined

  return seeds.map((seed, index) => ({
    id: `${category}-${String(index + 1).padStart(2, '0')}`,
    slug: seed.slug,
    version: 1,
    category,
    titleZh: seed.titleZh,
    titleEn: seed.titleEn,
    summaryZh: seed.summaryZh,
    learnerRole: seed.learnerRole,
    aiRole: seed.aiRole,
    estimatedMinutes: seed.minutes ?? ([3, 5, 5, 8, 8, 10] as const)[index % 6],
    recommendedTurns: seed.turns ?? 6,
    goals: seed.goalsZh.map((labelZh, goalIndex) => ({
      id: `${seed.slug}-goal-${goalIndex + 1}`,
      labelZh,
      completionSignal: `Learner communicates this outcome: ${labelZh}`,
      completionKeywords: [...seed.goalKeywords[goalIndex]],
    })),
    keywords: levelKeywords(seed.keywords),
    exampleExpressions: levelExpressions(seed.expressions),
    openingLines: levelOpenings(seed.openings),
    constraints: Object.fromEntries(
      (Object.entries(CONSTRAINTS) as [CefrLevel, LevelConstraint][]).map(
        ([level, constraint]) => [level, { ...constraint }],
      ),
    ) as LevelContent<LevelConstraint>,
    safetyNote,
    image: {
      key: seed.imageKey ?? imageKey,
      altZh: seed.imageAltZh,
      focalPoint: '50% 45%',
    },
    status: 'published',
  }))
}
