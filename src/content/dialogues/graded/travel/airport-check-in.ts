import { travelPack, type Scene } from './authoring'

const scene: Scene = {
  sceneId: 'travel-01',
  slug: 'airport-check-in',
  situations: [
    '虚构机场值机柜台。你是Alex Chen，今天乘SM204直飞Oslo，16:00起飞；有护照、电子订位确认、一只18千克箱子和小背包。箱子已由自己整理。此练习柜台允许一只20千克内托运行李，不讨论真实航空政策。座位、标签、提醒方式仍可选择。短练只表达证件、航班核对和行李需求，不代表已值机。',
    '虚构机场协助柜台。你是Alex Chen，今天乘SM204直飞Oslo，16:00起飞；有护照和电子订位确认，一只自己整理的18千克箱子及小背包。练习柜台的一件20千克托运额度是情境条件，不是真实规则。你需要额外核对行李提取和去登机口的方法；所有选择只是讨论，未签发登机牌。',
  ],
  paths: [
    [
      [1, 2, 3],
      [1, 2, 3, 4, 5, 6],
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    ],
    [
      [1, 3, 2],
      [1, 3, 2, 4, 5, 6],
      [1, 3, 2, 4, 5, 6, 7, 8, 11, 12],
    ],
  ],
  closing:
    'That completes this check-in conversation practice. Your stated requests are recorded for the exercise; no boarding pass or baggage tag has been issued.',
  partial:
    'We have practised part of the check-in conversation. Any unconfirmed details remain open; no check-in has taken place.',
  repairs: {
    clarify:
      'I can repeat the current check-in question. Please use the displayed choices if they fit.',
    struggle:
      'Take your time. A short answer about the current travel detail is enough.',
    offTopic: 'Let us return to the current check-in detail.',
    unknown:
      'That wording is not in this local exercise. I have not confirmed a document, bag or seat from it.',
    changed: 'Your earlier request has been revised within the exercise only.',
    refusedClosing:
      'We will stop this check-in practice here. No travel arrangements have been changed.',
  },
}
export const airportPacks = {
  A1: travelPack(
    scene,
    'A1',
    {
      canDoZh: '借助明确二选一核对证件、航班和一件行李。',
      complexityZh: '单个具体信息逐项表达；拓展增加标签与指路。',
      scaffoldingZh: '情境先给姓名航班和重量，允许重复及短语回答。',
      registerZh: '简单柜台礼貌用语，可拒绝附加选择。',
    },
    [
      [
        'document',
        'identify',
        'May I see your passport or booking confirmation first?',
        '选择先出示哪份资料。',
        'passport',
        'Here is my passport.',
        'booking',
        'Here is my booking confirmation.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A1.document, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'flight',
        'verify',
        'Shall we check the flight number or departure time first?',
        'SM204和16:00已给出，选择核对项目。',
        'number',
        'The flight number, please.',
        'time',
        'The departure time, please.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A1.flight, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'bag',
        'declare',
        'Is the suitcase your only bag to check in?',
        '背包随身；可先问额度。',
        'one',
        'Yes, one suitcase.',
        'ask',
        'What is the bag limit, please?',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A1.bag, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'seat',
        'prefer',
        'Would you like a window seat or an aisle seat?',
        '只是偏好，未分配座位。',
        'window',
        'A window seat, please.',
        'aisle',
        'An aisle seat, please.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A1.seat, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'weight',
        'clarify',
        'Your case weighs eighteen kilos; is the display clear?',
        '读数已提供，可要求再展示。',
        'clear',
        'Yes, I can read it.',
        'show',
        'Please show me the number again.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A1.weight, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'packing',
        'explain',
        'Did you pack the suitcase yourself?',
        '两答都保留自己整理的事实。',
        'alone',
        'Yes, I packed it alone.',
        'help',
        'Yes. A friend helped me close it.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A1.packing, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'tag',
        'check-label',
        'Should we check your name or Oslo on the sample tag first?',
        '标签是示例，不是真实托运凭证。',
        'name',
        'My name, please.',
        'destination',
        'Oslo, please.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A1.tag, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'notice',
        'request',
        'Would you like the boarding information on paper?',
        '选择信息形式，不表示已签发。',
        'paper',
        'Yes, on paper, please.',
        'screen',
        'On the screen, please.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A1.notice, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'fee',
        'decline-extra',
        'Do you want to ask about a paid seat upgrade?',
        '可以不问付费升级。',
        'ask',
        'Yes, what is the price?',
        'no',
        'No, thank you.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A1.fee, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'next',
        'confirm-next',
        'Will you check the departure board or ask at the gate next?',
        '这是准备做的下一步。',
        'board',
        'I will check the board.',
        'gate',
        'I will ask at the gate.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A1.next, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'collection',
        'locate',
        'Do you need help finding baggage information for Oslo?',
        '未发生行李运输。',
        'help',
        'Yes, where can I find it?',
        'no',
        'No, I can find it.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A1.collection, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'route',
        'navigate',
        'Would a map or spoken directions help you reach the gate area?',
        '选择指路方式，不虚构登机口号。',
        'map',
        'A map, please.',
        'spoken',
        'Please tell me the way.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A1.route, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#airport-check-in — A1 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  A2: travelPack(
    scene,
    'A2',
    {
      canDoZh: '连贯完成值机信息交换，说明简单偏好并请求核实。',
      complexityZh: '连接证件顺序、重量和信息呈现，保持未出票状态。',
      scaffoldingZh: '给出具体数值，问句提供有限选项与因果支架。',
      registerZh: '常用礼貌请求；能够拒绝额外消费。',
    },
    [
      [
        'document',
        'identify',
        'Which would you like to hand over first, your passport or the confirmation?',
        '两份都存在，只选先后。',
        'passport',
        'I will show my passport first.',
        'booking',
        'I have the confirmation open on my phone.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A2.document, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'flight',
        'verify',
        'Which detail on SM204 would you like me to check with you?',
        '可核对目的地或时间。',
        'destination',
        'Please check that it goes to Oslo.',
        'time',
        'Please check the four o’clock departure.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A2.flight, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'bag',
        'declare',
        'How would you like to handle your eighteen-kilo suitcase?',
        '限额20千克为虚构条件，背包随身。',
        'check',
        'I would like to check it in.',
        'confirm',
        'Could you confirm that it is within the allowance first?',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A2.bag, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'seat',
        'prefer',
        'Which seat would make the journey easier for you?',
        '说明简单偏好原因。',
        'window',
        'A window seat, because I like the view.',
        'aisle',
        'An aisle seat, so I can get up easily.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A2.seat, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'weight',
        'clarify',
        'Would you like to read the scale yourself or hear the weight again?',
        '同一重量可换说明方式。',
        'read',
        'I would like to read the display myself.',
        'repeat',
        'Could you say the weight once more?',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A2.weight, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'packing',
        'explain',
        'Was anyone with you when you packed your case?',
        '自己整理不排除朋友在场。',
        'alone',
        'No, I packed it on my own.',
        'friend',
        'My friend was there, but I chose what to pack.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A2.packing, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'tag',
        'check-label',
        'What would you check first on the practice baggage label?',
        '姓名与目的地都可核对。',
        'name',
        'I would check the spelling of Alex Chen.',
        'destination',
        'I would check that Oslo is printed on it.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A2.tag, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'notice',
        'request',
        'How would you prefer to read the boarding instructions?',
        '只请求说明。',
        'paper',
        'Could I have a printed copy to keep?',
        'screen',
        'The screen is easier for me to read.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A2.notice, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'fee',
        'decline-extra',
        'Would you like information about the optional seat upgrade?',
        '可以询价，也可以拒绝。',
        'ask',
        'Yes, but please tell me the cost before I decide.',
        'no',
        'No, thanks. I do not need an upgrade.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A2.fee, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'next',
        'confirm-next',
        'Where will you check for a possible gate change?',
        '不承诺实际航班状态。',
        'board',
        'I will look at the departure board.',
        'desk',
        'I will ask a member of staff near the gate.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A2.next, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'collection',
        'locate',
        'How could we help you with the arrival baggage information?',
        '选择阅读或口头说明。',
        'written',
        'Please show me where the information is written.',
        'explain',
        'Could you explain where to check after arrival?',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A2.collection, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'route',
        'navigate',
        'Would you prefer a marked route or a short explanation of the way?',
        '指向登机区域，不假定特定登机口。',
        'map',
        'Please mark the gate area on a map.',
        'spoken',
        'A short explanation would help me more.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.A2.route, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#airport-check-in — A2 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  B1: travelPack(
    scene,
    'B1',
    {
      canDoZh: '核对行程与行李限制，解释偏好及信息困难。',
      complexityZh: '在已知直飞行程上处理读数、可选费用和后续查询。',
      scaffoldingZh: '保留具体情境，允许带理由的有限答案和澄清。',
      registerZh: '自然服务交际；提问不表示同意购买。',
    },
    [
      [
        'document',
        'identify',
        'Would you rather start with the identity check or the booking reference?',
        '选择核对顺序。',
        'passport',
        'Let us start with my passport so you can check my name.',
        'booking',
        'The booking reference is ready on my phone, so let us start there.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B1.document, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'flight',
        'verify',
        'What part of the flight listing would you like to double-check?',
        '已知SM204直飞Oslo。',
        'direct',
        'Please check that this is the direct flight to Oslo.',
        'date',
        'Please confirm that the listing is for today, not tomorrow.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B1.flight, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'bag',
        'declare',
        'Are you ready to request check-in for the suitcase, or do you need the allowance explained?',
        '询问额度不自动确认托运。',
        'check',
        'I am ready to request check-in for this one suitcase.',
        'explain',
        'Please explain the allowance before I confirm the request.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B1.bag, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'seat',
        'prefer',
        'What matters most when you choose between a window and an aisle?',
        '两种请求都未得到真实保证。',
        'window',
        'I prefer the window because I would rather not be disturbed by people passing.',
        'aisle',
        'I prefer the aisle because I want to stand up without disturbing anyone.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B1.seat, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'weight',
        'clarify',
        'The scale reads eighteen kilos; what would help you verify that?',
        '不把重量改成另一数字。',
        'display',
        'Could you turn the display towards me so I can read it?',
        'repeat',
        'Could you repeat the figure slowly so I can compare it with my note?',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B1.weight, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'packing',
        'explain',
        'Can you explain your part in packing this suitcase?',
        '本人决定内容，朋友仅可协助合箱。',
        'alone',
        'I selected and packed everything myself, with nobody else there.',
        'friend',
        'I packed the contents myself; my friend only helped close the case.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B1.packing, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'tag',
        'check-label',
        'Which label detail would you prioritise before moving on?',
        '标签仍是练习样本。',
        'name',
        'The name, because a spelling error could make identification harder.',
        'destination',
        'The destination, because I want the sample label to match the direct route.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B1.tag, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'notice',
        'request',
        'What format would make the boarding instructions easiest to keep track of?',
        '选择说明格式，不确认登机牌。',
        'paper',
        'A paper copy would help because my phone battery is low.',
        'screen',
        'Showing them on the screen would be enough; I can make a note.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B1.notice, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'fee',
        'decline-extra',
        'Shall we discuss the upgrade price, without making a purchase?',
        '只问价格或拒绝讨论。',
        'ask',
        'Yes, I would compare the price before considering an upgrade.',
        'no',
        'No, I would prefer to keep the request limited to a standard seat.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B1.fee, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'next',
        'confirm-next',
        'How will you keep track of the gate information after this conversation?',
        '后续行动尚未发生。',
        'board',
        'I plan to check the board again before going to the gate.',
        'staff',
        'I will ask gate staff if the signs and my information do not match.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B1.next, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'collection',
        'locate',
        'What would you like clarified about collecting the suitcase at the destination?',
        '只确认信息查找，不作运输保证。',
        'where',
        'I would like to know where to look for the baggage belt information.',
        'help',
        'I would like to know which desk to ask if I cannot find the information.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B1.collection, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'route',
        'navigate',
        'Which kind of directions would help if you missed a sign on the way?',
        '可用图或地标说明。',
        'map',
        'A marked map would let me check the route without starting again.',
        'spoken',
        'An explanation using landmarks would be easier for me to follow.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B1.route, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#airport-check-in — B1 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  B2: travelPack(
    scene,
    'B2',
    {
      canDoZh: '权衡信息形式、附加费用及核实优先级。',
      complexityZh: '区分请求与确认，解释流程中的限制和误解风险。',
      scaffoldingZh: '固定行程提供语义边界，回答练习条件句和让步。',
      registerZh: '合作但不被动同意；拒绝保持具体且克制。',
    },
    [
      [
        'document',
        'identify',
        'How would you prefer to organise the document check?',
        '两资料可用，只选顺序。',
        'passport',
        'Please match the passport name first; we can then compare it with the booking.',
        'booking',
        'Let us locate the booking first, then match it against my passport.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B2.document, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'flight',
        'verify',
        'Which potential mismatch in the listing concerns you most?',
        '疑点不是既成错误。',
        'date',
        'A date mismatch would be serious, so I would like today’s departure verified.',
        'route',
        'I want to rule out a connection being added to what I understood was a direct route.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B2.flight, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'bag',
        'declare',
        'Would you confirm the suitcase request now or first review what the allowance includes?',
        '未确认时保留开放状态。',
        'check',
        'Please record a request to check this single suitcase; I understand the stated limit.',
        'review',
        'I would like to review the allowance before committing to the baggage request.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B2.bag, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'seat',
        'prefer',
        'How would you balance easy access against being less disturbed?',
        '不暗示座位已分配。',
        'aisle',
        'Easy access matters more, so I would request an aisle even if people pass nearby.',
        'window',
        'Being less disturbed matters more, so I would request a window despite the limited access.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B2.seat, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'weight',
        'clarify',
        'How should we resolve any uncertainty about the eighteen-kilo reading?',
        '读数已固定，讨论核实方式。',
        'view',
        'Let me see the display directly rather than rely on a figure I may have misheard.',
        'repeat',
        'Please repeat the number clearly; the background noise made the first reading hard to catch.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B2.weight, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'packing',
        'explain',
        'How would you distinguish packing the contents from help with closing the case?',
        '回答不虚构他人放入物品。',
        'alone',
        'I did both myself, so there was no outside involvement in packing or closing it.',
        'friend',
        'I packed all the contents; the only help I received was with closing the case.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B2.packing, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'tag',
        'check-label',
        'Which aspect of the sample label would you verify before we move on?',
        '优先级不同，未作真实托运。',
        'name',
        'I would verify the name against my passport, since a close spelling is not enough.',
        'destination',
        'I would verify Oslo against the itinerary, rather than assume the label is correct.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B2.tag, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'notice',
        'request',
        'What would make the boarding instructions accessible without relying on memory?',
        '选择可保留的信息。',
        'paper',
        'A printed copy would give me a stable reference if my phone runs out of power.',
        'screen',
        'A clear screen display would allow me to note the details without needing a printout.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B2.notice, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'fee',
        'decline-extra',
        'Would discussing a paid upgrade be useful, or would you rather exclude that option?',
        '可拒绝额外选项，不重新推销。',
        'ask',
        'I am willing to hear the total cost, but that should not be taken as agreement to pay.',
        'no',
        'Please exclude paid upgrades; I would like to focus on the standard options.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B2.fee, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'next',
        'confirm-next',
        'What is your plan if the gate information later differs from what you saw here?',
        '未来不一致是假设。',
        'board',
        'I would compare the latest board display before acting on the earlier information.',
        'staff',
        'I would ask staff to clarify the discrepancy rather than guess which version is current.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B2.next, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'collection',
        'locate',
        'What information would reduce uncertainty when you look for the suitcase on arrival?',
        '不保证行李一定到达。',
        'display',
        'Knowing where the belt information is displayed would help me check for myself.',
        'desk',
        'Knowing where the baggage enquiry desk is would help if the display is unclear.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B2.collection, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'route',
        'navigate',
        'Which navigation aid would be more useful in an unfamiliar terminal?',
        '选择学习者可用的支架。',
        'map',
        'A marked map would let me adjust if I took a wrong turn.',
        'spoken',
        'Landmark-based directions would be easier to follow than a list of corridor names.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.B2.route, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#airport-check-in — B2 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  C1: travelPack(
    scene,
    'C1',
    {
      canDoZh: '精确限定核实范围，处理身份、行程与收费的潜在歧义。',
      complexityZh: '区分观察、推断与授权，解释核对优先级且不反复确认。',
      scaffoldingZh: '仅保留事实底板和备选立场，运用自然限定而非礼貌堆叠。',
      registerZh: '专业柜台语域，明确边界但保持合作；依据CEFR而非BC C1页面。',
    },
    [
      [
        'document',
        'identify',
        'Which sequence would make the identity and booking checks clearest?',
        '排序不改变身份或订位。',
        'passport',
        'Please establish the name from my passport, then use it to cross-check the booking rather than the other way round.',
        'booking',
        'The reference should locate the booking quickly; we can then verify the identity details against the passport.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.C1.document, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'flight',
        'verify',
        'What would you like checked rather than inferred from the booking summary?',
        '明确需要核实的行程细节。',
        'date',
        'Please verify the departure date explicitly; a familiar flight number alone would not establish that this is today’s service.',
        'route',
        'Please verify that the itinerary is direct to Oslo; I would not want to infer that from a shortened destination display.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.C1.flight, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'bag',
        'declare',
        'Would you like me to note the suitcase request, or explain the allowance first?',
        '只在练习内授权请求，不是真实办理。',
        'check',
        'Please record my request to check the one suitcase under the allowance you have described.',
        'clarify',
        'I am asking for clarification first; please leave the baggage request unconfirmed until the allowance is clear.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.C1.bag, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'seat',
        'prefer',
        'Which compromise would you accept when expressing your seat preference?',
        '偏好带权衡，不变成承诺。',
        'window',
        'I would accept less convenient access in exchange for a window seat, provided we keep it as a preference rather than a guarantee.',
        'aisle',
        'I would accept some passing traffic for an aisle seat; being able to get up easily is the more important consideration.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.C1.seat, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'weight',
        'clarify',
        'What would settle the reading without introducing a second, conflicting figure?',
        '18千克读数不变。',
        'display',
        'Let me read the same display directly so we are checking one measurement rather than comparing recollections.',
        'repeat',
        'Please repeat eighteen kilos clearly; I need to confirm what I heard, not request a different weight.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.C1.weight, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'packing',
        'explain',
        'How would you describe the packing arrangements without overstating anyone else’s involvement?',
        '精确区分整理内容与合箱。',
        'alone',
        'I selected the contents, packed them and closed the suitcase myself; nobody else took part.',
        'friend',
        'I was responsible for selecting and packing the contents. My friend’s involvement was limited to helping close the suitcase.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.C1.packing, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'tag',
        'check-label',
        'Which check would you give priority on the illustrative baggage tag?',
        '说明先核对什么。',
        'name',
        'I would compare the full name with the passport first, rather than treat a recognisable approximation as sufficient.',
        'destination',
        'I would check the destination against the itinerary first, since an otherwise accurate label could still show the wrong destination.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.C1.tag, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'notice',
        'request',
        'Which format would let you refer back to the instructions reliably?',
        '只选择说明形式。',
        'paper',
        'A printed copy would remove my dependence on a phone whose battery may not last through the airport.',
        'screen',
        'A clear display would be sufficient for me to take a note; there is no need for a printed copy.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.C1.notice, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'fee',
        'decline-extra',
        'How would you like to handle the optional upgrade discussion?',
        '询价与接受收费严格分开。',
        'ask',
        'I am open to hearing the full price, on the understanding that an enquiry does not authorise a charge.',
        'no',
        'Let us leave paid upgrades out of the discussion; I would rather use the remaining time to check the essential details.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.C1.fee, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'next',
        'confirm-next',
        'How would you respond to conflicting gate information later in the terminal?',
        '未来情况，不替真实工作人员确认。',
        'board',
        'I would check the latest display before relying on an earlier note, while keeping track of the flight number.',
        'staff',
        'I would ask staff to reconcile the two versions; choosing whichever seems more convenient would not resolve the uncertainty.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.C1.next, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'collection',
        'locate',
        'What clarification about arrival baggage information would be most useful now?',
        '不声称运输结果。',
        'display',
        'I would like to know where to find the current belt listing, without treating that as a guarantee about the suitcase’s arrival.',
        'desk',
        'I would like to identify the enquiry point in advance, so an unclear display does not leave me guessing where to seek help.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.C1.collection, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'route',
        'navigate',
        'What would make directions usable if you lost your bearings halfway there?',
        '地图或地标，不重复核对航班。',
        'map',
        'A marked map would let me reorient myself from my actual position rather than restart the instructions from memory.',
        'spoken',
        'A few distinctive landmarks would help me recover the route more effectively than a rapid list of turns.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#airport-check-in — airport-check-in.C1.route, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#airport-check-in — C1 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
}
