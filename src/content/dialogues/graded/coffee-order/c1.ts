import { cefrSource, coffeePack, coffeeQuestions } from './authoring'

// Explicit editorial attestation after reading every listed row and both variants.
const reviewed = {
  state: 'model-reviewed' as const,
  record:
    'src/content/dialogues/graded/coffee-order/coffee-pilot-review.md#c1 — Codex implementation agent, model-assisted reading, 2026-09-09; teacher reads 0',
}

export const c1 = coffeePack(
  'C1',
  {
    canDoZh:
      '在熟悉的服务场景中精确限定偏好，澄清容易混同的概念，并以得体语气处理取舍。',
    complexityZh:
      '不是给简单句加长：区分强烈风味与刺激感、单价与实际价值、制作与交付时点、记录与报销要求。',
    scaffoldingZh:
      '保留有限选项以确保本地确定性；参考回答展示限定、重新表述与克制异议，不能代表完整 C1 能力测评。',
    registerZh: '自然但精准的口语，不用正式公文或刻意生僻词冒充高级表达。',
    sourceBasis: [cefrSource],
  },
  coffeeQuestions('C1', [
    [
      'drink',
      'order',
      'The Americano is the more assertive option; the filter coffee is subtler. What sort of flavour are you after?',
      '直接区分风味偏好和咖啡因，不推断咖啡因作用。',
      'americano',
      'The Americano sounds right. I am after a pronounced flavour, rather than choosing it for the caffeine.',
      'filter',
      'I would lean towards the filter coffee. I am after something nuanced, not necessarily something that makes an immediate impression.',
      {
        state: 'model-reviewed',
        record:
          'coffee-pilot-review.md#task-3i-polish — affected question and both answers reread with selected context by Codex implementation agent, 2026-09-11; teacher0',
      },
    ],
    [
      'size',
      'quantity',
      'The larger cup works out better per millilitre, though that may not make it better value for you. Which size would you prefer?',
      '回应对方对价值的限定，并区分单价与自身效用。',
      'small',
      'Small, please. The lower unit price is beside the point if I end up leaving half of it.',
      'large',
      'Large would actually be worthwhile in my case. I have a long break, so I am not buying more than I can enjoy.',
      reviewed,
    ],
    [
      'service',
      'serving',
      'There is space to sit in, although I cannot promise it will remain quiet. Would staying or taking it away suit you better?',
      '不把当前空位误解为未来安静保证。',
      'here',
      'I will stay. I am not expecting silence; I just need somewhere to pause between appointments.',
      'takeaway',
      'I will take it away, then. It is not the bustle itself that bothers me, but I do need to concentrate today.',
      reviewed,
    ],
    [
      'milk',
      'customize',
      'We can leave it black or soften it with oat milk. Do you have a preference, bearing in mind that the flavour will change?',
      '承认配料改变风味，精确表达优先事项。',
      'none',
      'Black, please. I would rather experience the coffee as it is, even if that means a little more bitterness.',
      'oat',
      'Oat milk would suit me. Preserving every flavour note matters less to me than having a drink I find pleasantly rounded.',
      reviewed,
    ],
    [
      'sweetener',
      'preference',
      'We can leave the sugar out or add a single portion. Are you looking to preserve the bitterness or temper it a little?',
      'temper 指适度缓和，不等于完全消除。',
      'none',
      'Leave it out, please. I am not trying to eliminate the bitterness; within reason, it is part of what I enjoy.',
      'one',
      'A single portion, please. I want to take the edge off rather than turn it into a sweet drink.',
      reviewed,
    ],
    [
      'payment',
      'payment',
      'Cash and card are equally welcome, with no surcharge either way. Do you have a preference?',
      '不凭空引入支付限制，可解释个人记账策略。',
      'cash',
      'Cash, please. It is a personal budgeting habit, rather than any objection to paying electronically.',
      'card',
      'I will use my card. Having a traceable total is useful, even though it does not replace a detailed receipt.',
      reviewed,
    ],
    [
      'receipt',
      'record',
      'An itemised receipt is available if you need one; otherwise we can avoid printing it. What would be appropriate?',
      '选择凭证不保证公司报销，区分用途与批准结果。',
      'yes',
      'Please print it. I may be able to claim the expense, but I will need the itemised record before I can check.',
      'no',
      'There is no need to print it. This is a personal purchase, so a separate itemised record would serve little purpose.',
      reviewed,
    ],
    [
      'name',
      'identify',
      'For collection, we can use a name or an order number. Which would you be more comfortable having called out?',
      '有分寸地处理隐私，不把不同偏好当成对抗。',
      'sam',
      'Sam is fine. I am comfortable using a first name here, and I will be listening for it.',
      'number',
      'An order number, please. It is a minor preference, but I would rather not have my name called across the room.',
      reviewed,
    ],
    [
      'cooling',
      'temperature',
      'We could add a little cold water for immediate drinking, at the cost of some concentration. Would that be a worthwhile trade-off?',
      'concentration 是饮品浓度；表明接受或不接受代价。',
      'water',
      'In this case, yes. I would rather enjoy it now than preserve the exact concentration and have to leave it untouched.',
      'unchanged',
      'Not for me, thanks. I can give it time to cool, so there is no real need to compromise the flavour.',
      reviewed,
    ],
    [
      'food',
      'upsell',
      'There are cookies available as an optional extra. Would one be useful, or shall we leave the order as it stands?',
      '得体接受或婉拒提议，明确是否更改订单。',
      'cookie',
      'On balance, I will add one. I may not need it immediately, but it will tide me over until a late lunch.',
      'none',
      'Let us leave it as it stands. I appreciate the suggestion, but adding food would be more out of habit than hunger.',
      reviewed,
    ],
    [
      'timing',
      'schedule',
      'We can begin now or in ten minutes; that is the preparation start, not a guaranteed collection time. Which would you prefer?',
      '明确承认开始制作与保证取餐时间不同。',
      'now',
      'Please begin now. I would rather build in a little leeway than treat the preparation time as a firm collection promise.',
      'later',
      'In ten minutes would be preferable. I understand it will take a little longer after that, and my schedule allows for it.',
      reviewed,
    ],
    [
      'cup',
      'sustainability',
      'We can fill a clean cup you have brought or provide one appropriate for your order. What would be most practical today?',
      '避免把环保立场绝对化，也不假定自带容器。',
      'own',
      'I have a clean reusable cup with me, so using that seems the sensible option without complicating the order.',
      'shop',
      'Please provide one today. I generally favour reusables, but insisting on one I have not brought would not achieve much.',
      reviewed,
    ],
  ]),
  {
    clarify: 'Of course. Let us make the outstanding choice explicit.',
    struggle:
      'There is no need to force a polished answer. Use a reviewed example, or retain your own wording for later reflection.',
    offTopic:
      'That is outside the scope of this local coffee lesson. Let us return to the detail still awaiting a decision.',
    unknown:
      'Your exact wording is retained. There is no reviewed match in this local lesson, so neither a semantic judgment nor a correction is being inferred.',
    changed:
      'The supported revision is recorded; independent decisions stand, while dependent details are reconsidered.',
    refusedClosing:
      'Understood. We will end the practice with the order incomplete, without treating that decision as successful completion.',
  },
  reviewed,
)
