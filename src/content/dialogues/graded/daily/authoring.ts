import type { CefrLevel } from '@/domain/scenes/types'
import { assembleQuestions, type AuthoredRow } from '../authoring'
import type { GradedPack } from '../schema'

export type Row = AuthoredRow
export type Review = GradedPack['questions'][number]['review']
export const source =
  'CEFR2020 Companion Volume, oral interaction pp.70–71, information exchange, obtaining goods/services and clarification scales; https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4; design interpretation in docs/research/2026-09-09-local-learning-evidence.md. Original practice, not certification.'
export type DailyScene = {
  sceneId: string
  slug: string
  situations: [string, string]
  paths: [
    { short: string[]; standard: string[]; extended: string[] },
    { short: string[]; standard: string[]; extended: string[] },
  ]
  closing: string
  partial: string
  repairs: GradedPack['repairs']
}
// Metadata assembly only. Situations, order, rationales and reading decisions are authored inputs.
export function dailyPack(
  scene: DailyScene,
  level: CefrLevel,
  rationale: Omit<GradedPack['rationale'], 'sourceBasis'>,
  rows: Row[],
  review: Review = {
    state: 'draft',
    record: 'daily-review.md: variant reading pending',
  },
): GradedPack {
  const questions = assembleQuestions(
    scene.slug,
    level,
    rows,
    [source],
    'daily-review.md: item reading pending',
  )
  const mode = (keys: string[]) => ({
    questionIds: keys.map((key) => `${scene.slug}.${level}.${key}`),
    achievedClosing: scene.closing,
    partialClosing: scene.partial,
  })
  return {
    schemaVersion: 1,
    engineVersion: 1,
    contentVersion: 1,
    sceneId: scene.sceneId,
    category: 'daily',
    level,
    author:
      'SpeakMate original authoring — Codex implementation agent, 2026-09-10',
    rationale: { ...rationale, sourceBasis: [source] },
    questions,
    repairs: scene.repairs,
    variants: [
      {
        id: 'visit',
        situationZh: scene.situations[0],
        modes: {
          short: mode(scene.paths[0].short),
          standard: mode(scene.paths[0].standard),
          extended: mode(scene.paths[0].extended),
        },
        review: { ...review },
      },
      {
        id: 'planning',
        situationZh: scene.situations[1],
        modes: {
          short: mode(scene.paths[1].short),
          standard: mode(scene.paths[1].standard),
          extended: mode(scene.paths[1].extended),
        },
        review: { ...review },
      },
    ],
  }
}
