import type { CefrLevel } from '@/domain/scenes/types'
import { normalizeAcceptedForm } from '@/content/dialogues/graded/schema'
import {
  analysisEntrySchema,
  type AnalysisKind,
  type AnalysisEntry,
} from './schema'

export type AnalysisRequest = {
  sceneId?: string
  intent?: string
  questionId?: string
  kind: AnalysisKind
  text: string
  level: CefrLevel
}
export type AnalysisResult = {
  status: 'exact' | 'partial' | 'unknown'
  originalText: string
  entries: AnalysisEntry[]
  explanationZh: string
  capabilities: ['save', 'note', 'self-recall']
}
export interface LearningAssistantProvider {
  analyze(request: AnalysisRequest): Promise<AnalysisResult>
}

export const localLearningAssistant: LearningAssistantProvider = {
  async analyze(request) {
    const travel = [
      'travel-01',
      'travel-02',
      'travel-03',
      'travel-04',
      'travel-05',
      'travel-06',
    ].includes(request.sceneId ?? '')
    const base = {
      originalText: request.text,
      capabilities: ['save', 'note', 'self-recall'] as [
        'save',
        'note',
        'self-recall',
      ],
    }
    const remainingDining = [
      'dining-02',
      'dining-03',
      'dining-04',
      'dining-05',
      'dining-06',
    ].includes(request.sceneId ?? '')
    if (request.sceneId !== 'dining-01' && !remainingDining && !travel)
      return {
        ...base,
        status: 'unknown',
        entries: [],
        explanationZh:
          '此场景尚无已收录解析。可以保存原文、写笔记或自行回忆，不生成含义或评分。',
      }
    const catalog = travel
      ? (await import('./travel')).travelAnalysis
      : remainingDining
        ? (await import('./dining')).diningAnalysis
        : (await import('./coffee')).coffeeAnalysis
    const entries = catalog
      .filter((e) => e.sceneId === request.sceneId)
      .map((e) => analysisEntrySchema.parse(e))
      .filter((e) => e.review.state === 'model-reviewed')
    const normalized = normalizeAcceptedForm(request.text)
    const exact = entries.filter(
      (e) =>
        e.kind === request.kind &&
        e.forms.some((f) => normalizeAcceptedForm(f) === normalized) &&
        (!request.intent || e.intents.includes(request.intent)) &&
        (!e.questionIds ||
          (request.questionId && e.questionIds.includes(request.questionId))),
    )
    if (exact.length === 1)
      return {
        ...base,
        status: 'exact',
        entries: exact,
        explanationZh:
          '已匹配本场景的已编写条目；仅解释该情境用法，不是通用语义判定或能力评分。',
      }
    const tokens = normalized.split(/[^a-z'-]+/u)
    const partial = entries.filter(
      (e) =>
        e.kind === 'word' &&
        e.forms.some((f) => tokens.includes(normalizeAcceptedForm(f))),
    )
    return partial.length
      ? {
          ...base,
          status: 'partial',
          entries: partial,
          explanationZh:
            '仅找到部分单词的本场景情境义，不代表整句解析正确，也不确认该句中这些词的实际含义。',
        }
      : {
          ...base,
          status: 'unknown',
          entries: [],
          explanationZh:
            '本地未收录可靠匹配。保留原文，可以保存、记笔记和自行回忆，不编造语法纠正。',
        }
  },
}
