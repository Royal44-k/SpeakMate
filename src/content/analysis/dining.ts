import type { AnalysisEntry } from './schema'
import { source } from '@/content/dialogues/graded/dining/authoring'

// Explicit annotation after all15 entries/75examples/75substitutions were read.
const reviewed = {
  state: 'model-reviewed' as const,
  record:
    'src/content/dialogues/graded/dining/dining-review.md#analysis — Codex implementation agent; postdraft model-assisted reading 2026-09-09; teacher0',
}
const sourceBasis = [source]
export const diningAnalysis: AnalysisEntry[] = [
  {
    id: 'restaurant.word.portion',
    sceneId: 'dining-02',
    contentVersion: 1,
    kind: 'word',
    forms: ['portion', 'a portion'],
    intents: ['quantity'],
    meaningZh: '这里指一人份或一份食物的份量，不是整个菜谱的产量。',
    grammarZh:
      '可数名词：a small portion、two portions；portion of + 食物说明一份什么。',
    registerZh: '中性餐厅用语；询问份量不必涉及体重或健康。',
    errorsZh:
      'portion 与 proportion（比例）不同；small portion 不自动说明热量或营养。',
    examples: [
      {
        level: 'A1',
        text: 'A small portion, please.',
        substitution: 'A regular portion, please.',
      },
      {
        level: 'A2',
        text: 'A small portion is enough for lunch.',
        substitution: 'I would like a regular portion today.',
      },
      {
        level: 'B1',
        text: 'I would prefer a small portion because I am eating again later.',
        substitution: 'A regular portion would suit me because I missed lunch.',
      },
      {
        level: 'B2',
        text: 'A smaller portion would help me avoid ordering more than I can finish.',
        substitution:
          'I would choose a regular portion so I am less likely to need another dish afterwards.',
      },
      {
        level: 'C1',
        text: 'The smaller portion is a practical preference, not a request to alter the recipe.',
        substitution:
          'I would keep the regular portion but leave the recipe unchanged.',
      },
    ],
    sourceBasis,
    review: reviewed,
  },
  {
    id: 'restaurant.phrase.on-the-side',
    sceneId: 'dining-02',
    contentVersion: 1,
    kind: 'phrase',
    forms: ['on the side'],
    intents: ['customize'],
    meaningZh: '此处指配料单独盛放，而不是混进主菜。',
    grammarZh: '常用 serve + 配料 + on the side；on the side 是方式/位置短语。',
    registerZh: '自然餐厅请求，可以用 Could I have ... on the side?。',
    errorsZh:
      '不等同于 a side salad（配菜沙拉），也不能据此保证未发生配料接触。',
    examples: [
      {
        level: 'A1',
        text: 'Chilli on the side, please.',
        substitution: 'No chilli, please.',
      },
      {
        level: 'A2',
        text: 'Could I have the chilli on the side?',
        substitution: 'Could you add a little chilli to the pasta?',
      },
      {
        level: 'B1',
        text: 'Please serve the chilli on the side so I can add it myself.',
        substitution: 'Please mix in a little chilli before serving.',
      },
      {
        level: 'B2',
        text: 'Having chilli on the side would let me adjust the heat gradually.',
        substitution:
          'A little chilli mixed in would be fine; I do not need exact control.',
      },
      {
        level: 'C1',
        text: 'By on the side, I mean served separately, not left out altogether.',
        substitution:
          'To clarify, I want the chilli omitted, not merely served separately.',
      },
    ],
    sourceBasis,
    review: reviewed,
  },
  {
    id: 'restaurant.sentence.no-chilli',
    sceneId: 'dining-02',
    contentVersion: 1,
    kind: 'sentence',
    forms: ['No chilli, please.'],
    intents: ['customize'],
    meaningZh: '礼貌要求不加辣椒；没有表示不加其他配料，也没有声明过敏。',
    grammarZh:
      'No + 名词的简短否定请求，在点餐情境可独立成句；please 缓和语气。',
    registerZh: '直接而礼貌，适合初级学习者在明确加料问题后回答。',
    errorsZh:
      '不是“I do not like all food”；不能从拒绝辣椒推断奶、糖或其他选择。',
    examples: [
      {
        level: 'A1',
        text: 'No chilli, please.',
        substitution: 'A little chilli, please.',
      },
      {
        level: 'A2',
        text: 'Please do not add chilli to the pasta.',
        substitution: 'Please add a little chilli to my pasta.',
      },
      {
        level: 'B1',
        text: 'I would like no chilli because I prefer the dish mild.',
        substitution: 'I would like some chilli because I enjoy a little heat.',
      },
      {
        level: 'B2',
        text: 'Please leave the chilli out; the other ingredients can stay as they are.',
        substitution: 'Please serve the chilli separately rather than omit it.',
      },
      {
        level: 'C1',
        text: 'It is the chilli I would like omitted, not a request to simplify the entire dish.',
        substitution:
          'A small amount of chilli is welcome; I am not asking for the dish to be completely mild.',
      },
    ],
    sourceBasis,
    review: reviewed,
  },
  {
    id: 'allergy.word.ingredient',
    sceneId: 'dining-03',
    contentVersion: 1,
    kind: 'word',
    forms: ['ingredient', 'ingredients'],
    intents: ['request', 'scope'],
    meaningZh:
      '配料，指制作食品使用的组成材料；列出配料与检查制作过程是不同的信息。',
    grammarZh:
      '可数名词；one ingredient、a list of ingredients，作复合名词定语常用单数 ingredient list。',
    registerZh: '中性询问信息，不是医学判断。',
    errorsZh:
      '不能把 ingredient list 当作食品适合某人的证明，也不能假定配料名已涵盖所有制作过程。',
    examples: [
      {
        level: 'A1',
        text: 'The ingredient list, please.',
        substitution: 'Please ask the chef.',
      },
      {
        level: 'A2',
        text: 'Could I read the ingredients before I order?',
        substitution: 'Could you ask about the recipe before I decide?',
      },
      {
        level: 'B1',
        text: 'The menu name does not tell me all the ingredients.',
        substitution:
          'I need more detail than the short menu description provides.',
      },
      {
        level: 'B2',
        text: 'The ingredient list would be a starting point, not the end of the enquiry.',
        substitution:
          'Preparation would still need discussion even after reading the ingredients.',
      },
      {
        level: 'C1',
        text: 'Knowing the ingredients does not by itself establish how the food was prepared.',
        substitution:
          'I would keep the ingredient enquiry separate from questions about shared equipment.',
      },
    ],
    sourceBasis,
    review: reviewed,
  },
  {
    id: 'allergy.phrase.allergic-to',
    sceneId: 'dining-03',
    contentVersion: 1,
    kind: 'phrase',
    forms: ['allergic to'],
    intents: ['disclose'],
    meaningZh: '对某物过敏；此条只解释表达方式，不评估或确认用户是否过敏。',
    grammarZh:
      'be + allergic + to + 名词；例如 allergic to peanuts。allergy 是名词，allergic 是形容词。',
    registerZh: '需要准确说明的信息，不宜用来替代普通的不喜欢。',
    errorsZh:
      '通常说 allergic to，不说 allergic with；表达本身不给出严重程度或处置方法。',
    examples: [
      {
        level: 'A1',
        text: 'I am allergic to peanuts.',
        substitution: 'I am allergic to sesame.',
      },
      {
        level: 'A2',
        text: 'I am allergic to sesame, so I need to ask about the food.',
        substitution: 'I have a sesame allergy and need some information.',
      },
      {
        level: 'B1',
        text: 'Please tell the kitchen I am allergic to peanuts, not simply avoiding their taste.',
        substitution:
          'Please record my peanut allergy rather than a general food preference.',
      },
      {
        level: 'B2',
        text: 'Being allergic to sesame is the point I need recorded accurately.',
        substitution:
          'Please distinguish a sesame allergy from a dislike of sesame.',
      },
      {
        level: 'C1',
        text: 'When I say allergic to peanuts, I am explaining why I am asking, not inviting you to infer a medical history.',
        substitution:
          'Please keep the note focused on the allergy I have stated, without adding assumptions.',
      },
    ],
    sourceBasis,
    review: reviewed,
  },
  {
    id: 'allergy.sentence.peanut',
    sceneId: 'dining-03',
    contentVersion: 1,
    kind: 'sentence',
    forms: ['I have a peanut allergy.'],
    intents: ['disclose'],
    meaningZh: '我对花生过敏；表达者在说明情况，系统并非根据此句进行诊断。',
    grammarZh:
      'have + a/an + 名词短语；peanut 作定语用单数，allergy 为单数可数名词。',
    registerZh: '直接说明，可作为向工作人员提问前的背景。',
    errorsZh:
      '不要遗漏单数 allergy 前的 a；不能从此句推出某食品不含花生或适合食用。',
    examples: [
      {
        level: 'A1',
        text: 'I have a peanut allergy.',
        substitution: 'I have a sesame allergy.',
      },
      {
        level: 'A2',
        text: 'I have a peanut allergy and need to check the ingredients.',
        substitution: 'I have a sesame allergy, so could we ask the chef?',
      },
      {
        level: 'B1',
        text: 'Please mention my peanut allergy when you pass on the questions.',
        substitution:
          'Please make sure the kitchen understands that I have a sesame allergy.',
      },
      {
        level: 'B2',
        text: 'The note should state a peanut allergy rather than a dietary preference.',
        substitution:
          'A vague note about preferences would not reflect the sesame allergy I mentioned.',
      },
      {
        level: 'C1',
        text: 'Please retain the specific wording peanut allergy so the message is not weakened in passing it on.',
        substitution:
          'Please preserve the reference to a sesame allergy rather than replace it with a broad summary.',
      },
    ],
    sourceBasis,
    review: reviewed,
  },
  {
    id: 'return.word.refund',
    sceneId: 'dining-04',
    contentVersion: 1,
    kind: 'word',
    forms: ['refund', 'a refund'],
    intents: ['remedy', 'clarify'],
    meaningZh: '退还款项；本场景只提出虚构商店退款申请，并未真的退钱。',
    grammarZh:
      '可作名词 request/get a refund，也可作动词 refund the payment；a refund to the original card 表示退款去向。',
    registerZh: '中性服务词，不需要用要求权利的语气。',
    errorsZh:
      'refund 不是 exchange（换货）；提出请求不等于已经获批，更不是所有商店通用规则。',
    examples: [
      {
        level: 'A1',
        text: 'A refund, please.',
        substitution: 'An exchange, please.',
      },
      {
        level: 'A2',
        text: 'I would like to request a refund.',
        substitution: 'I would like to request an exchange.',
      },
      {
        level: 'B1',
        text: 'I am asking for a refund to the original card under this example policy.',
        substitution:
          'I would prefer a same-price exchange under the example policy.',
      },
      {
        level: 'B2',
        text: 'A refund would suit my situation better than replacing the item.',
        substitution:
          'An exchange would be more useful to me than reversing the purchase.',
      },
      {
        level: 'C1',
        text: 'The request for a refund should not be recorded as an approved repayment.',
        substitution:
          'Please distinguish the requested exchange from one that has actually been carried out.',
      },
    ],
    sourceBasis,
    review: reviewed,
  },
  {
    id: 'return.phrase.proof',
    sceneId: 'dining-04',
    contentVersion: 1,
    kind: 'phrase',
    forms: ['proof of purchase'],
    intents: ['evidence'],
    meaningZh: '购买凭证，场景中指纸质或电子收据，用于核对该笔购买。',
    grammarZh:
      'proof 在此通常不可数，常用 provide/show proof of purchase；不是 a proof of purchase 的机械逐字表达。',
    registerZh: '柜台服务中常用的略正式表达。',
    errorsZh:
      '凭证只支持相关购买信息，不自动证明退换条件全满足；不要提供无关手机或账户资料。',
    examples: [
      {
        level: 'A1',
        text: 'Here is my receipt.',
        substitution: 'I have a digital receipt.',
      },
      {
        level: 'A2',
        text: 'I can show proof of purchase on my phone.',
        substitution: 'I brought a paper receipt as proof of purchase.',
      },
      {
        level: 'B1',
        text: 'This receipt is my proof of purchase for the mug.',
        substitution:
          'The digital receipt shows the purchase we are discussing.',
      },
      {
        level: 'B2',
        text: 'I can provide proof of purchase without displaying unrelated transactions.',
        substitution: 'Please keep the receipt check confined to this item.',
      },
      {
        level: 'C1',
        text: 'Proof of purchase establishes the transaction; it does not remove the separate condition check.',
        substitution:
          'The receipt supports the purchase details, while the inspection remains a distinct step.',
      },
    ],
    sourceBasis,
    review: reviewed,
  },
  {
    id: 'return.sentence.request',
    sceneId: 'dining-04',
    contentVersion: 1,
    kind: 'sentence',
    forms: ['A refund, please.'],
    intents: ['remedy'],
    meaningZh:
      '礼貌申请退款，回答“退款还是换货”；并未确认退款方式、日期或审批结果。',
    grammarZh:
      '名词短语可在明确服务问题后充当完整回应；单数可数名词 refund 前用 a。',
    registerZh: '简洁请求而非命令，please 增添礼貌。',
    errorsZh:
      '不能因为选中了此示例就称钱已到账；也不应将所有含 refund 的自由句都视为这个请求。',
    examples: [
      {
        level: 'A1',
        text: 'A refund, please.',
        substitution: 'An exchange, please.',
      },
      {
        level: 'A2',
        text: 'Could I request a refund to my original card?',
        substitution: 'Could I request an exchange for a same-price mug?',
      },
      {
        level: 'B1',
        text: 'I would prefer a refund because a replacement would not be useful to me.',
        substitution:
          'I would prefer an exchange because I still need a different mug.',
      },
      {
        level: 'B2',
        text: 'I am requesting a refund while recognising that the shop still needs to check the item.',
        substitution:
          'I am requesting an exchange, not assuming it has already been authorised.',
      },
      {
        level: 'C1',
        text: 'Please record a preference for a refund, keeping the request distinct from any eventual approval.',
        substitution:
          'Please note my preference for an exchange without treating it as a completed transaction.',
      },
    ],
    sourceBasis,
    review: reviewed,
  },
  {
    id: 'supermarket.word.aisle',
    sceneId: 'dining-05',
    contentVersion: 1,
    kind: 'word',
    forms: ['aisle', 'an aisle'],
    intents: ['navigate', 'find'],
    meaningZh: '超市货架之间供人通行的通道；此处两种干货在3号通道。',
    grammarZh:
      '可数名词，常说 in aisle three、down the aisle；aisle 以元音音素开头，所以 an aisle。',
    registerZh: '常见店内指路词。',
    errorsZh:
      '不要与 island（岛）混淆；不能由别的店铺或场景的通道号推断当前位置。',
    examples: [
      {
        level: 'A1',
        text: 'It is in aisle three.',
        substitution: 'Please show me aisle three.',
      },
      {
        level: 'A2',
        text: 'Could you show me where aisle three is?',
        substitution: 'Could you mark aisle three on the map?',
      },
      {
        level: 'B1',
        text: 'I think I walked past the right aisle without noticing the sign.',
        substitution:
          'I would like directions because I have missed the section once.',
      },
      {
        level: 'B2',
        text: 'A map of the aisles would help me find the section on later visits.',
        substitution: 'Being shown the aisle would save time on this visit.',
      },
      {
        level: 'C1',
        text: 'I need help locating the aisle, not deciding which product to buy once I reach it.',
        substitution:
          'The location is clear; it is the range of products that I still need to compare.',
      },
    ],
    sourceBasis,
    review: reviewed,
  },
  {
    id: 'supermarket.phrase.unit',
    sceneId: 'dining-05',
    contentVersion: 1,
    kind: 'phrase',
    forms: ['price per kilo'],
    intents: ['compare'],
    meaningZh: '每千克价格，便于在同一单位基础上比较不同大小的包装。',
    grammarZh: 'per + 单数计量名词，如 per kilo；kilo 是 kilogram 的日常简写。',
    registerZh: '常见购物比价表达，不自动判断什么对某个人最划算。',
    errorsZh:
      '单价与整袋价格不同；低单价不保证当次总支出较低，也不能假定大袋单价一定低。',
    examples: [
      {
        level: 'A1',
        text: 'The price per kilo, please.',
        substitution: 'The price per bag, please.',
      },
      {
        level: 'A2',
        text: 'Let us compare the price per kilo.',
        substitution: 'Let us check the cost of one bag.',
      },
      {
        level: 'B1',
        text: 'The price per kilo helps me compare different pack sizes.',
        substitution: 'The bag price tells me what I would pay today.',
      },
      {
        level: 'B2',
        text: 'A unit-price comparison is useful only if the figures use the same weight unit.',
        substitution:
          'Comparing bag prices alone does not account for different amounts inside.',
      },
      {
        level: 'C1',
        text: 'A lower price per kilo may still involve more upfront spending than I intend.',
        substitution:
          'I would separate the question of unit value from the amount leaving my budget today.',
      },
    ],
    sourceBasis,
    review: reviewed,
  },
  {
    id: 'supermarket.sentence.show',
    sceneId: 'dining-05',
    contentVersion: 1,
    kind: 'sentence',
    forms: ['Please show me.'],
    intents: ['navigate'],
    questionIds: ['supermarket-help.A1.navigation'],
    meaningZh:
      '在店员询问地图还是带路之后，请对方指给自己看/带自己找；目标由当前通道问题给出。',
    grammarZh:
      'Please + 动词原形构成礼貌祈使句；show 的接收对象用宾格 me。上下文省略了展示或带去的目标。',
    registerZh: '初级学习者可使用的简短求助句。',
    errorsZh:
      '缺少当前导航问题不能猜测 show 什么；不是通用翻译或自动确认为导航请求。',
    examples: [
      { level: 'A1', text: 'Please show me.', substitution: 'A map, please.' },
      {
        level: 'A2',
        text: 'Could you show me where the aisle is?',
        substitution: 'Could you give me a map of the shop?',
      },
      {
        level: 'B1',
        text: 'I would prefer to be shown because I missed the aisle once.',
        substitution: 'A map should be enough for me to find the section.',
      },
      {
        level: 'B2',
        text: 'Being shown would save time after my unsuccessful attempt to locate the shelf.',
        substitution:
          'Directions on a map would let me learn the layout independently.',
      },
      {
        level: 'C1',
        text: 'A brief demonstration of the route would be more useful than another general description.',
        substitution:
          'A marked route would give me sufficient guidance without taking you away from your work.',
      },
    ],
    sourceBasis,
    review: reviewed,
  },
  {
    id: 'price.word.discount',
    sceneId: 'dining-06',
    contentVersion: 1,
    kind: 'word',
    forms: ['discount', 'a discount'],
    intents: ['negotiate', 'respect-refusal'],
    meaningZh:
      '折扣或减价；询问折扣不表示对方必须让价。此虚构店的标价无进一步折扣。',
    grammarZh:
      '名词常搭配 ask for/offer a discount、a discount on an item；further discount 表示再优惠。',
    registerZh: '中性商业交流，拒绝后可换比较策略或不买。',
    errorsZh:
      '英文10% discount 是减去10%，不等同于中文“打一折”；本条不提供真实价格或交易建议。',
    examples: [
      {
        level: 'A1',
        text: 'Is there a discount?',
        substitution: 'The listed price is clear, thanks.',
      },
      {
        level: 'A2',
        text: 'Is there any further discount on this tote?',
        substitution: 'I understand there is no further discount.',
      },
      {
        level: 'B1',
        text: 'I would ask once about a discount and accept a clear refusal.',
        substitution:
          'I would compare the listed prices without requesting a reduction.',
      },
      {
        level: 'B2',
        text: 'A discount would be welcome, but I would not treat it as an entitlement.',
        substitution:
          'If the price is final, I would assess the alternatives rather than keep bargaining.',
      },
      {
        level: 'C1',
        text: 'Once the discount question is closed, repackaging the same request would not make the exchange more constructive.',
        substitution:
          'I would acknowledge the boundary and decide whether the listed offer meets my needs.',
      },
    ],
    sourceBasis,
    review: reviewed,
  },
  {
    id: 'price.phrase.budget',
    sceneId: 'dining-06',
    contentVersion: 1,
    kind: 'phrase',
    forms: ['within my budget'],
    intents: ['budget', 'decision'],
    meaningZh:
      '在自己的预算范围内；这里预算上限包括所选附加费用，不是已经核实总额。',
    grammarZh:
      'within + 名词短语表示范围内；keep the total within my budget。反义可用 over my budget。',
    registerZh: '礼貌说明限制，无须透露账户余额或收入。',
    errorsZh:
      '不说 within to my budget；较低单价不能保证整笔购买 within budget。',
    examples: [
      {
        level: 'A1',
        text: 'My budget is twenty pounds.',
        substitution: 'My budget is eighteen pounds.',
      },
      {
        level: 'A2',
        text: 'I need to stay within my budget.',
        substitution: 'I cannot spend more than my limit.',
      },
      {
        level: 'B1',
        text: 'Please include wrapping when checking whether the total is within my budget.',
        substitution:
          'I would leave out wrapping if it took the total over my budget.',
      },
      {
        level: 'B2',
        text: 'A purchase must fit within my budget as a whole, not merely have an attractive base price.',
        substitution: 'Small extras still count towards the overall limit.',
      },
      {
        level: 'C1',
        text: 'Keeping within my budget takes priority over securing a unit saving on goods I do not need.',
        substitution:
          'I would forgo the bundle rather than confuse a lower unit price with affordable total spending.',
      },
    ],
    sourceBasis,
    review: reviewed,
  },
  {
    id: 'price.sentence.leave',
    sceneId: 'dining-06',
    contentVersion: 1,
    kind: 'sentence',
    forms: ['I will leave without buying.'],
    intents: ['decision'],
    meaningZh:
      '决定不购买而离开；这是可以接受的协商结果，不是付款取消已经发生的证明。',
    grammarZh:
      'will + 动词原形表示此处决定；without 是介词，后接 buying，不接 buy。',
    registerZh: '清楚、非攻击性的退出表达，可加 thank you 保持礼貌。',
    errorsZh: '不是 without to buy；此句不意味对商品质量或店员作出评价。',
    examples: [
      {
        level: 'A1',
        text: 'I will leave without buying.',
        substitution: 'I would like to check the total first.',
      },
      {
        level: 'A2',
        text: 'I have decided not to buy anything today.',
        substitution: 'I would like to compare an option with my limit first.',
      },
      {
        level: 'B1',
        text: 'Thank you for the information, but I would rather leave without a purchase.',
        substitution:
          'The information is useful; I would like a final cost check before deciding.',
      },
      {
        level: 'B2',
        text: 'I do not need to make a purchase just because we have discussed a possible deal.',
        substitution:
          'A final comparison would help, but my interest is not yet a commitment.',
      },
      {
        level: 'C1',
        text: 'Walking away is a reasonable conclusion to the enquiry, not a failure to justify the time spent on it.',
        substitution:
          'I would keep the decision open until the full cost has been checked, without implying consent to buy.',
      },
    ],
    sourceBasis,
    review: reviewed,
  },
]
