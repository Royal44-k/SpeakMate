import type { CefrLevel } from '@/domain/scenes/types'
import type { GradedQuestion } from './schema'

export type AuthoredRow = [
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

export function assembleQuestions(
  slug: string,
  level: CefrLevel,
  rows: AuthoredRow[],
  sourceBasis: string[],
  draftRecord: string,
): GradedQuestion[] {
  return rows.map(
    ([
      key,
      intent,
      text,
      hintZh,
      valueA,
      answerA,
      valueB,
      answerB,
      review = { state: 'draft', record: draftRecord },
    ]) => {
      const id = `${slug}.${level}.${key}`
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
        sourceBasis: [...sourceBasis],
        review: { ...review },
      }
    },
  )
}
