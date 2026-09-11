import type { SceneDefinition } from './types'

const aliases: Record<string, string> = {
  'coffee-order':
    '咖啡 拿铁 美式 卡布奇诺 燕麦奶 外带 外卖 cafe café espresso cappuccino latte takeaway',
  'restaurant-order': '饭店 吃饭 餐馆 菜单 点菜 dinner lunch food menu',
  'food-allergy': '过敏 素食 花生 坚果 麸质 忌口 vegetarian vegan gluten nuts',
  'return-item': '退货 换货 退款 售后 购物 shopping refund exchange return',
  'supermarket-help': '购物 买菜 杂货 supermarket grocery groceries',
  'price-discount': '打折 优惠券 促销 价格 bargain coupon sale',
  'airport-check-in': '飞机 机场 登机 值机 托运 flight baggage checkin',
  'security-screening': '机场 安检 行李 security airport screening',
  'immigration-interview': '海关 入境 签证 customs immigration visa',
  'flight-connection':
    '航班 延误 改签 转机 flight cancellation delayed connection',
  'hotel-check-in': '酒店 宾馆 旅馆 住宿 入住 hotel reservation checkin',
  'hotel-room-problem': '酒店 客房 服务 毛巾 住宿 hotel room service',
  'ask-directions': '问路 地图 迷路 导航 地铁 directions map lost',
  'taxi-ride': '打车 出租车 网约车 交通 taxi cab ride',
  'bank-card-problem': '银行 信用卡 付款 借记卡 bank credit debit card',
  'collect-parcel': '快递 取件 包裹 邮寄 parcel package delivery',
  'haircut-request': '剪发 理发 发型 美发 haircut barber salon',
  'phone-repair': '手机 维修 屏幕 电池 phone repair screen battery',
  'work-introduction': '工作 介绍 入职 自我介绍 work introduction onboarding',
  'daily-standup': '晨会 站会 工作 汇报 standup scrum daily status',
  'progress-update': '进度 汇报 项目 工作 project progress report update',
  'deadline-negotiation':
    '延期 截止 交付 协商 工作 deadline extension negotiate',
  'meeting-disagreement': '会议 异议 反对 意见 工作 meeting disagreement',
  'job-interview': '工作 求职 招聘 应聘 面试 job interview career',
  'first-small-talk': '聊天 寒暄 认识 破冰 small talk chat icebreaker',
  'networking-event': '社交 活动 人脉 交流 networking event',
  'make-invitation': '约会 周末 邀约 安排 计划 weekend invitation plans',
  'polite-refusal': '拒绝 婉拒 礼貌 decline refuse refusal',
  'discuss-opinions': '观点 讨论 交流 辩论 opinion discussion debate',
  'apology-repair': '道歉 关系 修复 误会 apology sorry misunderstanding',
  'class-introduction':
    '学校 课堂 班级 自我介绍 同学 school class introduction',
  'ask-teacher': '学校 老师 提问 作业 teacher homework question',
  'group-project': '学校 小组 合作 项目 group project school',
  'presentation-qa': '学校 演讲 演示 答辩 问答 presentation questions',
  'seminar-discussion': '学校 研讨 学术 讨论 seminar academic discussion',
  'office-hours': '学校 教授 辅导 咨询 office hours professor tutorial',
  'pharmacy-medicine': '药房 药店 买药 药师 pharmacy medicine',
  'describe-symptoms': '身体 不适 症状 疼痛 就诊 symptoms pain',
  'doctor-appointment': '医生 预约 看病 诊所 挂号 doctor clinic appointment',
  'emergency-call': '求助 电话 紧急 报警 emergency help',
  'lost-property': '遗失 失物 丢东西 钱包 lost property wallet',
  'rental-repair': '房东 物业 租房 报修 漏水 heating landlord rental',
}

export function normalizeSearch(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function oneEditApart(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0,
    j = 0,
    edits = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++
      j++
      continue
    }
    if (++edits > 1) return false
    if (a.length >= b.length) i++
    if (b.length >= a.length) j++
  }
  return edits + (i < a.length || j < b.length ? 1 : 0) <= 1
}

type SearchableScene = Pick<
  SceneDefinition,
  'slug' | 'titleZh' | 'titleEn' | 'summaryZh'
> &
  Partial<
    Pick<
      SceneDefinition,
      'learnerRole' | 'aiRole' | 'goals' | 'keywords' | 'exampleExpressions'
    >
  >
export function searchScenes<T extends SearchableScene>(
  scenes: readonly T[],
  input: string,
) {
  const query = normalizeSearch(input)
  if (!query) return [...scenes]
  const terms = query.split(' ')
  return scenes
    .map((scene, index) => {
      const title = normalizeSearch(`${scene.titleZh} ${scene.titleEn}`)
      const content = normalizeSearch(
        [
          title,
          scene.slug,
          scene.summaryZh,
          scene.learnerRole,
          scene.aiRole,
          ...(scene.goals ?? []).map((goal) => goal.labelZh),
          ...Object.values(scene.keywords ?? {}).flat(),
          ...Object.values(scene.exampleExpressions ?? {}).flat(),
          aliases[scene.slug] ?? '',
        ].join(' '),
      )
      const words = content.split(' ')
      const score = terms.reduce((sum, term) => {
        if (sum < 0) return -1
        if (title.includes(term)) return sum + 10
        if (content.includes(term)) return sum + 3
        if (
          /^[a-z]{4,}$/.test(term) &&
          words.some(
            (word) => /^[a-z]+$/.test(word) && oneEditApart(word, term),
          )
        )
          return sum + 1
        return -1
      }, 0)
      return {
        scene,
        index,
        score: score < 0 ? -1 : score + (title.includes(query) ? 20 : 0),
      }
    })
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.scene)
}
