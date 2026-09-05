import type {
  ConversationInput,
  ConversationProvider,
  ConversationResult,
  FeedbackIssueTag,
} from './contracts'

interface Correction {
  pattern: RegExp
  replacement: string
  tag: FeedbackIssueTag
  explanation: string
}

const CORRECTIONS: Correction[] = [
  {
    pattern: /\bI am agree\b/i,
    replacement: 'I agree',
    tag: 'grammar',
    explanation: 'agree 是动词，前面不需要 am。',
  },
  {
    pattern: /\bhe need\b/i,
    replacement: 'he needs',
    tag: 'grammar',
    explanation: '一般现在时中，he 后面的动词要用第三人称单数。',
  },
  {
    pattern: /\bI want ([^.?!]+)/i,
    replacement: 'Could I have $1',
    tag: 'register',
    explanation: '服务场景中用 Could I have… 会更自然、礼貌。',
  },
]

function applyCorrections(text: string, level: string) {
  let corrected = text.trim()
  const tags: FeedbackIssueTag[] = []
  const explanations: string[] = []

  for (const correction of CORRECTIONS) {
    if (tags.length === 2) break
    if (correction.tag === 'register' && !['B2', 'C1'].includes(level)) continue
    if (!correction.pattern.test(corrected)) continue
    corrected = corrected.replace(correction.pattern, correction.replacement)
    if (!tags.includes(correction.tag)) tags.push(correction.tag)
    explanations.push(correction.explanation)
  }

  return { corrected, tags, explanations }
}

function findNewCompletedGoalIds(input: ConversationInput): string[] {
  const normalized = input.learnerText.toLowerCase()
  const completed = new Set(input.completedGoalIds)

  for (const goal of input.scene.goals) {
    if (completed.has(goal.id)) continue
    if (
      goal.completionKeywords.some((keyword) =>
        includesWholeKeyword(normalized, keyword),
      )
    ) {
      completed.add(goal.id)
    }
  }

  return [...completed]
}

function includesWholeKeyword(text: string, keyword: string) {
  const escaped = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(
    `(?:^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`,
    'iu',
  ).test(text)
}

function buildReply(input: ConversationInput, completedGoalIds: string[]) {
  const nextGoalIndex = input.scene.goals.findIndex(
    (goal) => !completedGoalIds.includes(goal.id),
  )
  const nextGoal = input.scene.goals[Math.max(0, nextGoalIndex)]
  const keyword =
    nextGoal.completionKeywords.find((candidate) =>
      input.scene.keywords.some(
        (levelKeyword) =>
          levelKeyword.toLowerCase() === candidate.toLowerCase(),
      ),
    ) ?? nextGoal.completionKeywords[0]
  const acknowledgement = input.history.length > 0 ? 'Thanks.' : 'All right.'
  const templates = {
    A1: `Please tell me about ${keyword} now.`,
    A2: `Could you tell me more about ${keyword}, please?`,
    B1: `${acknowledgement} Could you explain the ${keyword} detail and what you need next?`,
    B2: `${acknowledgement} Could you clarify the ${keyword} detail and your preferred option?`,
    C1: `${acknowledgement} Could you clarify the ${keyword} detail, including the main constraint, priority, and trade-off?`,
  } as const
  const closing = {
    A1: 'Thank you. Is there anything else you need?',
    A2: 'Thank you. Is there anything else you would like to add?',
    B1: 'Thank you. We have covered the key points. Is there anything else to confirm?',
    B2: 'Thank you. We have covered the priorities. Is there any final detail you would like to clarify?',
    C1: 'Thank you. We have covered the competing priorities and practical constraints. Is there any final nuance we should clarify?',
  } as const

  return {
    text:
      nextGoalIndex < 0
        ? closing[input.scene.level]
        : templates[input.scene.level],
    hintZh:
      nextGoalIndex < 0
        ? '本场景的关键任务已覆盖，可以结束练习或再补充一个细节。'
        : `AI 角色“${input.scene.aiRole}”正在确认：${input.scene.goals[nextGoalIndex].labelZh}。可参考关键词 “${keyword}”。`,
  }
}

export const localCoach: ConversationProvider = {
  kind: 'local',
  async nextTurn(input, signal) {
    if (signal?.aborted) throw new DOMException('Request aborted', 'AbortError')

    const { corrected, tags, explanations } = applyCorrections(
      input.learnerText,
      input.scene.level,
    )
    const completedGoalIds = findNewCompletedGoalIds(input)
    const reply = buildReply(input, completedGoalIds)
    const hasCorrection = tags.length > 0

    const result: ConversationResult = {
      reply: {
        text: reply.text,
        hintZh: reply.hintZh,
        emotion: input.turnIndex === 0 ? 'warm' : 'curious',
      },
      feedback: {
        heard: input.learnerText.trim(),
        corrected: hasCorrection ? corrected : null,
        naturalAlternative: hasCorrection ? corrected : null,
        explanationZh: hasCorrection
          ? explanations.join(' ')
          : '表达清楚自然，继续把注意力放在完成场景任务上。',
        issueTags: tags,
      },
      progress: {
        completedGoalIds,
        shouldOfferCompletion:
          completedGoalIds.length >= input.scene.goals.length ||
          input.turnIndex + 1 >= input.scene.recommendedTurns,
      },
      provider: 'local',
      degraded: true,
    }
    return result
  },
}
