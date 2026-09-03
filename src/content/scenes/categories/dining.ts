import { defineScenes, type SceneSeed } from '../factory'

const scenes = [
  {
    slug: 'coffee-order', titleZh: '咖啡点单', titleEn: 'Ordering coffee', summaryZh: '选择饮品、规格和取餐方式。', learnerRole: '咖啡店顾客', aiRole: '节奏明快的咖啡师', goalsZh: ['选择饮品和杯型', '说明糖奶偏好', '确认价格和取餐方式'], keywords: ['coffee', 'size', 'milk', 'sugar', 'to go', 'recommendation'],
    expressions: { basic: ['A small latte, please.', 'No sugar, please.'], standard: ['Could I get an oat-milk latte to go?', 'What would you recommend if I prefer something less sweet?'], advanced: ['Could you balance the espresso with less syrup while keeping the texture creamy?', 'I am open to a seasonal option, provided it is not overly sweet.'] },
    openings: { basic: 'What would you like?', standard: 'Hi! What can I make for you today?', advanced: 'Welcome. Are you after your usual style of coffee or something a little different today?' }, imageAltZh: '自然光咖啡店吧台和咖啡师',
  },
  {
    slug: 'restaurant-order', titleZh: '餐厅点餐', titleEn: 'Ordering at a restaurant', summaryZh: '理解菜单、点餐并确认烹饪要求。', learnerRole: '第一次来餐厅的顾客', aiRole: '熟悉菜单的服务员', goalsZh: ['询问菜品内容', '完成主食和饮品点单', '确认烹饪程度或配菜'], keywords: ['menu', 'starter', 'main course', 'medium', 'side dish', 'special'],
    expressions: { basic: ['I would like the chicken.', 'Water, please.'], standard: ['What does this dish come with?', 'Could I have the steak medium, with salad on the side?'], advanced: ['Which dish best represents the chef’s style without being too heavy?', 'Could the sauce be served separately so I can adjust the richness?'] },
    openings: { basic: 'Are you ready to order?', standard: 'Would you like to hear today’s specials?', advanced: 'I can walk you through the menu. Are there particular flavors or textures you are hoping for?' }, imageAltZh: '现代餐厅餐桌与菜单',
  },
  {
    slug: 'food-allergy', titleZh: '过敏与忌口', titleEn: 'Food allergies', summaryZh: '严谨说明过敏原并核对制作方式。', learnerRole: '有明确饮食限制的顾客', aiRole: '谨慎核对配料的餐厅主管', goalsZh: ['说明过敏原或忌口', '询问交叉接触风险', '确认安全替代菜品'], keywords: ['allergy', 'nuts', 'ingredients', 'separate', 'cross-contact', 'substitute'],
    expressions: { basic: ['I am allergic to nuts.', 'Does this have milk?'], standard: ['Could you check the ingredients for me?', 'Is this prepared separately from shellfish?'], advanced: ['Even trace exposure is a concern; could the kitchen confirm its cross-contact procedure?', 'If that cannot be guaranteed, which sealed or simply prepared option is safest?'] },
    openings: { basic: 'Do you have an allergy?', standard: 'Please tell me which ingredients you need to avoid.', advanced: 'Thank you for telling us. Could you clarify the severity and whether cross-contact is also a concern?' }, imageAltZh: '餐厅服务员认真核对配料表',
  },
  {
    slug: 'return-item', titleZh: '商品退换', titleEn: 'Returning an item', summaryZh: '说明商品问题并协商退款或换货。', learnerRole: '带着商品和收据的顾客', aiRole: '依据政策处理售后的店员', goalsZh: ['说明购买信息', '清楚描述商品问题', '确认退款或换货方式'], keywords: ['receipt', 'return', 'refund', 'exchange', 'faulty', 'policy'],
    expressions: { basic: ['I want to return this.', 'Here is the receipt.'], standard: ['It stopped working after two days.', 'Could I exchange it for another size?'], advanced: ['The fault appeared under normal use, so I would prefer a refund rather than store credit.', 'Could you explain which part of the return policy applies in this case?'] },
    openings: { basic: 'Do you have the receipt?', standard: 'How can I help with this item today?', advanced: 'I can look into the return, although the purchase falls just outside our standard window. What happened?' }, imageAltZh: '商店服务台上的商品和收据',
  },
  {
    slug: 'supermarket-help', titleZh: '超市询问', titleEn: 'Finding groceries', summaryZh: '询问商品位置、替代品和标签信息。', learnerRole: '不熟悉超市布局的顾客', aiRole: '忙碌但乐于指路的超市员工', goalsZh: ['询问商品位置', '说明具体规格', '找到合适替代品'], keywords: ['aisle', 'organic', 'label', 'in stock', 'alternative', 'dairy-free'],
    expressions: { basic: ['Where is the rice?', 'Do you have soy milk?'], standard: ['Which aisle has dairy-free products?', 'Is there a similar one in stock?'], advanced: ['I am looking for a lower-sodium alternative with comparable ingredients.', 'Could you help me interpret whether this label indicates added sugar?'] },
    openings: { basic: 'What are you looking for?', standard: 'Sure, which product do you need help finding?', advanced: 'I can help. Are you looking for a particular brand, ingredient profile, or dietary option?' }, imageAltZh: '明亮超市货架与购物篮',
  },
  {
    slug: 'price-discount', titleZh: '价格与优惠', titleEn: 'Prices and discounts', summaryZh: '理解促销条件并核对最终价格。', learnerRole: '准备结账的顾客', aiRole: '解释活动规则的收银员', goalsZh: ['询问标价与折扣', '理解优惠适用条件', '确认最终支付金额'], keywords: ['price', 'discount', 'member', 'valid', 'coupon', 'terms'],
    expressions: { basic: ['How much is this?', 'Is this on sale?'], standard: ['Does the discount apply without membership?', 'Can I use this coupon with the promotion?'], advanced: ['The shelf label suggests a different price; could you verify which offer takes precedence?', 'Could you walk me through the conditions that exclude this item from the promotion?'] },
    openings: { basic: 'This is twenty dollars.', standard: 'Are you asking about today’s member discount?', advanced: 'The promotion has several conditions. Which price or offer did you see advertised?' }, imageAltZh: '商店收银台与促销标签',
  },
] satisfies readonly SceneSeed[]

export const DINING_SCENES = defineScenes('dining', 'dining', scenes)
