import type { AnalysisEntry } from './schema'
const sourceBasis = [
  'Original travel-language explanations; CEFR2020 information exchange/clarification task design as summarised in docs/research/2026-09-09-local-learning-evidence.md. No dictionary or legal coverage claim.',
]
const read = {
  state: 'model-reviewed' as const,
  record:
    'dialogues/graded/travel/travel-review.md#analysis-reading — six named entries and their 30 examples/30 substitutions read by Codex, 2026-09-10',
}
export const travelAnalysis: AnalysisEntry[] = [
  {
    id: 'travel.airport.luggage',
    sceneId: 'travel-01',
    contentVersion: 1,
    kind: 'word',
    forms: ['luggage'],
    intents: ['declare', 'locate'],
    meaningZh: '行李的总称；此处包括箱子与背包，并非已确认可以托运的承诺。',
    grammarZh:
      'luggage 通常不可数，可说 a piece of luggage、two bags，不说 two luggages。check in luggage 表示办理托运。',
    registerZh: '常见旅行用词，比具体的 suitcase 范围更广。',
    errorsZh:
      '不能由含 luggage 的句子推断件数、重量或额度；这些都需要明确的情境信息。',
    examples: [
      {
        level: 'A1',
        text: 'This is my luggage.',
        substitution: 'This is my suitcase.',
      },
      {
        level: 'A2',
        text: 'I have one piece of luggage to check in.',
        substitution: 'I would like to check in one suitcase.',
      },
      {
        level: 'B1',
        text: 'Please explain the luggage allowance before I confirm the request.',
        substitution: 'I need the baggage limit clarified before deciding.',
      },
      {
        level: 'B2',
        text: 'The luggage allowance and the seat preference need separate checks.',
        substitution:
          'A seat request does not establish the baggage allowance.',
      },
      {
        level: 'C1',
        text: 'A stated luggage allowance does not, by itself, establish that a particular bag has been accepted.',
        substitution:
          'Please distinguish the allowance information from confirmation that the suitcase has been checked in.',
      },
    ],
    sourceBasis,
    review: read,
  },
  {
    id: 'travel.security.take-out',
    sceneId: 'travel-02',
    contentVersion: 1,
    kind: 'phrase',
    forms: ['take out'],
    intents: ['organise'],
    meaningZh:
      '拿出、取出；在本场景指从口袋取出手机或钥匙。不能用词组自动判断应取出哪件物品。',
    grammarZh:
      'take + 名词 + out 或 take out + 名词；代词常置中间，如 take it out。取出位置可加 of my pocket。',
    registerZh: '常见操作表达；本条不提供真实机场安检规则。',
    errorsZh:
      'take off 通常指脱下衣物等，不等于从口袋取出物件；it 没有前文时不能猜指代。',
    examples: [
      {
        level: 'A1',
        text: 'I will take out my keys.',
        substitution: 'I will take out my phone.',
      },
      {
        level: 'A2',
        text: 'I will take my phone out of my pocket first.',
        substitution: 'I will remove the keys from my pocket first.',
      },
      {
        level: 'B1',
        text: 'Taking out the keys first would help me avoid overlooking them.',
        substitution:
          'I would remove the small items first so I do not forget them.',
      },
      {
        level: 'B2',
        text: 'Before taking anything else out, I would clarify which items the instruction covers.',
        substitution:
          'I would check the scope of the instruction before removing more items.',
      },
      {
        level: 'C1',
        text: 'The instruction to take an item out identifies an action, but its object still needs to be unambiguous.',
        substitution:
          'A clear removal instruction should specify which item is meant rather than rely on a guessed reference.',
      },
    ],
    sourceBasis,
    review: read,
  },
  {
    id: 'travel.connection.connection',
    sceneId: 'travel-03',
    contentVersion: 1,
    kind: 'word',
    forms: ['connection'],
    intents: ['state-problem', 'clarify-route'],
    meaningZh:
      '转乘的衔接；此处指前段航班与前往Oslo航班之间的衔接，不是网络连接。',
    grammarZh:
      'make a connection 表示赶上衔接；miss a connection 表示错过；a connecting flight 为转乘航班。',
    registerZh: '中性旅行用语，不能凭这个词确认转机可行性。',
    errorsZh:
      'connection 也可指网络或人际关系；未收录整句只能返回本场景词义的部分匹配。',
    examples: [
      {
        level: 'A1',
        text: 'I need help with my connection.',
        substitution: 'Please help me with the next flight.',
      },
      {
        level: 'A2',
        text: 'I have little time for my connection.',
        substitution: 'There is not much time before my next flight.',
      },
      {
        level: 'B1',
        text: 'I need to check whether the connection is still possible.',
        substitution: 'Please help me verify the options for the next flight.',
      },
      {
        level: 'B2',
        text: 'A different connection is worth checking, but the complete timings matter.',
        substitution:
          'I would assess the whole connecting route before agreeing to it.',
      },
      {
        level: 'C1',
        text: 'Knowing the remaining connection time does not settle whether the transfer is feasible.',
        substitution:
          'The time figure is a starting point for the enquiry, not confirmation that the connection can be made.',
      },
    ],
    sourceBasis,
    review: read,
  },
  {
    id: 'travel.immigration.purpose',
    sceneId: 'travel-04',
    contentVersion: 1,
    kind: 'phrase',
    forms: ['purpose of visit'],
    intents: ['state-purpose'],
    meaningZh:
      '访问目的；练习表达此行主要原因，不是签证类别、法律资格或准入结果。',
    grammarZh:
      'purpose of + 名词，问句可说 What is the purpose of your visit?；回答可用 I am here to + 动词或 for + 名词。',
    registerZh: '正式问答常见表达，答案应具体而真实；此练习仅用虚构信息。',
    errorsZh:
      '不要把 for tourism 和 to visit 混成 to tourism；回答目的不等于证明已获任何许可。',
    examples: [
      {
        level: 'A1',
        text: 'I am here for a holiday.',
        substitution: 'I am visiting my cousin.',
      },
      {
        level: 'A2',
        text: 'The purpose of my visit is a short holiday.',
        substitution: 'I have come to spend time with my cousin.',
      },
      {
        level: 'B1',
        text: 'Seeing my cousin is the main reason for the visit.',
        substitution:
          'The trip is mainly a holiday, with activities still to be decided.',
      },
      {
        level: 'B2',
        text: 'My main purpose is to visit family; sightseeing would be secondary.',
        substitution:
          'A holiday is the main purpose, while individual activities remain flexible.',
      },
      {
        level: 'C1',
        text: 'I would state the principal purpose clearly without presenting optional activities as separate commitments.',
        substitution:
          'The main reason for the visit should remain distinct from incidental plans during the stay.',
      },
    ],
    sourceBasis,
    review: read,
  },
  {
    id: 'travel.hotel.reservation',
    sceneId: 'travel-05',
    contentVersion: 1,
    kind: 'word',
    forms: ['reservation'],
    intents: ['identify', 'clarify-room'],
    meaningZh:
      '预订；在本场景是已给定的一人两晚标准房记录，不能由询问推出新预订已完成。',
    grammarZh:
      'make/check a reservation；a reservation under Alex Chen 表示以该姓名预订。酒店口语也常用 booking。',
    registerZh: '中性前台服务用语，既可指预订行为也可指记录。',
    errorsZh: 'reservation 不等于入住已经完成；可选早餐与提前入住需另外确认。',
    examples: [
      {
        level: 'A1',
        text: 'I have a reservation.',
        substitution: 'I have a booking.',
      },
      {
        level: 'A2',
        text: 'The reservation is under Alex Chen.',
        substitution: 'I booked the room in the name Alex Chen.',
      },
      {
        level: 'B1',
        text: 'Please compare the reservation with my confirmation.',
        substitution:
          'Could you check the booking details against this document?',
      },
      {
        level: 'B2',
        text: 'A location preference should not change the room category in the reservation.',
        substitution:
          'Please keep the booked room type separate from my preferred location.',
      },
      {
        level: 'C1',
        text: 'Agreement on the number of nights does not rule out a mismatch in the reservation dates.',
        substitution:
          'Both the arrival and departure dates should be checked, not merely the length of the stay.',
      },
    ],
    sourceBasis,
    review: read,
  },
  {
    id: 'travel.room.air-conditioning',
    sceneId: 'travel-06',
    contentVersion: 1,
    kind: 'sentence',
    forms: ['The air conditioning is not working.'],
    intents: ['describe-problem'],
    meaningZh:
      '空调没有正常工作；在本房间情境指没有制冷，不给出内部故障原因或维修方法。',
    grammarZh:
      'air conditioning 作为系统通常不可数；is not working 用现在进行时描述当前运行问题，不等同于永久损坏。',
    registerZh: '清楚、中性的故障报告，可接具体观察而不是未经证实的诊断。',
    errorsZh:
      '不能因 not working 就断言某部件坏了；working 在此是正常运行，不是从事职业工作。',
    examples: [
      {
        level: 'A1',
        text: 'The air conditioning is not working.',
        substitution: 'The air conditioning is blowing warm air.',
      },
      {
        level: 'A2',
        text: 'The air conditioning is running, but the room is not getting cooler.',
        substitution: 'The unit is on, but the air still feels warm.',
      },
      {
        level: 'B1',
        text: 'I tried the remote, but the air conditioning still did not cool the room.',
        substitution: 'Using the remote did not solve the lack of cooling.',
      },
      {
        level: 'B2',
        text: 'I can describe the lack of cooling without identifying what caused it.',
        substitution:
          'The room remains warm, but the technical cause needs assessment.',
      },
      {
        level: 'C1',
        text: 'The absence of cooling is an observation I can report, not a diagnosis of a particular component.',
        substitution:
          'I would describe what the unit does rather than attribute the fault to a part I have not examined.',
      },
    ],
    sourceBasis,
    review: read,
  },
]
