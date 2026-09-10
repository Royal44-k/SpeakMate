import type { AnalysisEntry } from './schema'
const sourceBasis = [
  'Original explanations and graded examples; CEFR2020 interaction, goal-oriented cooperation and clarification design as summarised in docs/research/2026-09-09-local-learning-evidence.md. Bounded language lookup, not employment advice or credential verification.',
]
const review = {
  state: 'model-reviewed' as const,
  record:
    'dialogues/graded/work/work-review.md#analysis: six entries, 30 examples and 30 substitutions read; forecast A1 example corrected and reread by Codex implementation agent, 2026-09-10',
}
export const workAnalysis: AnalysisEntry[] = [
  {
    id: 'work.introduction.responsible-for',
    contentVersion: 1,
    kind: 'phrase',
    forms: ['responsible for'],
    sceneId: 'work-01',
    intents: ['state-boundary', 'introduce-role'],
    meaningZh:
      '负责某项工作或对其负有责任；本场景须说清个人范围，不自动表示有批准权。',
    grammarZh:
      'be responsible for + 名词或动名词，如 responsible for checking。for 后不用动词原形；responsible to 某人则可表示向谁负责。',
    registerZh: '中性职业表达，既可用于介绍，也可用于礼貌纠正职责误解。',
    errorsZh:
      '不要把负责协调等同有权批准；I am responsible 和 I am the only person responsible 也不是同一范围。',
    examples: [
      {
        level: 'A1',
        text: 'I am responsible for this list.',
        substitution: 'I am responsible for these signs.',
      },
      {
        level: 'A2',
        text: 'I am responsible for checking the names.',
        substitution: 'I am responsible for updating the guide.',
      },
      {
        level: 'B1',
        text: 'I am responsible for collecting the details, but Maya makes the decision.',
        substitution: 'I coordinate the case, but approval remains with Maya.',
      },
      {
        level: 'B2',
        text: 'Our team is responsible for the process; my role is to check the incoming information.',
        substitution:
          'I handle the initial checks rather than the process-wide decisions.',
      },
      {
        level: 'C1',
        text: 'I am responsible for keeping the case moving, although the authority to approve an exception sits elsewhere.',
        substitution:
          'My remit covers coordination, not independent approval of exceptions.',
      },
    ],
    sourceBasis,
    review,
  },
  {
    id: 'work.standup.blocker',
    contentVersion: 1,
    kind: 'word',
    forms: ['blocker'],
    sceneId: 'work-02',
    intents: ['report-blocker'],
    meaningZh:
      '在工作进度语境中指阻止某项工作继续推进的障碍；不是所有困难或未完成事项都算 blocker。',
    grammarZh:
      '可数名词：a blocker、the main blocker；常用 a blocker for testing 或 be blocked by something。',
    registerZh:
      '团队短会中常见的工作用语；面对不熟悉术语的人，可改说 something stopping the work。',
    errorsZh:
      '不要把 blocker 当作借口或责备某个人的标签。说明具体受阻步骤，同时可说仍能完成的准备。',
    examples: [
      {
        level: 'A1',
        text: 'There is one blocker: I need an account.',
        substitution: 'I cannot start without an account.',
      },
      {
        level: 'A2',
        text: 'The missing test account is a blocker for this check.',
        substitution: 'I need the test account before I can run this check.',
      },
      {
        level: 'B1',
        text: 'Access is the blocker, but I can prepare the sample cases now.',
        substitution: 'I can prepare the cases while I wait for access.',
      },
      {
        level: 'B2',
        text: 'The blocker is account approval, not a lack of work we can do independently.',
        substitution:
          'Approval prevents the live check, although preparation can continue.',
      },
      {
        level: 'C1',
        text: 'I would separate the access blocker from uncertainty in the test itself; only the former requires someone else to act.',
        substitution:
          'Access needs another owner’s action, whereas the test uncertainty is ours to investigate.',
      },
    ],
    sourceBasis,
    review,
  },
  {
    id: 'work.progress.forecast',
    contentVersion: 1,
    kind: 'word',
    forms: ['forecast'],
    sceneId: 'work-03',
    intents: ['qualify-forecast'],
    meaningZh:
      '依据当前信息作出的预测；这里是完成时间预估，不等于固定期限、批准或实际完成。',
    grammarZh:
      '可作名词 a forecast 或动词 forecast completion。常用 current forecast、revise a forecast；给时间时可说 a forecast for next week。',
    registerZh:
      '比 guess 更强调有依据的判断，常用于项目报告；依据不够时应明确无法给出有用预估。',
    errorsZh:
      '不要把 forecast、target 和 confirmed date 混用。目标是希望达到，预测是预计会发生，确认日期还涉及明确决定。',
    examples: [
      {
        level: 'A1',
        text: 'I think the guide will be ready next week.',
        substitution: 'It may be ready next week.',
      },
      {
        level: 'A2',
        text: 'The forecast may change after the checks.',
        substitution: 'The finish time is not certain yet.',
      },
      {
        level: 'B1',
        text: 'My forecast depends on the map being confirmed this week.',
        substitution:
          'I expect to finish next week if the map is confirmed in time.',
      },
      {
        level: 'B2',
        text: 'I would revise the forecast if the new images required substantial changes.',
        substitution:
          'A major image change would alter my estimate of the remaining time.',
      },
      {
        level: 'C1',
        text: 'The current forecast assumes confirmation rather than replacement of the outstanding content.',
        substitution:
          'Next week remains plausible only if the checks leave the main content intact.',
      },
    ],
    sourceBasis,
    review,
  },
  {
    id: 'work.deadline.trade-off',
    contentVersion: 1,
    kind: 'phrase',
    forms: ['trade-off'],
    sceneId: 'work-04',
    intents: ['offer-tradeoff', 'explain-impact'],
    meaningZh:
      '为了得到某种益处而接受另一项代价的权衡，如保留检查时间但减少练习变化。不是双方已经达成的协议。',
    grammarZh:
      '可数名词 a trade-off，常搭配 a trade-off between A and B、make a trade-off。动词形式 trade off 不等同此处名词拼写。',
    registerZh:
      '中性分析性表达，用来让协商代价可见；基础级可改说 keep this but do less of that。',
    errorsZh:
      'trade-off 不是无成本的双赢，也不表示可以牺牲必要安全或质量检查；说清谁受影响。',
    examples: [
      {
        level: 'A1',
        text: 'We can keep the checks but use fewer pictures.',
        substitution: 'We can use fewer pages and keep the checks.',
      },
      {
        level: 'A2',
        text: 'The trade-off is less practice in the first session.',
        substitution: 'There would be fewer exercises for the first session.',
      },
      {
        level: 'B1',
        text: 'The trade-off is a smaller first version in exchange for more checking time.',
        substitution:
          'Reducing the first version would protect time for the checks.',
      },
      {
        level: 'B2',
        text: 'We should explain the trade-off to the trainer before assuming fewer exercises are acceptable.',
        substitution:
          'The trainer needs to judge the cost of losing those practice options.',
      },
      {
        level: 'C1',
        text: 'A later handover may simply shift the trade-off onto the trainer’s preparation time.',
        substitution:
          'Extending our work period could leave the trainer absorbing the same pressure.',
      },
    ],
    sourceBasis,
    review,
  },
  {
    id: 'work.meeting.test-assumption',
    contentVersion: 1,
    kind: 'sentence',
    forms: ['Could we test that assumption?'],
    sceneId: 'work-05',
    intents: ['question-assumption'],
    questionIds: ['meeting-disagreement.C1.assumption'],
    meaningZh:
      '我们能否检验一下这个假设？that 在这里指开场已提供的“一个看板会让每个人工作更少”的主张，不能对任意未出现的观点套用。',
    grammarZh:
      'Could we + 动词原形构成合作式建议；test 的宾语是 that assumption，询问的是检验前提而非直接否定结论。',
    registerZh:
      '正式度适中的会议表达，比 You are wrong 更聚焦证据，但仍构成实质质疑。',
    errorsZh:
      '只有相关问题上下文才精确匹配这句；不能因为出现 assumption 就声称已解析整段论证。',
    examples: [
      {
        level: 'A1',
        text: 'Is that idea right?',
        substitution: 'Do we know that?',
      },
      {
        level: 'A2',
        text: 'Can we check whether the board saves time?',
        substitution: 'Could we find out how much time it takes?',
      },
      {
        level: 'B1',
        text: 'Could we check whether everyone would really have less work?',
        substitution: 'We need to find out who would maintain the board.',
      },
      {
        level: 'B2',
        text: 'Could we test the assumption that fewer emails mean less work overall?',
        substitution:
          'Could we compare the total work rather than just the number of messages?',
      },
      {
        level: 'C1',
        text: 'Could we test that assumption before the saving becomes the main justification for switching?',
        substitution:
          'Could we establish where the claimed saving comes from before relying on it?',
      },
    ],
    sourceBasis,
    review,
  },
  {
    id: 'work.interview.contributed-to',
    contentVersion: 1,
    kind: 'phrase',
    forms: ['contributed to'],
    sceneId: 'work-06',
    intents: ['separate-contribution'],
    meaningZh:
      '为某事作出了贡献；表示参与和作用，不自动表示独立完成、领导项目或保证成果归因。',
    grammarZh:
      'contributed 是 contribute 的过去式，to 是介词，后接名词或动名词：contributed to preparing the event。也可用 contributed ideas to the project。',
    registerZh:
      '面试中可用于准确描述团队中的个人作用；应跟具体任务，不靠谦逊措辞掩盖不真实经历。',
    errorsZh:
      '不要写 contributed to prepare；不要把 contributed to 改写成 led 或 delivered alone，除非实际事实支持。',
    examples: [
      {
        level: 'A1',
        text: 'I helped the team with the list.',
        substitution: 'I made the signs for the team.',
      },
      {
        level: 'A2',
        text: 'I contributed to the event by checking names.',
        substitution: 'My task was to check the visitor names.',
      },
      {
        level: 'B1',
        text: 'I contributed to the preparation, while other volunteers managed the activities.',
        substitution:
          'I helped prepare the event, but I did not run the activities.',
      },
      {
        level: 'B2',
        text: 'I contributed to the visitor information, rather than directing the whole event.',
        substitution:
          'My responsibility was the information, not overall event management.',
      },
      {
        level: 'C1',
        text: 'I contributed to the preparation by checking the visitor list; the wider outcome depended on several colleagues’ work.',
        substitution:
          'I can account for my own checks without attributing the event’s overall success to them.',
      },
    ],
    sourceBasis,
    review,
  },
]
