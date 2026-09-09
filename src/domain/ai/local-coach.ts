import type {
  ConversationInput,
  ConversationProvider,
  ConversationResult,
  FeedbackIssueTag,
} from './contracts'
import { guideQuestions, normalizeUtterance } from './dialogue-guide'

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
  let nextGoalIndex = input.scene.goals.findIndex(
    (goal) => !completedGoalIds.includes(goal.id),
  )
  const used = new Set([
    ...input.history.map((item) => normalizeUtterance(item.text)),
    normalizeUtterance(input.learnerText),
  ])
  let question: string | undefined
  if (nextGoalIndex >= 0) {
    for (let offset = 0; offset < input.scene.goals.length; offset++) {
      const index = (nextGoalIndex + offset) % input.scene.goals.length
      const options = guideQuestions(input.scene, index)
      const openingIndex = Math.max(
        0,
        input.scene.openingLines.indexOf(input.history[0]?.text ?? ''),
      )
      const shift = options.length ? openingIndex % options.length : 0
      question = [...options.slice(shift), ...options.slice(0, shift)].find(
        (text) => !used.has(normalizeUtterance(text)),
      )
      if (question) {
        nextGoalIndex = index
        break
      }
    }
  }
  const finished =
    nextGoalIndex < 0 ||
    input.turnIndex + 1 >= input.scene.recommendedTurns ||
    !question
  const closing = {
    A1: 'Thank you. Let us review your practice now.',
    A2: 'Thank you for practising. Let us review your conversation now.',
    B1: 'Thank you for the conversation. Let us review your expressions and choose what to practise next.',
    B2: 'Thank you for working through this situation. Let us review your expressions and identify a useful next step.',
    C1: 'Thank you for exploring this situation. Let us review how you expressed your ideas and identify opportunities to refine them further.',
  } as const

  return {
    finished,
    text: finished ? closing[input.scene.level] : question!,
    hintZh: finished
      ? '这一轮练习已结束。查看复盘后，可开启新对话继续挑战。'
      : `${completedGoalIds.includes(input.scene.goals[nextGoalIndex].id) ? '补充练习' : '下一步'}：${input.scene.goals[nextGoalIndex].labelZh}。可展开“下一句怎么说”组织自己的回应。`,
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
          : '基础规则检查未发现预设的常见问题；这不代表完整语法或发音评估。请继续回应对方的问题。',
        issueTags: tags,
      },
      progress: {
        completedGoalIds,
        shouldOfferCompletion: reply.finished,
      },
      provider: 'local',
      degraded: true,
    }
    return result
  },
}
