import type { CefrLevel } from '@/domain/scenes/types'
import type { GradedPack, GradedQuestion } from '../schema'

export const source =
  'https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4 — overall oral interaction pp.70–71; obtaining goods/services, information exchange and clarification scales. Design reference only; original English, not certification.'
export const draft = {
  state: 'draft' as const,
  record: 'dining-review.md: awaiting postdraft item reading',
}
export type Row = [
  key: string,
  intent: string,
  question: string,
  hint: string,
  valueA: string,
  answerA: string,
  valueB: string,
  answerB: string,
  review?: GradedQuestion['review'],
]
export type Scene = {
  sceneId: string
  slug: string
  situations: [string, string]
  closing: string
  partial: string
  repairs: GradedPack['repairs']
}

/** Category-local metadata only: every English string and level rationale is supplied by its author. */
export function diningPack(
  scene: Scene,
  level: CefrLevel,
  rationale: Omit<GradedPack['rationale'], 'sourceBasis'>,
  rows: Row[],
  variantReview: GradedQuestion['review'] = draft,
): GradedPack {
  const questions: GradedQuestion[] = rows.map(
    ([
      key,
      intent,
      text,
      hintZh,
      valueA,
      answerA,
      valueB,
      answerB,
      review = draft,
    ]) => {
      const id = `${scene.slug}.${level}.${key}`
      const answer = (slot: string, value: string, text: string) => ({
        id: `${id}.${slot}`,
        text,
        acceptedForms: [text],
        effects: [{ key, value }],
        review: { ...review },
      })
      return {
        id,
        intent,
        text,
        hintZh,
        objective: key,
        requires: [],
        answers: [answer('a', valueA, answerA), answer('b', valueB, answerB)],
        sourceBasis: [source],
        review: { ...review },
      }
    },
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
    category: 'dining',
    level,
    author:
      'SpeakMate original authoring — Codex implementation agent, 2026-09-09',
    rationale: { ...rationale, sourceBasis: [source] },
    questions,
    repairs: scene.repairs,
    variants: [
      {
        id: 'visit',
        situationZh: scene.situations[0],
        review: { ...variantReview },
        modes: {
          short: path([1, 2, 3]),
          standard: path([1, 2, 3, 4, 5, 6]),
          extended: path([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
        },
      },
      {
        id: 'planning',
        situationZh: scene.situations[1],
        review: { ...variantReview },
        modes: {
          short: path([1, 3, 2]),
          standard: path([1, 3, 2, 4, 5, 6]),
          extended: path([1, 3, 2, 4, 5, 6, 7, 8, 11, 12]),
        },
      },
    ],
  }
}
