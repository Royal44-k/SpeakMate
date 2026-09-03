import type {
  ConversationInput,
  ConversationProvider,
  ConversationResult,
  FeedbackIssueTag,
} from './contracts'

const CATEGORY_REPLIES: Record<string, string[]> = {
  travel: [
    'Welcome. May I have the name on the reservation, please?',
    'Thank you. Could I see your passport or booking confirmation?',
    'Your room is ready. Would you like to ask about breakfast or check-out?',
  ],
  dining: [
    'Of course. What would you like to order today?',
    'Would you like anything changed or left out?',
    'Is there anything else I can help you with?',
  ],
  daily: [
    'Certainly. Could you tell me a little more about what you need?',
    'I understand. What option would work best for you?',
    'That sounds clear. Shall we confirm the details?',
  ],
  work: [
    'Thanks for explaining. What outcome would you like from this discussion?',
    'What is the main reason behind your suggestion?',
    'That is helpful. How should we move forward?',
  ],
  social: [
    'Nice to meet you. What brings you here today?',
    'That sounds interesting. Could you tell me more?',
    'I enjoyed our conversation. Would you like to stay in touch?',
  ],
  study: [
    'That is a good starting point. Which part would you like to explore?',
    'What example could you use to support that idea?',
    'How would you summarize your conclusion?',
  ],
  emergency: [
    'I understand. Please tell me what happened and where you are now.',
    'Thank you. What is the most urgent detail we should record?',
    'I have the key information. Is there anything important to add?',
  ],
}

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
  const matchesKeyword = input.scene.keywords.some((keyword) =>
    normalized.includes(keyword.toLowerCase()),
  )
  const nextGoal = input.scene.goals.find(
    (goal) => !input.completedGoalIds.includes(goal.id),
  )

  if (!nextGoal || (!matchesKeyword && input.turnIndex < 2)) {
    return [...input.completedGoalIds]
  }
  return [...new Set([...input.completedGoalIds, nextGoal.id])]
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
    const replies = CATEGORY_REPLIES[input.scene.category] ?? CATEGORY_REPLIES.daily
    // The scene opening line is already on screen before the learner speaks,
    // so the first processed learner turn must advance to the next prompt.
    const reply = replies[Math.min(input.turnIndex + 1, replies.length - 1)]
    const hasCorrection = tags.length > 0

    const result: ConversationResult = {
      reply: {
        text: reply,
        hintZh: '听清问题后，用一句完整英文回应；需要时可参考下方关键词。',
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
