import { travelPack, type Scene } from './authoring'
const scene: Scene = {
  sceneId: 'travel-05',
  slug: 'hotel-check-in',
  situations: [
    '虚构Harbour Hotel前台。你是Alex Chen，一人订了9月10日入住、12日离店的两晚标准房，有预订确认、身份证明和一只旅行包。前台展示一张样例房卡及文字用法，不是给你的真实钥匙。本练习标准房不含早餐；早餐可另询价，安静房与提前入住都只是可询问的偏好，未确认。情境时刻为13:00，示例通常入住时间15:00。短练核对身份、日期和房型资料，不表示完成入住。',
    '虚构Harbour Hotel协助前台。Alex Chen一人预订9月10日至12日两晚标准房，带确认信、身份证明和旅行包，早餐未含。前台有示范房卡及文字用法，尚未分配实际房卡。现在13:00，示例通常入住时间15:00；提前入住或安静位置都未确认。你还需要额外询问行李暂存与离店手续；任何费用和服务需要另行核实，不发生真实支付或订房。',
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
    'This hotel check-in conversation is complete. We have practised requests and checks; no room, early access, breakfast or payment has been arranged.',
  partial:
    'We have covered part of the hotel enquiry. Unconfirmed details remain open, and no check-in or payment has occurred.',
  repairs: {
    clarify:
      'We can clarify the current hotel question before adding a new request.',
    struggle:
      'Take your time. A short reply about this booking detail is enough.',
    offTopic: 'Let us return to the hotel check-in enquiry.',
    unknown:
      'This wording is not a reviewed answer in the local exercise. It has not confirmed a booking choice or payment.',
    changed:
      'Your earlier preference has been revised in the practice record only.',
    refusedClosing:
      'We will stop the hotel practice here. No booking or payment has been changed.',
  },
}
export const hotelPacks = {
  A1: travelPack(
    scene,
    'A1',
    {
      canDoZh: '在具体预订背景下出示资料并核对简单入住需求。',
      complexityZh: '姓名、两晚日期、标准房分别处理，不默认为已入住。',
      scaffoldingZh: '给定酒店时间和早餐边界，支持短语选择。',
      registerZh: '简单前台礼貌请求，可拒绝加购。',
    },
    [
      [
        'identity',
        'identify',
        'Your booking is under Alex Chen; will you show ID or the confirmation first?',
        '姓名固定，只选出示顺序。',
        'id',
        'My ID first, please.',
        'confirmation',
        'Here is my booking confirmation.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A1.identity, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'dates',
        'verify-dates',
        'Shall we read the dates aloud or check them on your confirmation?',
        '10日至12日不改变。',
        'aloud',
        'Please read the dates aloud.',
        'written',
        'Let us check the confirmation.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A1.dates, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'room',
        'clarify-room',
        'Do you want to check the room type or the number of guests first?',
        '标准房一人已给，只选核对项。',
        'type',
        'The room type, please.',
        'guests',
        'The number of guests, please.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A1.room, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'location',
        'express-preference',
        'Would you prefer a room near the lift or farther away?',
        '房间位置仅偏好。',
        'near',
        'Near the lift, please.',
        'quiet',
        'Farther away, please.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A1.location, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'early',
        'negotiate-time',
        'It is one o’clock; will you ask about early access or wait until three?',
        '可请求，但不确认提前入住。',
        'ask',
        'Can I enter the room early?',
        'wait',
        'I can wait until three.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A1.early, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'breakfast',
        'decline-extra',
        'Breakfast costs extra; do you want to ask the price?',
        '不把询价视为购买。',
        'ask',
        'Yes, what is the price?',
        'no',
        'No breakfast, thank you.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A1.breakfast, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'payment',
        'clarify-payment',
        'Would you like the payment information on paper or on screen?',
        '只问信息形式。',
        'paper',
        'On paper, please.',
        'screen',
        'On the screen, please.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A1.payment, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'key',
        'request-help',
        'Do you need someone to explain the sample room key?',
        '样卡不具真实开门权限。',
        'yes',
        'Yes, please explain it.',
        'no',
        'No, I understand it.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A1.key, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'wifi',
        'ask-information',
        'Would you like written Wi-Fi instructions or a spoken explanation?',
        '不输出真实密码。',
        'written',
        'Written instructions, please.',
        'spoken',
        'Please explain it to me.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A1.wifi, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'contact',
        'confirm-next',
        'Will you call reception or come to the desk if you need help?',
        '未来求助方式。',
        'call',
        'I will call reception.',
        'desk',
        'I will come to the desk.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A1.contact, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'luggage',
        'ask-storage',
        'Do you want to ask about storing your bag before room access?',
        '未安排保管。',
        'ask',
        'Yes, where can I leave my bag?',
        'keep',
        'No, I will keep my bag.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A1.luggage, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'checkout',
        'clarify-departure',
        'Would you like to check the departure time or the key-return place?',
        '离店日期12日固定。',
        'time',
        'The departure time, please.',
        'key',
        'Where do I return the key?',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A1.checkout, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#hotel-check-in — A1 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  A2: travelPack(
    scene,
    'A2',
    {
      canDoZh: '完成可预测的入住核对，提出位置与信息需求。',
      complexityZh: '在13点与15点差距中作请求或等待选择，早餐明确加购。',
      scaffoldingZh: '使用给定两晚预订，允许简单原因和询价。',
      registerZh: '日常礼貌前台表达，拒绝额外项目不带敌意。',
    },
    [
      [
        'identity',
        'identify',
        'Which document would you like to use first for the Alex Chen booking?',
        '身份和预订都在。',
        'id',
        'I would like to show my ID first.',
        'confirmation',
        'I have the booking confirmation ready here.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A2.identity, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'dates',
        'verify-dates',
        'How would you prefer to check the September tenth-to-twelfth dates?',
        '口头或书面核对同日期。',
        'aloud',
        'Could you say the dates so I can check them?',
        'written',
        'Please compare them with my confirmation.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A2.dates, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'room',
        'clarify-room',
        'Which part of the standard-room booking should we look at first?',
        '不假设升级或加人。',
        'type',
        'Please check the room type first.',
        'guests',
        'Please check that it is for one guest.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A2.room, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'location',
        'express-preference',
        'Where would you prefer the room to be in relation to the lift?',
        '位置不能保证。',
        'near',
        'Near the lift, so I do not have far to walk.',
        'quiet',
        'Away from the lift, because I prefer less noise.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A2.location, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'early',
        'negotiate-time',
        'Would you like to ask about entering before three, or is waiting suitable?',
        '等待同意与提前请求分开。',
        'ask',
        'Could you check whether early access is possible?',
        'wait',
        'Waiting until three is fine for me.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A2.early, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'breakfast',
        'decline-extra',
        'Would information about the extra breakfast charge be useful?',
        '询价不等同加早餐。',
        'ask',
        'Yes, please tell me the charge before I decide.',
        'no',
        'No, thanks. I do not want to add breakfast.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A2.breakfast, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'payment',
        'clarify-payment',
        'How would you like to see the payment details before deciding anything?',
        '展示不收费。',
        'paper',
        'Could I see a printed explanation of the charges?',
        'screen',
        'Please show the payment details on the screen.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A2.payment, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'key',
        'request-help',
        'Would you like a demonstration of the practice key card?',
        '卡只是示范。',
        'show',
        'Yes, please show me how to use it.',
        'clear',
        'No, thanks. The sample instructions are clear.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A2.key, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'wifi',
        'ask-information',
        'Which would help you more with Wi-Fi, a note or an explanation?',
        '说明形式不同。',
        'written',
        'A note would help me remember the steps.',
        'spoken',
        'Could you explain the steps slowly?',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A2.wifi, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'contact',
        'confirm-next',
        'How would you contact reception if a question came up later?',
        '未来不需要假定房间已分配。',
        'call',
        'I would call reception for help.',
        'desk',
        'I would come back to the desk and ask.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A2.contact, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'luggage',
        'ask-storage',
        'Would you like information about bag storage while room access is unresolved?',
        '不假定已接受等待。',
        'ask',
        'Yes, is there somewhere I could leave my bag?',
        'keep',
        'No, I would rather keep it with me.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A2.luggage, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'checkout',
        'clarify-departure',
        'Which departure detail would you like explained for September twelfth?',
        '日期不变，核对不同内容。',
        'time',
        'Please tell me what time I would need to leave.',
        'key',
        'Please explain where I would return the key.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.A2.checkout, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#hotel-check-in — A2 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  B1: travelPack(
    scene,
    'B1',
    {
      canDoZh: '解释入住偏好，核查费用和未确认时间安排。',
      complexityZh: '多个服务项目各自保留请求状态，不连带确认早餐或提前入住。',
      scaffoldingZh: '提供固定预订，回答增加理由与条件。',
      registerZh: '自然服务口语，可直接拒绝加购。',
    },
    [
      [
        'identity',
        'identify',
        'What would you prefer to present first to help locate and check the Alex Chen reservation?',
        '只选核对顺序。',
        'id',
        'I would start with my ID so the name can be checked accurately.',
        'confirmation',
        'I would start with the confirmation because it has the booking reference.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B1.identity, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'dates',
        'verify-dates',
        'What would help you verify that the booking covers the intended two nights?',
        '同两晚，非另订。',
        'aloud',
        'Please read the September tenth-to-twelfth dates aloud so I can compare them with my plan.',
        'written',
        'Let us compare the dates directly with the written confirmation.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B1.dates, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'room',
        'clarify-room',
        'What would you like checked first in the standard-room details?',
        '一人标准房不变。',
        'type',
        'Please check the room category so I know it matches the reservation.',
        'guests',
        'Please check that only one guest is listed, as planned.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B1.room, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'location',
        'express-preference',
        'What is the reason for your preferred location within the hotel?',
        '临近电梯或安静权衡。',
        'near',
        'Being near the lift would make it easier for me to move my bag.',
        'quiet',
        'Being farther from the lift would be preferable because corridor noise bothers me.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B1.location, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'early',
        'negotiate-time',
        'How would you like to handle the gap between now and the usual three-o’clock access time?',
        '提前请求未解决。',
        'ask',
        'I would like to ask about early access, but I understand it needs checking.',
        'wait',
        'I can wait until three, so there is no need to request early access.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B1.early, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'breakfast',
        'decline-extra',
        'Would you like to explore the breakfast option even though it is not included?',
        '礼貌不买或先问价。',
        'ask',
        'Yes, I would like the price before deciding whether to add it.',
        'no',
        'No, I prefer to make my own breakfast plans and leave it out.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B1.breakfast, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'payment',
        'clarify-payment',
        'What format would help you understand the payment information properly?',
        '未付款。',
        'paper',
        'A printed breakdown would let me read the details at my own pace.',
        'screen',
        'A clear display would be enough for me to check the figures.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B1.payment, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'key',
        'request-help',
        'Would a demonstration help you understand the example key card?',
        '未交付真实钥匙。',
        'show',
        'Yes, I would rather see it demonstrated than guess which way to hold it.',
        'clear',
        'No, the example instructions make sense to me already.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B1.key, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'wifi',
        'ask-information',
        'How would you prefer the Wi-Fi steps explained so you can follow them later?',
        '不提供虚假密码。',
        'written',
        'Written instructions would be useful because I can refer back to them.',
        'spoken',
        'A spoken explanation would help me ask about any step I do not understand.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B1.wifi, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'contact',
        'confirm-next',
        'What would be your first way of asking reception for help later?',
        '两未来方式均可行。',
        'call',
        'I would call first because a short question may not need a visit to the desk.',
        'desk',
        'I would come to the desk because I find face-to-face explanations easier.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B1.contact, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'luggage',
        'ask-storage',
        'Would discussing storage be helpful while the access timing remains under discussion?',
        '不把提前入住申请变等待同意。',
        'ask',
        'Yes, I would like to know whether a storage option exists and how it works.',
        'keep',
        'No, I would keep the bag with me until the access timing is clear.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B1.luggage, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'checkout',
        'clarify-departure',
        'What would you like to clarify now about leaving on September twelfth?',
        '新信息是时刻或交卡位置。',
        'time',
        'I would like the required departure time so I can plan that morning.',
        'key',
        'I would like to know where the key should be returned when I leave.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B1.checkout, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#hotel-check-in — B1 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  B2: travelPack(
    scene,
    'B2',
    {
      canDoZh: '权衡方便和安静，核实费用及服务请求的边界。',
      complexityZh: '并列处理多个独立选择，等待和提前请求不互相覆盖。',
      scaffoldingZh: '原预订提供稳定底板，练理由、条件与拒绝。',
      registerZh: '有分寸地协商，不把询问视为授权收费。',
    },
    [
      [
        'identity',
        'identify',
        'Which document would make the most efficient starting point for checking this reservation?',
        '不改姓名。',
        'id',
        'My ID would establish the exact name before we compare it with the reservation.',
        'confirmation',
        'The confirmation would locate the reference quickly, after which the identity details can be checked.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B2.identity, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'dates',
        'verify-dates',
        'How would you like to rule out a mismatch in the two-night booking dates?',
        '两方法验证同日期。',
        'aloud',
        'Please state both September tenth and twelfth explicitly so an arrival or departure mismatch is not overlooked.',
        'written',
        'Please compare the dates with the confirmation rather than relying only on the phrase two nights.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B2.dates, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'room',
        'clarify-room',
        'Which booking detail would you prioritise before discussing optional preferences?',
        '不重复选择偏好。',
        'type',
        'I would prioritise the room category, since a preference should not obscure whether the reservation itself matches.',
        'guests',
        'I would prioritise the single-guest detail so later charges are not discussed on the wrong basis.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B2.room, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'location',
        'express-preference',
        'How would you balance convenience against possible corridor noise?',
        '真实不同权衡。',
        'near',
        'I would favour being near the lift because easier access matters more to me than occasional corridor noise.',
        'quiet',
        'I would favour a room farther from the lift, accepting a longer walk in return for the possibility of less noise.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B2.location, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'early',
        'negotiate-time',
        'Would you request an exception to the usual access time or keep to the stated arrangement?',
        '请求不是例外获批。',
        'ask',
        'I would ask whether early access can be considered, without treating the request as approval.',
        'wait',
        'I would keep to the stated three-o’clock time rather than ask for an exception.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B2.early, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'breakfast',
        'decline-extra',
        'Is the optional breakfast worth discussing, or would you prefer to exclude it?',
        '拒绝被尊重。',
        'ask',
        'I would discuss the full price first, with any decision to add breakfast left open.',
        'no',
        'Please exclude breakfast; I would rather keep this enquiry focused on the room.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B2.breakfast, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'payment',
        'clarify-payment',
        'How would you prefer to examine the charges before any payment decision?',
        '展示方式有区别。',
        'paper',
        'A printed breakdown would allow me to check individual items without feeling rushed.',
        'screen',
        'An itemised screen display would be enough, provided the full figures are visible.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B2.payment, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'key',
        'request-help',
        'Would you benefit from seeing the sample key used, rather than just reading about it?',
        '明确示范样卡。',
        'show',
        'Yes, seeing the orientation would remove a practical uncertainty the written description leaves.',
        'clear',
        'No, the written example is sufficiently clear for me to understand the operation.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B2.key, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'wifi',
        'ask-information',
        'Which instruction format would reduce the need to ask the same Wi-Fi question again?',
        '新服务信息不是已知事实重复。',
        'written',
        'A written sequence would let me revisit the relevant step without relying on memory.',
        'spoken',
        'A spoken explanation would let me resolve unclear terms immediately before making my own note.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B2.wifi, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'contact',
        'confirm-next',
        'How would you choose to raise a later question with reception?',
        '具体沟通渠道。',
        'call',
        'I would call for an initial explanation, since a straightforward question may be settled verbally.',
        'desk',
        'I would come to the desk so I could point to any detail that was causing confusion.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B2.contact, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'luggage',
        'ask-storage',
        'Would it be useful to investigate bag storage independently of the access-time decision?',
        '储物和提前入住两个问题分开。',
        'ask',
        'Yes, I would check the storage conditions without assuming that early room access has been refused or approved.',
        'keep',
        'No, I prefer to retain the bag myself while the timing is clarified.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B2.luggage, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'checkout',
        'clarify-departure',
        'Which aspect of the September twelfth departure would you like made explicit?',
        '日期已知，核对新流程。',
        'time',
        'The required leaving time would help me distinguish the departure date from the actual deadline that morning.',
        'key',
        'The key-return procedure would help me avoid assuming that leaving the room alone completes the departure steps.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.B2.checkout, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#hotel-check-in — B2 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
  C1: travelPack(
    scene,
    'C1',
    {
      canDoZh: '精确区分预订核实、偏好及附加服务授权，解释取舍。',
      complexityZh: '有条理保留待解决条件，避免把独立请求连成隐含承诺。',
      scaffoldingZh: '仅给必要日期和服务边界，使用自然限定和明确理由。',
      registerZh: '正式前台协商但不堆砌礼貌词；CEFR C1对齐。',
    },
    [
      [
        'identity',
        'identify',
        'Which order would make the reservation and identity checks least ambiguous?',
        '文档顺序不同，姓名不变。',
        'id',
        'I would establish the exact name from my ID first, then use that as the reference when checking the reservation.',
        'confirmation',
        'I would locate the reservation by its confirmation reference first, then verify that its identity details match my ID.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.C1.identity, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'dates',
        'verify-dates',
        'How would you prefer to establish that both ends of the intended stay match the booking?',
        '不能仅靠两晚推断日期。',
        'aloud',
        'Please state September tenth as the arrival and September twelfth as the departure, so neither end is left to inference.',
        'written',
        'I would compare the dates against the confirmation directly; agreement on the number of nights alone would not rule out a shifted stay.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.C1.dates, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'room',
        'clarify-room',
        'Which reservation detail should anchor the discussion before preferences are considered?',
        '原订一人标准房。',
        'type',
        'The standard-room category should be established first, so a location preference is not mistaken for a request to change the booked category.',
        'guests',
        'The one-guest occupancy should be established first, so subsequent information is not based on an assumed additional guest.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.C1.room, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'location',
        'express-preference',
        'What compromise are you prepared to make over the room’s position?',
        '可口述的具体权衡。',
        'near',
        'I would accept some corridor traffic for a room near the lift; ease of moving my bag is the more practical concern.',
        'quiet',
        'I would accept a longer walk for a room farther from the lift, while recognising that location alone cannot guarantee silence.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.C1.location, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'early',
        'negotiate-time',
        'How would you express your position on access before the usual three-o’clock time?',
        '请求与等待不混淆。',
        'ask',
        'I would welcome a check on early access, but please leave the outcome open until availability and any conditions are clear.',
        'wait',
        'I can work with three o’clock, so there is no need to seek an exception on my behalf.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.C1.early, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'breakfast',
        'decline-extra',
        'Where would you draw the line between discussing breakfast and agreeing to add it?',
        '明确询价边界。',
        'ask',
        'I am willing to consider it once the full price is clear, but an enquiry should not be recorded as consent to add the charge.',
        'no',
        'I do not want to add breakfast, so further pricing detail is unnecessary for this booking discussion.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.C1.breakfast, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'payment',
        'clarify-payment',
        'What would let you examine the payment information carefully without committing prematurely?',
        '不授权支付。',
        'paper',
        'A printed itemised explanation would let me check the basis of each charge before making a payment decision.',
        'screen',
        'A complete itemised display would be sufficient, provided I can review it rather than respond to a total quoted in passing.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.C1.payment, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'key',
        'request-help',
        'Does the written key-card example leave a practical uncertainty that a demonstration would resolve?',
        '示例卡片不同于实际发卡。',
        'show',
        'Yes, I would like the orientation demonstrated; that specific point is less clear to me than the rest of the instructions.',
        'clear',
        'No, the example already makes the operation clear, so a further demonstration would not add anything I need.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.C1.key, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'wifi',
        'ask-information',
        'Which explanation would give you a dependable reference for the Wi-Fi steps?',
        '保留实际操作范围。',
        'written',
        'A concise written sequence would be most useful, because I could return to a particular step without reconstructing the whole explanation.',
        'spoken',
        'A spoken explanation would let me resolve ambiguous terms immediately, after which I could note the steps in my own words.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.C1.wifi, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'contact',
        'confirm-next',
        'How would you choose a contact method if a further question arose?',
        '两策略不是强制流程。',
        'call',
        'I would begin by calling reception, unless the issue proved difficult to explain without showing the relevant detail.',
        'desk',
        'I would come to the desk because being able to point to the information often makes the explanation more precise.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.C1.contact, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'luggage',
        'ask-storage',
        'Would a separate enquiry about storage help without prejudging the room-access discussion?',
        '提前入住始终独立待定。',
        'ask',
        'Yes, I would like the storage conditions explained as an independent option, not as evidence that the access request has been settled.',
        'keep',
        'No, I would retain the bag for now; that choice does not require the room-access question to be resolved first.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.C1.luggage, Codex postdraft reading 2026-09-10',
        },
      ],
      [
        'checkout',
        'clarify-departure',
        'What should be clarified about departure rather than left implicit in the booked end date?',
        '新事实不重复确认日期。',
        'time',
        'The leaving time on September twelfth should be explicit, since a date by itself does not tell me the deadline that morning.',
        'key',
        'The key-return procedure should be explicit, so I do not confuse vacating the room with completing every requested departure step.',
        {
          state: 'model-reviewed',
          record:
            'travel-review.md#hotel-check-in — hotel-check-in.C1.checkout, Codex postdraft reading 2026-09-10',
        },
      ],
    ],
    {
      state: 'model-reviewed',
      record:
        'travel-review.md#hotel-check-in — C1 counter/assistance situations, paths, endings and repairs read 2026-09-10',
    },
  ),
}
