# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-placeholder-browser.spec.ts >> H: native Back cancellation, ordinary draft clear and second Forward retained placeholder use explicit safe source
- Location: tests\e2e\task7-placeholder-browser.spec.ts:5:1

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/scenes\/prepare\?scene=coffee-order/
Received string:  "http://127.0.0.1:3130/scenes?level=A2"
Timeout: 8000ms

Call log:
  - Expect "toHaveURL" with timeout 8000ms
    19 × locator resolved to <html lang="zh-CN" data-footer-visible="true">…</html>
       - unexpected value "http://127.0.0.1:3130/scenes?level=A2"

```

```yaml
- main:
  - paragraph: SITUATIONS
  - heading "把英语练进生活里" [level=1]
  - text: 42 个真实对话场景
  - search:
    - text: 搜索场景
    - searchbox "搜索场景"
    - button "清空搜索" [disabled]
    - button "搜索"
  - group "场景分类":
    - button "全部" [pressed]
    - button "旅行"
    - button "餐饮"
    - button "日常"
    - button "职场"
    - button "社交"
    - button "学习"
    - button "应急"
  - button "A1"
  - button "A2" [pressed]
  - button "B1"
  - button "B2"
  - button "C1"
  - group "练习时长":
    - button "全部时长" [pressed]
    - button "3 分钟"
    - button "5 分钟"
    - button "8 分钟"
    - button "10 分钟"
  - status:
    - strong: "42"
    - text: 个匹配场景 · 当前 A2
  - link "准备练习：机场值机":
    - /url: /scenes/prepare?scene=airport-check-in&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "明亮机场值机柜台与行李传送带"
      - text: A2 级 3 分钟
      - heading "机场值机 Airport check-in" [level=2]
      - paragraph: 演练核对航班、行李和座位偏好。
      - text: 3 种练习长度
  - link "准备练习：安检沟通":
    - /url: /scenes/prepare?scene=security-screening&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "机场安检通道和托盘"
      - text: A2 级 5 分钟
      - heading "安检沟通 Security screening" [level=2]
      - paragraph: 演练理解安检要求、说明物品和请求澄清。
      - text: 3 种练习长度
  - link "准备练习：转机问询":
    - /url: /scenes/prepare?scene=flight-connection&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "机场航班信息屏与转机指示牌"
      - text: A2 级 5 分钟
      - heading "转机问询 Flight connection" [level=2]
      - paragraph: 在前往转机服务台之前，演练向信息协助点问路与确认下一步。
      - text: 3 种练习长度
  - link "准备练习：入境问答":
    - /url: /scenes/prepare?scene=immigration-interview&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "国际入境检查柜台"
      - text: A2 级 8 分钟
      - heading "入境问答 Immigration questions" [level=2]
      - paragraph: 演练入境情境的回答与回应策略，不代表真实审查。
      - text: 3 种练习长度
  - link "准备练习：酒店入住":
    - /url: /scenes/prepare?scene=hotel-check-in&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "温暖灯光下的精品酒店前台"
      - text: A2 级 8 分钟
      - heading "酒店入住 Hotel check-in" [level=2]
      - paragraph: 核对预订、提出房间偏好，并确认早餐信息。
      - text: 3 种练习长度
  - link "准备练习：房间问题":
    - /url: /scenes/prepare?scene=hotel-room-problem&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "酒店客房与服务电话"
      - text: A2 级 10 分钟
      - heading "房间问题 Hotel room problem" [level=2]
      - paragraph: 礼貌描述设施问题并协商解决方案。
      - text: 3 种练习长度
  - link "准备练习：咖啡点单":
    - /url: /scenes/prepare?scene=coffee-order&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "自然光咖啡店吧台和咖啡师"
      - text: A2 级 3 分钟
      - heading "咖啡点单 Ordering coffee" [level=2]
      - paragraph: 选择饮品、规格和取餐方式。
      - text: 3 种练习长度
  - link "准备练习：餐厅点餐":
    - /url: /scenes/prepare?scene=restaurant-order&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "现代餐厅餐桌与菜单"
      - text: A2 级 5 分钟
      - heading "餐厅点餐 Ordering at a restaurant" [level=2]
      - paragraph: 理解菜单、点餐并确认烹饪要求。
      - text: 3 种练习长度
  - link "准备练习：过敏与忌口":
    - /url: /scenes/prepare?scene=food-allergy&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "餐厅服务员认真核对配料表"
      - text: A2 级 5 分钟
      - heading "过敏与忌口 Food allergies" [level=2]
      - paragraph: 演练说明饮食限制和询问配料，不判断食物是否安全。
      - text: 3 种练习长度
  - link "准备练习：商品退换":
    - /url: /scenes/prepare?scene=return-item&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "商店服务台上的商品和收据"
      - text: A2 级 8 分钟
      - heading "商品退换 Returning an item" [level=2]
      - paragraph: 说明商品问题并协商退款或换货。
      - text: 3 种练习长度
  - link "准备练习：超市询问":
    - /url: /scenes/prepare?scene=supermarket-help&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "明亮超市货架与购物篮"
      - text: A2 级 8 分钟
      - heading "超市询问 Finding groceries" [level=2]
      - paragraph: 询问商品位置、替代品和标签信息。
      - text: 3 种练习长度
  - link "准备练习：价格与优惠":
    - /url: /scenes/prepare?scene=price-discount&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "商店收银台与促销标签"
      - text: A2 级 10 分钟
      - heading "价格与优惠 Prices and discounts" [level=2]
      - paragraph: 理解促销条件并核对最终价格。
      - text: 3 种练习长度
  - link "准备练习：问路":
    - /url: /scenes/prepare?scene=ask-directions&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "城市街角地图与路标"
      - text: A2 级 3 分钟
      - heading "问路 Asking for directions" [level=2]
      - paragraph: 说明目的地并澄清路线与地标。
      - text: 3 种练习长度
  - link "准备练习：打车沟通":
    - /url: /scenes/prepare?scene=taxi-ride&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "夜色城市中的出租车后座视角"
      - text: A2 级 5 分钟
      - heading "打车沟通 Taking a taxi" [level=2]
      - paragraph: 说明目的地、路线偏好与下车位置。
      - text: 3 种练习长度
  - link "准备练习：银行卡问题":
    - /url: /scenes/prepare?scene=bank-card-problem&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "银行服务柜台与银行卡"
      - text: A2 级 5 分钟
      - heading "银行卡问题 Bank card issue" [level=2]
      - paragraph: 用虚构情境演练卡片问题沟通，不提交账户或身份资料。
      - text: 3 种练习长度
  - link "准备练习：快递取件":
    - /url: /scenes/prepare?scene=collect-parcel&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "社区快递服务点货架"
      - text: A2 级 8 分钟
      - heading "快递取件 Collecting a parcel" [level=2]
      - paragraph: 用情境中的虚构信息演练取件与异常沟通。
      - text: 3 种练习长度
  - link "准备练习：理发需求":
    - /url: /scenes/prepare?scene=haircut-request&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "现代理发店镜前咨询"
      - text: A2 级 8 分钟
      - heading "理发需求 Getting a haircut" [level=2]
      - paragraph: 描述长度、造型和不想改变的部分。
      - text: 3 种练习长度
  - link "准备练习：手机维修":
    - /url: /scenes/prepare?scene=phone-repair&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "手机维修台与拆机工具"
      - text: A2 级 10 分钟
      - heading "手机维修 Phone repair" [level=2]
      - paragraph: 演练描述故障和确认检查、费用与授权边界。
      - text: 3 种练习长度
  - link "准备练习：职场自我介绍":
    - /url: /scenes/prepare?scene=work-introduction&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "国际团队围桌进行欢迎会"
      - text: A2 级 3 分钟
      - heading "职场自我介绍 Work introduction" [level=2]
      - paragraph: 用合适的详略介绍角色、经历和合作方式。
      - text: 3 种练习长度
  - link "准备练习：每日站会":
    - /url: /scenes/prepare?scene=daily-standup&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "团队站会与任务看板"
      - text: A2 级 5 分钟
      - heading "每日站会 Daily stand-up" [level=2]
      - paragraph: 简洁汇报进展、计划和阻塞。
      - text: 3 种练习长度
  - link "准备练习：汇报进度":
    - /url: /scenes/prepare?scene=progress-update&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "会议室屏幕上的项目进度"
      - text: A2 级 5 分钟
      - heading "汇报进度 Progress update" [level=2]
      - paragraph: 用证据说明状态、风险和下一步。
      - text: 3 种练习长度
  - link "准备练习：协商截止日期":
    - /url: /scenes/prepare?scene=deadline-negotiation&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "办公室内对项目时间表进行协商"
      - text: A2 级 8 分钟
      - heading "协商截止日期 Negotiating a deadline" [level=2]
      - paragraph: 解释限制并提出可信的范围或日期方案。
      - text: 3 种练习长度
  - link "准备练习：会议表达异议":
    - /url: /scenes/prepare?scene=meeting-disagreement&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "多元团队在会议中讨论方案"
      - text: A2 级 8 分钟
      - heading "会议表达异议 Disagreeing in a meeting" [level=2]
      - paragraph: 尊重地质疑观点并提出可验证的替代方案。
      - text: 3 种练习长度
  - link "准备练习：求职面试":
    - /url: /scenes/prepare?scene=job-interview&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "专业而友好的求职面试"
      - text: A2 级 10 分钟
      - heading "求职面试 Job interview" [level=2]
      - paragraph: 用具体事例介绍能力、动机和判断。
      - text: 3 种练习长度
  - link "准备练习：初次寒暄":
    - /url: /scenes/prepare?scene=first-small-talk&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "轻松社交活动中的两人交谈"
      - text: A2 级 3 分钟
      - heading "初次寒暄 First-time small talk" [level=2]
      - paragraph: 与邻居 Alex 演练开启、延续并结束轻松对话。
      - text: 3 种练习长度
  - link "准备练习：活动社交":
    - /url: /scenes/prepare?scene=networking-event&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "现代行业交流活动与胸牌"
      - text: A2 级 5 分钟
      - heading "活动社交 Networking event" [level=2]
      - paragraph: 与志愿者 Morgan 演练社区创意活动中的交流。
      - text: 3 种练习长度
  - link "准备练习：发出邀请":
    - /url: /scenes/prepare?scene=make-invitation&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "朋友通过手机商量周末活动"
      - text: A2 级 5 分钟
      - heading "发出邀请 Making an invitation" [level=2]
      - paragraph: 和朋友 Lee 演练向不在场的 Jo 发出邀请。
      - text: 3 种练习长度
  - link "准备练习：礼貌拒绝":
    - /url: /scenes/prepare?scene=polite-refusal&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "两位朋友进行真诚而平静的对话"
      - text: A2 级 8 分钟
      - heading "礼貌拒绝 Polite refusal" [level=2]
      - paragraph: 和 Dana 演练婉拒 Casey，清楚表达边界。
      - text: 3 种练习长度
  - link "准备练习：讨论观点":
    - /url: /scenes/prepare?scene=discuss-opinions&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "朋友在公园长椅上讨论观点"
      - text: A2 级 8 分钟
      - heading "讨论观点 Discussing opinions" [level=2]
      - paragraph: 和 Rowan 演练表达立场、回应不同观点。
      - text: 3 种练习长度
  - link "准备练习：道歉与修复关系":
    - /url: /scenes/prepare?scene=apology-repair&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "安静咖啡馆中的真诚道歉"
      - text: A2 级 10 分钟
      - heading "道歉与修复关系 Apology and repair" [level=2]
      - paragraph: 和 Ellis 演练向不在场的 Robin 道歉与修复关系。
      - text: 3 种练习长度
  - link "准备练习：课堂介绍":
    - /url: /scenes/prepare?scene=class-introduction&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "明亮国际课堂中的学生介绍"
      - text: A2 级 3 分钟
      - heading "课堂介绍 Class introduction" [level=2]
      - paragraph: 向老师 Lee 演练介绍学习背景、兴趣和目标。
      - text: 3 种练习长度
  - link "准备练习：向老师提问":
    - /url: /scenes/prepare?scene=ask-teacher&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "学生课后向老师提问"
      - text: A2 级 5 分钟
      - heading "向老师提问 Asking a teacher" [level=2]
      - paragraph: 向老师 Lee 演练澄清文字材料和提出问题。
      - text: 3 种练习长度
  - link "准备练习：小组分工":
    - /url: /scenes/prepare?scene=group-project&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "学生围桌讨论小组项目"
      - text: A2 级 5 分钟
      - heading "小组分工 Dividing group work" [level=2]
      - paragraph: 与同学 Jo 演练协商任务、时间和责任边界。
      - text: 3 种练习长度
  - link "准备练习：演讲问答":
    - /url: /scenes/prepare?scene=presentation-qa&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "学术演讲后的听众提问"
      - text: A2 级 8 分钟
      - heading "演讲问答 Presentation Q&A" [level=2]
      - paragraph: 以给定文字材料演练回应听众 Jo 的问题。
      - text: 3 种练习长度
  - link "准备练习：研讨讨论":
    - /url: /scenes/prepare?scene=seminar-discussion&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "小型研讨班围圈讨论"
      - text: A2 级 8 分钟
      - heading "研讨讨论 Seminar discussion" [level=2]
      - paragraph: 和同学 Jo 演练引用观点、建立联系和推进讨论。
      - text: 3 种练习长度
  - link "准备练习：老师答疑":
    - /url: /scenes/prepare?scene=office-hours&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "教授办公室中的一对一答疑"
      - text: A2 级 10 分钟
      - heading "老师答疑 Office hours" [level=2]
      - paragraph: 向老师 Lee 演练讨论方向、反馈和下一步。
      - text: 3 种练习长度
  - link "准备练习：药店买药":
    - /url: /scenes/prepare?scene=pharmacy-medicine&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "整洁药店柜台和药师"
      - text: A2 级 3 分钟
      - heading "药店买药 At a pharmacy" [level=2]
      - paragraph: 与练习伙伴演练如何向药师提问，不提供产品、用药或诊疗建议。
      - text: 3 种练习长度
  - link "准备练习：描述症状":
    - /url: /scenes/prepare?scene=describe-symptoms&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "诊所接待处进行症状登记"
      - text: A2 级 5 分钟
      - heading "描述症状 Describing symptoms" [level=2]
      - paragraph: 用虚构文字情境演练描述感受与时间，不诊断或判断紧急程度。
      - text: 3 种练习长度
  - link "准备练习：预约医生":
    - /url: /scenes/prepare?scene=doctor-appointment&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "现代诊所预约前台"
      - text: A2 级 5 分钟
      - heading "预约医生 Booking a doctor" [level=2]
      - paragraph: 演练未发送的预约询问，不联系诊所或确认真实预约。
      - text: 3 种练习长度
  - link "准备练习：拨打求助电话":
    - /url: /scenes/prepare?scene=emergency-call&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "手机求助通话与清晰位置标记"
      - text: A2 级 8 分钟
      - heading "拨打求助电话 Calling for help" [level=2]
      - paragraph: 用虚构地点演练求助通话；不拨号、不报警、不联系救援。
      - text: 3 种练习长度
  - link "准备练习：报告遗失物":
    - /url: /scenes/prepare?scene=lost-property&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "交通枢纽失物招领服务台"
      - text: A2 级 8 分钟
      - heading "报告遗失物 Reporting lost property" [level=2]
      - paragraph: 演练未发送的失物报告草稿，不提交真实报失或确认找回。
      - text: 3 种练习长度
  - link "准备练习：租房报修":
    - /url: /scenes/prepare?scene=rental-repair&level=A2&from=%2Fscenes%3Flevel%3DA2
    - article:
      - img "公寓内物业人员检查漏水问题"
      - text: A2 级 10 分钟
      - heading "租房报修 Rental repair request" [level=2]
      - paragraph: 演练未发送的物业报修沟通，不判断现场安全或实际安排维修。
      - text: 3 种练习长度
- navigation "主要导航":
  - link "目标":
    - /url: /
  - link "练习":
    - /url: /practice
  - link "场景":
    - /url: /scenes
  - link "记录簿":
    - /url: /notebook
  - link "我的":
    - /url: /me
- alert
- status
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test'
  2  | import { writeFile } from 'node:fs/promises'
  3  | import {onboard,enterScene,localState,protect} from './task7-browser-helpers'
  4  | 
  5  | test('H: native Back cancellation, ordinary draft clear and second Forward retained placeholder use explicit safe source', async ({page,context,baseURL},info)=>{
  6  |   const finishNetwork=await protect(context,baseURL!)
  7  |   await onboard(page)
  8  |   const id=await enterScene(page,'coffee-order','A2')
  9  |   const url=page.url()
  10 |   await page.getByRole('button',{name:/键盘/}).click()
  11 |   await page.getByRole('textbox',{name:'英文内容'}).fill('Synthetic native back draft.')
  12 |   await page.evaluate(()=>history.back())
  13 |   await expect(page.getByRole('button',{name:'继续练习',exact:true})).toBeVisible()
  14 |   await page.getByRole('button',{name:'继续练习',exact:true}).click()
  15 |   await expect(page.getByRole('textbox',{name:'英文内容'})).toHaveValue('Synthetic native back draft.')
  16 |   await page.getByRole('button',{name:'取消',exact:true}).click()
  17 |   await page.waitForFunction(()=>!history.state?.__speakmateExitGuard)
  18 |   const clean=await page.evaluate(()=>({url:location.href,state:history.state,length:history.length}))
  19 |   await page.evaluate(()=>history.forward())
  20 |   await page.waitForFunction(()=>history.state?.__speakmateRoutePlaceholder===true)
  21 |   expect(page.url()).toBe(url)
  22 |   const placeholder=await page.evaluate(()=>({url:location.href,state:history.state,length:history.length}))
  23 |   await page.getByRole('link',{name:'退出本次练习'}).click()
> 24 |   await expect(page).toHaveURL(/\/scenes\/prepare\?scene=coffee-order/)
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  25 |   expect((await localState(page)).sessions.map(session=>session.id)).toEqual([id])
  26 |   await writeFile(info.outputPath('native-placeholder.json'),JSON.stringify({clean,placeholder,returned:page.url()},null,2))
  27 |   await finishNetwork(info)
  28 | })
  29 | 
```