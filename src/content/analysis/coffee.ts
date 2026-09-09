import type { AnalysisEntry } from './schema'

const sourceBasis = [
  'Original contextual language notes; task-level design: CEFR 2020 Companion Volume, overall oral interaction pp.70–71, https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4. Not a copied dictionary definition or CEFR certification.',
]
const review = {
  state: 'model-reviewed' as const,
  record:
    'src/content/dialogues/graded/coffee-order/coffee-pilot-review.md#analysis — six entries and all 30 example/substitution pairs; Codex implementation agent, model-assisted reading 2026-09-09; human teacher count 0',
}

export const coffeeAnalysis: AnalysisEntry[] = [
  {
    id: 'coffee.word.black',
    contentVersion: 1,
    kind: 'word',
    forms: ['black'],
    sceneId: 'dining-01',
    intents: ['order', 'customize'],
    meaningZh:
      '咖啡点单中指不加奶的；并不自动表示不加糖。这是情境义，不是 black 的全部词义。',
    grammarZh:
      '可作前置形容词 black coffee，也可接在 have / take / keep + 宾语之后：I take my coffee black.',
    registerZh: '日常柜台用语，中性、简洁；加 please 更礼貌。',
    errorsZh:
      'black 不等于无糖；也不能把 black tea 中的 black 按咖啡点单义解释。涉及配料时应分别确认。',
    examples: [
      {
        level: 'A1',
        text: 'Black coffee, please.',
        substitution: 'Coffee with oat milk, please.',
      },
      {
        level: 'A2',
        text: 'I usually have my coffee black.',
        substitution: 'I usually have milk in my coffee.',
      },
      {
        level: 'B1',
        text: 'Please keep it black so I can taste the coffee itself.',
        substitution: 'Please add oat milk to soften the taste.',
      },
      {
        level: 'B2',
        text: 'I prefer it black, although I sometimes add sugar.',
        substitution: 'I prefer it with milk, but without sugar.',
      },
      {
        level: 'C1',
        text: 'By black, I mean without milk; I have not decided about sugar yet.',
        substitution:
          'I would like milk, but that does not mean I want it sweetened.',
      },
    ],
    sourceBasis,
    review,
  },
  {
    id: 'coffee.word.receipt',
    contentVersion: 1,
    kind: 'word',
    forms: ['receipt', 'a receipt'],
    sceneId: 'dining-01',
    intents: ['record', 'payment', 'order'],
    meaningZh:
      '这里指购买后用于记录交易的收据；要求收据不表示已经付款，也不保证费用可报销。',
    grammarZh:
      '可数名词，单数常说 a receipt；常见搭配 ask for / keep / print a receipt，明细收据为 an itemised receipt。',
    registerZh: '中性服务用语，可用于消费记录和工作报销场景。',
    errorsZh:
      '不要与 recipe（食谱）混淆；付款前要求的账单常用 bill，receipt 通常记录已发生的交易。',
    examples: [
      {
        level: 'A1',
        text: 'A receipt, please.',
        substitution: 'No receipt, thank you.',
      },
      {
        level: 'A2',
        text: 'Could I have a paper receipt?',
        substitution: 'Could you print a receipt for me?',
      },
      {
        level: 'B1',
        text: 'I need to keep the receipt for my records.',
        substitution: 'I do not need a receipt for this purchase.',
      },
      {
        level: 'B2',
        text: 'Please give me an itemised receipt rather than just the card slip.',
        substitution:
          'A record of the total is enough; I do not need the itemised receipt.',
      },
      {
        level: 'C1',
        text: 'I will keep the receipt, although reimbursement is by no means certain.',
        substitution:
          'Having a receipt documents the purchase; it does not guarantee reimbursement.',
      },
    ],
    sourceBasis,
    review,
  },
  {
    id: 'coffee.phrase.to-go',
    contentVersion: 1,
    kind: 'phrase',
    forms: ['to go'],
    sceneId: 'dining-01',
    intents: ['order', 'serving'],
    meaningZh:
      '在点餐中指外带，与 for here（堂食）相对；这里不是表示目的的“去做某事”。',
    grammarZh:
      '可跟在餐饮名词后：a coffee to go；也可作柜台问题的简短回应：To go, please.',
    registerZh:
      '北美餐饮口语常见；英国也常用 takeaway 或 to take away。并非所有含 go 的句子都属于该结构。',
    errorsZh: '不要把 I have to go（我得走了）解析为外带；这是不同结构。',
    examples: [
      {
        level: 'A1',
        text: 'To go, please.',
        substitution: 'For here, please.',
      },
      {
        level: 'A2',
        text: 'Can I have a coffee to go?',
        substitution: 'Can I have a coffee to take away?',
      },
      {
        level: 'B1',
        text: 'I will get it to go because my break is nearly over.',
        substitution: 'I will stay here because I still have some time.',
      },
      {
        level: 'B2',
        text: 'I would like it to go, even though there are seats available.',
        substitution:
          'I will take it away rather than wait for a quieter table.',
      },
      {
        level: 'C1',
        text: 'To go would be more practical; it is not a reflection on the café itself.',
        substitution:
          'I would prefer to take it away, purely because of my schedule.',
      },
    ],
    sourceBasis,
    review,
  },
  {
    id: 'coffee.phrase.leave-out',
    contentVersion: 1,
    kind: 'phrase',
    forms: ['leave it out', 'leave out'],
    sceneId: 'dining-01',
    intents: ['preference', 'customize'],
    questionIds: [
      'coffee.A1.sweetener',
      'coffee.A2.sweetener',
      'coffee.B1.sweetener',
      'coffee.B2.sweetener',
      'coffee.C1.sweetener',
    ],
    meaningZh:
      '在谈配料时表示不加入或省略某项。it 必须由上下文明确指向某种配料。',
    grammarZh:
      'leave out 是可分短语动词；名词可说 leave out the sugar 或 leave the sugar out，代词须放中间：leave it out。',
    registerZh: '日常请求可说 Please leave it out；单独命令式可能显得生硬。',
    errorsZh:
      '不能说 leave out it；缺少配料上下文时不能据此判断省略的是糖、奶还是别的东西。',
    examples: [
      {
        level: 'A1',
        text: 'No sugar, please.',
        substitution: 'No milk, please.',
      },
      {
        level: 'A2',
        text: 'Please leave out the sugar.',
        substitution: 'Please leave the sugar out.',
      },
      {
        level: 'B1',
        text: 'If you have not added the sugar yet, please leave it out.',
        substitution:
          'Please do not add sugar if the drink is still being prepared.',
      },
      {
        level: 'B2',
        text: 'I would prefer you to leave the sugar out so I can adjust it myself.',
        substitution:
          'Could you serve the sugar separately instead of adding it?',
      },
      {
        level: 'C1',
        text: 'When I said to leave it out, I was referring to the sugar, not the milk.',
        substitution:
          'To clarify, it is the sugar I would like omitted; the milk is fine.',
      },
    ],
    sourceBasis,
    review,
  },
  {
    id: 'coffee.sentence.americano',
    contentVersion: 1,
    kind: 'sentence',
    forms: ['An Americano, please.'],
    sceneId: 'dining-01',
    intents: ['order'],
    meaningZh:
      '回应店员点单问题：“请给我一杯美式咖啡。”数量一杯由单数冠词表达，杯型、奶糖及堂食外带尚未说明。',
    grammarZh:
      '柜台情境允许名词短语作完整交际回应，不必因没有主语和动词而判为语法错误。Americano 以元音音素开头，用 an。',
    registerZh: '简洁礼貌的服务请求；please 在这里不是道歉。',
    errorsZh:
      '不要改成 a Americano；也不能从这句话推出“小杯”“无糖”或“已付款”。',
    examples: [
      {
        level: 'A1',
        text: 'An Americano, please.',
        substitution: 'A filter coffee, please.',
      },
      {
        level: 'A2',
        text: 'I would like an Americano, please.',
        substitution: 'Could I have a filter coffee, please?',
      },
      {
        level: 'B1',
        text: 'I will have an Americano because I would like a stronger flavour.',
        substitution:
          'I will choose filter coffee because I prefer a gentler taste.',
      },
      {
        level: 'B2',
        text: 'I would go for the Americano, provided it is the bolder of the two.',
        substitution:
          'I would prefer the filter coffee if its flavour is more delicate.',
      },
      {
        level: 'C1',
        text: 'The Americano would suit me, though it is intensity of flavour I am after, not a caffeine boost.',
        substitution:
          'The filter coffee sounds more appealing; subtlety matters more to me than intensity.',
      },
    ],
    sourceBasis,
    review,
  },
  {
    id: 'coffee.sentence.order-number',
    contentVersion: 1,
    kind: 'sentence',
    forms: ['Could you call my order number instead, please?'],
    sceneId: 'dining-01',
    intents: ['identify'],
    questionIds: [
      'coffee.A1.name',
      'coffee.A2.name',
      'coffee.B1.name',
      'coffee.B2.name',
      'coffee.C1.name',
    ],
    meaningZh:
      '在店员询问取餐名时，礼貌请求改叫订单号码。instead 的替代对象是前文提出的姓名。',
    grammarZh:
      'Could you + 动词原形构成礼貌请求；call 在这里指叫出号码，不是打电话。instead 作副词说明替代做法。',
    registerZh: '合作、温和地表达隐私或识别偏好，不需要详细解释个人原因。',
    errorsZh:
      '不要把 could 当成过去已完成的动作；缺少取餐上下文时，call 也可能有别的含义。',
    examples: [
      {
        level: 'A1',
        text: 'The order number, please.',
        substitution: 'Sam, please.',
      },
      {
        level: 'A2',
        text: 'Could you call my order number instead, please?',
        substitution: 'Could you use my first name, please?',
      },
      {
        level: 'B1',
        text: 'Please call the number because I may not hear my name clearly.',
        substitution: 'Please call Sam; I will be listening for that name.',
      },
      {
        level: 'B2',
        text: 'An order number would help avoid confusion with another customer.',
        substitution:
          'A first name should be enough if I wait near the counter.',
      },
      {
        level: 'C1',
        text: 'I would rather use the order number; it is simply a privacy preference.',
        substitution: 'Using Sam is fine, provided you only need a first name.',
      },
    ],
    sourceBasis,
    review,
  },
]
