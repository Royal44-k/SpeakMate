import type { GradedPack, GradedQuestion } from '../schema'
import type { CefrLevel } from '@/domain/scenes/types'

export const cefrSource =
  'https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4 — overall oral interaction pp.70–71; obtaining goods/services and clarification scales; task-design reference only, all English original.'
export type CoffeeRow = [
  key: string,
  intent: string,
  question: string,
  hintZh: string,
  firstValue: string,
  firstAnswer: string,
  secondValue: string,
  secondAnswer: string,
  review?: GradedQuestion['review'],
]
const draft = {
  state: 'draft' as const,
  record: 'coffee-pilot-review.md: awaiting item reading',
}

/** Metadata assembly only. Does not generate prose or confer review status. */
export function coffeeQuestions(
  level: CefrLevel,
  rows: CoffeeRow[],
): GradedQuestion[] {
  return rows.map(
    ([
      key,
      intent,
      text,
      hintZh,
      firstValue,
      firstAnswer,
      secondValue,
      secondAnswer,
      review = draft,
    ]) => {
      const id = `coffee.${level}.${key}`
      const answer = (slot: string, value: string, answerText: string) => ({
        id: `${id}.${slot}`,
        text: answerText,
        acceptedForms: [answerText],
        effects: [{ key, value }],
        review: { ...review },
      })
      return {
        id,
        text,
        intent,
        objective: key,
        hintZh,
        requires: [],
        answers: [
          answer('a', firstValue, firstAnswer),
          answer('b', secondValue, secondAnswer),
        ],
        sourceBasis: [cefrSource],
        review: { ...review },
      }
    },
  )
}

export function coffeePack(
  level: CefrLevel,
  rationale: GradedPack['rationale'],
  questions: GradedQuestion[],
  repairs: GradedPack['repairs'],
  variantReview: GradedQuestion['review'] = draft,
): GradedPack {
  const path = (
    keys: string[],
    achievedClosing: string,
    partialClosing: string,
  ) => ({
    questionIds: keys.map((key) => `coffee.${level}.${key}`),
    achievedClosing,
    partialClosing,
  })
  return {
    schemaVersion: 1,
    engineVersion: 1,
    contentVersion: 1,
    sceneId: 'dining-01',
    category: 'dining',
    level,
    author: 'SpeakMate original authoring — Codex model-assisted, 2026-09-09',
    rationale,
    questions,
    repairs,
    variants: [
      {
        id: 'counter',
        situationZh:
          '现场点单：美式和滴滤均有货，默认热饮、不加奶不加糖。短练确认饮品、杯型及堂食/外带；标准练加个性化和支付方式；拓展再确定收据、取餐称呼、降温及点心。只是练习，不代表真实支付或出单。',
        review: { ...variantReview },
        modes: {
          short: path(
            ['drink', 'size', 'service'],
            'Your drink, size and serving choice are noted. This practice is complete; no real order has been placed.',
            'This practice has ended with some order details still unconfirmed. No real order has been placed.',
          ),
          standard: path(
            ['drink', 'size', 'service', 'milk', 'sweetener', 'payment'],
            'Your order preferences and payment method are noted. This practice is complete; no payment has been taken.',
            'This practice has ended with some preferences still unconfirmed. No payment has been taken.',
          ),
          extended: path(
            [
              'drink',
              'size',
              'service',
              'milk',
              'sweetener',
              'payment',
              'receipt',
              'name',
              'cooling',
              'food',
            ],
            'Your order and collection preferences are noted, including temperature handling and the snack decision. This practice is complete; no real order has been placed.',
            'This practice has ended with some order or collection details still unconfirmed. No real order has been placed.',
          ),
        },
      },
      {
        id: 'planned',
        situationZh:
          '安排取餐：同一在售菜单及默认热黑咖啡；先确认饮品、堂食/外带、杯型。拓展练安排现在/稍后出杯和杯具方案，替代现场版的降温及点心，并非随机拼接。',
        review: { ...variantReview },
        modes: {
          short: path(
            ['drink', 'service', 'size'],
            'Your drink and serving arrangements are noted. This short practice is complete; no real order has been placed.',
            'This short practice has ended with serving arrangements still partly unconfirmed. No real order has been placed.',
          ),
          standard: path(
            ['drink', 'service', 'size', 'payment', 'sweetener', 'milk'],
            'Your serving arrangements, preferences and payment method are noted. This practice is complete; no payment has been taken.',
            'This practice has ended with some serving or payment preferences still unconfirmed. No payment has been taken.',
          ),
          extended: path(
            [
              'drink',
              'service',
              'size',
              'payment',
              'sweetener',
              'milk',
              'timing',
              'cup',
              'receipt',
              'name',
            ],
            'Your order, preparation time, cup choice and collection details are noted. This practice is complete; no real booking or order has been made.',
            'This practice has ended with some preparation or collection details still unconfirmed. No real booking or order has been made.',
          ),
        },
      },
    ],
  }
}
