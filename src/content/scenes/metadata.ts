import type { SceneDefinition, SceneCategory } from '@/domain/scenes/types'
export type SceneMetadata = Pick<
  SceneDefinition,
  | 'id'
  | 'slug'
  | 'version'
  | 'category'
  | 'titleZh'
  | 'titleEn'
  | 'summaryZh'
  | 'estimatedMinutes'
  | 'image'
  | 'status'
>
// Display-only data. Never import the legacy level factory or authored pack here.
type Row = [
  slug: string,
  titleZh: string,
  titleEn: string,
  summaryZh: string,
  altZh: string,
]
const rows: Record<SceneCategory, Row[]> = {
  travel: [
    [
      'airport-check-in',
      '机场值机',
      'Airport check-in',
      '演练核对航班、行李和座位偏好。',
      '明亮机场值机柜台与行李传送带',
    ],
    [
      'security-screening',
      '安检沟通',
      'Security screening',
      '演练理解安检要求、说明物品和请求澄清。',
      '机场安检通道和托盘',
    ],
    [
      'flight-connection',
      '转机问询',
      'Flight connection',
      '在前往转机服务台之前，演练向信息协助点问路与确认下一步。',
      '机场航班信息屏与转机指示牌',
    ],
    [
      'immigration-interview',
      '入境问答',
      'Immigration questions',
      '演练入境情境的回答与回应策略，不代表真实审查。',
      '国际入境检查柜台',
    ],
    [
      'hotel-check-in',
      '酒店入住',
      'Hotel check-in',
      '核对预订、提出房间偏好，并确认早餐信息。',
      '温暖灯光下的精品酒店前台',
    ],
    [
      'hotel-room-problem',
      '房间问题',
      'Hotel room problem',
      '礼貌描述设施问题并协商解决方案。',
      '酒店客房与服务电话',
    ],
  ],
  dining: [
    [
      'coffee-order',
      '咖啡点单',
      'Ordering coffee',
      '选择饮品、规格和取餐方式。',
      '自然光咖啡店吧台和咖啡师',
    ],
    [
      'restaurant-order',
      '餐厅点餐',
      'Ordering at a restaurant',
      '理解菜单、点餐并确认烹饪要求。',
      '现代餐厅餐桌与菜单',
    ],
    [
      'food-allergy',
      '过敏与忌口',
      'Food allergies',
      '演练说明饮食限制和询问配料，不判断食物是否安全。',
      '餐厅服务员认真核对配料表',
    ],
    [
      'return-item',
      '商品退换',
      'Returning an item',
      '说明商品问题并协商退款或换货。',
      '商店服务台上的商品和收据',
    ],
    [
      'supermarket-help',
      '超市询问',
      'Finding groceries',
      '询问商品位置、替代品和标签信息。',
      '明亮超市货架与购物篮',
    ],
    [
      'price-discount',
      '价格与优惠',
      'Prices and discounts',
      '理解促销条件并核对最终价格。',
      '商店收银台与促销标签',
    ],
  ],
  daily: [
    [
      'ask-directions',
      '问路',
      'Asking for directions',
      '说明目的地并澄清路线与地标。',
      '城市街角地图与路标',
    ],
    [
      'taxi-ride',
      '打车沟通',
      'Taking a taxi',
      '说明目的地、路线偏好与下车位置。',
      '夜色城市中的出租车后座视角',
    ],
    [
      'bank-card-problem',
      '银行卡问题',
      'Bank card issue',
      '用虚构情境演练卡片问题沟通，不提交账户或身份资料。',
      '银行服务柜台与银行卡',
    ],
    [
      'collect-parcel',
      '快递取件',
      'Collecting a parcel',
      '用情境中的虚构信息演练取件与异常沟通。',
      '社区快递服务点货架',
    ],
    [
      'haircut-request',
      '理发需求',
      'Getting a haircut',
      '描述长度、造型和不想改变的部分。',
      '现代理发店镜前咨询',
    ],
    [
      'phone-repair',
      '手机维修',
      'Phone repair',
      '演练描述故障和确认检查、费用与授权边界。',
      '手机维修台与拆机工具',
    ],
  ],
  work: [
    [
      'work-introduction',
      '职场自我介绍',
      'Work introduction',
      '用合适的详略介绍角色、经历和合作方式。',
      '国际团队围桌进行欢迎会',
    ],
    [
      'daily-standup',
      '每日站会',
      'Daily stand-up',
      '简洁汇报进展、计划和阻塞。',
      '团队站会与任务看板',
    ],
    [
      'progress-update',
      '汇报进度',
      'Progress update',
      '用证据说明状态、风险和下一步。',
      '会议室屏幕上的项目进度',
    ],
    [
      'deadline-negotiation',
      '协商截止日期',
      'Negotiating a deadline',
      '解释限制并提出可信的范围或日期方案。',
      '办公室内对项目时间表进行协商',
    ],
    [
      'meeting-disagreement',
      '会议表达异议',
      'Disagreeing in a meeting',
      '尊重地质疑观点并提出可验证的替代方案。',
      '多元团队在会议中讨论方案',
    ],
    [
      'job-interview',
      '求职面试',
      'Job interview',
      '用具体事例介绍能力、动机和判断。',
      '专业而友好的求职面试',
    ],
  ],
  social: [
    [
      'first-small-talk',
      '初次寒暄',
      'First-time small talk',
      '与邻居 Alex 演练开启、延续并结束轻松对话。',
      '轻松社交活动中的两人交谈',
    ],
    [
      'networking-event',
      '活动社交',
      'Networking event',
      '与志愿者 Morgan 演练社区创意活动中的交流。',
      '现代行业交流活动与胸牌',
    ],
    [
      'make-invitation',
      '发出邀请',
      'Making an invitation',
      '和朋友 Lee 演练向不在场的 Jo 发出邀请。',
      '朋友通过手机商量周末活动',
    ],
    [
      'polite-refusal',
      '礼貌拒绝',
      'Polite refusal',
      '和 Dana 演练婉拒 Casey，清楚表达边界。',
      '两位朋友进行真诚而平静的对话',
    ],
    [
      'discuss-opinions',
      '讨论观点',
      'Discussing opinions',
      '和 Rowan 演练表达立场、回应不同观点。',
      '朋友在公园长椅上讨论观点',
    ],
    [
      'apology-repair',
      '道歉与修复关系',
      'Apology and repair',
      '和 Ellis 演练向不在场的 Robin 道歉与修复关系。',
      '安静咖啡馆中的真诚道歉',
    ],
  ],
  study: [
    [
      'class-introduction',
      '课堂介绍',
      'Class introduction',
      '向老师 Lee 演练介绍学习背景、兴趣和目标。',
      '明亮国际课堂中的学生介绍',
    ],
    [
      'ask-teacher',
      '向老师提问',
      'Asking a teacher',
      '向老师 Lee 演练澄清文字材料和提出问题。',
      '学生课后向老师提问',
    ],
    [
      'group-project',
      '小组分工',
      'Dividing group work',
      '与同学 Jo 演练协商任务、时间和责任边界。',
      '学生围桌讨论小组项目',
    ],
    [
      'presentation-qa',
      '演讲问答',
      'Presentation Q&A',
      '以给定文字材料演练回应听众 Jo 的问题。',
      '学术演讲后的听众提问',
    ],
    [
      'seminar-discussion',
      '研讨讨论',
      'Seminar discussion',
      '和同学 Jo 演练引用观点、建立联系和推进讨论。',
      '小型研讨班围圈讨论',
    ],
    [
      'office-hours',
      '老师答疑',
      'Office hours',
      '向老师 Lee 演练讨论方向、反馈和下一步。',
      '教授办公室中的一对一答疑',
    ],
  ],
  emergency: [
    [
      'pharmacy-medicine',
      '药店买药',
      'At a pharmacy',
      '与练习伙伴演练如何向药师提问，不提供产品、用药或诊疗建议。',
      '整洁药店柜台和药师',
    ],
    [
      'describe-symptoms',
      '描述症状',
      'Describing symptoms',
      '用虚构文字情境演练描述感受与时间，不诊断或判断紧急程度。',
      '诊所接待处进行症状登记',
    ],
    [
      'doctor-appointment',
      '预约医生',
      'Booking a doctor',
      '演练未发送的预约询问，不联系诊所或确认真实预约。',
      '现代诊所预约前台',
    ],
    [
      'emergency-call',
      '拨打求助电话',
      'Calling for help',
      '用虚构地点演练求助通话；不拨号、不报警、不联系救援。',
      '手机求助通话与清晰位置标记',
    ],
    [
      'lost-property',
      '报告遗失物',
      'Reporting lost property',
      '演练未发送的失物报告草稿，不提交真实报失或确认找回。',
      '交通枢纽失物招领服务台',
    ],
    [
      'rental-repair',
      '租房报修',
      'Rental repair request',
      '演练未发送的物业报修沟通，不判断现场安全或实际安排维修。',
      '公寓内物业人员检查漏水问题',
    ],
  ],
}
export const SCENE_METADATA: SceneMetadata[] = (
  Object.entries(rows) as [SceneCategory, Row[]][]
).flatMap(([category, entries]) =>
  entries.map(([slug, titleZh, titleEn, summaryZh, altZh], index) => ({
    id: `${category}-${String(index + 1).padStart(2, '0')}`,
    slug,
    version: 1,
    category,
    titleZh,
    titleEn,
    summaryZh,
    estimatedMinutes: ([3, 5, 5, 8, 8, 10] as const)[index],
    status: 'published',
    image: {
      key: slug === 'hotel-check-in' ? 'hotel' : category,
      altZh,
      focalPoint: '50% 45%',
    },
  })),
)
export const getSceneMetadata = (identity: string) =>
  SCENE_METADATA.find(
    (scene) => scene.id === identity || scene.slug === identity,
  )
