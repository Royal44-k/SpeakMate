import type { GradedPack, GradedQuestion } from './dialogues/graded/schema'
import type { AnalysisEntry } from './analysis/schema'
/** Authored creation paths; never imported by a client. Review ledger is separate. */
export const microPathDefinitions: Record<string, string[]> = {
  'travel.airport.luggage': ['document', 'flight', 'bag', 'collection'],
  'travel.security.take-out': ['pace', 'laptop', 'pockets'],
  'travel.connection.connection': ['time', 'check', 'route'],
  'travel.immigration.purpose': ['purpose', 'dates', 'stay'],
  'travel.hotel.reservation': ['identity', 'dates', 'room'],
  'travel.room.air-conditioning': ['room', 'problem', 'request'],
  'coffee.word.black': ['drink', 'size', 'milk'],
  'coffee.word.receipt': ['drink', 'size', 'payment', 'receipt'],
  'coffee.phrase.to-go': ['drink', 'size', 'service'],
  'coffee.phrase.leave-out': ['drink', 'size', 'sweetener'],
  'coffee.sentence.americano': ['drink', 'size', 'service'],
  'coffee.sentence.order-number': ['drink', 'size', 'name'],
  'restaurant.word.portion': ['meal', 'portion', 'drink'],
  'restaurant.phrase.on-the-side': ['meal', 'portion', 'chilli'],
  'restaurant.sentence.no-chilli': ['meal', 'portion', 'chilli'],
  'allergy.word.ingredient': ['allergen', 'food', 'check', 'extras'],
  'allergy.phrase.allergic-to': ['allergen', 'food', 'check'],
  'allergy.sentence.peanut': ['allergen', 'food', 'check'],
  'return.word.refund': ['request', 'reason', 'policy'],
  'return.phrase.proof': ['request', 'reason', 'receipt'],
  'return.sentence.request': ['request', 'reason', 'receipt'],
  'supermarket.word.aisle': ['product', 'navigation', 'size'],
  'supermarket.phrase.unit': ['product', 'navigation', 'compare'],
  'supermarket.sentence.show': ['product', 'navigation', 'size'],
  'price.word.discount': ['item', 'budget', 'request', 'boundary'],
  'price.phrase.budget': ['item', 'budget', 'decision'],
  'price.sentence.leave': ['item', 'budget', 'decision'],
  'daily.directions.step-free': ['destination', 'access', 'format'],
  'daily.taxi.drop-off': ['destination', 'bag', 'dropoff'],
  'daily.bank.declined': ['problem', 'place', 'time'],
  'daily.parcel.parcel': ['object', 'notice', 'condition'],
  'daily.hair.trim': ['length', 'fringe', 'growth'],
  'daily.phone.estimate-first': ['fault', 'onset', 'estimate'],
  'work.introduction.responsible-for': ['role', 'focus', 'boundary'],
  'work.standup.blocker': ['done', 'plan', 'blocker'],
  'work.progress.forecast': ['status', 'evidence', 'forecast'],
  'work.deadline.trade-off': ['need', 'reason', 'tradeoff', 'impact'],
  'work.meeting.test-assumption': ['position', 'goal', 'assumption'],
  'work.interview.contributed-to': ['interest', 'experience', 'contribution'],
  'social.neighbour': ['name', 'connection', 'topic'],
  'social.keep-in-touch': ['purpose', 'area', 'contact'],
  'social.invitation': ['activity', 'invite', 'response'],
  'social.rather-not-say': ['decline', 'thanks', 'reason', 'privacy'],
  'social.see-your-point': ['position', 'reason', 'other'],
  'social.apology': ['acknowledge', 'impact', 'response', 'close'],
  'study.partner': ['name', 'experience', 'partner'],
  'study.for-example': ['focus', 'instruction', 'example', 'apply'],
  'study.role': ['role', 'product', 'absent'],
  'study.chart-sentence': ['topic', 'number', 'meaning'],
  'study.evidence': ['notice', 'meaning', 'evidence'],
  'study.work-on': ['aim', 'sample', 'priority', 'practice'],
  'emergency.label': ['need', 'label', 'history'],
  'emergency.comes-and-goes': ['feeling', 'onset', 'pattern'],
  'emergency.appointment': ['purpose', 'time', 'format'],
  'emergency.entrance-sentence': ['event', 'place', 'view'],
  'emergency.last-saw': ['item', 'last', 'time', 'uncertain'],
  'emergency.leak': ['problem', 'onset', 'pattern'],
}
const levelPathDefinitions: Record<
  string,
  Partial<Record<GradedPack['level'], string[]>>
> = {
  'study.for-example': {
    A2: ['focus', 'instruction', 'example', 'contrast', 'apply'],
  },
}
const reviewedCategories: string[] = [
  'work',
  'travel',
  'daily',
  'social',
  'study',
  'emergency',
  'dining',
]
// Five bounded micro-only targets. Ordinary source questions are never mutated.
const revisedTargets: Record<
  string,
  {
    text: string
    hintZh: string
    answers: [string, string]
    values: [string, string]
  }
> = {
  'restaurant.phrase.on-the-side.A1': {
    text: 'Chilli mixed into the pasta, or on the side?',
    hintZh: '选择辣椒另放，或拌入少量辣椒。另放不等于完全不加。',
    answers: ['Chilli on the side, please.', 'Please mix in a little chilli.'],
    values: ['separate', 'mixed'],
  },
  'restaurant.phrase.on-the-side.A2': {
    text: 'Would you like a little chilli mixed into your pasta, or served on the side?',
    hintZh: '礼貌说明辣椒另放，或在意面中加入少量辣椒。',
    answers: [
      'Could I have the chilli on the side?',
      'Could you add a little chilli to the pasta?',
    ],
    values: ['separate', 'mixed'],
  },
  'restaurant.sentence.no-chilli.B1': {
    text: 'Would you like chilli in your pasta, or would you prefer none? Tell me your preference.',
    hintZh: '说明完全不加辣椒或加入一些辣椒，并给出偏好的原因。',
    answers: [
      'I would like no chilli because I prefer the dish mild.',
      'I would like some chilli because I enjoy a little heat.',
    ],
    values: ['no', 'add'],
  },
  'restaurant.sentence.no-chilli.B2': {
    text: 'Would you like the chilli left out or a little added, while keeping the other ingredients unchanged?',
    hintZh: '明确只省略辣椒或添加少量辣椒，其他配料保持不变。',
    answers: [
      'Please leave the chilli out; the other ingredients can stay as they are.',
      'Please add a little chilli; the other ingredients can stay as they are.',
    ],
    values: ['no', 'add'],
  },
  'restaurant.sentence.no-chilli.C1': {
    text: 'How would you make clear whether chilli should be omitted or added, without suggesting changes to the rest of the dish?',
    hintZh: '强调省略的只是辣椒，或欢迎少量辣椒；不要把偏好说成改动整道菜。',
    answers: [
      'It is the chilli I would like omitted, not a request to simplify the entire dish.',
      'A small amount of chilli is welcome; I am not asking for the dish to be completely mild.',
    ],
    values: ['no', 'add'],
  },
}
function revisedTarget(
  entryId: string,
  pack: GradedPack,
): GradedQuestion | undefined {
  const material = revisedTargets[`${entryId}.${pack.level}`]
  if (!material) return undefined
  const original = pack.questions.find(
    (q) => q.id === `restaurant-order.${pack.level}.chilli`,
  )!
  const review = {
    state: 'model-reviewed' as const,
    record: `micro-practice-review.md#dining-v2: ${entryId}.${pack.level}; complete effective path review, not teacher certification`,
  }
  return {
    ...original,
    text: material.text,
    hintZh: material.hintZh,
    answers: material.answers.map((text, index) => ({
      id: original.answers[index].id,
      text,
      acceptedForms: [text],
      effects: [{ key: 'chilli', value: material.values[index] }],
      review,
    })) as GradedQuestion['answers'],
    review,
  }
}
export function buildMicroPractices(
  packs: GradedPack[],
  analyses: AnalysisEntry[],
) {
  return analyses.flatMap((entry) =>
    packs
      .filter((pack) => pack.sceneId === entry.sceneId)
      .flatMap((pack) => {
        const targets = pack.questions.filter((question) =>
          entry.questionIds
            ? entry.questionIds.includes(question.id)
            : entry.intents.includes(question.intent),
        )
        if (!targets.length) return []
        const keys =
          levelPathDefinitions[entry.id]?.[pack.level] ??
          microPathDefinitions[entry.id]
        if (!keys) throw Error('MICRO_PATH_NOT_AUTHORED')
        const questionIds = keys.map((key) => {
          const question = pack.questions.find(
            (question) => question.id.split('.').at(-1) === key,
          )
          if (!question) throw Error('MICRO_QUESTION_MISSING')
          return question.id
        })
        if (targets.some((question) => !questionIds.includes(question.id)))
          throw Error('MICRO_TARGET_MISSING')
        const targetQuestionOverride = revisedTarget(entry.id, pack)
        return [
          {
            schemaVersion: 1 as const,
            id: `micro.${entry.id}.${pack.level}`,
            ...(targetQuestionOverride
              ? { version: 2 as const, targetQuestionOverride }
              : { version: 1 as const }),
            analysisEntryId: entry.id,
            sceneId: pack.sceneId,
            level: pack.level,
            sourceContentVersion: pack.contentVersion,
            sourceVariantId: pack.variants[0].id,
            targetQuestionIds: targets.map((q) => q.id),
            questionIds,
            achievedClosing:
              'This short practice is complete. No real service or decision has been made.',
            partialClosing:
              'This short practice has ended with some goals still open. No real service or decision has been made.',
            review: {
              state: reviewedCategories.includes(pack.category)
                ? ('model-reviewed' as const)
                : ('draft' as const),
              record: `micro-practice-review.md#${targetQuestionOverride ? 'dining-v2' : pack.category}: ${pack.level} ${entry.id}; complete authored path review, not teacher certification`,
            },
          },
        ]
      }),
  )
}
