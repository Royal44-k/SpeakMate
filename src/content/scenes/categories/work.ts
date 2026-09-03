import { defineScenes, type SceneSeed } from '../factory'

const scenes = [
  {
    slug: 'work-introduction', titleZh: '职场自我介绍', titleEn: 'Work introduction', summaryZh: '用合适的详略介绍角色、经历和合作方式。', learnerRole: '刚加入国际团队的成员', aiRole: '主持团队欢迎会的同事', goalsZh: ['说明岗位和职责', '概括相关经历', '提出建立合作的下一步'], keywords: ['role', 'team', 'experience', 'responsible', 'collaborate', 'background'],
    expressions: { basic: ['I work in product design.', 'I am new to the team.'], standard: ['I am responsible for user research and prototyping.', 'I look forward to working with the engineering team.'], advanced: ['My background sits at the intersection of research and product strategy, so I often translate ambiguity into testable decisions.', 'I would value an early conversation about how this team prefers to surface risks.'] },
    openings: { basic: 'What is your job?', standard: 'Welcome! Could you tell the team a little about yourself?', advanced: 'It would be helpful to understand not only your background, but also how you tend to contribute when a project is uncertain.' }, imageAltZh: '国际团队围桌进行欢迎会',
  },
  {
    slug: 'daily-standup', titleZh: '每日站会', titleEn: 'Daily stand-up', summaryZh: '简洁汇报进展、计划和阻塞。', learnerRole: '参加英文站会的项目成员', aiRole: '控制会议节奏的敏捷教练', goalsZh: ['说明昨天完成内容', '说明今天计划', '明确阻塞与所需帮助'], keywords: ['finished', 'today', 'blocked', 'dependency', 'priority', 'handoff'],
    expressions: { basic: ['I finished the login page.', 'Today I will test it.'], standard: ['I completed the API integration and will address review comments today.', 'I am blocked by access to the staging environment.'], advanced: ['The core path is complete, but the handoff risk remains because the upstream schema is still changing.', 'I can protect the deadline if we freeze the interface by noon.'] },
    openings: { basic: 'What did you finish?', standard: 'Please share your progress, plan, and any blockers.', advanced: 'Give us the shortest useful update, and flag anything that could change another team member’s priorities.' }, imageAltZh: '团队站会与任务看板',
  },
  {
    slug: 'progress-update', titleZh: '汇报进度', titleEn: 'Progress update', summaryZh: '用证据说明状态、风险和下一步。', learnerRole: '向项目负责人汇报的执行者', aiRole: '重视结果与风险的项目负责人', goalsZh: ['概括当前状态', '用证据解释偏差', '提出下一步和需要的决策'], keywords: ['progress', 'milestone', 'risk', 'evidence', 'next step', 'decision'],
    expressions: { basic: ['The first part is done.', 'We need two more days.'], standard: ['We have completed three of the four milestones.', 'The main risk is delayed feedback from the vendor.'], advanced: ['The headline is that scope remains achievable, but confidence has dropped due to an unresolved dependency.', 'I need a decision today on whether we protect the date or the full feature set.'] },
    openings: { basic: 'Is the work finished?', standard: 'Could you give me a brief status update?', advanced: 'Start with the decision-relevant headline, then tell me what evidence changes our confidence.' }, imageAltZh: '会议室屏幕上的项目进度',
  },
  {
    slug: 'deadline-negotiation', titleZh: '协商截止日期', titleEn: 'Negotiating a deadline', summaryZh: '解释限制并提出可信的范围或日期方案。', learnerRole: '需要重新协商交付计划的负责人', aiRole: '关注业务承诺的客户方经理', goalsZh: ['说明无法按期的原因', '给出替代日期或范围', '明确双方下一步承诺'], keywords: ['deadline', 'scope', 'trade-off', 'deliver', 'commitment', 'phased'],
    expressions: { basic: ['We need more time.', 'We can finish on Friday.'], standard: ['Could we move the deadline to next Tuesday?', 'We can keep the date if we reduce the scope.'], advanced: ['Rather than offer an unreliable promise, I suggest a phased delivery that protects the critical workflow.', 'If the date is immovable, we need agreement on which quality risk the business is willing to accept.'] },
    openings: { basic: 'Can you finish tomorrow?', standard: 'The agreed deadline is Friday. What has changed?', advanced: 'The launch commitment has already been communicated externally, so any change needs a compelling rationale and a mitigation plan.' }, imageAltZh: '办公室内对项目时间表进行协商',
  },
  {
    slug: 'meeting-disagreement', titleZh: '会议表达异议', titleEn: 'Disagreeing in a meeting', summaryZh: '尊重地质疑观点并提出可验证的替代方案。', learnerRole: '对提案存在专业异议的参会者', aiRole: '对原方案投入较多的会议主持人', goalsZh: ['明确认可共同目标', '具体说明风险或异议', '提出替代方案或验证方法'], keywords: ['concern', 'assumption', 'alternative', 'evidence', 'challenge', 'align'],
    expressions: { basic: ['I am not sure about this.', 'Can we try another way?'], standard: ['I see the benefit, but I am concerned about the timeline.', 'Could we test that assumption before committing?'], advanced: ['I support the objective, though I would challenge the assumption that adoption will follow automatically.', 'Could we frame this as a reversible experiment rather than an irreversible commitment?'] },
    openings: { basic: 'Do you agree?', standard: 'It sounds like you have a concern. What is it?', advanced: 'We appear aligned on the goal but not the approach. Which assumption do you believe is weakest?' }, imageAltZh: '多元团队在会议中讨论方案',
  },
  {
    slug: 'job-interview', titleZh: '求职面试', titleEn: 'Job interview', summaryZh: '用具体事例介绍能力、动机和判断。', learnerRole: '申请国际团队岗位的候选人', aiRole: '追问细节的招聘经理', goalsZh: ['清晰说明求职动机', '用 STAR 事例证明能力', '提出有质量的问题'], keywords: ['experience', 'challenge', 'result', 'motivation', 'strength', 'impact'],
    expressions: { basic: ['I have three years of experience.', 'I enjoy solving problems.'], standard: ['In my last role, I led a project that improved retention.', 'I am interested because the role combines research and execution.'], advanced: ['The hardest decision was to narrow the scope despite stakeholder pressure; it improved both delivery speed and adoption.', 'How does the team distinguish strong execution from strong product judgment in performance reviews?'] },
    openings: { basic: 'Tell me about yourself.', standard: 'Why are you interested in this role?', advanced: 'Walk me through a decision where the obvious solution was not the right one, and explain your personal contribution.' }, imageAltZh: '专业而友好的求职面试',
  },
] satisfies readonly SceneSeed[]

export const WORK_SCENES = defineScenes('work', 'work', scenes)
