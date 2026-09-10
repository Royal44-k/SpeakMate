import type { AnalysisEntry } from './schema'
const sourceBasis = [
  'Original explanations and examples; CEFR2020 information exchange, clarification and services design, as summarised in docs/research/2026-09-09-local-learning-evidence.md. No general dictionary, financial or repair advice coverage.',
]
const review = {
  state: 'model-reviewed' as const,
  record:
    'dialogues/graded/daily/daily-review.md#analysis: six named entries, 30 examples and 30 substitutions read by Codex implementation agent, 2026-09-10',
}
export const dailyAnalysis: AnalysisEntry[] = [
  {
    id: 'daily.directions.step-free',
    contentVersion: 1,
    kind: 'phrase',
    forms: ['step-free'],
    sceneId: 'daily-01',
    intents: ['set-access'],
    meaningZh:
      '无台阶的；本场景用于提出步行路线的可达性要求，不表示已核实街道条件。',
    grammarZh:
      'step-free 是复合形容词，通常放在 route 或 access 前：a step-free route。也可作表语：The route is step-free。',
    registerZh: '常见于路线、车站和建筑入口的可达性交流；比只说 easy 更具体。',
    errorsZh:
      'free 在此表示没有某物，不是免费；step-free 不等于收费为零，也不保证整段平坦或无障碍。',
    examples: [
      {
        level: 'A1',
        text: 'A step-free route, please.',
        substitution: 'A route without steps, please.',
      },
      {
        level: 'A2',
        text: 'I need a step-free route because my bag is heavy.',
        substitution:
          'I need a route without stairs because I am carrying a heavy bag.',
      },
      {
        level: 'B1',
        text: 'I would prefer a step-free route even if the walk is longer.',
        substitution: 'I would accept a longer walk to avoid steps.',
      },
      {
        level: 'B2',
        text: 'Keeping the route step-free matters more to me than saving a few minutes.',
        substitution:
          'Avoiding steps is a higher priority for me than taking the quickest route.',
      },
      {
        level: 'C1',
        text: 'If the shortcut involves steps, I would favour the longer step-free route.',
        substitution:
          'I would accept the extra distance rather than negotiate steps on the shortcut.',
      },
    ],
    sourceBasis,
    review,
  },
  {
    id: 'daily.taxi.drop-off',
    contentVersion: 1,
    kind: 'phrase',
    forms: ['drop off'],
    sceneId: 'daily-02',
    intents: ['request-dropoff'],
    meaningZh: '开车把人送到某处并让其下车；本场景讨论希望的下车点。',
    grammarZh:
      '可分短语动词：drop someone off；代词放中间，如 drop me off，不说 drop off me。地点常用 at。',
    registerZh:
      '常见乘车口语，比正式的 transport 更自然。动词写 drop off；作名词或定语常见 drop-off。',
    errorsZh:
      'pick up 是接上车，不是下车；提出 drop-off 请求不等于已经到达或该处允许停车。',
    examples: [
      {
        level: 'A1',
        text: 'Please drop me off here.',
        substitution: 'Please let me out here.',
      },
      {
        level: 'A2',
        text: 'Could you drop me off at the main entrance?',
        substitution: 'Could I get out by the main entrance?',
      },
      {
        level: 'B1',
        text: 'I would like you to drop me off near an entrance I can recognise.',
        substitution:
          'I would prefer a clearly identifiable entrance as the drop-off point.',
      },
      {
        level: 'B2',
        text: 'Could you drop me off at the side entrance if stopping there is permitted?',
        substitution:
          'The side entrance would suit me, provided it is a permitted stopping place.',
      },
      {
        level: 'C1',
        text: 'I would prefer to be dropped off where I can reach the entrance without carrying the suitcase around the building.',
        substitution:
          'A drop-off point close to the entrance would spare me having to carry the suitcase around the building.',
      },
    ],
    sourceBasis,
    review,
  },
  {
    id: 'daily.bank.declined',
    contentVersion: 1,
    kind: 'word',
    forms: ['declined'],
    sceneId: 'daily-03',
    intents: ['describe-problem'],
    meaningZh: '本场景指支付被拒绝、未获接受；只报告结果，不解释银行为何拒绝。',
    grammarZh:
      'The payment was declined 是一般过去时被动语态：was + 过去分词。decline 也可表示主动谢绝：I declined the offer。',
    registerZh: '支付提示和服务沟通中常见，语气较中性；不等于责备商户或用户。',
    errorsZh:
      'declined 并不自动表示余额不足、卡已注销或账户冻结；decline 在别处也能表示下降，本条不能套用到所有句子。',
    examples: [
      {
        level: 'A1',
        text: 'The payment was declined.',
        substitution: 'The payment was not accepted.',
      },
      {
        level: 'A2',
        text: 'My payment was declined at the shop yesterday.',
        substitution: 'The shop payment was not accepted yesterday.',
      },
      {
        level: 'B1',
        text: 'The payment was declined, but I do not know the reason.',
        substitution:
          'I know the payment was refused, but I cannot explain why.',
      },
      {
        level: 'B2',
        text: 'I would like to understand why the payment was declined before making assumptions.',
        substitution:
          'Please explain what can be checked about the refused payment before we draw conclusions.',
      },
      {
        level: 'C1',
        text: 'The payment was declined; that is the outcome I can report, not an explanation of the cause.',
        substitution:
          'I can confirm the refusal of the payment, but the underlying reason remains to be established.',
      },
    ],
    sourceBasis,
    review,
  },
  {
    id: 'daily.parcel.parcel',
    contentVersion: 1,
    kind: 'word',
    forms: ['parcel'],
    sceneId: 'daily-04',
    intents: ['identify-object', 'report-condition'],
    meaningZh: '包裹；本场景指纸箱或软包装道具，不由这个单词推断收件人身份。',
    grammarZh:
      '可数名词：a parcel、two parcels。collect a parcel 指领取；send a parcel 指寄出；parcel 本身不一定是硬纸箱。',
    registerZh:
      '日常邮寄、领取场景常用；package 也常见，但本条不是地区用词的完整比较。',
    errorsZh:
      '不能把 parcel 自动当作内容物、运单号或领取凭证；描述包装完好也不能证明里面物品完好。',
    examples: [
      {
        level: 'A1',
        text: 'This is the parcel.',
        substitution: 'This is the package.',
      },
      {
        level: 'A2',
        text: 'The parcel has a green sticker.',
        substitution: 'There is a green sticker on the package.',
      },
      {
        level: 'B1',
        text: 'I am asking about the parcel with the blue sticker.',
        substitution: 'My enquiry concerns the blue-labelled package.',
      },
      {
        level: 'B2',
        text: 'The parcel has a tear in its outer wrapping.',
        substitution:
          'There is a visible tear in the packaging around the parcel.',
      },
      {
        level: 'C1',
        text: 'I would like the parcel identified by its packaging features before discussing collection.',
        substitution:
          'Please establish which package I mean from its visible features before moving on to the collection process.',
      },
    ],
    sourceBasis,
    review,
  },
  {
    id: 'daily.hair.trim',
    contentVersion: 1,
    kind: 'word',
    forms: ['trim'],
    sceneId: 'daily-05',
    intents: ['choose-length', 'ask-upkeep'],
    meaningZh:
      '修剪，尤其少量修整发尾；本场景与明显剪短作对比，但不是固定厘米数。',
    grammarZh:
      '可作可数名词 a trim：I would like a trim；也可作动词 trim the ends。Just a trim 是省略主句的自然服务回答。',
    registerZh: '理发店常用口语。若保留长度很重要，应进一步明确并在剪前核对。',
    errorsZh:
      'trim 不等于 shave（剃除），也不自动规定剪掉多少；把 small trim 当绝对长度保证会造成误会。',
    examples: [
      {
        level: 'A1',
        text: 'Just a trim, please.',
        substitution: 'Please tidy the ends.',
      },
      {
        level: 'A2',
        text: 'I would like a small trim, not a much shorter cut.',
        substitution: 'Please tidy the ends without making it much shorter.',
      },
      {
        level: 'B1',
        text: 'A trim would suit me because I want to keep most of the length.',
        substitution:
          'I only want the ends tidied, as the overall length suits me.',
      },
      {
        level: 'B2',
        text: 'Before the trim, please show me the amount you intend to remove.',
        substitution:
          'Please indicate how much would be cut off before you start tidying the ends.',
      },
      {
        level: 'C1',
        text: 'By a trim, I mean refreshing the ends while preserving the overall length as far as possible.',
        substitution:
          'I am asking for the ends to be tidied, rather than for a substantial reduction in length.',
      },
    ],
    sourceBasis,
    review,
  },
  {
    id: 'daily.phone.estimate-first',
    contentVersion: 1,
    kind: 'sentence',
    forms: ['Please give me an estimate first.'],
    sceneId: 'daily-06',
    intents: ['request-estimate'],
    meaningZh:
      '请先给我一个费用估计。first 将估价放在后续决定之前；不表示同意维修或接受费用。',
    grammarZh:
      'Please + 动词原形构成礼貌祈使句；give + me + an estimate 为双宾语结构，也可说 give an estimate to me。estimate 前用 an。',
    registerZh:
      '维修等服务咨询中简短直接的请求；更委婉时可用 Could you give me an estimate first?。',
    errorsZh:
      'estimate 通常是估计，不必然是固定报价或保证；单句没说明估价是否收费，应另问检查或估价费用。',
    examples: [
      {
        level: 'A1',
        text: 'Please give me an estimate first.',
        substitution: 'Please tell me the likely cost first.',
      },
      {
        level: 'A2',
        text: 'Could you give me an estimate before I decide?',
        substitution: 'Could you tell me the likely cost before I choose?',
      },
      {
        level: 'B1',
        text: 'I would like an estimate before considering a repair.',
        substitution:
          'Please explain the expected cost before I decide about repair work.',
      },
      {
        level: 'B2',
        text: 'An estimate would help me judge whether the proposed repair is worthwhile.',
        substitution:
          'Knowing the likely total would help me decide whether to proceed with the proposed work.',
      },
      {
        level: 'C1',
        text: 'Please distinguish the estimated total from any charge that would remain payable if I declined the repair.',
        substitution:
          'I would like the expected repair cost separated from fees that apply even if I decide not to proceed.',
      },
    ],
    sourceBasis,
    review,
  },
]
