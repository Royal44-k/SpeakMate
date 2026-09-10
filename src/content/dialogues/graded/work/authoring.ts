import type { CefrLevel } from '@/domain/scenes/types'
import { assembleQuestions, type AuthoredRow } from '../authoring'
import type { GradedPack } from '../schema'

export type Review = GradedPack['questions'][number]['review']
export const source =
  'CEFR2020 Companion Volume oral interaction pp.70–71, goal-oriented cooperation, information exchange and clarification; https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4. Design interpretation: docs/research/2026-09-09-local-learning-evidence.md. Original workplace practice, not certification.'
export type WorkScene = {
  sceneId: string
  slug: string
  situations: [string, string]
  paths: [
    Record<'short' | 'standard' | 'extended', string[]>,
    Record<'short' | 'standard' | 'extended', string[]>,
  ]
  closing: string
  partial: string
  repairs: GradedPack['repairs']
}

// Only IDs and pack metadata are assembled. Every situation, path, rationale,
// utterance and editorial decision is supplied by the scene author.
export function workPack(
  scene: WorkScene,
  level: CefrLevel,
  rationale: Omit<GradedPack['rationale'], 'sourceBasis'>,
  rows: AuthoredRow[],
  review: Review = {
    state: 'draft',
    record: 'work-review.md: variant reading pending',
  },
): GradedPack {
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
    category: 'work',
    level,
    author:
      'SpeakMate original authoring — Codex implementation agent, 2026-09-10',
    rationale: { ...rationale, sourceBasis: [source] },
    questions: assembleQuestions(
      scene.slug,
      level,
      rows,
      [source],
      'work-review.md: item reading pending',
    ),
    repairs: scene.repairs,
    variants: [
      {
        id: 'team',
        situationZh: scene.situations[0],
        modes: {
          short: mode(scene.paths[0].short),
          standard: mode(scene.paths[0].standard),
          extended: mode(scene.paths[0].extended),
        },
        review: { ...review },
      },
      {
        id: 'handover',
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
