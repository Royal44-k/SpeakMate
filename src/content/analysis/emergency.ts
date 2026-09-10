import type { AnalysisEntry } from './schema'
const source = [
  'Original language notes aligned with CEFR2020 information exchange and clarification; docs/research/2026-09-09-local-learning-evidence.md. Communication boundaries: docs/research/2026-09-09-health-corpus-boundaries.md; not medical, legal or teacher review.',
]
export const emergencyAnalysis: AnalysisEntry[] = [
  {
    id: 'emergency.label',
    contentVersion: 1,
    kind: 'word',
    forms: ['label'],
    sceneId: 'emergency-01',
    intents: ['identify-label-gap', 'state-need'],
    meaningZh:
      '标签；本药房练习指包装上可阅读的文字区域，不据此判断药品是否适用。',
    grammarZh:
      '可数名词：a label、the label、read the label。on the label 表示文字印在标签上。也可作动词，但此条只覆盖名词。',
    registerZh: '中性日常名词，适合指出看不清或不懂的包装文字。',
    errorsZh:
      'label 是标签，table 是桌子或表格。能读清字不等于理解含义，更不等于获得用药建议。',
    examples: [
      {
        level: 'A1',
        text: 'I cannot read the label.',
        substitution: 'I cannot read the card.',
      },
      {
        level: 'A2',
        text: 'The words on the label are too small.',
        substitution: 'The words on the box are unclear.',
      },
      {
        level: 'B1',
        text: 'I can read the label, but I need help understanding one term.',
        substitution:
          'I can read the message, but I need help understanding one phrase.',
      },
      {
        level: 'B2',
        text: 'A larger label would address the small print, but not my question about the meaning.',
        substitution:
          'A clearer copy would address the blurred text, but not the unfamiliar terminology.',
      },
      {
        level: 'C1',
        text: 'I would quote the visible wording on the label and leave the unreadable portion unspecified.',
        substitution:
          'I would distinguish the printed wording from my interpretation rather than present them as equivalent.',
      },
    ],
    sourceBasis: source,
    review: { state: 'model-reviewed', record: 'emergency-review.md: label' },
  },
  {
    id: 'emergency.comes-and-goes',
    contentVersion: 1,
    kind: 'phrase',
    forms: ['comes and goes'],
    sceneId: 'emergency-02',
    intents: ['describe-pattern'],
    meaningZh:
      '时有时无、反复出现；本场景仅描述虚构感受的时间模式，不说明原因或轻重。',
    grammarZh:
      '两个并列动词都随单数第三人称主语加 s：The feeling comes and goes。复数用 come and go。',
    registerZh: '自然常用的口头描述，比技术术语更日常。',
    errorsZh:
      '不是物理地来去，也不意味着感受已经永久消失；不要只给 comes 加 s 却写成 comes and go。',
    examples: [
      {
        level: 'A1',
        text: 'The feeling comes and goes.',
        substitution: 'The sound comes and goes.',
      },
      {
        level: 'A2',
        text: 'The feeling comes and goes during the day.',
        substitution: 'The noise comes and goes in the evening.',
      },
      {
        level: 'B1',
        text: 'It comes and goes, but I have not recorded the times.',
        substitution:
          'It returns sometimes, although I cannot give an exact pattern.',
      },
      {
        level: 'B2',
        text: 'The feeling comes and goes; I cannot say how long each period lasts.',
        substitution:
          'I notice separate episodes, but I have not monitored the intervals continuously.',
      },
      {
        level: 'C1',
        text: 'Saying that it comes and goes describes my experience, not a continuous record of every interval.',
        substitution:
          'I would qualify the pattern to reflect the gaps in my attention rather than imply uninterrupted observation.',
      },
    ],
    sourceBasis: source,
    review: {
      state: 'model-reviewed',
      record: 'emergency-review.md: comes-and-goes',
    },
  },
  {
    id: 'emergency.appointment',
    contentVersion: 1,
    kind: 'word',
    forms: ['appointment'],
    sceneId: 'emergency-03',
    intents: ['state-booking-purpose', 'request-time'],
    meaningZh:
      '预约、约定会面的安排；request an appointment 是提出预约请求，本身不表示时间已经确认。',
    grammarZh:
      '可数名词：an appointment、request an appointment、an appointment with someone。appointment 以元音音素开头，前用 an。',
    registerZh: '中性日常行政沟通；此处指诊所会面安排而非职务任命。',
    errorsZh:
      '不要把 appointment 和 disappointment 混淆；偏好某时段、提出请求或练习句子都不等于完成真实预约。',
    examples: [
      {
        level: 'A1',
        text: 'I want an appointment.',
        substitution: 'I want some information.',
      },
      {
        level: 'A2',
        text: 'I would like to ask about an appointment on Tuesday.',
        substitution: 'I would like to ask about a visit on Thursday.',
      },
      {
        level: 'B1',
        text: 'I have requested an appointment, but the time has not been confirmed.',
        substitution:
          'I have suggested a time, but no arrangement has been agreed.',
      },
      {
        level: 'B2',
        text: 'The appointment request should distinguish a preferred time from a firm availability limit.',
        substitution:
          'The enquiry should distinguish a possible format from a confirmed arrangement.',
      },
      {
        level: 'C1',
        text: 'An appointment under discussion should not acquire the appearance of a confirmed booking in the notes.',
        substitution:
          'A proposed time should retain its tentative status until agreement is explicit.',
      },
    ],
    sourceBasis: source,
    review: {
      state: 'model-reviewed',
      record: 'emergency-review.md: appointment',
    },
  },
  {
    id: 'emergency.entrance-sentence',
    contentVersion: 1,
    kind: 'sentence',
    forms: ['I cannot see the entrance.'],
    sceneId: 'emergency-04',
    intents: ['state-view-limit'],
    meaningZh:
      '我看不到入口。只表示说话者当前视线限制，不表示入口不存在、没有人或某种情况不存在。',
    grammarZh:
      'I + cannot + 动词原形 see + 宾语 the entrance；情态动词后的 see 不加 s。cannot 表示不能，不应被忽略为肯定句。',
    registerZh: '清楚直接的模拟报告语言，无移动、检查或急救操作含义。',
    errorsZh:
      '不能从看不到推断不存在；the entrance 在本练习有虚构地图作指代背景，不作真实位置识别。',
    examples: [
      {
        level: 'A1',
        text: 'I cannot see the entrance.',
        substitution: 'I cannot see the door.',
      },
      {
        level: 'A2',
        text: 'I cannot see the entrance from here.',
        substitution: 'I can see the door, but not the room inside.',
      },
      {
        level: 'B1',
        text: 'I cannot see the entrance, so I cannot describe the people there.',
        substitution:
          'The doorway is out of view, so I do not know who is beside it.',
      },
      {
        level: 'B2',
        text: 'I cannot see the entrance; that limits my report rather than proving that nobody is there.',
        substitution:
          'The interior is outside my view, so I would leave its condition unconfirmed.',
      },
      {
        level: 'C1',
        text: 'I cannot see the entrance, and that absence of observation should not be interpreted as evidence about what is happening there.',
        substitution:
          'My visual account ends at the doorway; it should not be extended to the unseen interior.',
      },
    ],
    sourceBasis: source,
    review: {
      state: 'model-reviewed',
      record: 'emergency-review.md: entrance-sentence',
    },
  },
  {
    id: 'emergency.last-saw',
    contentVersion: 1,
    kind: 'phrase',
    forms: ['last saw'],
    sceneId: 'emergency-05',
    intents: [
      'give-last-seen-place',
      'give-last-seen-time',
      'acknowledge-memory-gap',
    ],
    meaningZh:
      '最后一次看见；指最后能回忆起的目击，不自动说明物品最终遗落在哪里。',
    grammarZh:
      'saw 是 see 的一般过去式。I last saw it in the cafe：last 修饰 saw，后可接宾语及地点或时间。',
    registerZh: '日常报失叙述中的自然短语，适合明确记忆起点。',
    errorsZh:
      '不要写 I last seen it；seen 通常需要助动词或其他结构。last saw 不等于 definitely left。',
    examples: [
      {
        level: 'A1',
        text: 'I last saw it today.',
        substitution: 'I last saw it yesterday.',
      },
      {
        level: 'A2',
        text: 'I last saw my notebook in the cafe.',
        substitution: 'I last saw my bag in the reading room.',
      },
      {
        level: 'B1',
        text: 'I last saw it at the table, but I may have carried it elsewhere.',
        substitution:
          'I remember it beside my chair, but I do not know where I left it.',
      },
      {
        level: 'B2',
        text: 'The place where I last saw it is a reliable memory, not a confirmed location of the loss.',
        substitution:
          'The last sighting provides a starting point, but does not establish the item’s later location.',
      },
      {
        level: 'C1',
        text: 'I would retain “last saw” rather than allow a sighting to be restated as a definite account of where the item was left.',
        substitution:
          'The report should preserve the limit of the recollection instead of replacing it with a stronger claim.',
      },
    ],
    sourceBasis: source,
    review: {
      state: 'model-reviewed',
      record: 'emergency-review.md: last-saw',
    },
  },
  {
    id: 'emergency.leak',
    contentVersion: 1,
    kind: 'word',
    forms: ['leak'],
    sceneId: 'emergency-06',
    intents: ['describe-repair-need', 'describe-observation-frequency'],
    meaningZh:
      '漏、泄漏；可作动词或指漏处、漏水现象的名词。本场景只描述水龙头观察，不诊断部件或说明维修步骤。',
    grammarZh:
      '名词 a leak；动词 The tap leaks；进行时 The tap is leaking。主语单数时一般现在时加 s。',
    registerZh: '常见生活和报修词；本条不覆盖机密外泄等其他语境的完整解释。',
    errorsZh:
      'leak 和 leek（韭葱）同音但不同词。发现漏水不表示知道原因、费用责任或可自行处理。',
    examples: [
      {
        level: 'A1',
        text: 'There is a leak.',
        substitution: 'The tap is leaking.',
      },
      {
        level: 'A2',
        text: 'I noticed a leak this morning.',
        substitution: 'I noticed water dripping yesterday.',
      },
      {
        level: 'B1',
        text: 'I can describe the leak, but I do not know its cause.',
        substitution: 'I can report the dripping without naming a faulty part.',
      },
      {
        level: 'B2',
        text: 'The leak is an observation to report, not evidence that I have inspected the equipment.',
        substitution:
          'My notes describe the visible problem rather than a completed technical check.',
      },
      {
        level: 'C1',
        text: 'I would distinguish the reported leak from any proposed explanation, leaving the cause open for assessment.',
        substitution:
          'The account should identify what was observed without allowing a plausible cause to become an established finding.',
      },
    ],
    sourceBasis: source,
    review: { state: 'model-reviewed', record: 'emergency-review.md: leak' },
  },
]
