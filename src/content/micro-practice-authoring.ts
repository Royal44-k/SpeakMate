import type { GradedPack } from './dialogues/graded/schema'
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
        return [
          {
            schemaVersion: 1 as const,
            id: `micro.${entry.id}.${pack.level}`,
            version: 1 as const,
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
              record: `micro-practice-review.md#${pack.category}: ${pack.level} ${entry.id}; complete authored path review, not teacher certification`,
            },
          },
        ]
      }),
  )
}
