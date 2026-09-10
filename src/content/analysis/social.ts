import type { AnalysisEntry } from './schema'

const source =
  'Original social-use notes; CEFR2020 oral interaction and conversation pp.70–71; https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4. Local design evidence: docs/research/2026-09-09-local-learning-evidence.md. Not a general dictionary or certification.'
export const socialAnalysis: AnalysisEntry[] = [
  {
    id: 'social.neighbour',
    contentVersion: 1,
    kind: 'word',
    forms: ['neighbour', 'neighbor'],
    sceneId: 'social-01',
    intents: ['describe-connection'],
    meaningZh: '邻居，指住在附近的人；本场景不要求具体住址。',
    grammarZh:
      '可数名词，单数常用 a/my 等限定词。neighbour 是英式拼法，neighbor 是美式拼法。',
    registerZh: '中性日常用语。说 a neighbour 不表示是亲密朋友。',
    errorsZh:
      '不要把 neighbour 与 neighbourhood（社区、街区）混为一谈；认识邻居不自动允许交换私人资料。',
    examples: [
      {
        level: 'A1',
        text: 'A neighbour is here.',
        substitution: 'My neighbour is here.',
      },
      {
        level: 'A2',
        text: 'A neighbour told me about the garden.',
        substitution: 'A friend told me about the garden.',
      },
      {
        level: 'B1',
        text: 'I met a neighbour while I was looking at the plants.',
        substitution: 'I met a volunteer while I was looking at the plants.',
      },
      {
        level: 'B2',
        text: 'A neighbour recommended the event, although I had not been before.',
        substitution:
          'A colleague recommended the event, although I had not been before.',
      },
      {
        level: 'C1',
        text: 'I know a few neighbours by sight, but I would not claim to know them well.',
        substitution:
          'I know a few volunteers by sight, but I would not claim to know them well.',
      },
    ],
    sourceBasis: [source],
    review: {
      state: 'model-reviewed',
      record: 'social-review.md: social.neighbour',
    },
  },
  {
    id: 'social.keep-in-touch',
    contentVersion: 1,
    kind: 'phrase',
    forms: ['keep in touch'],
    sceneId: 'social-02',
    intents: ['choose-contact'],
    meaningZh: '保持联系；作为请求或意愿并不证明双方已同意交换资料。',
    grammarZh:
      'keep in touch with somebody；情态动词后用原形 keep。可用 would like to 表达自愿意向。',
    registerZh: '友好自然，常见于认识后的告别或后续联络商量。',
    errorsZh:
      '不是 keep touch，也不要把一句客气告别当作长期联系许可。with 后接联系对象。',
    examples: [
      {
        level: 'A1',
        text: 'I want to keep in touch.',
        substitution: 'I do not want to keep in touch.',
      },
      {
        level: 'A2',
        text: 'We could keep in touch by email.',
        substitution: 'We could keep in touch by phone.',
      },
      {
        level: 'B1',
        text: 'I would like to keep in touch about local workshops.',
        substitution: 'I would like to keep in touch about future exhibitions.',
      },
      {
        level: 'B2',
        text: 'I would be happy to keep in touch, provided neither of us felt obliged to reply quickly.',
        substitution:
          'I would be happy to exchange emails, provided neither of us felt obliged to reply quickly.',
      },
      {
        level: 'C1',
        text: 'There would be a reason to keep in touch if we both wanted to continue discussing the exhibition.',
        substitution:
          'There would be a reason to meet again if we both wanted to continue discussing the exhibition.',
      },
    ],
    sourceBasis: [source],
    review: {
      state: 'model-reviewed',
      record: 'social-review.md: social.keep-in-touch',
    },
  },
  {
    id: 'social.invitation',
    contentVersion: 1,
    kind: 'word',
    forms: ['invitation'],
    sceneId: 'social-03',
    intents: ['word-invitation', 'respect-response'],
    meaningZh: '邀请；可指邀请行为或邀请消息，不等于对方的接受。',
    grammarZh:
      '可数名词，an invitation；常搭配 invitation to an event、accept/decline an invitation。动词为 invite。',
    registerZh:
      '中性；朋友口语中可直接用 Would you like to… 表达，不必总说名词。',
    errorsZh:
      'invite 是动词（也有非正式名词用法），正式清楚地指一份邀请时用 invitation；an invitation 不是 an acceptance。',
    examples: [
      {
        level: 'A1',
        text: 'This is an invitation.',
        substitution: 'This is a message.',
      },
      {
        level: 'A2',
        text: 'The invitation is for Saturday.',
        substitution: 'The invitation is for Sunday.',
      },
      {
        level: 'B1',
        text: 'I want the invitation to make it easy to say no.',
        substitution: 'I want the message to make it easy to say no.',
      },
      {
        level: 'B2',
        text: 'A clear invitation gives enough detail to consider without creating pressure.',
        substitution:
          'A clear offer gives enough detail to consider without creating pressure.',
      },
      {
        level: 'C1',
        text: 'Declining an invitation does not, by itself, express a wish to negotiate another date.',
        substitution:
          'Leaving an invitation unanswered does not, by itself, express agreement to attend.',
      },
    ],
    sourceBasis: [source],
    review: {
      state: 'model-reviewed',
      record: 'social-review.md: social.invitation',
    },
  },
  {
    id: 'social.rather-not-say',
    contentVersion: 1,
    kind: 'sentence',
    forms: ["I'd rather not say.", 'I would rather not say.'],
    sceneId: 'social-04',
    intents: ['choose-disclosure', 'protect-reason'],
    meaningZh: '我宁愿不说。礼貌保留信息；在拒绝邀请时可以不交代私人原因。',
    grammarZh:
      'would rather + 动词原形；否定为 would rather not + 原形。I’d 在这里是 I would，不是 I had。',
    registerZh: '日常而明确，语气可以平静，无需接辩解。',
    errorsZh:
      '不要说 would rather to say 或 would rather do not say；此句只表达不披露，并不解释实际原因或态度动机。',
    examples: [
      {
        level: 'A1',
        text: "I'd rather not say.",
        substitution: 'I would rather not answer.',
      },
      {
        level: 'A2',
        text: 'I would rather not say why I cannot come.',
        substitution: 'I would rather not explain my plans.',
      },
      {
        level: 'B1',
        text: 'I appreciate the question, but I would rather not say more about my reasons.',
        substitution:
          'I appreciate the question, but I would rather keep my reasons private.',
      },
      {
        level: 'B2',
        text: 'I would rather not say more; my decision is clear even without the details.',
        substitution:
          'I would rather leave the details out; my decision is clear without them.',
      },
      {
        level: 'C1',
        text: 'I would rather not say, since I do not want a private decision to become a matter for discussion.',
        substitution:
          'I would rather keep that private, rather than invite discussion of a personal decision.',
      },
    ],
    sourceBasis: [source],
    review: {
      state: 'model-reviewed',
      record: 'social-review.md: social.rather-not-say',
    },
  },
  {
    id: 'social.see-your-point',
    contentVersion: 1,
    kind: 'phrase',
    forms: ['see your point'],
    sceneId: 'social-05',
    intents: ['acknowledge-other'],
    meaningZh: '理解你的意思或论点；不必表示赞同结论。',
    grammarZh:
      'see 在此为理解，your point 是宾语；I can see your point 常接 but 引出保留或不同意见。',
    registerZh: '自然讨论用语，用于承认对方有可理解的理由。',
    errorsZh:
      '不是看见某个物理点；说理解后仍可不同意，不应把此短语识别为立场改变。',
    examples: [
      {
        level: 'A1',
        text: 'I see your point.',
        substitution: 'I understand your idea.',
      },
      {
        level: 'A2',
        text: 'I see your point, but I like quiet events.',
        substitution: 'I see your point, but I prefer music.',
      },
      {
        level: 'B1',
        text: 'I can see your point about keeping the programme simple.',
        substitution: 'I can see your point about offering more choices.',
      },
      {
        level: 'B2',
        text: 'I see your point about volunteer time, although I would still give visitors more options.',
        substitution:
          'I see your point about limited space, although I would still consider a quiet area.',
      },
      {
        level: 'C1',
        text: 'I can see your point without treating it as decisive; we may simply be protecting different parts of the experience.',
        substitution:
          'I can understand your reasoning without adopting the conclusion; our priorities may still differ.',
      },
    ],
    sourceBasis: [source],
    review: {
      state: 'model-reviewed',
      record: 'social-review.md: social.see-your-point',
    },
  },
  {
    id: 'social.apology',
    contentVersion: 1,
    kind: 'word',
    forms: ['apology'],
    sceneId: 'social-06',
    intents: ['acknowledge-mistake', 'respect-response', 'close-apology'],
    meaningZh: '道歉；表达对具体错误的歉意，不保证获得原谅或修复结果。',
    grammarZh:
      '可数名词 an apology；an apology for + 名词或动名词；动词 apologise/apologize 后常接 to somebody for something。',
    registerZh: '中性，朋友之间可直接说 I’m sorry for…，不必总用名词。',
    errorsZh:
      '道歉、实际补救、接受道歉和原谅是不同事情；不要由 apology 推断对方同意或信任已恢复。',
    examples: [
      { level: 'A1', text: 'This is my apology.', substitution: 'I am sorry.' },
      {
        level: 'A2',
        text: 'I want to offer an apology for the delay.',
        substitution: 'I want to apologise for the delay.',
      },
      {
        level: 'B1',
        text: 'My apology does not mean the book has already been returned.',
        substitution:
          'My plan does not mean the book has already been returned.',
      },
      {
        level: 'B2',
        text: 'An apology should not require the other person to offer reassurance.',
        substitution:
          'A repair offer should not require the other person to offer forgiveness.',
      },
      {
        level: 'C1',
        text: 'I would keep the apology separate from any expectation that trust would be restored immediately.',
        substitution:
          'I would keep the practical repair separate from any expectation of immediate forgiveness.',
      },
    ],
    sourceBasis: [source],
    review: {
      state: 'model-reviewed',
      record: 'social-review.md: social.apology',
    },
  },
]
