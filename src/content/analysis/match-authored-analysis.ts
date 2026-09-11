import type { AnalysisRequest, AnalysisResult } from './provider'
import { analysisEntrySchema, type AnalysisEntry } from './schema'
import { normalizeAcceptedForm } from '@/content/dialogues/graded/schema'

/** The existing curated matcher, shared by authored/server and public-data adapters. */
export function matchAuthoredAnalysis(
  request: AnalysisRequest,
  catalog: readonly AnalysisEntry[],
): AnalysisResult {
  const base = {
    originalText: request.text,
    capabilities: ['save', 'note', 'self-recall'] as [
      'save',
      'note',
      'self-recall',
    ],
  }
  const entries = catalog
    .filter((entry) => entry.sceneId === request.sceneId)
    .map((entry) => analysisEntrySchema.parse(entry))
    .filter((entry) => entry.review.state === 'model-reviewed')
  if (!entries.length)
    return {
      ...base,
      status: 'unknown',
      entries: [],
      explanationZh:
        '此场景尚无已收录解析。可以保存原文、写笔记或自行回忆，不生成含义或评分。',
    }
  const normalized = normalizeAcceptedForm(request.text)
  const exact = entries.filter(
    (entry) =>
      entry.kind === request.kind &&
      entry.forms.some((form) => normalizeAcceptedForm(form) === normalized) &&
      (!request.intent || entry.intents.includes(request.intent)) &&
      (!entry.questionIds ||
        (request.questionId && entry.questionIds.includes(request.questionId))),
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
    (entry) =>
      entry.kind === 'word' &&
      entry.forms.some((form) => tokens.includes(normalizeAcceptedForm(form))),
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
}
