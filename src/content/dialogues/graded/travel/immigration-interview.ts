import { travelPack, type Scene } from './authoring'
const scene: Scene = {
  sceneId: 'travel-04',
  slug: 'immigration-interview',
  situations: [
    '虚构入境问答排练，无特定国家法律。你是Alex Chen，计划9月10日到15日停留，返程计划为15日，住Harbour Hotel；酒店确认信、返程预订信息和自己的旅行笔记在手。旅行目的是观光或探望表亲，行程尚未决定是否含博物馆。费用自付，自己准备旅行资料。真实入境决定和证件要求不在本练习范围内，不输入真实敏感号码；排练也会询问你准备怎样回应不明白的问题。',
    '虚构入境协助排练，无特定国家法律。Alex Chen计划9月10日至15日停留，15日返程，住Harbour Hotel；有酒店确认信、返程预订信息和旅行笔记，费用自付并自行准备资料。你需要较多帮助说明尚未确定的活动以及不明白的问题。目的可选观光或探望表亲；会讨论不记得资料时怎样回答，以及不透露真实号码的练习方式；请求解释不表示真实获准入境。',
  ],
  paths: [
    [
      [1, 2, 3],
      [1, 2, 3, 4, 5, 6],
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    ],
    [
      [1, 2, 3],
      [1, 2, 3, 4, 5, 6],
      [1, 2, 3, 4, 5, 6, 7, 8, 11, 12],
    ],
  ],
  closing:
    'This interview practice is complete. Your answers have been practised, but no immigration permission or assessment has been given.',
  partial:
    'We have practised some interview answers. The remaining questions are unconfirmed; this exercise gives no immigration decision.',
  repairs: {
    clarify:
      'You may ask for the current interview question to be explained. No answer is inferred from that request.',
    struggle:
      'Take your time and use the fictional details. You do not need to provide real personal numbers.',
    offTopic:
      'Let us return to the interview question using the fictional visit.',
    unknown:
      'This wording has not matched a reviewed answer. It is not judged false, and no immigration conclusion is drawn.',
    changed:
      'Your practice answer has been revised; this is not a change to an official record.',
    refusedClosing:
      'We will stop this language practice. No conclusion about admission or legal rights follows from stopping.',
  },
}
export const immigrationPacks = {
  A1: travelPack(
    scene,
    'A1',
    {
      canDoZh: '用给定虚构资料回答目的、日期和住宿等简单问题。',
      complexityZh: '单一事实与简短澄清，不讨论签证权利或入境条件。',
      scaffoldingZh: '先给人物和日期，允许短语及重复请求。',
      registerZh: '清楚礼貌、不装懂；拒绝使用真实敏感信息。',
    },
    [
      [
        'purpose',
        'state-purpose',
        'What is the purpose of your visit?',
        '只用虚构观光或探亲目的。',
        'tourism',
        'I am here for a holiday.',
        'family',
        'I am visiting my cousin.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A1.purpose, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'dates',
        'clarify-dates',
        'Would you like to say the visit dates or show your written plan?',
        '两答均保留10日至15日。',
        'say',
        'From September tenth to the fifteenth.',
        'show',
        'Here is my plan for September tenth to the fifteenth.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A1.dates, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'stay',
        'confirm-stay',
        'Can you name your hotel or show its confirmation?',
        '两答都表达Harbour Hotel。',
        'name',
        'I am staying at Harbour Hotel.',
        'show',
        'Here is the Harbour Hotel confirmation.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A1.stay, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'return',
        'provide-evidence',
        'Is your return information on paper or on your phone?',
        '返程15日已给，不需要重新猜日期。',
        'paper',
        'It is on paper.',
        'phone',
        'It is on my phone.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A1.return, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'funds',
        'explain-support',
        'Will you pay your travel costs by card or with cash?',
        '两种方式均自付，不问真实余额。',
        'card',
        'I will use my own card.',
        'cash',
        'I will use my own cash.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A1.funds, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'language',
        'request-clarification',
        'Would slower speech or simpler words help you?',
        '可以要求语言协助。',
        'slow',
        'Please speak slowly.',
        'simple',
        'Simple words, please.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A1.language, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'activity',
        'describe-plan',
        'Have you decided whether to visit a museum?',
        '观光或探親均可安排博物馆。',
        'yes',
        'Yes, I would like to visit one.',
        'no',
        'No, not yet.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A1.activity, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'address',
        'locate-record',
        'Where can you find the hotel address?',
        '资料齐备，不要求背地址。',
        'letter',
        'It is on the confirmation letter.',
        'note',
        'I have it in my notes.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A1.address, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'preparation',
        'explain-background',
        'Did you prepare the trip details on paper or on a screen?',
        '由自己准备的事实不变。',
        'paper',
        'I wrote them on paper.',
        'screen',
        'I prepared them on my computer.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A1.preparation, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'ending',
        'confirm-understanding',
        'Do you understand the questions we have practised?',
        '不能以听懂代表获准入境。',
        'yes',
        'Yes, I understand them.',
        'help',
        'I need more practice, please.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A1.ending, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'uncertain',
        'limit-claim',
        'If you do not remember a detail, what will you say?',
        '练习诚实表达不确定。',
        'check',
        'I need to check my notes.',
        'unknown',
        'I do not remember.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A1.uncertain, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'privacy',
        'set-boundary',
        'Will you use made-up details or real personal numbers in this exercise?',
        '两答均拒绝泄露真实号码，策略不同。',
        'fiction',
        'I will use the made-up details.',
        'skip',
        'I will skip personal numbers.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A1.privacy, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#immigration-interview — A1 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  A2: travelPack(
    scene,
    'A2',
    {
      canDoZh: '连接目的与行程资料，解释简单的理解困难。',
      complexityZh: '区分固定日期和未决定活动，选择资料呈现方式。',
      scaffoldingZh: '具体酒店和日期先给，回答可用because和before。',
      registerZh: '直接如实说明，简洁提出协助或隐私边界。',
    },
    [
      [
        'purpose',
        'state-purpose',
        'Why have you planned this visit?',
        '两目的均可配现有住宿。',
        'tourism',
        'I have planned a short holiday.',
        'family',
        'I want to spend some time with my cousin.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A2.purpose, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'dates',
        'clarify-dates',
        'How would you like to explain the dates of your stay?',
        '口述或出示同一日期。',
        'say',
        'I plan to stay from the tenth to the fifteenth of September.',
        'show',
        'I can show the written plan for September tenth to fifteenth.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A2.dates, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'stay',
        'confirm-stay',
        'How can you confirm where you plan to stay?',
        '都明确同一家酒店。',
        'name',
        'The hotel is called Harbour Hotel.',
        'show',
        'I can show my confirmation for Harbour Hotel.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A2.stay, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'return',
        'provide-evidence',
        'How have you brought the information for your planned return?',
        '现有信息不保证航班执行。',
        'paper',
        'I have a printed copy of the return booking.',
        'phone',
        'I have saved the return booking on my phone.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A2.return, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'funds',
        'explain-support',
        'How do you plan to cover your own travel expenses?',
        '不作财务建议。',
        'card',
        'I plan to pay with my own card.',
        'cash',
        'I have my own cash for the travel costs.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A2.funds, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'language',
        'request-clarification',
        'What kind of help would make the interview questions easier?',
        '区分速度和词汇。',
        'slow',
        'Could you speak a little more slowly?',
        'simple',
        'Could you use simpler words when possible?',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A2.language, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'activity',
        'describe-plan',
        'Is a museum visit already part of your plan?',
        '未定不是矛盾。',
        'yes',
        'Yes, I would like to include a museum visit.',
        'no',
        'No, I have not decided on that activity yet.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A2.activity, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'address',
        'locate-record',
        'Where would you look if you needed the hotel’s full address?',
        '允许查看资料不猜。',
        'letter',
        'I would look at the hotel confirmation.',
        'note',
        'I would check the address in my travel notes.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A2.address, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'preparation',
        'explain-background',
        'How did you organise the details before the trip?',
        '自己准备，方式有别。',
        'paper',
        'I wrote the travel details in a notebook.',
        'screen',
        'I organised the information on my computer.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A2.preparation, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'ending',
        'confirm-understanding',
        'Are the practice questions clear enough, or do you need more help?',
        '不是获得入境结果。',
        'clear',
        'They are clear enough for me now.',
        'help',
        'I would like more help with the wording.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A2.ending, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'uncertain',
        'limit-claim',
        'What would you do if you were unsure of one of the details?',
        '不发明答案。',
        'check',
        'I would check my notes before answering.',
        'admit',
        'I would say that I am not sure.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A2.uncertain, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'privacy',
        'set-boundary',
        'How will you avoid sharing real personal numbers here?',
        '学习者只用虚构资料。',
        'fiction',
        'I will use only the example details.',
        'skip',
        'I will leave out any personal numbers.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.A2.privacy, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#immigration-interview — A2 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  B1: travelPack(
    scene,
    'B1',
    {
      canDoZh: '有条理说明短期访问与资料依据，诚实表达未确定事项。',
      complexityZh: '连接时间住宿与个人计划，区分记忆和书面证据。',
      scaffoldingZh: '固定日期酒店支持解释理由及核对请求。',
      registerZh: '正式问答中的自然口语，不作法律权利判断。',
    },
    [
      [
        'purpose',
        'state-purpose',
        'Could you explain the main reason for this short visit?',
        '只选一个主要目的。',
        'tourism',
        'The main reason is a holiday; I want time away from my usual routine.',
        'family',
        'The main reason is to see my cousin, whom I have not visited for a while.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B1.purpose, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'dates',
        'clarify-dates',
        'Would you rather state the dates from memory or refer to your written plan?',
        '同一日期，不改变天数。',
        'say',
        'I can state them: I plan to stay from September tenth to fifteenth.',
        'show',
        'I would rather refer to the plan, which gives September tenth to fifteenth.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B1.dates, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'stay',
        'confirm-stay',
        'What would you use to establish the name of your accommodation?',
        '共同住宿世界事实。',
        'name',
        'I can give the name directly: it is Harbour Hotel.',
        'show',
        'I would show the Harbour Hotel confirmation so the name is clear.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B1.stay, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'return',
        'provide-evidence',
        'What format is the return booking information available in?',
        '不虚构新增材料。',
        'paper',
        'I brought a printed copy so I can refer to it without a phone.',
        'phone',
        'It is saved on my phone, where I keep the travel information together.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B1.return, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'funds',
        'explain-support',
        'Can you explain how you intend to pay for the visit?',
        '资金来源自付，方式区别。',
        'card',
        'I will cover the costs myself using my own card.',
        'cash',
        'I have set aside my own cash to cover the travel costs.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B1.funds, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'language',
        'request-clarification',
        'What should you ask for if the question is difficult to follow?',
        '速度与词义困难不同。',
        'slow',
        'I would ask you to slow down because I may have missed part of it.',
        'simple',
        'I would ask you to put it in simpler words rather than pretend I understood.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B1.language, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'activity',
        'describe-plan',
        'How definite are your plans for visiting a museum?',
        '亲友访问仍可看博物馆。',
        'planned',
        'I want to include a museum, although I have not chosen which one.',
        'open',
        'That part is still open; I have not decided whether to include a museum.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B1.activity, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'address',
        'locate-record',
        'How would you find the full hotel address without guessing?',
        '明确资料来源。',
        'letter',
        'I would read it from the confirmation, rather than rely on a remembered street name.',
        'note',
        'I have recorded it in my travel notes and would check that entry.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B1.address, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'preparation',
        'explain-background',
        'What method did you use to prepare the trip information yourself?',
        '本人准备不暗示他人代理。',
        'paper',
        'I used a notebook because I find a paper checklist easy to follow.',
        'screen',
        'I organised it on a computer so I could keep related details together.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B1.preparation, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'ending',
        'confirm-understanding',
        'How would you describe your understanding at the end of this practice?',
        '可以承认还需练习。',
        'clear',
        'I understand the questions we covered and can explain the fictional details.',
        'help',
        'I understand the general topics, but I need more help expressing some answers.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B1.ending, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'uncertain',
        'limit-claim',
        'How would you respond if a requested detail was not clear in your memory?',
        '核对或直说不记得。',
        'check',
        'I would ask for a moment to check the information I brought.',
        'admit',
        'I would say that I do not remember clearly rather than supply a likely answer.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B1.uncertain, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'privacy',
        'set-boundary',
        'What boundary will you keep between this exercise and your real identity details?',
        '两安全做法。',
        'fiction',
        'I will answer using the fictional identity supplied for the exercise.',
        'skip',
        'I will practise the wording but leave personal numbers out of the answer.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B1.privacy, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#immigration-interview — B1 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  B2: travelPack(
    scene,
    'B2',
    {
      canDoZh: '精确说明目的与证据限度，管理不确定和理解修复。',
      complexityZh: '将固定安排、意向活动和资料来源区分，不作准入结论。',
      scaffoldingZh: '以给定虚构事实练条件和对比表达。',
      registerZh: '礼貌合作但不为显得确定而猜测。',
    },
    [
      [
        'purpose',
        'state-purpose',
        'How would you distinguish your main purpose from optional activities during the stay?',
        '博物馆不是固定主要目的。',
        'tourism',
        'The main purpose is a holiday; individual activities can be decided within that plan.',
        'family',
        'Visiting my cousin is the main purpose; any sightseeing would be secondary.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B2.purpose, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'dates',
        'clarify-dates',
        'Which approach would make the planned dates clearest in your answer?',
        '口述或书面同日期。',
        'say',
        'I would state September tenth to fifteenth explicitly, rather than give an approximate length of stay.',
        'show',
        'I would refer to the written plan for September tenth to fifteenth to avoid a date being misheard.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B2.dates, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'stay',
        'confirm-stay',
        'How would you make the accommodation name unambiguous?',
        '不是两家酒店。',
        'name',
        'I would give the full name, Harbour Hotel, rather than a shortened description.',
        'show',
        'I would show the Harbour Hotel confirmation so the interviewer can read the exact name.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B2.stay, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'return',
        'provide-evidence',
        'How would you present the return booking details if asked to clarify them?',
        '返程计划不是许可证据判断。',
        'paper',
        'I would use the printed copy as a stable reference for the planned return.',
        'phone',
        'I would open the saved booking on my phone without displaying unrelated information.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B2.return, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'funds',
        'explain-support',
        'How would you explain your payment arrangements without adding unnecessary financial detail?',
        '只练表达，不评估资金够不够。',
        'card',
        'I would say that I am paying my own travel costs by card, without adding account details in this exercise.',
        'cash',
        'I would explain that the travel costs come from my own cash budget, without giving real balances here.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B2.funds, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'language',
        'request-clarification',
        'How would you identify the kind of clarification you need?',
        '说明具体困难。',
        'slow',
        'If the pace is the problem, I would request slower delivery rather than a completely different question.',
        'simple',
        'If the wording is the problem, I would ask for a simpler formulation rather than just a louder repetition.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B2.language, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'activity',
        'describe-plan',
        'What can you say about a museum visit without overstating how much is arranged?',
        '两种明确程度不同。',
        'planned',
        'I intend to include a museum visit, but neither the venue nor the day is fixed.',
        'open',
        'I have not decided whether to visit a museum, so I would leave it as a possibility rather than a plan.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B2.activity, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'address',
        'locate-record',
        'Which reference would you consult to avoid an inaccurate hotel address?',
        '有两种可用记录。',
        'letter',
        'I would consult the confirmation letter instead of reconstructing the address from memory.',
        'note',
        'I would consult the address I recorded in my travel notes, rather than guess the missing part.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B2.address, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'preparation',
        'explain-background',
        'How did your chosen preparation method help you organise the trip details?',
        '本人自备资料。',
        'paper',
        'Writing a paper checklist helped me see missing details before I travelled.',
        'screen',
        'Preparing the information on a computer helped me group the booking details logically.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B2.preparation, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'ending',
        'confirm-understanding',
        'What would be an honest account of what this interview practice has achieved for you?',
        '不等同真实审查通过。',
        'clear',
        'The covered questions are clear, and I can use the fictional details to answer them.',
        'help',
        'The questions are more familiar, but I still need help phrasing some of the answers.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B2.ending, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'uncertain',
        'limit-claim',
        'How would you avoid turning uncertainty about a detail into an inaccurate answer?',
        '不从关键词推断答案。',
        'check',
        'I would request time to check the record before making a definite statement.',
        'admit',
        'I would explicitly say that I cannot recall the detail rather than present an estimate as fact.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B2.uncertain, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'privacy',
        'set-boundary',
        'How would you practise the exchange while keeping real identity information out of it?',
        '教学隐私边界非法律建议。',
        'fiction',
        'I would consistently use the supplied fictional identity so no real number is needed.',
        'skip',
        'I would practise the sentence structure with personal-number fields omitted.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.B2.privacy, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#immigration-interview — B2 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  C1: travelPack(
    scene,
    'C1',
    {
      canDoZh: '在正式问答中精确限定证据、意图与记忆，主动修复歧义。',
      complexityZh: '组织访问目的与未定活动，避免把计划说成完成或获准。',
      scaffoldingZh: '只提供虚构事实底板，练习有分寸的限定与范围说明。',
      registerZh: '自然正式而非法律论证；C1来源CEFR。',
    },
    [
      [
        'purpose',
        'state-purpose',
        'How would you state the principal purpose without allowing incidental activities to obscure it?',
        '同一行程容纳两种主目的。',
        'tourism',
        'This is primarily a holiday; the details of what I do each day are secondary to that purpose.',
        'family',
        'The visit is primarily to spend time with my cousin; any sightseeing would be incidental rather than a separate main purpose.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.C1.purpose, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'dates',
        'clarify-dates',
        'How would you give the intended dates precisely while reducing the risk of misunderstanding?',
        '日期固定10日至15日。',
        'say',
        'I would state the dates in full, September tenth to fifteenth, instead of relying on a relative phrase such as later this week.',
        'show',
        'I would refer to the written plan showing September tenth to fifteenth, allowing the dates to be checked directly rather than inferred from the duration.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.C1.dates, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'stay',
        'confirm-stay',
        'Which way of identifying the accommodation would best avoid an ambiguous reference?',
        '明确Harbour Hotel。',
        'name',
        'I would use the full name, Harbour Hotel, rather than assume that a general reference to a hotel near the harbour identifies it.',
        'show',
        'I would present the Harbour Hotel confirmation so the exact name is available without depending on how it is pronounced.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.C1.stay, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'return',
        'provide-evidence',
        'How would you make the planned return information available without widening the disclosure unnecessarily?',
        '不提供真实账户数据。',
        'paper',
        'I would present the relevant printed booking, keeping the discussion tied to the planned return rather than unrelated papers.',
        'phone',
        'I would open the saved return booking itself, rather than hand over an unrestricted view of the contents of my phone.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.C1.return, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'funds',
        'explain-support',
        'What concise explanation would establish who is covering the trip without introducing irrelevant detail?',
        '自付，支付方式有别。',
        'card',
        'I am covering the travel costs myself by card; that explains the arrangement without adding real account information to a practice answer.',
        'cash',
        'I have allocated my own cash for the travel expenses; I would keep the explanation focused on that arrangement.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.C1.funds, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'language',
        'request-clarification',
        'How would you distinguish a difficulty with delivery from a difficulty with meaning?',
        '明确慢说或改述。',
        'slow',
        'The wording may be familiar but too quickly delivered, in which case I would ask for a slower repetition without changing the question.',
        'simple',
        'I may hear every word yet miss the meaning; then I would ask for a simpler formulation rather than another identical repetition.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.C1.language, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'activity',
        'describe-plan',
        'How would you describe the status of a possible museum visit accurately?',
        '区分意图与可能。',
        'planned',
        'I intend to visit a museum, while leaving the choice of venue and day open; the intention is firmer than the arrangements.',
        'open',
        'A museum visit remains a possibility, but I have not decided to include it and would not present it as an established plan.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.C1.activity, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'address',
        'locate-record',
        'What would you rely on if an exact hotel address was needed rather than an approximate location?',
        '不凭空推断。',
        'letter',
        'I would read the address from the confirmation letter, since knowing roughly where the hotel is would not supply an exact address.',
        'note',
        'I would consult the address recorded in my notes instead of filling a gap in memory with a plausible street name.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.C1.address, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'preparation',
        'explain-background',
        'How did you organise the information you prepared for the visit?',
        '具体准备方法，不空泛自夸。',
        'paper',
        'I prepared a paper checklist, which made omissions visible without requiring me to move between several screens.',
        'screen',
        'I organised the records on a computer, grouping each booking with the details needed to explain it.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.C1.preparation, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'ending',
        'confirm-understanding',
        'How would you qualify your understanding of the exchange without overstating your progress?',
        '语言学习结论非入境结论。',
        'clear',
        'I can follow the questions covered here and explain the fictional details, while recognising that this is a bounded practice exchange.',
        'help',
        'The topics are clear to me, but some formulations still need work; familiarity should not be mistaken for effortless expression.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.C1.ending, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'uncertain',
        'limit-claim',
        'How would you handle a detail you could plausibly infer but could not reliably recall?',
        '明确拒绝猜测。',
        'check',
        'I would ask to consult the record before answering; a plausible inference would not justify presenting the detail as remembered fact.',
        'admit',
        'I would say that I cannot recall it reliably, rather than make the answer sound more certain than my knowledge allows.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.C1.uncertain, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'privacy',
        'set-boundary',
        'What approach keeps the language exercise useful without turning it into a collection of real identity data?',
        '安全练习策略，不推导权利。',
        'fiction',
        'Using the supplied fictional identity throughout preserves the communicative task without needing real personal identifiers.',
        'skip',
        'I would retain the surrounding language but omit personal-number fields, making the omission explicit rather than inventing a real-looking record.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#immigration-interview — immigration-interview.C1.privacy, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#immigration-interview — C1 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
}
