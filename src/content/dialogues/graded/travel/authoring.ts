import type { CefrLevel } from '@/domain/scenes/types'
import { assembleQuestions, type AuthoredRow } from '../authoring'
import type { GradedPack } from '../schema'

export const source =
  'https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4 — CEFR2020 oral interaction pp.70–71, information exchange, goods/services and clarification scales; approved local evidence note. Original task design, not certification or travel advice.'
export type Row = AuthoredRow
export type Scene = {
  sceneId: string
  slug: string
  situations: [string, string]
  paths: [number[][], number[][]]
  closing: string
  partial: string
  repairs: GradedPack['repairs']
}
export function travelPack(
  scene: Scene,
  level: CefrLevel,
  rationale: Omit<GradedPack['rationale'], 'sourceBasis'>,
  rows: Row[],
  variantReview: GradedPack['variants'][number]['review'] = {
    state: 'draft',
    record: 'travel-review.md: awaiting variant reading',
  },
): GradedPack {
  const questions = assembleQuestions(
    scene.slug,
    level,
    rows,
    [source],
    'travel-review.md: awaiting item reading',
  )
  const path = (positions: number[]) => ({
    questionIds: positions.map((i) => questions[i - 1].id),
    achievedClosing: scene.closing,
    partialClosing: scene.partial,
  })
  return {
    schemaVersion: 1,
    engineVersion: 1,
    contentVersion: 1,
    sceneId: scene.sceneId,
    category: 'travel',
    level,
    author:
      'SpeakMate original authoring — Codex implementation agent, 2026-09-09 to 2026-09-10',
    rationale: { ...rationale, sourceBasis: [source] },
    questions,
    repairs: scene.repairs,
    variants: [
      {
        id: 'counter',
        situationZh: scene.situations[0],
        modes: {
          short: path(scene.paths[0][0]),
          standard: path(scene.paths[0][1]),
          extended: path(scene.paths[0][2]),
        },
        review: { ...variantReview },
      },
      {
        id: 'assistance',
        situationZh: scene.situations[1],
        modes: {
          short: path(scene.paths[1][0]),
          standard: path(scene.paths[1][1]),
          extended: path(scene.paths[1][2]),
        },
        review: { ...variantReview },
      },
    ],
  }
}
