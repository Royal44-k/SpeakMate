import { defineScenes, type SceneSeed } from '../factory'

const scenes = [
  {
    slug: 'first-small-talk', titleZh: '初次寒暄', titleEn: 'First-time small talk', summaryZh: '自然开启、延续并结束轻松对话。', learnerRole: '第一次见面的活动参与者', aiRole: '友好但不熟悉你的同行', goalsZh: ['自然介绍自己', '提出开放式问题', '礼貌结束或交换联系方式'], keywords: ['nice to meet', 'from', 'interest', 'event', 'conversation', 'contact'],
    expressions: { basic: ['Nice to meet you.', 'Where are you from?'], standard: ['What brought you to this event?', 'It was lovely talking with you.'], advanced: ['I noticed your question during the talk; what sparked your interest in the topic?', 'I should let you mingle, but I would enjoy continuing this conversation later.'] },
    openings: { basic: 'Hi, I am Alex.', standard: 'Hi, I do not think we have met. How are you finding the event?', advanced: 'That was an interesting session. I am curious which part resonated most with you.' }, imageAltZh: '轻松社交活动中的两人交谈',
  },
  {
    slug: 'networking-event', titleZh: '活动社交', titleEn: 'Networking event', summaryZh: '介绍专业兴趣并建立有意义的连接。', learnerRole: '希望拓展行业联系的参与者', aiRole: '时间有限的资深行业人士', goalsZh: ['用一句话说明专业方向', '找到共同兴趣', '提出合适的后续联系'], keywords: ['work', 'industry', 'project', 'connect', 'insight', 'follow up'],
    expressions: { basic: ['I work in technology.', 'Can we connect?'], standard: ['I focus on language-learning products.', 'Would you be open to a short follow-up call?'], advanced: ['I am exploring how conversational interfaces can reduce the fear of speaking, which seems adjacent to your work.', 'Rather than take more of your time now, may I send a concise note with the relevant finding?'] },
    openings: { basic: 'What do you do?', standard: 'What area do you work in?', advanced: 'You mentioned you are building in education. What specific problem are you trying to solve?' }, imageAltZh: '现代行业交流活动与胸牌',
  },
  {
    slug: 'make-invitation', titleZh: '发出邀请', titleEn: 'Making an invitation', summaryZh: '提出具体邀请并灵活协调时间。', learnerRole: '想邀请新朋友参加活动的人', aiRole: '感兴趣但日程不确定的朋友', goalsZh: ['说明活动和原因', '提出具体时间地点', '回应犹豫并确认安排'], keywords: ['free', 'join', 'Saturday', 'place', 'plan', 'available'],
    expressions: { basic: ['Are you free Saturday?', 'Would you like to join us?'], standard: ['We are having dinner near the river. Would you like to come?', 'If Saturday is difficult, Sunday also works.'], advanced: ['A few of us are going to the exhibition you mentioned; I thought it might be your kind of thing.', 'No pressure at all—if this weekend is busy, we can find a quieter time.'] },
    openings: { basic: 'What is the plan?', standard: 'That sounds nice. When were you thinking?', advanced: 'I would be interested, although my weekend is fairly crowded. What did you have in mind?' }, imageAltZh: '朋友通过手机商量周末活动',
  },
  {
    slug: 'polite-refusal', titleZh: '礼貌拒绝', titleEn: 'Polite refusal', summaryZh: '在维护关系的同时清楚表达边界。', learnerRole: '无法接受邀请或请求的人', aiRole: '热情且会尝试说服你的朋友或同事', goalsZh: ['表达感谢或理解', '清楚拒绝而不过度解释', '视情况给出替代方案'], keywords: ['thank', 'cannot', 'unfortunately', 'another time', 'appreciate', 'commitment'],
    expressions: { basic: ['Thank you, but I cannot.', 'Maybe another time.'], standard: ['I appreciate the invitation, but I already have plans.', 'I cannot take this on, though I can review it next week.'], advanced: ['I value being included, but I need to decline so I do not overcommit.', 'I cannot support the full request; I could, however, help define the first step.'] },
    openings: { basic: 'Can you come tonight?', standard: 'We would really like you to join us. Are you sure you cannot?', advanced: 'Your involvement would make a real difference, so I wanted to ask whether there is any flexibility.' }, imageAltZh: '两位朋友进行真诚而平静的对话',
  },
  {
    slug: 'discuss-opinions', titleZh: '讨论观点', titleEn: 'Discussing opinions', summaryZh: '表达立场、倾听理由并寻找共识。', learnerRole: '参与轻度争议话题讨论的人', aiRole: '持不同观点但愿意交流的朋友', goalsZh: ['清楚表达观点', '询问并复述对方理由', '指出共识或保留分歧'], keywords: ['opinion', 'reason', 'agree', 'however', 'perspective', 'common ground'],
    expressions: { basic: ['I think it is a good idea.', 'Why do you think that?'], standard: ['I understand your point, but my experience was different.', 'It sounds like we agree on the goal.'], advanced: ['I may be weighting the risks differently, though I can see why that experience led you there.', 'Perhaps the disagreement is less about values than about which outcome seems most likely.'] },
    openings: { basic: 'What do you think?', standard: 'I see it differently. What makes you feel that way?', advanced: 'I suspect we agree on more than it seems. Which underlying principle matters most to you here?' }, imageAltZh: '朋友在公园长椅上讨论观点',
  },
  {
    slug: 'apology-repair', titleZh: '道歉与修复关系', titleEn: 'Apology and repair', summaryZh: '承担责任、理解影响并提出修复行动。', learnerRole: '需要为失误真诚道歉的人', aiRole: '受到影响且仍有情绪的朋友或同事', goalsZh: ['明确承认具体行为', '理解对方受到的影响', '提出可信的修复行动'], keywords: ['sorry', 'fault', 'understand', 'impact', 'make it right', 'trust'],
    expressions: { basic: ['I am sorry I was late.', 'It was my fault.'], standard: ['I should have told you earlier.', 'I understand why that was frustrating.'], advanced: ['I am sorry; I prioritized my convenience and left you dealing with the consequences.', 'I do not expect trust to reset immediately, but here is what I will change.'] },
    openings: { basic: 'Why were you late?', standard: 'I was disappointed that you did not tell me.', advanced: 'The mistake mattered, but the lack of communication affected my trust even more. What do you want me to understand now?' }, imageAltZh: '安静咖啡馆中的真诚道歉',
  },
] satisfies readonly SceneSeed[]

export const SOCIAL_SCENES = defineScenes('social', 'social', scenes)
