export interface DigitalReward {
  id: string
  kind: 'profile' | 'cover' | 'sheet'
  price: 100 | 200 | 300
  title: string
  description: string
  content?: string
}
export const REWARDS: readonly DigitalReward[] = [
  {
    id: 'profile-atlantic',
    kind: 'profile',
    price: 100,
    title: '深海个人卡',
    description: '把「我的」个人卡切换为深海蓝。',
  },
  {
    id: 'profile-paper',
    kind: 'profile',
    price: 100,
    title: '纸页个人卡',
    description: '把「我的」个人卡切换为浅色纸页。',
  },
  {
    id: 'cover-horizon',
    kind: 'cover',
    price: 200,
    title: '海平线目标封面',
    description: '今日目标使用深蓝封面与明亮文字。',
  },
  {
    id: 'cover-sky',
    kind: 'cover',
    price: 200,
    title: '晴空目标封面',
    description: '今日目标使用浅蓝封面与深色文字。',
  },
  {
    id: 'sheet-clarify',
    kind: 'sheet',
    price: 300,
    title: '把话问清楚',
    description: '一份可以离线阅读、开口练习的原创沟通小抄。',
    content: `建议练习范围：A2–B1，可使用更简单的表达。
适用范围：日常学习和一般交流中的澄清练习，不代替专业翻译或紧急沟通支持。以下英文是参考表达，不是唯一正确答案。
第一步 · 请求重说
Could you say that again, please?
请对方再说一遍。先读一次，再遮住英文，只看“请再说一遍”，试着用自己的话表达。
第二步 · 缩小问题
What does “platform” mean here?
询问 platform 在当前语境中的意思。把引号中的词换成你真正不理解的词；同一个词在不同场景中可能意思不同。
第三步 · 核对理解
Do you mean we should meet at three?
核对“我们是不是应该三点见面”，不把自己的猜测说成对方已经确认。
自己练一轮
想象朋友说了一个你没听清的见面安排。先请求重说，再询问一个细节，最后用一句话核对。可写下来或自行朗读；这份资料不打分，阅读和翻页本身不计任务积分。`,
  },
  {
    id: 'sheet-preferences',
    kind: 'sheet',
    price: 300,
    title: '表达选择与理由',
    description: '从简单选择到协商备选方案的原创随身练习。',
    content: `建议练习范围：A2–B1，可使用更简单的表达。
适用范围：日常安排、学习搭档和一般社交练习。参考句展示一种礼貌说法，不承诺适合每种关系或文化情境。
第一步 · 说出偏好
I’d prefer to meet in the morning.
表达更愿意上午见面。把 in the morning 换成你真实偏好的时间；这不是替对方决定。
第二步 · 给出简短理由
That works better for me because I have a class in the afternoon.
说明上午更方便，因为下午有课。只分享你愿意分享的真实原因；不必为了练习编造个人经历。
第三步 · 提供备选
If that doesn’t work for you, could we try Friday?
如果对方不方便，提议试试周五。用提问留出协商空间，不表示对方已同意。
自己练一轮
从“散步、线上讨论、一起学习”选一个安排。说出一个偏好、一个可分享的理由和一个备选方案。遮住参考句再复述，可以改用更简单的英文。自己比较信息是否清楚；不做语法或发音评分，也不因打开资料自动完成任何任务。`,
  },
]
export function rewardById(id: string): DigitalReward {
  const reward = REWARDS.find((r) => r.id === id)
  if (!reward) throw new Error('UNKNOWN_REWARD')
  return reward
}
