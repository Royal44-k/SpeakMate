import type { CefrLevel } from '@/domain/scenes/types'
import type { AnalysisKind, AnalysisEntry } from './schema'
import { gradedSceneManifest } from '@/content/dialogues/graded/manifest'
import { matchAuthoredAnalysis } from './match-authored-analysis'

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

/** Authored adapter for tests/build; clients use publicLearningAssistant instead. */
export const localLearningAssistant: LearningAssistantProvider = {
  async analyze(request) {
    const category = gradedSceneManifest.find(
      (scene) => scene.sceneId === request.sceneId,
    )?.category
    const entries =
      category === 'emergency'
        ? (await import('./emergency')).emergencyAnalysis
        : category === 'study'
          ? (await import('./study')).studyAnalysis
          : category === 'social'
            ? (await import('./social')).socialAnalysis
            : category === 'work'
              ? (await import('./work')).workAnalysis
              : category === 'daily'
                ? (await import('./daily')).dailyAnalysis
                : category === 'travel'
                  ? (await import('./travel')).travelAnalysis
                  : category === 'dining'
                    ? request.sceneId === 'dining-01'
                      ? (await import('./coffee')).coffeeAnalysis
                      : (await import('./dining')).diningAnalysis
                    : []
    return matchAuthoredAnalysis(request, entries)
  },
}
