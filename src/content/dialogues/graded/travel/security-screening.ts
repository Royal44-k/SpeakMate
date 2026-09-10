import { travelPack, type Scene } from './authoring'
const scene: Scene = {
  sceneId: 'travel-02',
  slug: 'security-screening',
  situations: [
    '虚构安检练习。你带一个背包、一台笔记本电脑、一只空水瓶和外套，口袋里有手机和钥匙。桌上已有两个托盘，周围比较嘈杂。此练习通道要求电脑单独放盘，空瓶留包内；其他步骤先问工作人员，不推断真实机场规则。你可要求慢说或保留对额外问题的回应。短练只练习理解指示，不代表已通过安检。',
    '虚构安检协助通道。你带背包、笔记本电脑、空水瓶和外套，口袋有手机和钥匙。桌上已有两个托盘，周围有噪音。此练习要求电脑单独放盘、空瓶留包内；你不熟悉流程，需要额外问清物品认领和隐私协助。不是现实安检指南，没有任何物品已获许可或已检查。',
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
    'This screening communication practice is complete. We have discussed instructions and requests, not cleared you or your belongings through security.',
  partial:
    'We will pause the practice with some screening details still unconfirmed. This is not a security clearance.',
  repairs: {
    clarify:
      'I can repeat the current instruction question without assuming you understood it.',
    struggle:
      'Take one item at a time. You may ask for help with the current question.',
    offTopic: 'Let us return to the screening instruction we are practising.',
    unknown:
      'This local exercise does not recognise that wording. No screening step has been confirmed.',
    changed: 'Your response has been revised in the practice record only.',
    refusedClosing:
      'We will stop the practice. This does not describe an actual security decision.',
  },
}
export const securityPacks = {
  A1: travelPack(
    scene,
    'A1',
    {
      canDoZh: '在重复和示范支架下说明物品并确认简单指示。',
      complexityZh: '一次处理电脑、空瓶或口袋物品，不推断真实规定。',
      scaffoldingZh: '问题给出具体物件及位置，提供简短请求。',
      registerZh: '基本礼貌，能说不明白及拒绝无关问题。',
    },
    [
      [
        'pace',
        'request-pace',
        'Shall I speak slowly or show you the steps?',
        '选择慢说或演示。',
        'slow',
        'Slowly, please.',
        'show',
        'Please show me.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A1.pace, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'laptop',
        'clarify-rule',
        'In this practice lane, the laptop goes in its own tray; is that clear?',
        '规则只属于本练习。',
        'clear',
        'Yes, its own tray.',
        'again',
        'Please say that again.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A1.laptop, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'bottle',
        'describe',
        'Your bottle is empty; is it plastic or metal?',
        '空瓶事实不变。',
        'plastic',
        'It is plastic.',
        'metal',
        'It is metal.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A1.bottle, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'pockets',
        'organise',
        'Will you take out your phone or your keys first?',
        '两样都有，只选择顺序。',
        'phone',
        'My phone first.',
        'keys',
        'My keys first.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A1.pockets, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'tray',
        'ask-equipment',
        'Do you need one more tray?',
        '表达需要，不声称已拿到。',
        'yes',
        'Yes, one more, please.',
        'no',
        'No, I have enough.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A1.tray, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'bag',
        'locate',
        'Is your backpack beside you or on the table?',
        '位置可选，不影响物品规则。',
        'beside',
        'It is beside me.',
        'table',
        'It is on the table.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A1.bag, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'coat',
        'check-instruction',
        'Do you want to ask about your coat before moving on?',
        '有外套；尚无脱外套要求。',
        'ask',
        'Yes, should I take it off?',
        'none',
        'No, I am carrying it.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A1.coat, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'wait',
        'follow-sequence',
        'Would you like me to point to the waiting line?',
        '不要把指线当准许通行。',
        'yes',
        'Yes, please point to it.',
        'no',
        'No, I can see it.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A1.wait, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'repeat',
        'repair-hearing',
        'Did you hear the instruction about leaving the empty bottle in the bag?',
        '核实听清，不检查物品。',
        'heard',
        'Yes, leave it in the bag.',
        'repeat',
        'No, please repeat it.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A1.repeat, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'ready',
        'confirm-next',
        'Are you ready to ask the officer for the next step?',
        '下一步由工作人员给出。',
        'ready',
        'Yes, I am ready to ask.',
        'wait',
        'Not yet. I need a moment.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A1.ready, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'claim',
        'identify-items',
        'How will you find your backpack after the practice check?',
        '颜色由回答建立。',
        'blue',
        'It is the blue backpack.',
        'red',
        'It is the red backpack.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A1.claim, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'privacy',
        'set-boundary',
        'Would you like help away from the queue?',
        '可接受私下协助或拒绝。',
        'private',
        'Yes, somewhere quiet, please.',
        'here',
        'No, here is fine.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A1.privacy, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#security-screening — A1 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  A2: travelPack(
    scene,
    'A2',
    {
      canDoZh: '在常见安检交换中说明物品位置并请求具体帮助。',
      complexityZh: '按次序处理物件，区别听懂与已经完成。',
      scaffoldingZh: '明确虚构通道条件，允许重复示范和短理由。',
      registerZh: '简短直接的礼貌协作，不假装懂得未给规则。',
    },
    [
      [
        'pace',
        'request-pace',
        'What would help you follow the screening steps?',
        '选择慢说或演示。',
        'slow',
        'Please speak more slowly so I can follow.',
        'show',
        'Could you show me one step at a time?',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A2.pace, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'laptop',
        'clarify-rule',
        'Can you explain where the laptop should go in this exercise?',
        '电脑独立盘，允许再问。',
        'clear',
        'It should go in a separate tray.',
        'check',
        'Do you mean a tray with nothing else in it?',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A2.laptop, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'bottle',
        'describe',
        'What kind of empty bottle are you carrying?',
        '只能描述，非准许判断。',
        'plastic',
        'I have an empty plastic bottle.',
        'metal',
        'Mine is an empty metal bottle.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A2.bottle, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'pockets',
        'organise',
        'Which pocket item will you put in a tray first?',
        '手机钥匙均存在。',
        'phone',
        'I will take out my phone first.',
        'keys',
        'I will put my keys in first.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A2.pockets, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'tray',
        'ask-equipment',
        'Have you got enough trays for the items we have discussed?',
        '可请求多一只。',
        'extra',
        'Could I have another tray, please?',
        'enough',
        'Yes, these trays are enough for me.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A2.tray, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'bag',
        'locate',
        'Where have you put the backpack while we talk?',
        '位置不暗示已经扫描。',
        'beside',
        'I have kept it beside me.',
        'table',
        'I have put it on the table.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A2.bag, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'coat',
        'check-instruction',
        'Do you need any information about handling your coat?',
        '询问不同于执行。',
        'ask',
        'Yes, do I need to remove it in this lane?',
        'carry',
        'No, thanks. I already have it in my hand.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A2.coat, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'wait',
        'follow-sequence',
        'Would pointing out the waiting line make the next step clearer?',
        '只问是否需要指示。',
        'yes',
        'Yes, I am not sure which line you mean.',
        'no',
        'No, I can see the line clearly now.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A2.wait, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'repeat',
        'repair-hearing',
        'Would you like the empty-bottle instruction repeated?',
        '空瓶放包里为场景事实。',
        'yes',
        'Yes, I missed that part of the explanation.',
        'no',
        'No, I heard that it stays in my bag.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A2.repeat, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'ready',
        'confirm-next',
        'Would you like a moment before asking what to do next?',
        '不发出通行保证。',
        'moment',
        'Yes, I need a moment to organise my things.',
        'ready',
        'No, I am ready to ask for the next step.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A2.ready, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'claim',
        'identify-items',
        'What will help you recognise your backpack when collecting it?',
        '标记与位置分开。',
        'blue',
        'It is blue with a small white label.',
        'red',
        'It is red with a black handle.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A2.claim, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'privacy',
        'set-boundary',
        'Would you prefer to discuss your question somewhere quieter?',
        '可以拒绝换地方。',
        'private',
        'Yes, it is hard to hear beside the queue.',
        'here',
        'No, thank you. I can ask it here.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.A2.privacy, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#security-screening — A2 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  B1: travelPack(
    scene,
    'B1',
    {
      canDoZh: '解释理解困难与物品安排，检查非例行指示。',
      complexityZh: '建立先后次序和澄清范围，避免把问题视为已执行。',
      scaffoldingZh: '情境限定物件，答案连接理由而不新增法规。',
      registerZh: '合作、清楚地表达暂缓和隐私偏好。',
    },
    [
      [
        'pace',
        'request-pace',
        'How can I make the instructions easier for you to follow in this noisy area?',
        '选择表达方式并给理由。',
        'slow',
        'Please slow down because I am losing some words in the noise.',
        'show',
        'A demonstration would help because I do not know this layout.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B1.pace, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'laptop',
        'clarify-rule',
        'What would you like to check about the separate laptop tray?',
        '不假定所有机场同规则。',
        'clear',
        'I understand the laptop needs its own tray in this exercise.',
        'empty',
        'I would like to check whether the tray should contain only the laptop.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B1.laptop, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'bottle',
        'describe',
        'Could you describe the bottle you are carrying?',
        '只说明材质和状态。',
        'plastic',
        'It is an empty plastic bottle that I use for water.',
        'metal',
        'It is made of metal and contains nothing at the moment.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B1.bottle, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'pockets',
        'organise',
        'How would you organise removing the two items from your pockets?',
        '保持手机和钥匙两物件。',
        'phone',
        'I would remove the phone first so I can put it somewhere visible.',
        'keys',
        'I would take out the keys first because they are easy to overlook.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B1.pockets, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'tray',
        'ask-equipment',
        'Would another tray help you keep the items separate?',
        '是否需要由答案选择。',
        'extra',
        'Yes, I would rather have another tray than crowd the items together.',
        'enough',
        'No, the trays I have give me enough room to organise them.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B1.tray, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'bag',
        'locate',
        'Where is the backpack while you deal with the loose items?',
        '地点不等于已完成检查。',
        'beside',
        'It is beside me, where I can keep track of it.',
        'table',
        'It is on the table, separate from the loose items.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B1.bag, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'coat',
        'check-instruction',
        'What would you like to establish about your coat before proceeding?',
        '没有未给出的强制要求。',
        'ask',
        'I would like to ask whether this lane requires me to remove it.',
        'carry',
        'I am already carrying it, so I do not need a removal instruction.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B1.coat, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'wait',
        'follow-sequence',
        'Do you need help identifying where to wait for further instructions?',
        '未获准通过。',
        'point',
        'Yes, please point out the line so I do not stop in the wrong place.',
        'clear',
        'No, the line is clear; I will wait for the next instruction.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B1.wait, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'repeat',
        'repair-hearing',
        'How well did you catch the instruction about the empty bottle?',
        '允许保留未听清状态。',
        'clear',
        'I heard that it stays in the bag for this practice lane.',
        'missed',
        'I missed the last part, so I would rather hear it again than guess.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B1.repeat, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'ready',
        'confirm-next',
        'What do you need before you ask the officer for the next instruction?',
        '可准备好或暂缓。',
        'time',
        'I need a moment to finish organising the loose items.',
        'ready',
        'Nothing more at this point; I am ready to ask what comes next.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B1.ready, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'claim',
        'identify-items',
        'How would you distinguish your backpack from a similar one?',
        '建立新认领特征。',
        'label',
        'Mine is blue and has a white label near the handle.',
        'handle',
        'Mine is red with a black handle, which helps me recognise it.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B1.claim, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'privacy',
        'set-boundary',
        'Would moving away from the queue make it easier to ask your question?',
        '不保证实际另有房间。',
        'private',
        'Yes, I would prefer to ask without everyone nearby hearing me.',
        'here',
        'No, the question is straightforward and I am comfortable asking here.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B1.privacy, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#security-screening — B1 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  B2: travelPack(
    scene,
    'B2',
    {
      canDoZh: '协商解释方式并区分物品陈述、流程理解及安全决定。',
      complexityZh: '处理噪音和隐私需求，清楚限定尚未确认的步骤。',
      scaffoldingZh: '固定物件支持较长解释、对比与条件表达。',
      registerZh: '不抵触也不盲从，礼貌要求具体指示。',
    },
    [
      [
        'pace',
        'request-pace',
        'Which adjustment would make the explanation practical for you to follow?',
        '不必假装已听懂。',
        'slow',
        'A slower pace would help me separate the instructions from the background noise.',
        'show',
        'Showing the sequence would be more useful than repeating the entire explanation at the same speed.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B2.pace, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'laptop',
        'clarify-rule',
        'Is the separate-tray requirement sufficiently specific, or does it need clarification?',
        '仅本练习电脑独立盘。',
        'clear',
        'It is specific enough: the laptop needs a tray of its own in this lane.',
        'contents',
        'I would clarify whether anything may share that tray before arranging the items.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B2.laptop, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'bottle',
        'describe',
        'Could you tell me what the bottle is made of and whether there is anything in it?',
        '不作许可判断。',
        'plastic',
        'It is a plastic bottle, and it is completely empty. I can show it to you if you need a closer look.',
        'metal',
        'It is a metal bottle with nothing in it. Please let me know if you need a closer look.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B2.bottle, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'pockets',
        'organise',
        'What order would help you keep track of the phone and keys?',
        '两物件顺序不影响后续。',
        'phone',
        'I would start with the phone because I want to keep it visible while handling smaller items.',
        'keys',
        'I would remove the keys first to avoid overlooking them when concentrating on the phone.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B2.pockets, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'tray',
        'ask-equipment',
        'Would you request extra space or work with the trays already available?',
        '不声称设备已提供。',
        'extra',
        'I would request another tray so the items can remain clearly separated.',
        'enough',
        'I would use the available trays; there is enough space without taking another.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B2.tray, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'bag',
        'locate',
        'Where is the backpack while we clarify the instructions?',
        '地点与检查状态分离。',
        'beside',
        'I have kept it beside me so I can keep track of it while listening.',
        'table',
        'It is on the table within sight, separate from the loose items we are discussing.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B2.bag, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'coat',
        'check-instruction',
        'Is there an unresolved question about your coat that we should address now?',
        '未知通道要求需要问。',
        'ask',
        'Yes, I want to check the instruction for this lane rather than rely on another airport’s routine.',
        'carry',
        'No, I am already holding the coat, so the question of taking it off does not arise.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B2.coat, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'wait',
        'follow-sequence',
        'Would you prefer a visible indication of the waiting point or is the location already clear?',
        '只明确等候地点。',
        'point',
        'Please point it out; a visible reference would prevent a misunderstanding about where to stop.',
        'clear',
        'The location is clear, and I will wait there for further instructions.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B2.wait, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'repeat',
        'repair-hearing',
        'Do you need the bottle instruction repeated before treating it as understood?',
        '澄清不算执行。',
        'repeat',
        'Yes, I caught the reference to the bottle but not what I was meant to do with it.',
        'understood',
        'No, I understood that the empty bottle stays inside the bag in this exercise.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B2.repeat, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'ready',
        'confirm-next',
        'Would a brief pause improve your readiness to ask for the next step?',
        '不推断已经准备好。',
        'pause',
        'Yes, a short pause would let me organise the items without losing track of them.',
        'ready',
        'No pause is needed; I am ready to ask the officer what to do next.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B2.ready, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'claim',
        'identify-items',
        'Which distinguishing feature would you use when identifying your backpack?',
        '认领描述非所有权证明。',
        'label',
        'I would describe the white label on my blue backpack rather than identify it by colour alone.',
        'handle',
        'I would mention the black handle on the red backpack to make the description more specific.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B2.claim, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'privacy',
        'set-boundary',
        'What setting would make you comfortable raising your remaining question?',
        '尊重不愿私下移步或希望隐私。',
        'private',
        'A quieter spot away from the queue would let me ask without sharing the details with bystanders.',
        'here',
        'I am comfortable asking here, provided we keep the discussion focused on the screening step.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.B2.privacy, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#security-screening — B2 counter/assistance situations, paths, endings and repairs read 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
    },
  ),
  C1: travelPack(
    scene,
    'C1',
    {
      canDoZh: '精确修复程序理解并在工作人员职责范围内提出具体疑问。',
      complexityZh: '分开可观察描述、流程推断和最终决定，协商隐私与解释方式。',
      scaffoldingZh: '仅事实边界与备选策略，不用抽象填充提升等级。',
      registerZh: '合作而有分寸的正式口语，C1依据CEFR。',
    },
    [
      [
        'pace',
        'request-pace',
        'What change would make the explanation usable without omitting any necessary steps?',
        '寻求方式变化而非跳过步骤。',
        'slow',
        'Please keep the detail but slow the delivery; it is the pace, not the amount of information, that I am struggling with.',
        'show',
        'A step-by-step demonstration would help me connect the instructions to the layout without asking you to leave anything out.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.C1.pace, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'laptop',
        'clarify-rule',
        'Does “a tray of its own” leave any practical ambiguity for you?',
        '精确澄清共享托盘边界。',
        'clear',
        'No; I understand it to mean a separate tray for the laptop in this exercise, without generalising to other lanes.',
        'contents',
        'I would like to clarify whether that excludes every other item, rather than assume that a small object would be an exception.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.C1.laptop, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'bottle',
        'describe',
        'Could you describe the bottle for me, including what it is made of and whether it contains anything?',
        '观察与决定严格分开。',
        'plastic',
        'It is made of plastic and is completely empty. If you need to see it more closely, please tell me where to put it.',
        'metal',
        'It is a metal bottle, and there is nothing in it. I can take it out for you to look at if you would like me to.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.C1.bottle, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'pockets',
        'organise',
        'Which sequence would reduce the chance of losing track of the loose items?',
        '保持两物件并给具体策略。',
        'phone',
        'I would set the phone down visibly first, then deal with the keys rather than juggle both at once.',
        'keys',
        'I would remove the easily overlooked keys first, leaving the more conspicuous phone until the next step.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.C1.pockets, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'tray',
        'ask-equipment',
        'Is an additional tray necessary for the arrangement you intend, or merely convenient?',
        '真正区分需要与无需多占。',
        'extra',
        'I would ask for one because the arrangement needs more space to keep the items separate, not simply because an extra tray is available.',
        'enough',
        'The current trays provide enough room, so convenience alone would not lead me to request another.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.C1.tray, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'bag',
        'locate',
        'Where have you kept the backpack while making room for the other items?',
        '说明当前位置，不捏造完成。',
        'beside',
        'I have kept it beside me rather than add it to the table before the loose items are organised.',
        'table',
        'I have placed it on the table, far enough from the loose items to keep the two groups distinct.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.C1.bag, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'coat',
        'check-instruction',
        'What, if anything, needs settling about your coat before the next instruction?',
        '条件不同仍保持连贯。',
        'ask',
        'I need the lane-specific instruction clarified; remembering a different airport’s procedure would not settle what is required here.',
        'carry',
        'Nothing concerning removal, since I am already carrying it; I would still follow whatever handling instruction comes next.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.C1.coat, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'wait',
        'follow-sequence',
        'Would an explicit indication of the waiting point remove any remaining uncertainty?',
        '不把等候点当通过许可。',
        'point',
        'Yes, please indicate the exact line; I would rather resolve the location now than interpret a gesture incorrectly later.',
        'clear',
        'The line itself is unambiguous, so I can wait there without taking that as permission to proceed beyond it.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.C1.wait, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'repeat',
        'repair-hearing',
        'Which part of the empty-bottle instruction, if any, remains unclear?',
        '允许整个动作未听清。',
        'repeat',
        'I caught the part about the bottle, but the noise drowned out what I should do with it. Could you repeat that part?',
        'clear',
        'The instruction is clear: the empty bottle stays in the bag. I will leave it there unless you ask me to take it out.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.C1.repeat, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'ready',
        'confirm-next',
        'What would allow you to move to the next instruction without rushing the current preparation?',
        '暂缓与准备好都合理。',
        'pause',
        'Could I have a moment to organise the loose items? I would find it easier to follow the next instruction once they are in place.',
        'ready',
        'The preparation is clear enough for me to ask for the next instruction; I do not need a further pause at this point.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.C1.ready, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'claim',
        'identify-items',
        'What features would help me pick out your backpack from the others?',
        '描述限度明确。',
        'label',
        'Mine is the blue backpack with a white label. The label should help distinguish it from the other blue bags.',
        'handle',
        'It is the red backpack with a black handle; that combination may be easier to spot than the colour alone.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.C1.claim, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'privacy',
        'set-boundary',
        'How would you express your preference about where to raise a sensitive question?',
        '不把隐私请求变成真实安排。',
        'private',
        'Is there somewhere away from the queue where I could ask? I would prefer not to discuss the details within everyone’s hearing.',
        'here',
        'I am comfortable remaining here as long as we keep the exchange to the necessary procedural detail.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#security-screening — security-screening.C1.privacy, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#security-screening — C1 counter/assistance situations, paths, endings and repairs read 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
    },
  ),
}
