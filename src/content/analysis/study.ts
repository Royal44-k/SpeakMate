import type { AnalysisEntry } from './schema'
const source = [
  'Original study examples; CEFR2020 interaction design interpreted in docs/research/2026-09-09-local-learning-evidence.md. Not copied course text or certification.',
]
export const studyAnalysis: AnalysisEntry[] = [
  {
    id: 'study.partner',
    contentVersion: 1,
    kind: 'word',
    forms: ['partner'],
    sceneId: 'study-01',
    intents: ['choose-partner-format'],
    meaningZh:
      '本课堂情境中指一起完成两人练习的搭档，不自动指恋人或商业合伙人。',
    grammarZh:
      '可数名词；a partner、my partner、work with a partner。with 后接合作的人。',
    registerZh: '普通课堂交流，适用于安排配对任务。',
    errorsZh:
      '不要因为别的句子出现 partner 就断言它仍是课堂搭档；不要把 work with 和 work for 混同。',
    examples: [
      { level: 'A1', text: 'I need a partner.', substitution: 'I need a pen.' },
      {
        level: 'A2',
        text: 'I would like the same partner for this activity.',
        substitution: 'I would like a new partner for the next activity.',
      },
      {
        level: 'B1',
        text: 'My partner and I could take turns asking questions.',
        substitution:
          'My partner and I could take turns describing the picture.',
      },
      {
        level: 'B2',
        text: 'A more confident partner should not have to lead every exchange.',
        substitution:
          'A quieter partner should still have an opportunity to contribute.',
      },
      {
        level: 'C1',
        text: 'Rotating partners could broaden the discussion, provided each new pair has time to establish a shared starting point.',
        substitution:
          'Keeping the same partner could support continuity, provided the roles do not become fixed.',
      },
    ],
    sourceBasis: source,
    review: {
      state: 'model-reviewed',
      record: 'study-review.md: analysis partner',
    },
  },
  {
    id: 'study.for-example',
    contentVersion: 1,
    kind: 'phrase',
    forms: ['for example'],
    sceneId: 'study-02',
    intents: ['request-example', 'apply-example'],
    meaningZh:
      '例如，用来引出某一类别或解释的具体例子；一个例子本身不证明普遍规律。',
    grammarZh:
      '可放在句首，通常后接逗号；也可作插入语。for example 不是 such as 后接名词那种完全相同的句法框架。',
    registerZh: '课堂提问与解释中常见，中性语域。',
    errorsZh:
      '不要把一个示例说成所有情况都如此；完整句前通常用 For example, 而不是直接把 such as 当连接完整句的连词。',
    examples: [
      {
        level: 'A1',
        text: 'I know a word, for example, “book”.',
        substitution: 'I know a word, for example, “apple”.',
      },
      {
        level: 'A2',
        text: 'We can write about a place. For example, we can describe a park.',
        substitution:
          'We can write about a person. For example, we can describe a friend.',
      },
      {
        level: 'B1',
        text: 'Could you show a different use, for example, a question with the same verb?',
        substitution:
          'Could you show another pattern, for example, a sentence with two actions?',
      },
      {
        level: 'B2',
        text: 'The wording may overstate the result; for example, “everyone” includes people who did not respond.',
        substitution:
          'The wording may hide a limit; for example, “usually” suggests observations from more than one day.',
      },
      {
        level: 'C1',
        text: 'The claim needs a clearer boundary; for example, it could be restricted to the group actually observed.',
        substitution:
          'The explanation needs a testable contrast; for example, we could compare what the two formulations imply.',
      },
    ],
    sourceBasis: source,
    review: {
      state: 'model-reviewed',
      record: 'study-review.md: analysis for-example',
    },
  },
  {
    id: 'study.role',
    contentVersion: 1,
    kind: 'word',
    forms: ['role'],
    sceneId: 'study-03',
    intents: ['choose-role', 'include-absent-member'],
    meaningZh: '在小组项目中承担的职责或作用，不表示一个人拥有全部决定权。',
    grammarZh:
      '可数名词；take on a role、define a role、a role in the project。in 后接活动或范围。',
    registerZh: '中性的合作和学习规划用语。',
    errorsZh:
      'role 是职责，roll 可指卷状物或滚动；承担协调角色不等于替缺席者同意方案。',
    examples: [
      {
        level: 'A1',
        text: 'My role is to draw.',
        substitution: 'My role is to write.',
      },
      {
        level: 'A2',
        text: 'Would you like a role in making the poster?',
        substitution: 'Would you like a role in checking the labels?',
      },
      {
        level: 'B1',
        text: 'We should discuss the absent member’s role when they arrive.',
        substitution:
          'We should discuss each person’s role before dividing the materials.',
      },
      {
        level: 'B2',
        text: 'The coordinating role includes combining sections, not rewriting everyone’s argument without discussion.',
        substitution:
          'The checking role includes flagging uncertain claims, not silently deleting another person’s work.',
      },
      {
        level: 'C1',
        text: 'The scope of the role should be explicit so that responsibility for integration is not confused with authority over every contribution.',
        substitution:
          'The limits of the role should remain open to review if the workload turns out to be uneven.',
      },
    ],
    sourceBasis: source,
    review: {
      state: 'model-reviewed',
      record: 'study-review.md: analysis role',
    },
  },
  {
    id: 'study.chart-sentence',
    contentVersion: 1,
    kind: 'sentence',
    forms: ['The chart shows ten students.'],
    sceneId: 'study-04',
    intents: ['report-number', 'explain-chart'],
    meaningZh:
      '这张图表展示了十名学生的信息。本情境的十人为虚构示例，句子本身没说十人都步行，也没说明偏好或原因。',
    grammarZh:
      'The chart 是单数主语，show 加 s 成 shows；ten students 是复数宾语。一般现在时在这里描述图表当前呈现的内容。',
    registerZh: '清楚中性的图表介绍，适合问答中交代样本大小。',
    errorsZh:
      '不要把 shows ten students 误解成 ten students walk；展示数量不等于证明因果关系，也不自动支持全校结论。',
    examples: [
      {
        level: 'A1',
        text: 'The chart shows ten students.',
        substitution: 'The picture shows two chairs.',
      },
      {
        level: 'A2',
        text: 'The chart shows ten students: six walk and four take the bus.',
        substitution: 'The chart shows one day, not a whole week.',
      },
      {
        level: 'B1',
        text: 'The chart shows ten students, but it does not explain their reasons for travelling that way.',
        substitution:
          'The chart shows two travel methods, but it does not compare journey times.',
      },
      {
        level: 'B2',
        text: 'The chart shows ten students, so the total should remain visible beside any percentage.',
        substitution:
          'The chart shows a one-day distribution, so it should not be presented as a stable trend.',
      },
      {
        level: 'C1',
        text: 'The chart shows ten students; treating that small descriptive example as a school-wide finding would extend the claim beyond its basis.',
        substitution:
          'The chart shows recorded methods of travel; calling them preferences would introduce a distinction that was never measured.',
      },
    ],
    sourceBasis: source,
    review: {
      state: 'model-reviewed',
      record: 'study-review.md: analysis chart-sentence',
    },
  },
  {
    id: 'study.evidence',
    contentVersion: 1,
    kind: 'word',
    forms: ['evidence'],
    sceneId: 'study-05',
    intents: ['evaluate-evidence', 'refer-to-material'],
    meaningZh:
      '支持某个判断的依据；在本讨论中可指明确提供的观察或文本细节，需区分它能支持什么和不能支持什么。',
    grammarZh:
      '通常为不可数名词：some evidence、a piece of evidence、evidence for a claim。普通本情境不用 an evidence。',
    registerZh:
      '中性至学术语域；简单等级可用给出的词组理解，不要求独立做研究论证。',
    errorsZh:
      'evidence 不等于某人说得自信；一个观察也不自动证明原因或长期效果。避免把相关或时间先后写成因果。',
    examples: [
      {
        level: 'A1',
        text: 'Here is some evidence.',
        substitution: 'Here is some information.',
      },
      {
        level: 'A2',
        text: 'Where can we find evidence for this idea?',
        substitution: 'Where can we find an example of this idea?',
      },
      {
        level: 'B1',
        text: 'The text gives evidence that reading is allowed, but not that every student uses the corner.',
        substitution:
          'The picture gives evidence of two chairs, but not of who normally sits there.',
      },
      {
        level: 'B2',
        text: 'A single observation is limited evidence for a claim about improved concentration.',
        substitution:
          'Several positive comments may still be limited evidence for a claim about all students.',
      },
      {
        level: 'C1',
        text: 'The evidence supports a narrow description of what occurred, not the causal explanation being attached to it.',
        substitution:
          'The evidence needs to be weighed against the claim’s scope, rather than described as strong without specifying what it supports.',
      },
    ],
    sourceBasis: source,
    review: {
      state: 'model-reviewed',
      record: 'study-review.md: analysis evidence',
    },
  },
  {
    id: 'study.work-on',
    contentVersion: 1,
    kind: 'phrase',
    forms: ['work on'],
    sceneId: 'study-06',
    intents: ['state-consultation-aim', 'set-priority', 'choose-practice'],
    meaningZh: '着手练习、改善某个具体方面，强调过程；不表示已经完成或掌握。',
    grammarZh:
      'work on + 名词或动名词，如 work on a description、work on making references clear。此处 on 不是表面位置。',
    registerZh: '自然常用的学习咨询口语，比笼统地说自己很差更聚焦。',
    errorsZh:
      'work on 不等于 work out（解决或弄明白等义）；说 will work on 只表达计划，不能推定已修改或取得进步。',
    examples: [
      {
        level: 'A1',
        text: 'I want to work on writing.',
        substitution: 'I want to work on reading.',
      },
      {
        level: 'A2',
        text: 'I would like to work on word order today.',
        substitution: 'I would like to work on spelling today.',
      },
      {
        level: 'B1',
        text: 'I will work on linking my sentences before adding more detail.',
        substitution: 'I will work on finding simpler words when I get stuck.',
      },
      {
        level: 'B2',
        text: 'I would rather work on one recurring issue than collect corrections I cannot apply independently.',
        substitution:
          'I would rather work on the main source of confusion than polish wording that is already clear.',
      },
      {
        level: 'C1',
        text: 'I plan to work on distinguishing intended effects from demonstrated outcomes, using unfamiliar examples to test the distinction.',
        substitution:
          'I plan to work on qualifying claims without weakening the points that the available information genuinely supports.',
      },
    ],
    sourceBasis: source,
    review: {
      state: 'model-reviewed',
      record: 'study-review.md: analysis work-on',
    },
  },
]
