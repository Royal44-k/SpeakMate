import type { CefrLevel } from '@/domain/scenes/types'
import { assembleQuestions, type AuthoredRow } from '../authoring'
import type { GradedPack } from '../schema'

export type Review = GradedPack['questions'][number]['review']
export const source =
  'CEFR2020 Companion Volume, overall oral interaction and conversation pp.70–71; https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4. Design interpretation: docs/research/2026-09-09-local-learning-evidence.md. Original social practice, not certification.'
export type SocialScene = {
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

// Metadata only: scenes supply all prose, explicit paths and editorial records.
export function socialPack(
  scene: SocialScene,
  level: CefrLevel,
  rationale: Omit<GradedPack['rationale'], 'sourceBasis'>,
  rows: AuthoredRow[],
  review: Review = {
    state: 'draft',
    record: 'social-review.md: reading pending',
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
    category: 'social',
    level,
    author:
      'SpeakMate original authoring — Codex implementation agent, 2026-09-10',
    rationale: { ...rationale, sourceBasis: [source] },
    questions: assembleQuestions(
      scene.slug,
      level,
      rows,
      [source],
      'social-review.md: item reading pending',
    ),
    repairs: scene.repairs,
    variants: [
      {
        id: 'conversation',
        situationZh: scene.situations[0],
        modes: {
          short: mode(scene.paths[0].short),
          standard: mode(scene.paths[0].standard),
          extended: mode(scene.paths[0].extended),
        },
        review: { ...review },
      },
      {
        id: 'consideration',
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
