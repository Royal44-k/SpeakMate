import { travelPack, type Scene } from './authoring'
const scene: Scene = {
  sceneId: 'travel-06',
  slug: 'hotel-room-problem',
  situations: [
    '虚构Harbour Hotel求助对话。你是Alex Chen，住204房；空调没有制冷，已试过遥控器，没有漏水、烟或异味，不涉及紧急维修指令。现在20:00，前台说可询问技术人员，预计20分钟后才能回复是否有空；换房有无空房待查。你在描述问题和提出方案，不代表修复、退款或换房已经发生。',
    '虚构Harbour Hotel协助对话。Alex Chen住204房，空调不制冷，遥控器已试过，无漏水、烟和异味。现在20:00，技术人员能否来仍待核实，前台预计20分钟后才能回复；其他房间是否可用未知。你还需讨论跟进记录和未解决时如何再联系，不进行拆修，也不假装已安排服务。',
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
    'That completes the room-problem conversation practice. The reported problem and requests are recorded for the exercise; no repair, room move or refund has occurred.',
  partial:
    'We have practised part of reporting the room problem. Unconfirmed access, timing and alternatives remain open.',
  repairs: {
    clarify:
      'We can clarify the current room-problem question without assuming a repair has been arranged.',
    struggle:
      'A short description is enough. Use the fictional room details and ask for repetition if needed.',
    offTopic: 'Let us return to the problem in the fictional room.',
    unknown:
      'That wording is unconfirmed in this local exercise. It has not triggered a repair or a room change.',
    changed: 'Your earlier request has been revised in the exercise only.',
    refusedClosing:
      'We will stop the room-problem practice. No service has been arranged or cancelled.',
  },
}
export const roomProblemPacks = {
  A1: travelPack(
    scene,
    'A1',
    {
      canDoZh: '简单报告房间故障，指出房号并请求跟进。',
      complexityZh: '固定204房空调不制冷，区分问题、需求和未确认方案。',
      scaffoldingZh: '给出故障背景与等待条件，允许简短答案。',
      registerZh: '清楚礼貌，可拒绝等待或人员进入。',
    },
    [
      [
        'room',
        'identify-room',
        'Can you say your room number or show the room card?',
        '两答都明确204。',
        'say',
        'I am in room two-oh-four.',
        'show',
        'Here is my card for room 204.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A1.room, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'problem',
        'describe-problem',
        'What is wrong with the air conditioning?',
        '不新增危险情况。',
        'stopped',
        'The air conditioning is not working. No air comes out.',
        'warm',
        'It blows warm air, not cold air.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A1.problem, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'request',
        'request-remedy',
        'Would you like us to ask about a repair or another room?',
        '只是请求，未实施。',
        'repair',
        'Please ask about a repair.',
        'room',
        'Please check for another room.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A1.request, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'start',
        'give-time',
        'Did you notice the problem just now or earlier this evening?',
        '两种发现时间都在20:00之前。',
        'now',
        'Just now.',
        'earlier',
        'Earlier this evening.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A1.start, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'remote',
        'explain-attempt',
        'When you tried the remote, did the screen light up?',
        '遥控器已试过，结果不同。',
        'yes',
        'Yes, the screen lit up.',
        'no',
        'No, the screen stayed dark.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A1.remote, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'wait',
        'negotiate-time',
        'An update may take twenty minutes; can you wait or do you need an earlier reply?',
        '20分钟是回复，不是修好。',
        'wait',
        'I can wait for the update.',
        'sooner',
        'An earlier reply, please.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A1.wait, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'access',
        'set-boundary',
        'If a staff visit is possible, should someone knock or call first?',
        '有条件，尚未安排。',
        'knock',
        'Please knock first.',
        'call',
        'Please call me first.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A1.access, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'impact',
        'explain-impact',
        'Is the warm room stopping you resting or working?',
        '两个影响均成立，无人身紧急情况。',
        'rest',
        'I cannot rest comfortably.',
        'work',
        'It is hard to work here.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A1.impact, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'alternative',
        'compare-option',
        'If another room is available, what should we check first?',
        '未保证有空房。',
        'quiet',
        'Is it quiet?',
        'cost',
        'Does it cost extra?',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A1.alternative, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'contact',
        'confirm-next',
        'Would you prefer a phone update or a message from reception?',
        '只选反馈方式。',
        'phone',
        'Please phone me.',
        'message',
        'A message, please.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A1.contact, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'record',
        'keep-record',
        'Would you like the problem written down or read back to you?',
        '不同记录协助。',
        'written',
        'Please write it down.',
        'read',
        'Please read it back.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A1.record, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'followup',
        'plan-followup',
        'If there is no update, will you call or visit reception?',
        '不推断已错过承诺。',
        'call',
        'I will call reception.',
        'desk',
        'I will go to the desk.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A1.followup, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#hotel-room-problem — A1 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  A2: travelPack(
    scene,
    'A2',
    {
      canDoZh: '说明故障经过和影响，协商等待与反馈方式。',
      complexityZh: '区分维修请求和换房查询，各后续问题都可兼容。',
      scaffoldingZh: '固定房号和非紧急故障，支持简单原因和if句。',
      registerZh: '自然求助，明确访问前联系和时间偏好。',
    },
    [
      [
        'room',
        'identify-room',
        'How would you like to confirm which room you are in?',
        '房号不因方式变化。',
        'say',
        'My room number is 204.',
        'show',
        'I can show the card marked 204.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A2.room, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'problem',
        'describe-problem',
        'Can you describe what the air conditioning is doing?',
        '均表示没有制冷，前者明确不启动。',
        'stopped',
        'It does not turn on when I try to use it.',
        'warm',
        'It is running, but the air is warm.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A2.problem, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'request',
        'request-remedy',
        'Which possibility would you like reception to check first?',
        '不假定选择已经安排。',
        'repair',
        'Please check whether someone can repair it.',
        'room',
        'Please check whether I could change rooms.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A2.request, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'start',
        'give-time',
        'When did you first realise the room was not cooling down?',
        '发现时间不同。',
        'now',
        'I only noticed the problem a few minutes ago.',
        'earlier',
        'I noticed it earlier this evening.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A2.start, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'remote',
        'explain-attempt',
        'What happened to the remote’s screen when you tried it?',
        '不据屏幕诊断。',
        'lit',
        'The screen lit up, but the room did not get cooler.',
        'dark',
        'The screen stayed dark when I tried it.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A2.remote, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'wait',
        'negotiate-time',
        'Would a reply in about twenty minutes be suitable?',
        '是回复是否有空，不是技术人员到达。',
        'wait',
        'Yes, I can wait that long for an update.',
        'sooner',
        'Could I have an earlier update, please?',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A2.wait, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'access',
        'set-boundary',
        'How should staff contact you before any possible visit?',
        '请求非进入许可。',
        'knock',
        'Please ask them to knock before coming in.',
        'call',
        'Please ask them to call me before coming.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A2.access, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'impact',
        'explain-impact',
        'How is the room temperature affecting your evening?',
        '说明影响。',
        'rest',
        'I want to rest, but the room feels too warm.',
        'work',
        'I need to work, and the heat makes it difficult.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A2.impact, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'alternative',
        'compare-option',
        'What would you want to know about a possible replacement room?',
        '并不确认接受换房。',
        'quiet',
        'I would want to know whether it is quiet.',
        'cost',
        'I would want to know whether there is an extra charge.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A2.alternative, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'contact',
        'confirm-next',
        'How would you prefer to receive news from reception?',
        '只选择更新渠道。',
        'phone',
        'Please call me when there is an update.',
        'message',
        'Please send a message so I can read it.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A2.contact, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'record',
        'keep-record',
        'How can we help you check that the problem description is correct?',
        '不把报告当修复。',
        'written',
        'Please give me a written note of the problem.',
        'read',
        'Could you read the description back to me?',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A2.record, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'followup',
        'plan-followup',
        'What will you do if you do not receive an update?',
        '未来条件。',
        'call',
        'I will call reception to ask again.',
        'desk',
        'I will come to the desk for an update.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.A2.followup, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#hotel-room-problem — A2 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  B1: travelPack(
    scene,
    'B1',
    {
      canDoZh: '有条理报告故障、已试操作及实际影响，请求可核实的跟进。',
      complexityZh: '等待更早回复可以保持未解决；替代房仅作为条件。',
      scaffoldingZh: '明确房间与故障，答案连接过去经过和原因。',
      registerZh: '礼貌坚持需求，人员接触需先联系。',
    },
    [
      [
        'room',
        'identify-room',
        'What is the clearest way for you to identify the room with the problem?',
        '204是固定身份。',
        'say',
        'I can give the number directly: it is room 204.',
        'show',
        'I would prefer to show the card for room 204 so there is no confusion.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B1.room, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'problem',
        'describe-problem',
        'What have you observed about the air conditioning, rather than what you think caused it?',
        '观察非维修诊断。',
        'stopped',
        'It does not seem to operate when I try to use it.',
        'warm',
        'It runs, but it blows warm air instead of cooling the room.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B1.problem, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'request',
        'request-remedy',
        'What would you like reception to investigate as the first possible solution?',
        '调查请求，不声称维修。',
        'repair',
        'Please find out whether a technician could look at it.',
        'room',
        'Please find out whether a different room might be available.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B1.request, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'start',
        'give-time',
        'How long have you been aware that the cooling was not working?',
        '发现而非实际故障起点。',
        'recent',
        'I became aware of it only a few minutes ago.',
        'earlier',
        'I noticed it earlier this evening, but I cannot say when it first started.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B1.start, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'remote',
        'explain-attempt',
        'What did you notice when you used the remote control?',
        '屏幕亮或暗皆可与故障匹配。',
        'lit',
        'The display lit up, although that did not make the room any cooler.',
        'dark',
        'The display stayed dark, so I could not tell whether it had responded.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B1.remote, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'wait',
        'negotiate-time',
        'How does the suggested twenty-minute wait for an update fit your needs?',
        '等待的是回复，不能承诺修好。',
        'wait',
        'I can wait twenty minutes for an update, provided it is clear that this is not a repair time.',
        'sooner',
        'I would appreciate an earlier reply because I need to decide how to use the evening.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B1.wait, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'access',
        'set-boundary',
        'What contact would you want before a staff member visited the room?',
        '两答案不自动准许无人在场进入。',
        'knock',
        'Please have them knock and wait for my answer before entering.',
        'call',
        'Please call first so I know a visit is being considered.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B1.access, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'impact',
        'explain-impact',
        'Why is getting an update important to you this evening?',
        '影响不同，需求合理。',
        'rest',
        'I need to rest, and the warm room is making that uncomfortable.',
        'work',
        'I have work to finish and am finding it difficult to concentrate in the heat.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B1.impact, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'alternative',
        'compare-option',
        'If a room move becomes possible, which detail would you check before deciding?',
        '尚未可用仍能问条件。',
        'quiet',
        'I would check the noise level because moving to a noisy room may not help me.',
        'cost',
        'I would check any extra cost so I do not agree to an unexpected charge.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B1.alternative, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'contact',
        'confirm-next',
        'What update method would work best while you wait for more information?',
        '不假设接受20分钟。',
        'phone',
        'A phone call would let me ask a quick question about the update.',
        'message',
        'A message would let me read the details carefully and keep a record.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B1.contact, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'record',
        'keep-record',
        'How would you check that reception has understood the report accurately?',
        '核对报告，不重复问故障。',
        'written',
        'I would like a written summary so I can check the key details.',
        'read',
        'Please read the report back so I can correct anything that was misheard.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B1.record, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'followup',
        'plan-followup',
        'How would you follow up if the expected update did not arrive?',
        '未来可能。',
        'call',
        'I would call reception and refer to the earlier report.',
        'desk',
        'I would go to the desk with the room number and ask where the enquiry stands.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B1.followup, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#hotel-room-problem — B1 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  B2: travelPack(
    scene,
    'B2',
    {
      canDoZh: '区分观察与诊断，协商回复时限和访问边界，比较备选方案。',
      complexityZh: '多个需求不互相默示授权；信息回复与维修完成明确分开。',
      scaffoldingZh: '固定非紧急事实，练具体理由及条件表达。',
      registerZh: '坚定而合作，避免泛化投诉或维修保证。',
    },
    [
      [
        'room',
        'identify-room',
        'How would you make sure the report is attached to the correct room?',
        '两方式保持204。',
        'say',
        'I would state room 204 clearly before describing the fault.',
        'show',
        'I would show the card marked 204 so the number can be checked visually.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B2.room, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'problem',
        'describe-problem',
        'How would you describe the symptoms without presenting an unverified diagnosis?',
        '不引导拆机。',
        'stopped',
        'The unit does not appear to operate when I try it; I cannot tell what has failed inside.',
        'warm',
        'The unit runs but supplies warm air, so the observed problem is a lack of cooling rather than a cause I can identify.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B2.problem, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'request',
        'request-remedy',
        'Which potential response would you like checked before other options are discussed?',
        '先查维修或先查换房。',
        'repair',
        'I would ask whether a technician can attend before judging whether a room move is necessary.',
        'room',
        'I would ask about another room first, rather than assume a repair can be completed soon.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B2.request, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'start',
        'give-time',
        'Can you distinguish when you noticed the problem from when it might have begun?',
        '不凭空给故障开始时间。',
        'recent',
        'I noticed it a few minutes ago, but that does not establish when the fault began.',
        'earlier',
        'I have been aware of it since earlier this evening; I cannot reliably date the actual start.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B2.start, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'remote',
        'explain-attempt',
        'What does your attempt with the remote establish, and what does it leave unclear?',
        '屏幕状态不是诊断。',
        'lit',
        'The screen lit up, but that only shows a display response, not that the cooling worked.',
        'dark',
        'The screen remained dark, so I could not confirm a response from the remote itself.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B2.remote, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'wait',
        'negotiate-time',
        'Is the proposed delay for an availability update acceptable, or should an earlier response be requested?',
        '更早请求不解决等待冲突。',
        'wait',
        'Twenty minutes is acceptable for an availability update; I would not interpret it as a promise of completed repair.',
        'sooner',
        'Please request an earlier response; I need more certainty about my evening before accepting that wait.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B2.wait, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'access',
        'set-boundary',
        'What condition would you put on contact before any possible room visit?',
        '无自动进入授权。',
        'knock',
        'Staff should knock and receive an answer before entering, rather than treat the report as permission to walk in.',
        'call',
        'Please arrange contact by phone first so I can discuss the proposed visit before anyone comes up.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B2.access, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'impact',
        'explain-impact',
        'Which consequence of the warm room best explains the urgency of your enquiry?',
        '非紧急风险，具体影响。',
        'rest',
        'It is preventing me from resting comfortably, which is why an update matters even before a solution is available.',
        'work',
        'It is interfering with work I need to finish, so uncertainty about the timing is affecting my plans.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B2.impact, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'alternative',
        'compare-option',
        'What would you need clarified before treating a replacement room as a suitable alternative?',
        '可用性仍待查。',
        'quiet',
        'I would need to ask about noise, since a move would not necessarily solve the practical problem if the new room were very noisy.',
        'cost',
        'I would need any price difference made explicit before considering whether to accept the move.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B2.alternative, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'contact',
        'confirm-next',
        'Which update format would be most useful while the timing and remedy remain open?',
        '不暗示接受原等待。',
        'phone',
        'A call would allow immediate clarification if the update contains several possible next steps.',
        'message',
        'A message would provide a stable record of what has and has not been confirmed.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B2.contact, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'record',
        'keep-record',
        'How would you verify the recorded report without repeating the entire conversation?',
        '核对新记录而非重复目标。',
        'written',
        'A short written summary would let me identify any inaccurate detail efficiently.',
        'read',
        'A read-back of the key points would let me correct a misunderstanding on the spot.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B2.record, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'followup',
        'plan-followup',
        'What would be a constructive follow-up if no update arrived as expected?',
        '不预设工作人员违约。',
        'call',
        'I would call with the room number and ask for the status of the existing enquiry.',
        'desk',
        'I would visit reception and refer to the earlier report rather than begin a separate complaint from scratch.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.B2.followup, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#hotel-room-problem — B2 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  C1: travelPack(
    scene,
    'C1',
    {
      canDoZh: '精确说明故障证据、实际影响和条件性授权，协商尚未解决事项。',
      complexityZh: '追踪观察、待查方案、时间及进入条件的区别，不虚构修复。',
      scaffoldingZh: '事实充分但解决方案开放，以具体让步和限定推进。',
      registerZh: '克制、清晰的服务协商口语，C1依据CEFR。',
    },
    [
      [
        'room',
        'identify-room',
        'How would you establish the room reference before the report becomes more detailed?',
        '固定204，先后不变房号。',
        'say',
        'I would state room 204 at the outset so the details that follow are attached to an explicit reference.',
        'show',
        'I would present the card for room 204, giving reception a visual reference before we discuss the fault.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.C1.room, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'problem',
        'describe-problem',
        'What can you report from observation without attributing the fault to a particular component?',
        '不提供技术维修建议。',
        'stopped',
        'The unit does not appear to start when I try to use it; I would leave the internal cause for someone qualified to assess.',
        'warm',
        'It runs but delivers warm air, so I can report the absence of cooling without claiming to know which component is responsible.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.C1.problem, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'request',
        'request-remedy',
        'Which line of enquiry would you prioritise while both repair and room availability remain uncertain?',
        '优先级不等于排除其他方案。',
        'repair',
        'I would establish whether a technician can attend first; that information would make a later discussion of alternatives more useful.',
        'room',
        'I would establish whether another room is available first, rather than build my plans around an unconfirmed repair schedule.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.C1.request, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'start',
        'give-time',
        'When did you first notice that the air conditioning was not cooling the room?',
        '发现时间与实际起因不同。',
        'recent',
        'I only noticed it a few minutes ago, so I cannot say how long it had been like that before I tried it.',
        'earlier',
        'I noticed it earlier this evening, although I cannot give you an exact time. It has not cooled the room since then.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.C1.start, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'remote',
        'explain-attempt',
        'What happened when you tried the remote control? Did anything appear on its display?',
        '不猜电池或机器故障。',
        'lit',
        'The display lit up when I pressed the button, but the room did not get any cooler. I could not tell whether the unit had received the signal.',
        'dark',
        'The display stayed dark when I pressed the button. I tried it again with the same result, so I thought I should ask reception for help.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.C1.remote, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'wait',
        'negotiate-time',
        'How would you respond to the proposed twenty-minute interval for an availability update?',
        '明确是回复，不是到场或修好。',
        'wait',
        'I can accept that interval for an update, provided we keep it distinct from a commitment about attendance or repair completion.',
        'sooner',
        'I would like an earlier response sought, since accepting the proposed interval would leave me unable to plan the rest of the evening.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.C1.wait, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'access',
        'set-boundary',
        'What should staff understand about contact and entry if a visit becomes possible?',
        '两种边界均需先联系。',
        'knock',
        'They should knock and wait for my response; reporting a fault should not be interpreted as unrestricted permission to enter.',
        'call',
        'Please call to agree a suitable time before sending anyone up; I need to know whether I can receive them.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.C1.access, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'impact',
        'explain-impact',
        'How would you explain the effect on you without exaggerating the nature of the problem?',
        '不新增危险状况。',
        'rest',
        'The room is too warm for me to rest comfortably; that is the practical impact I need addressed, without presenting this as an emergency.',
        'work',
        'The heat is making it difficult to concentrate on work I need to finish, which explains why uncertainty about the response matters to me.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.C1.impact, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'alternative',
        'compare-option',
        'What would determine whether an available replacement room was genuinely useful to you?',
        '即使有房仍有条件。',
        'quiet',
        'Its noise level would matter; availability alone would not make a move worthwhile if the alternative created a different obstacle to using the room.',
        'cost',
        'The cost difference would need to be clear; willingness to consider a move should not be treated as acceptance of an unspecified charge.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.C1.alternative, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'contact',
        'confirm-next',
        'Which communication method would best preserve clarity while the outcome remains unsettled?',
        '没有擅自解决时间或房间。',
        'phone',
        'A call would let me clarify the limits of any proposal immediately, rather than infer them from a brief message.',
        'message',
        'A message would give me a record of the proposal and its outstanding conditions, reducing reliance on what I remember hearing.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.C1.contact, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'record',
        'keep-record',
        'How would you check the report efficiently while leaving room to correct a misunderstanding?',
        '新记录不是修复证明。',
        'written',
        'A concise written summary would let me distinguish the observations I reported from any explanation added in passing.',
        'read',
        'A read-back would let me correct an inaccurate point immediately without reopening every detail that was understood correctly.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.C1.record, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
      [
        'followup',
        'plan-followup',
        'How would you seek a missing update without turning one enquiry into several disconnected reports?',
        '保持原报告上下文。',
        'call',
        'I would call, give room 204 and refer to the existing report, asking what remains pending rather than start a new account.',
        'desk',
        'I would return to reception with the same room reference and ask for the current position on the original enquiry.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-room-problem — hotel-room-problem.C1.followup, Codex postdraft reading 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#hotel-room-problem — C1 counter/assistance situations, paths, endings and repairs read 2026-09-10; fix round 1 complete-unit reread 2026-09-10',
    },
  ),
}
