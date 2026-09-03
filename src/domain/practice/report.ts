import type { PracticeSession, PracticeTurn } from './types'

export interface SessionReportMetric {
  score: number
  label: string
  description: string
}

export interface SessionReport {
  sessionId: string
  completionPercent: number
  metrics: {
    grammar: number
    vocabulary: number
    naturalness: number
    interaction: number
  }
  metricDetails: Record<keyof SessionReport['metrics'], SessionReportMetric>
  bestExpressions: string[]
  improvementThemes: string[]
  nextAction: string
}

function clampScore(value: number) {
  return Math.max(0, Math.min(4, Math.round(value * 10) / 10))
}

function descriptor(score: number) {
  if (score >= 3.5) return '稳定清晰'
  if (score >= 2.5) return '基本顺畅'
  if (score >= 1.5) return '正在建立'
  return '需要练习'
}

function metric(label: string, score: number, description: string): SessionReportMetric {
  return { label, score: clampScore(score), description }
}

export function buildSessionReport(
  session: PracticeSession,
  turns: PracticeTurn[],
  totalGoals: number,
): SessionReport {
  const turnCount = Math.max(1, turns.length)
  const tagCounts = new Map<string, number>()
  for (const tag of turns.flatMap((turn) => turn.feedback?.tags ?? [])) {
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
  }
  const grammarScore = 4 - ((tagCounts.get('grammar') ?? 0) / turnCount) * 2.2
  const vocabularyScore = 4 - ((tagCounts.get('vocabulary') ?? 0) / turnCount) * 2
  const naturalnessIssues = (tagCounts.get('register') ?? 0) + (tagCounts.get('clarity') ?? 0)
  const naturalnessScore = 4 - (naturalnessIssues / turnCount) * 1.7
  const completionRatio = totalGoals > 0 ? Math.min(1, session.completedGoals.length / totalGoals) : 0
  const interactionScore = completionRatio * 3.2 + Math.min(0.8, turns.length * 0.16)

  const scoreValues = {
    grammar: clampScore(grammarScore),
    vocabulary: clampScore(vocabularyScore),
    naturalness: clampScore(naturalnessScore),
    interaction: clampScore(interactionScore),
  }
  const themeLabels: Record<string, string> = {
    grammar: '句型准确度：先保证核心动词和时态清楚',
    vocabulary: '词汇选择：优先复用本场景关键词',
    register: '语气得体度：在服务与职场场景中使用更礼貌的请求',
    clarity: '表达清晰度：一句话只传达一个主要意思',
    strategy: '互动策略：回应后补一个具体细节或追问',
  }
  const improvementThemes = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([tag]) => themeLabels[tag] ?? '继续积累场景表达')

  const bestExpressions = turns
    .filter((turn) => (turn.feedback?.tags.length ?? 0) === 0)
    .map((turn) => turn.learnerText.trim())
    .filter(Boolean)
    .filter((expression, index, all) => all.indexOf(expression) === index)
    .slice(0, 3)
  if (bestExpressions.length < 3) {
    for (const turn of turns) {
      const candidate = turn.feedback?.natural?.trim()
      if (candidate && !bestExpressions.includes(candidate)) bestExpressions.push(candidate)
      if (bestExpressions.length === 3) break
    }
  }

  const weakest = Object.entries(scoreValues).sort((a, b) => a[1] - b[1])[0][0]
  const nextActions: Record<string, string> = {
    grammar: '下次先用短句说准核心动词，再补充时间和原因。',
    vocabulary: '重练本场景，并至少主动使用两个关键词。',
    naturalness: '跟读一遍收藏表达，再换成自己的信息复述。',
    interaction: '每次回答后增加一个细节或一个相关问题。',
  }

  return {
    sessionId: session.id,
    completionPercent: Math.round(completionRatio * 100),
    metrics: {
      ...scoreValues,
    },
    metricDetails: {
      grammar: metric('语法', scoreValues.grammar, descriptor(scoreValues.grammar)),
      vocabulary: metric('词汇', scoreValues.vocabulary, descriptor(scoreValues.vocabulary)),
      naturalness: metric('自然度', scoreValues.naturalness, descriptor(scoreValues.naturalness)),
      interaction: metric('互动完成度', scoreValues.interaction, descriptor(scoreValues.interaction)),
    },
    bestExpressions,
    improvementThemes,
    nextAction: nextActions[weakest],
  }
}
