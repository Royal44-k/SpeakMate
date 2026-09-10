import { travelPack, type Scene } from './authoring'
const scene: Scene = {
  sceneId: 'travel-03',
  slug: 'flight-connection',
  situations: [
    '虚构机场信息协助点，尚未到转机柜台。你是Alex Chen，现有行程今天由Helsinki转SM310去Oslo；前段延误，余下转机时间只有25分钟。Oslo有接待人等你。你有可在手机或纸上查看的登机信息和托运行李凭条，但行李去向待核实。协助人员只能讨论查询方案，未改票。短练明确剩余时间、查询渠道和行程优先级。',
    '虚构机场信息协助点，尚未到转机柜台。你是Alex Chen，前段延误后在Helsinki只剩25分钟衔接今天SM310去Oslo；有手机及纸质登机信息和行李凭条，Oslo的接待人在等你。你需额外讨论无法确认当天衔接时的过夜查询与材料记录。候选替代航班没有可用座位或价格保证；25分钟并非建议的转机标准。',
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
    'You have completed this connection enquiry practice. Any proposed route, baggage handling or ticket change still needs confirmation from the relevant staff.',
  partial:
    'We have covered only part of the connection enquiry. Unconfirmed flight and baggage details remain unresolved.',
  repairs: {
    clarify:
      'We can clarify the current connection question before discussing another detail.',
    struggle:
      'Focus on one part of the journey. You can use a short answer or ask for repetition.',
    offTopic: 'Let us return to the connection enquiry.',
    unknown:
      'I have not matched that wording to a reviewed answer or confirmed a travel change.',
    changed:
      'Your preference has changed in the practice record; no ticket has been altered.',
    refusedClosing:
      'We will end the connection practice here. No travel changes have been made.',
  },
}
export const connectionPacks = {
  A1: travelPack(
    scene,
    'A1',
    {
      canDoZh: '借助明确数字说出紧张转机需求并选查询方向。',
      complexityZh: '固定Helsinki至Oslo行程；只表达需求不判断能否赶上。',
      scaffoldingZh: '25分钟与航班号先给，短句或二选一。',
      registerZh: '简单求助，可拒绝未经解释的方案。',
    },
    [
      [
        'time',
        'state-problem',
        'You have twenty-five minutes left; do you need the time repeated?',
        '不是保证能赶上。',
        'repeat',
        'Yes, please repeat it.',
        'clear',
        'No, I understand the time.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A1.time, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'check',
        'seek-information',
        'Shall we check the gate display or ask the transfer desk first?',
        '选择查询渠道。',
        'display',
        'The gate display, please.',
        'desk',
        'The transfer desk, please.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A1.check, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'priority',
        'prioritise',
        'Is arriving today or avoiding extra cost more important to you?',
        '优先级不等于可实现。',
        'today',
        'Arriving today is more important.',
        'cost',
        'No extra cost, please.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A1.priority, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'evidence',
        'provide-detail',
        'Will you show your boarding information or baggage receipt first?',
        '两材料都在，只选先后。',
        'boarding',
        'My boarding information first.',
        'bag',
        'My baggage receipt first.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A1.evidence, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'route',
        'clarify-route',
        'Do you want to ask about a direct flight or another connection?',
        '候选去Oslo路线未安排。',
        'direct',
        'A direct flight, please.',
        'connect',
        'Another connection, please.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A1.route, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'consent',
        'withhold-consent',
        'Should any change wait until you know the full details?',
        '两答均保留最终同意。',
        'cost',
        'Yes, I need the price first.',
        'time',
        'Yes, I need the times first.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A1.consent, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'luggage',
        'trace-bag',
        'Would you like to check the bag tag or ask staff about your suitcase?',
        '行李去向未知。',
        'tag',
        'Let us check the tag.',
        'staff',
        'Please ask the staff.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A1.luggage, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'help',
        'navigate',
        'Would a map or someone’s directions help you find the transfer desk?',
        '查询先后不等于已找到柜台。',
        'map',
        'A map would help.',
        'directions',
        'Directions, please.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A1.help, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'message',
        'update-contact',
        'Will you tell your host now or after checking the options?',
        'Oslo有人接待，未必家庭。',
        'now',
        'I will send a message now.',
        'later',
        'I will wait for more information.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A1.message, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'next',
        'plan-next',
        'Will you wait near the desk or check the board while waiting for advice?',
        '只讨论等待方案。',
        'desk',
        'I will wait near the desk.',
        'board',
        'I will check the board.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A1.next, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'overnight',
        'consider-fallback',
        'If no suitable flight is found today, what would you ask about first?',
        '假设，不假定有免费住宿。',
        'stay',
        'A place to stay, please.',
        'flight',
        'Tomorrow’s flights, please.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A1.overnight, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'record',
        'keep-record',
        'Would you keep a written note or a photo of the travel information?',
        '选择记录方式。',
        'note',
        'A written note, please.',
        'photo',
        'I would take a photo.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A1.record, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#flight-connection — A1 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  A2: travelPack(
    scene,
    'A2',
    {
      canDoZh: '解释延误后需求，提出路线和费用核对请求。',
      complexityZh: '处理多个待核实项目，保留修改行程的选择权。',
      scaffoldingZh: '固定剩余时间；可用先后和简单条件句。',
      registerZh: '常用服务表达，直接而不命令。',
    },
    [
      [
        'time',
        'state-problem',
        'Is the remaining connection time clear, or should I say it again?',
        '25分钟已给，理解可不同。',
        'repeat',
        'Please say it again more slowly.',
        'clear',
        'Yes, I understand that only twenty-five minutes remain.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A2.time, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'check',
        'seek-information',
        'Where would you like to look for the latest connection information first?',
        '不把旧信息当现在状态。',
        'display',
        'Let us look at the gate display first.',
        'desk',
        'I would like to ask the transfer desk first.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A2.check, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'priority',
        'prioritise',
        'What is your main concern when we discuss possible alternatives?',
        '费用与时间优先不同。',
        'today',
        'I would like to arrive in Oslo today.',
        'cost',
        'I need to avoid paying extra if possible.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A2.priority, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'evidence',
        'provide-detail',
        'Which travel document will you use to start the enquiry?',
        '不是出示护照敏感数据。',
        'boarding',
        'I will show the boarding information on my phone.',
        'bag',
        'I will start with the receipt for my checked bag.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A2.evidence, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'route',
        'clarify-route',
        'What kind of alternative route would you like information about?',
        '询问不接受改票。',
        'direct',
        'Could you check for a direct flight to Oslo?',
        'connect',
        'Could you check a route with another connection?',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A2.route, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'consent',
        'withhold-consent',
        'What must you know before agreeing to a possible change?',
        '保留未同意。',
        'price',
        'Please tell me the total price before I agree.',
        'times',
        'Please show me all the flight times first.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A2.consent, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'luggage',
        'trace-bag',
        'How would you like to begin checking where the suitcase should go?',
        '不确认已运送。',
        'tag',
        'Please read the destination on the bag tag with me.',
        'staff',
        'Let us ask staff to check the baggage details.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A2.luggage, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'help',
        'navigate',
        'How would you prefer to find the transfer service area?',
        '选择支架。',
        'map',
        'Please mark the service area on a map.',
        'directions',
        'Could you give me simple directions from here?',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A2.help, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'message',
        'update-contact',
        'When would you like to update the person expecting you in Oslo?',
        '事实未确认时也可通知延误。',
        'now',
        'I will tell them now that my connection is uncertain.',
        'later',
        'I will wait until I have clearer information.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A2.message, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'next',
        'plan-next',
        'What will you do while waiting for an answer about your options?',
        '不是航班等待确认。',
        'desk',
        'I will stay near the transfer desk.',
        'board',
        'I will check the board for any new information.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A2.next, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'overnight',
        'consider-fallback',
        'If travel today is not possible, which information would help first?',
        '假设未发生。',
        'stay',
        'I would ask where I could stay for the night.',
        'flight',
        'I would ask about the next day’s flights.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A2.overnight, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'record',
        'keep-record',
        'How would you keep the details so you can check them later?',
        '非已改票证明。',
        'note',
        'I would write down the times and flight numbers.',
        'photo',
        'I would take a photo of the information with permission.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.A2.record, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#flight-connection — A2 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  B1: travelPack(
    scene,
    'B1',
    {
      canDoZh: '处理延误引起的非例行查询并解释优先级。',
      complexityZh: '把路线、行李和可能过夜分成尚待核实的事项。',
      scaffoldingZh: '给出完整原行程，用理由及假设组织表达。',
      registerZh: '合作式求助，同时要求知情确认。',
    },
    [
      [
        'time',
        'state-problem',
        'How confident are you that you heard the remaining time correctly?',
        '不判断25分钟是否足够。',
        'repeat',
        'Not very; could you repeat the time before I decide what to ask?',
        'clear',
        'I heard twenty-five minutes, but I am not assuming that guarantees the connection.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B1.time, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'check',
        'seek-information',
        'Which source would you consult first to find out what is happening with SM310?',
        '只选择渠道。',
        'display',
        'I would check the current gate display because my earlier information may be out of date.',
        'desk',
        'I would ask the transfer desk because I need help understanding the options.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B1.check, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'priority',
        'prioritise',
        'What should staff take into account when comparing options for you?',
        '不保留隐含必须同时满足。',
        'today',
        'Arriving today matters most because someone is expecting me in Oslo.',
        'cost',
        'Avoiding extra expense matters most because I have a limited travel budget.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B1.priority, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'evidence',
        'provide-detail',
        'Which information would you show first to make the enquiry easier?',
        '两材料用途不同。',
        'boarding',
        'The boarding information should help staff identify the flight I am trying to catch.',
        'bag',
        'The baggage receipt should help us start with the suitcase details I cannot confirm.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B1.evidence, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'route',
        'clarify-route',
        'What alternative would be worth checking without assuming it is available?',
        '无订票承诺。',
        'direct',
        'I would ask about a direct service to avoid another tight connection.',
        'connect',
        'I would consider another connection if staff can explain the full route.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B1.route, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'consent',
        'withhold-consent',
        'What would prevent you from agreeing to a change immediately?',
        '明确未授权。',
        'price',
        'I would need the full cost explained, since a route alone does not tell me what I would pay.',
        'times',
        'I would need every departure and arrival time before deciding whether the route works.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B1.consent, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'luggage',
        'trace-bag',
        'How would you start resolving the uncertainty about your checked suitcase?',
        '凭条非实时定位。',
        'tag',
        'I would compare the tag destination with the itinerary as a starting point.',
        'staff',
        'I would ask staff to check the baggage record rather than guess from the flight options.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B1.luggage, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'help',
        'navigate',
        'What would help you reach the transfer desk without losing more time looking for it?',
        '地图或指路。',
        'map',
        'A marked map would let me find the desk without stopping repeatedly.',
        'directions',
        'Clear directions using nearby signs would be quicker for me to follow.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B1.help, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'message',
        'update-contact',
        'How would you handle updating your host while the route is still uncertain?',
        '通知不编造到达时刻。',
        'now',
        'I would explain the uncertainty now rather than give them an arrival time I cannot confirm.',
        'later',
        'I would wait for a clearer option so I can send one useful update instead of several guesses.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B1.message, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'next',
        'plan-next',
        'Where would you focus your attention while the enquiry is being considered?',
        '不声称工作人员已办理。',
        'desk',
        'I would remain near the desk so I can hear the response.',
        'board',
        'I would keep an eye on the board while staying available for further advice.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B1.next, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'overnight',
        'consider-fallback',
        'If the discussion leaves no suitable same-day option, what would you investigate next?',
        '不保证住宿补偿。',
        'stay',
        'I would ask about places to stay and check the cost before making any arrangement.',
        'flight',
        'I would ask which next-day services could be checked before considering accommodation.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B1.overnight, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'record',
        'keep-record',
        'How would you avoid confusing the original itinerary with a proposed alternative?',
        '记录注明候选状态。',
        'note',
        'I would write a separate note headed proposed route.',
        'photo',
        'I would photograph the proposed details and keep them separate from my original booking.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B1.record, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#flight-connection — B1 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  B2: travelPack(
    scene,
    'B2',
    {
      canDoZh: '协商有竞争的转机优先级并核查方案的完整性。',
      complexityZh: '区分原行程、候选路线和改票授权，解释待核实行李。',
      scaffoldingZh: '原行程作为底板，提供权衡与条件表达策略。',
      registerZh: '冷静有效，不暗示任何补偿权利或可行性保证。',
    },
    [
      [
        'time',
        'state-problem',
        'Is the time figure reliable enough for you to frame the enquiry, or should we repeat it?',
        '可靠指听清而非足够衔接。',
        'repeat',
        'Please repeat it; I want to avoid building the enquiry around a number I misheard.',
        'clear',
        'I have understood the twenty-five-minute figure, though whether the connection is feasible still needs checking.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B2.time, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'check',
        'seek-information',
        'Where would you begin verifying the status rather than relying on the original schedule?',
        '查询选择。',
        'display',
        'The live gate display would be my first reference before I rely on the printed schedule.',
        'desk',
        'I would begin with the transfer desk because a status update alone may not explain my options.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B2.check, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'priority',
        'prioritise',
        'Which trade-off should guide the comparison if no option meets every preference?',
        '优先不保证结果。',
        'today',
        'I would prioritise arriving today, while still needing any additional cost made explicit.',
        'cost',
        'I would prioritise avoiding extra charges, even if that means considering a later arrival.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B2.priority, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'evidence',
        'provide-detail',
        'Which record would provide the most useful starting point for this discussion?',
        '不同起点并非推断解决。',
        'boarding',
        'The boarding information identifies the original service, so it would anchor the route enquiry.',
        'bag',
        'The baggage receipt would anchor the luggage enquiry, which I do not want lost in the route discussion.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B2.evidence, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'route',
        'clarify-route',
        'Which routing option would you put forward for investigation, rather than acceptance?',
        '明确未选定。',
        'direct',
        'A direct option would reduce further connection uncertainty, provided availability and cost are checked.',
        'connect',
        'Another connecting route is worth investigating if the complete timings can be assessed together.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B2.route, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'consent',
        'withhold-consent',
        'What information would you need before a proposed change could become an agreed one?',
        '先查清再同意。',
        'price',
        'I would need a clear total charge, including any extra fees, before authorising a change.',
        'times',
        'I would need the full sequence of times, rather than only the final arrival, before giving agreement.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B2.consent, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'luggage',
        'trace-bag',
        'How would you keep the baggage question from being settled by assumption?',
        '标签不能确认实时处理。',
        'tag',
        'I would use the tag to establish its stated destination, while recognising that this does not confirm its current handling.',
        'staff',
        'I would ask staff to verify the baggage record separately from any proposed ticket change.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B2.luggage, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'help',
        'navigate',
        'Which form of directions would reduce the risk of another avoidable delay?',
        '具体导航选择。',
        'map',
        'A marked route would let me check my position if I missed a sign.',
        'directions',
        'Directions based on visible landmarks would be more useful to me than unfamiliar terminal names.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B2.help, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'message',
        'update-contact',
        'Would you update your host during the uncertainty or wait for a firmer account?',
        '不能告知未确认到达时间。',
        'now',
        'I would send a short update now, clearly distinguishing the delay from any unconfirmed arrival estimate.',
        'later',
        'I would wait for firmer information rather than repeatedly replace one speculative arrival time with another.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B2.message, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'next',
        'plan-next',
        'How would you use the waiting period without treating the enquiry as a confirmed arrangement?',
        '不提前离开或登机。',
        'desk',
        'I would remain within hearing distance of the desk so I can respond to any clarification.',
        'board',
        'I would monitor the board while keeping myself available to staff, without acting on an unconfirmed route.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B2.next, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'overnight',
        'consider-fallback',
        'What would you examine first if all suitable same-day possibilities were exhausted?',
        '不谈法定赔偿。',
        'stay',
        'I would examine accommodation options and their costs, without assuming the airline would pay.',
        'flight',
        'I would examine next-day flight possibilities before judging what overnight arrangements might be needed.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B2.overnight, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'record',
        'keep-record',
        'How would you preserve a useful record without confusing an offer with a booking?',
        '候选标签明确。',
        'note',
        'I would label my written notes as proposed options and keep the original booking details separate.',
        'photo',
        'I would save a photo of the proposed itinerary with a note that it still requires confirmation.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.B2.record, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#flight-connection — B2 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  C1: travelPack(
    scene,
    'C1',
    {
      canDoZh: '在时间压力下精确区分信息依据、约束、授权与尚未解决的后果。',
      complexityZh: '协调转机优先级和分开核实的行李问题，避免虚构完成。',
      scaffoldingZh: '给定现实约束，要求自然限定、让步和澄清。',
      registerZh: '专业但可口述的协商语气；只参照CEFR C1。',
    },
    [
      [
        'time',
        'state-problem',
        'Is there any uncertainty in what you heard that we should resolve before assessing the situation?',
        '区分听清与可行性。',
        'repeat',
        'Please repeat the remaining time once more; an uncertain starting figure would make the rest of the discussion less useful.',
        'clear',
        'The twenty-five minutes are clear. What remains uncertain is whether the connection can be made, not the number itself.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.C1.time, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'check',
        'seek-information',
        'Which source would you consult first, given that the original schedule no longer tells the whole story?',
        '避免旧信息决定当前状态。',
        'display',
        'I would begin with the current display to establish the latest published status, then seek clarification where needed.',
        'desk',
        'I would start at the transfer desk, since I need the implications explained rather than simply another departure time.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.C1.check, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'priority',
        'prioritise',
        'Which constraint should take precedence if the available choices force a compromise?',
        '不把偏好变保证。',
        'today',
        'Same-day arrival would take precedence, but that preference should not be interpreted as unlimited consent to additional charges.',
        'cost',
        'Keeping additional expense down would take precedence. I would consider arriving later if that gave me a more affordable option.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.C1.priority, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'evidence',
        'provide-detail',
        'What would you use to anchor the enquiry and avoid talking past one another?',
        '不同材料不同作用。',
        'boarding',
        'I would start with the original boarding information so that every proposed alternative is compared with the same itinerary.',
        'bag',
        'I would start with the baggage receipt because the suitcase’s handling needs a distinct answer, not an inference from the route discussion.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.C1.evidence, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'route',
        'clarify-route',
        'Which alternative merits investigation without prematurely narrowing the decision?',
        '真正限定备选，不已接受。',
        'direct',
        'A direct service merits checking because it removes another connection, though its availability and total cost remain open questions.',
        'connect',
        'A different connecting route merits checking if we can assess the whole itinerary rather than be persuaded by one attractive segment.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.C1.route, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'consent',
        'withhold-consent',
        'What would turn a potentially useful proposal into something you could actually authorise?',
        '不是已经授权。',
        'price',
        'A transparent total cost would be essential; asking about a route should not be taken as agreement to pay an unspecified charge.',
        'times',
        'I would need the full timings reconciled, including each connection, before an expression of interest could become consent to a change.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.C1.consent, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'luggage',
        'trace-bag',
        'How would you establish what is known about the suitcase without overstating the evidence?',
        '保留行李去向未解决。',
        'tag',
        'The tag establishes the recorded destination, so I would use it as a starting point rather than proof of the suitcase’s present routing.',
        'staff',
        'I would ask for a separate check of the baggage record; even a confirmed ticket change would not, by itself, answer the luggage question.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.C1.luggage, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'help',
        'navigate',
        'What kind of directions would remain useful if you failed to recognise one of the signs?',
        '实用支架，不抽象填充。',
        'map',
        'A marked map would give me a way to recover my position instead of relying on an uninterrupted sequence of remembered turns.',
        'directions',
        'A few distinctive landmarks would let me recognise the route even if an unfamiliar sign name did not register.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.C1.help, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'message',
        'update-contact',
        'How would you balance keeping your host informed against passing on speculation?',
        '不编造时刻。',
        'now',
        'I would communicate the disruption now and explicitly leave the arrival time open, rather than make silence seem like reassurance.',
        'later',
        'I would wait for a defensible update, provided I do not mistake an unconfirmed proposal for a settled arrival time.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.C1.message, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'next',
        'plan-next',
        'While staff look into the options, would you rather stay near the desk or keep an eye on the departure displays?',
        '未订位期间的行动。',
        'desk',
        'I would stay near the desk so I could respond promptly if staff needed more details, rather than risk missing them while checking the displays.',
        'board',
        'I would keep an eye on the displays, but stay within reach of the desk so staff could find me when they had an update.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.C1.next, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'overnight',
        'consider-fallback',
        'If a same-day solution proves unavailable, where would you begin the next enquiry?',
        '假设，非法律建议。',
        'stay',
        'I would ask about accommodation and who would be responsible for the cost, leaving that responsibility to be established rather than asserted.',
        'flight',
        'I would establish what next-day services could be considered, since that would frame any subsequent accommodation enquiry.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.C1.overnight, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'record',
        'keep-record',
        'What record would help you revisit the discussion without misrepresenting its outcome?',
        '候选与正式订位清晰区别。',
        'note',
        'I would keep dated notes distinguishing the original booking, proposals and unresolved questions, rather than merge them into a single itinerary.',
        'photo',
        'I would retain a clearly labelled image of the proposal, with its unconfirmed status visible when I refer back to it.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#flight-connection — flight-connection.C1.record, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#flight-connection — C1 counter/assistance situations, paths, endings and repairs read 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
    },
  ),
}
