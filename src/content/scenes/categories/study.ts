import { defineScenes, type SceneSeed } from '../factory'

const scenes = [
  {
    slug: 'class-introduction', titleZh: '课堂介绍', titleEn: 'Class introduction', summaryZh: '介绍学习背景、兴趣和课程目标。', learnerRole: '国际课堂的新同学', aiRole: '鼓励学生参与的授课老师', goalsZh: ['介绍姓名和背景', '说明学习兴趣', '表达一个课程目标'], keywords: ['student', 'study', 'interest', 'course', 'goal', 'background'],
    expressions: { basic: ['My name is Ming.', 'I study economics.'], standard: ['I am especially interested in behavioral economics.', 'I hope to become more confident discussing research.'], advanced: ['My current focus is how incentives shape consumer behavior, although I am still refining the research question.', 'I hope the course will challenge both my method and the assumptions behind it.'] },
    openings: { basic: 'What is your name?', standard: 'Please introduce yourself and tell us what interests you about the course.', advanced: 'Give us a short introduction that helps your classmates understand both your background and the questions you bring.' }, imageAltZh: '明亮国际课堂中的学生介绍',
  },
  {
    slug: 'ask-teacher', titleZh: '向老师提问', titleEn: 'Asking a teacher', summaryZh: '指出不理解之处并提出具体问题。', learnerRole: '需要澄清课程内容的学生', aiRole: '引导学生思考的老师', goalsZh: ['说明卡住的具体位置', '提出清晰问题', '用自己的话确认理解'], keywords: ['question', 'mean', 'example', 'explain', 'clarify', 'understand'],
    expressions: { basic: ['What does this mean?', 'Can you give an example?'], standard: ['I understand the definition, but not how it applies here.', 'Could you explain the difference another way?'], advanced: ['I follow the mechanism in the simplified case, but I am unsure which assumption breaks in the real example.', 'May I test my understanding by restating the argument?'] },
    openings: { basic: 'What is your question?', standard: 'Which part would you like me to explain?', advanced: 'Tell me what you already understand and the precise point where the reasoning stops being clear.' }, imageAltZh: '学生课后向老师提问',
  },
  {
    slug: 'group-project', titleZh: '小组分工', titleEn: 'Dividing group work', summaryZh: '协商任务、时间和责任边界。', learnerRole: '参与英文小组项目的学生', aiRole: '有不同偏好的组员', goalsZh: ['提出合理分工', '确认依赖和截止时间', '解决任务不均衡问题'], keywords: ['task', 'research', 'deadline', 'responsible', 'workload', 'coordinate'],
    expressions: { basic: ['I can make the slides.', 'Can you do the research?'], standard: ['Let us agree on owners and internal deadlines.', 'The workload does not seem evenly distributed.'], advanced: ['The tasks look equal in number but not in effort; could we estimate them before assigning owners?', 'I can take the analysis if someone else owns data cleaning and documents the assumptions.'] },
    openings: { basic: 'Which task do you want?', standard: 'How should we divide the research, analysis, and presentation?', advanced: 'Before we assign names, can we map the dependencies and identify which tasks carry the most uncertainty?' }, imageAltZh: '学生围桌讨论小组项目',
  },
  {
    slug: 'presentation-qa', titleZh: '演讲问答', titleEn: 'Presentation Q&A', summaryZh: '理解问题、组织回答并处理未知信息。', learnerRole: '完成英文演讲的报告人', aiRole: '提出尖锐但合理问题的听众', goalsZh: ['确认问题含义', '给出有结构的回答', '诚实处理未知或限制'], keywords: ['question', 'evidence', 'limitation', 'result', 'assumption', 'follow up'],
    expressions: { basic: ['Thank you for the question.', 'The result was positive.'], standard: ['If I understand correctly, you are asking about the sample size.', 'That is a limitation we plan to address.'], advanced: ['The short answer is yes, but the evidence supports a narrower claim than the slide may imply.', 'I do not have that breakdown here; I would rather verify it and follow up than speculate.'] },
    openings: { basic: 'Why did you choose this topic?', standard: 'How confident are you in the result?', advanced: 'Your conclusion seems stronger than the evidence shown. Which assumption justifies that leap?' }, imageAltZh: '学术演讲后的听众提问',
  },
  {
    slug: 'seminar-discussion', titleZh: '研讨讨论', titleEn: 'Seminar discussion', summaryZh: '引用观点、建立联系并推进集体讨论。', learnerRole: '参与小型英文研讨课的学生', aiRole: '推动深度讨论的同学', goalsZh: ['概括文本或他人观点', '提出有依据的回应', '提出推动讨论的问题'], keywords: ['argument', 'evidence', 'author', 'connection', 'interpretation', 'implication'],
    expressions: { basic: ['The author says this is important.', 'I agree with this idea.'], standard: ['This connects to the earlier point about access.', 'What evidence would change this interpretation?'], advanced: ['The argument is persuasive at the institutional level, but less so when individual incentives are considered.', 'Could the apparent contradiction reflect two different definitions of responsibility?'] },
    openings: { basic: 'Do you agree with the author?', standard: 'Which argument in the reading did you find most convincing?', advanced: 'What tension in the text remains unresolved, and why does that tension matter beyond this case?' }, imageAltZh: '小型研讨班围圈讨论',
  },
  {
    slug: 'office-hours', titleZh: 'Office Hour', titleEn: 'Office hours', summaryZh: '高效向老师讨论方向、反馈和下一步。', learnerRole: '带着初步想法参加答疑的学生', aiRole: '时间有限且重视学生主动性的教授', goalsZh: ['简要说明来意和准备', '提出最需要帮助的问题', '确认下一步行动'], keywords: ['feedback', 'topic', 'draft', 'direction', 'priority', 'next step'],
    expressions: { basic: ['Can you check my topic?', 'What should I do next?'], standard: ['I have narrowed the topic, but I am unsure about the research question.', 'Which revision should I prioritize?'], advanced: ['I am choosing between a broader comparative question and a narrower causal claim; where do you see the stronger contribution?', 'Could we agree on the evidence I should gather before our next conversation?'] },
    openings: { basic: 'How can I help?', standard: 'What would be most useful to discuss today?', advanced: 'We have fifteen minutes. Give me the decision you are trying to make and the work you have already done.' }, imageAltZh: '教授办公室中的一对一答疑',
  },
] satisfies readonly SceneSeed[]

export const STUDY_SCENES = defineScenes('study', 'study', scenes)
