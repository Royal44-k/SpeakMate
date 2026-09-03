import { defineScenes, type SceneSeed } from '../factory'

const scenes = [
  {
    slug: 'ask-directions', titleZh: '问路', titleEn: 'Asking for directions', summaryZh: '说明目的地并听懂路线与地标。', learnerRole: '在陌生城市寻找地点的行人', aiRole: '熟悉附近街区的本地人', goalsZh: ['说出目的地', '理解转弯和距离', '确认关键地标'], keywords: ['where', 'turn', 'straight', 'corner', 'landmark', 'opposite'],
    expressions: { basic: ['Where is the station?', 'Left or right?'], standard: ['How long does it take to walk there?', 'Is it opposite the bank?'], advanced: ['Could you describe the route using landmarks in case the street signs are unclear?', 'Would public transport be more practical at this time of day?'] },
    openings: { basic: 'Where do you need to go?', standard: 'Sure, what place are you looking for?', advanced: 'I can help. Are you prioritizing the simplest route or the quickest one?' }, imageAltZh: '城市街角地图与路标',
  },
  {
    slug: 'taxi-ride', titleZh: '打车沟通', titleEn: 'Taking a taxi', summaryZh: '说明目的地、路线偏好与下车位置。', learnerRole: '乘坐出租车的乘客', aiRole: '熟悉城市路况的司机', goalsZh: ['准确说明目的地', '讨论路线或时间', '确认下车点和支付方式'], keywords: ['address', 'traffic', 'route', 'drop off', 'meter', 'receipt'],
    expressions: { basic: ['Please go to this address.', 'Stop here, please.'], standard: ['Could you avoid the highway?', 'Can you drop me off at the main entrance?'], advanced: ['I need to arrive by nine; which route is most reliable given the traffic?', 'Could you keep the meter running and provide an itemized receipt?'] },
    openings: { basic: 'Where to?', standard: 'What address are we heading to?', advanced: 'Traffic is heavy downtown. Do you have a deadline or a preferred route?' }, imageAltZh: '夜色城市中的出租车后座视角',
  },
  {
    slug: 'bank-card-problem', titleZh: '银行卡问题', titleEn: 'Bank card issue', summaryZh: '描述卡片异常并确认安全处理步骤。', learnerRole: '银行卡无法使用的客户', aiRole: '谨慎核验身份的银行客服', goalsZh: ['说明交易或卡片问题', '完成必要身份核验', '确认冻结或补卡安排'], keywords: ['card', 'transaction', 'declined', 'freeze', 'replacement', 'verify'],
    expressions: { basic: ['My card does not work.', 'I do not know this payment.'], standard: ['The transaction was declined twice.', 'Could you freeze the card and send a replacement?'], advanced: ['I recognize the merchant but not the amount; could you open a dispute without blocking legitimate recurring payments?', 'What verification can I complete now to minimize disruption while protecting the account?'] },
    openings: { basic: 'What is wrong with your card?', standard: 'I can help. Was the card lost, declined, or charged incorrectly?', advanced: 'Before we discuss account details, I need to verify your identity and understand the exact transaction concern.' }, imageAltZh: '银行服务柜台与银行卡',
  },
  {
    slug: 'collect-parcel', titleZh: '快递取件', titleEn: 'Collecting a parcel', summaryZh: '提供取件信息并解决包裹异常。', learnerRole: '到服务点取件的收件人', aiRole: '核对订单的快递服务人员', goalsZh: ['提供取件码或姓名', '核对包裹信息', '处理未找到或破损情况'], keywords: ['parcel', 'code', 'name', 'damaged', 'collection', 'tracking'],
    expressions: { basic: ['I am here for a parcel.', 'This is my code.'], standard: ['The tracking says it is ready for collection.', 'The box looks damaged. Could we check it?'], advanced: ['The notification confirms delivery to this branch; could you trace the handover record?', 'I would like the visible damage documented before I accept the parcel.'] },
    openings: { basic: 'Your collection code, please.', standard: 'May I have your name or pickup code?', advanced: 'I cannot locate it under that code yet. Do you have the tracking number and delivery notification?' }, imageAltZh: '社区快递服务点货架',
  },
  {
    slug: 'haircut-request', titleZh: '理发需求', titleEn: 'Getting a haircut', summaryZh: '描述长度、造型和不想改变的部分。', learnerRole: '向发型师说明需求的顾客', aiRole: '会主动确认细节的发型师', goalsZh: ['说明目标长度', '描述造型偏好', '确认关键细节'], keywords: ['shorter', 'layers', 'trim', 'fringe', 'style', 'maintain'],
    expressions: { basic: ['Just a little shorter.', 'Please keep it long here.'], standard: ['Could you trim the sides but keep the length on top?', 'I would like something easy to maintain.'], advanced: ['I want more shape without losing the overall length; what would suit this texture?', 'Please avoid thinning the fringe too much, as it becomes difficult to style.'] },
    openings: { basic: 'How short?', standard: 'What kind of cut are you looking for today?', advanced: 'Tell me how you normally style your hair and what is not working with the current shape.' }, imageAltZh: '现代理发店镜前咨询',
  },
  {
    slug: 'phone-repair', titleZh: '手机维修', titleEn: 'Phone repair', summaryZh: '描述故障、备份情况并确认维修方案。', learnerRole: '手机发生故障的用户', aiRole: '需要诊断问题的维修技师', goalsZh: ['描述故障表现', '说明已尝试的方法', '确认数据和维修时间'], keywords: ['screen', 'battery', 'backup', 'repair', 'warranty', 'diagnose'],
    expressions: { basic: ['The screen is broken.', 'It will not turn on.'], standard: ['The battery drains very quickly.', 'Will my data be safe during the repair?'], advanced: ['The issue began after an update and persists after a restart; could you distinguish software from hardware failure?', 'Before authorizing repair, I need the data-risk, warranty, and turnaround implications.'] },
    openings: { basic: 'What happened to the phone?', standard: 'Can you describe the problem and when it started?', advanced: 'Walk me through the symptoms, recent changes, and troubleshooting you have already attempted.' }, imageAltZh: '手机维修台与拆机工具',
  },
] satisfies readonly SceneSeed[]

export const DAILY_SCENES = defineScenes('daily', 'daily', scenes)
