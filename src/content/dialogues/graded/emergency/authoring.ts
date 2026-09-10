import type { CefrLevel } from '@/domain/scenes/types'
import { assembleQuestions, type AuthoredRow } from '../authoring'
import type { GradedPack } from '../schema'

export type Review = GradedPack['questions'][number]['review']
export const sourceBasis = [
  'CEFR2020 Companion Volume: overall oral interaction pp.70–71, information exchange, obtaining goods and services, clarification; https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4. Original graded design interpreted in docs/research/2026-09-09-local-learning-evidence.md; not certification.',
  'Communication-only editorial boundaries: docs/research/2026-09-09-health-corpus-boundaries.md (2026-09-09). Official communication facts and jurisdiction limits are distinct from editorial inferences. No diagnosis, dosage, triage, safety assurance or real service.',
]
export type EmergencyScene = {
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
// Only assembles supplied metadata. Scene authors own every word, path and review decision.
export function emergencyPack(
  scene: EmergencyScene,
  level: CefrLevel,
  rationale: Omit<GradedPack['rationale'], 'sourceBasis'>,
  rows: AuthoredRow[],
  review: Review = {
    state: 'draft',
    record: 'emergency-review.md: variant reading pending',
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
    category: 'emergency',
    level,
    author:
      'SpeakMate original authoring — Codex implementation agent, 2026-09-10',
    rationale: { ...rationale, sourceBasis: [...sourceBasis] },
    questions: assembleQuestions(
      scene.slug,
      level,
      rows,
      sourceBasis,
      'emergency-review.md: item reading pending',
    ),
    repairs: scene.repairs,
    variants: [
      {
        id: 'desk',
        situationZh: scene.situations[0],
        modes: {
          short: mode(scene.paths[0].short),
          standard: mode(scene.paths[0].standard),
          extended: mode(scene.paths[0].extended),
        },
        review: { ...review },
      },
      {
        id: 'message',
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
