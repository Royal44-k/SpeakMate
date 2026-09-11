import type { GradedPack } from '@/content/dialogues/graded/schema'
import {
  practicePresentationSchema,
  type PracticePresentation,
} from '@/domain/practice/graded-evidence'

// Explicit canonical roles. Reviewed variants retain these counterparts at all
// five levels; advanced study/travel includes facilitated response rehearsal.
// Future role differences must be explicit selected-level/variant overrides.
const counterparts: Record<string, string> = {
  'travel-01': '值机工作人员角色',
  'travel-02': '安检工作人员角色',
  'travel-03': '转机服务台之前的信息协助点角色',
  'travel-04': '入境问答演练伙伴',
  'travel-05': '酒店前台角色',
  'travel-06': '酒店工作人员角色',
  'dining-01': '咖啡师角色',
  'dining-02': '餐厅服务员角色',
  'dining-03': '餐厅配料询问角色',
  'dining-04': '退换货店员角色',
  'dining-05': '超市员工角色',
  'dining-06': '价格询问店员角色',
  'daily-01': '问路沟通角色',
  'daily-02': '出租车司机角色',
  'daily-03': '银行卡问题沟通角色',
  'daily-04': '取件服务人员角色',
  'daily-05': '发型师角色',
  'daily-06': '维修咨询角色',
  'work-01': '团队介绍回应伙伴',
  'work-02': '站会回应伙伴',
  'work-03': '进度汇报回应伙伴',
  'work-04': '截止日期协商伙伴',
  'work-05': '会议异议回应伙伴',
  'work-06': '面试回应伙伴',
  'social-01': '邻居 Alex',
  'social-02': '社区创意活动志愿者 Morgan',
  'social-03': '朋友 Lee（协助练习邀请 Jo）',
  'social-04': '朋友 Dana（协助练习婉拒 Casey）',
  'social-05': '朋友 Rowan',
  'social-06': '朋友 Ellis（协助练习向 Robin 道歉）',
  'study-01': '老师 Lee',
  'study-02': '老师 Lee',
  'study-03': '同学 Jo',
  'study-04': '听众 Jo',
  'study-05': '同学 Jo',
  'study-06': '老师 Lee',
  'emergency-01': '协助准备药师提问的练习伙伴',
  'emergency-02': '虚构症状描述练习伙伴',
  'emergency-03': '模拟接待员（未发送询问）',
  'emergency-04': '扮演接线员的练习伙伴（不拨号）',
  'emergency-05': '失物报告草稿练习伙伴（未发送）',
  'emergency-06': '物业沟通角色（未发送报修）',
}

export function selectedPracticePresentation(
  pack: GradedPack,
  variantId: string,
): PracticePresentation {
  if (
    !pack.variants.some((variant) => variant.id === variantId) ||
    !counterparts[pack.sceneId]
  )
    throw new Error('PRESENTATION_SELECTION_UNAVAILABLE')
  const frameZh =
    pack.category === 'emergency'
      ? '这是已编写的虚构语言演练，不是医疗、报警、救援或物业服务。没有拨号或发送消息，不诊断、不判断安全、不确认预约或服务。只使用情境中的虚构材料，不提供真实身份、地址或医疗资料。'
      : pack.category === 'study'
        ? `这是已编写的课堂角色与回应演练（${pack.level}）；部分问题是在排练如何回应，并非角色逐字发言。完整文字材料在情境说明中；文字提到图表、图片或口头指令，不表示本页已提供对应图像或音频。`
        : pack.sceneId === 'travel-04'
          ? '这是已编写的入境问答与回应策略演练，不是实时官员问询或真实审查。请先读完整情境，使用虚构资料。'
          : pack.category === 'social'
            ? '这是已编写的社交角色与回应演练；邀请、婉拒和道歉是在与伙伴排练，不在场的收件人不会收到信息。情境说明中的人物与前提保持适用。'
            : '这是已编写的本地角色与回应演练，不是实时人员服务。请先阅读所选情境；问题可能包含排练提示，所有交易、安排与材料只属于练习。'
  return practicePresentationSchema.parse({
    schemaVersion: 1,
    counterpartZh: counterparts[pack.sceneId],
    frameZh,
  })
}
