import { defineScenes, type SceneSeed } from '../factory'

const scenes = [
  {
    slug: 'pharmacy-medicine',
    titleZh: '药店买药',
    titleEn: 'At a pharmacy',
    summaryZh: '描述一般需求并理解药师的产品说明。',
    learnerRole: '在药店寻求非紧急语言帮助的顾客',
    aiRole: '会提醒就医边界的药师',
    goalsZh: [
      '描述一般症状和持续时间',
      '说明过敏或正在使用的药物',
      '复述用法并确认何时寻求专业帮助',
    ],
    goalKeywords: [
      ['headache', 'symptom', 'days'],
      ['allergy', 'allergic', 'medicine', 'medication'],
      ['dose', 'use', 'doctor', 'professional'],
    ],
    keywords: [
      'headache',
      'allergy',
      'medicine',
      'dose',
      'pharmacist',
      'doctor',
    ],
    expressions: {
      basic: ['I have a headache.', 'I am allergic to penicillin.'],
      standard: [
        'I have had these symptoms for two days.',
        'Could you explain how this product is normally used?',
      ],
      advanced: [
        'I am not asking for a diagnosis; I need help explaining the symptoms and understanding the label.',
        'What language should I use when I contact a medical professional about this?',
      ],
    },
    openings: {
      basic: 'How do you feel?',
      standard: 'What symptoms would you like help describing?',
      advanced:
        'I can help with general product information and communication, but not diagnose you. What would you like to explain?',
    },
    imageAltZh: '整洁药店柜台和药师',
  },
  {
    slug: 'describe-symptoms',
    titleZh: '描述症状',
    titleEn: 'Describing symptoms',
    summaryZh: '向医疗人员清楚说明感受、时间和变化。',
    learnerRole: '需要表达身体状况的就诊者',
    aiRole: '收集基础信息的医疗接待人员',
    goalsZh: ['说出主要不适', '说明开始时间和变化', '回答基础严重程度问题'],
    goalKeywords: [
      ['pain', 'hurts', 'fever'],
      ['started', 'yesterday', 'worse', 'change'],
      ['severity', 'scale', 'location', 'intense'],
    ],
    keywords: ['pain', 'started', 'worse', 'fever', 'severity', 'location'],
    expressions: {
      basic: ['My stomach hurts.', 'It started yesterday.'],
      standard: [
        'The pain becomes worse after I eat.',
        'I also had a fever last night.',
      ],
      advanced: [
        'The discomfort began gradually, is localized on the right, and has become more intense since this morning.',
        'I can describe the pattern, but I need a clinician to assess what it means.',
      ],
    },
    openings: {
      basic: 'Where does it hurt?',
      standard: 'Please describe your main symptom and when it started.',
      advanced:
        'Tell me the location, onset, pattern, and any significant change; a clinician will evaluate the medical meaning.',
    },
    imageAltZh: '诊所接待处进行症状登记',
  },
  {
    slug: 'doctor-appointment',
    titleZh: '预约医生',
    titleEn: 'Booking a doctor',
    summaryZh: '说明预约原因并确认时间与所需材料。',
    learnerRole: '致电或到前台预约的患者',
    aiRole: '遵循流程安排时间的诊所接待员',
    goalsZh: ['说明非紧急预约原因', '协调可行时间', '确认地点和所需材料'],
    goalKeywords: [
      ['appointment', 'reason', 'symptoms', 'non-emergency'],
      ['Monday', 'available', 'time', 'day'],
      ['clinic', 'insurance', 'documents', 'referral'],
    ],
    keywords: [
      'appointment',
      'available',
      'clinic',
      'insurance',
      'urgent',
      'confirm',
    ],
    expressions: {
      basic: ['I need an appointment.', 'Is Monday available?'],
      standard: [
        'I would like the earliest non-emergency appointment.',
        'What documents should I bring?',
      ],
      advanced: [
        'The symptoms are not immediately life-threatening, but they are worsening; what is the appropriate scheduling route?',
        'Could you confirm whether the consultation requires a referral or insurance pre-authorization?',
      ],
    },
    openings: {
      basic: 'What day do you want?',
      standard: 'May I ask the general reason for the appointment?',
      advanced:
        'I can help route the appointment. If you believe it is an emergency, contact local emergency services immediately.',
    },
    imageAltZh: '现代诊所预约前台',
  },
  {
    slug: 'emergency-call',
    titleZh: '拨打求助电话',
    titleEn: 'Calling for help',
    summaryZh: '练习清晰报告地点、事件和现场状态。',
    learnerRole: '模拟拨打当地求助电话的人',
    aiRole: '保持冷静并收集关键信息的接线员',
    goalsZh: ['准确报告位置', '简要说明发生什么', '听懂并复述接线员问题'],
    goalKeywords: [
      ['location', 'address', 'I am at'],
      ['happened', 'accident', 'injured'],
      ['repeat', 'understand', 'instruction', 'safe'],
    ],
    keywords: ['help', 'location', 'happened', 'safe', 'injured', 'emergency'],
    expressions: {
      basic: ['I need help.', 'I am at this address.'],
      standard: [
        'There has been an accident near the station.',
        'I am in a safe place now.',
      ],
      advanced: [
        'I can give you the exact location and what I can observe without making assumptions.',
        'Please repeat the instruction slowly so I can confirm I understood it correctly.',
      ],
    },
    openings: {
      basic: 'Where are you?',
      standard: 'Tell me your exact location and what has happened.',
      advanced:
        'State your location first, then describe only what you can safely observe. This is language practice, not live emergency support.',
    },
    imageAltZh: '手机求助通话与清晰位置标记',
  },
  {
    slug: 'lost-property',
    titleZh: '报告遗失物',
    titleEn: 'Reporting lost property',
    summaryZh: '描述遗失物、最后出现地点和辨识特征。',
    learnerRole: '寻找遗失物的旅客或居民',
    aiRole: '记录信息的失物招领工作人员',
    goalsZh: [
      '描述遗失物外观',
      '说明最后看到的时间地点',
      '留下联系方式并确认后续',
    ],
    goalKeywords: [
      ['lost', 'wallet', 'black', 'description'],
      ['last saw', 'last seen', 'bus', 'time', 'place'],
      ['contact', 'phone', 'report', 'follow up'],
    ],
    keywords: [
      'lost',
      'wallet',
      'last seen',
      'description',
      'contact',
      'report',
    ],
    expressions: {
      basic: ['I lost my wallet.', 'It is black.'],
      standard: [
        'I last saw it on the number eight bus.',
        'It has a small red mark inside.',
      ],
      advanced: [
        'The wallet itself is replaceable, but the identification inside makes the timing important.',
        'Could you record the distinctive features without putting sensitive document numbers in the report?',
      ],
    },
    openings: {
      basic: 'What did you lose?',
      standard: 'Please describe the item and where you last saw it.',
      advanced:
        'I will create a report. Tell me the identifying features, timeline, and safest way to contact you.',
    },
    imageAltZh: '交通枢纽失物招领服务台',
  },
  {
    slug: 'rental-repair',
    titleZh: '租房报修',
    titleEn: 'Rental repair request',
    summaryZh: '描述住房故障、影响和合理处理时间。',
    learnerRole: '需要联系房东或物业的租客',
    aiRole: '负责评估优先级的物业经理',
    goalsZh: ['具体描述故障', '说明影响和已采取措施', '确认维修时间与进入安排'],
    goalKeywords: [
      ['leak', 'heating', 'broken'],
      ['affecting', 'worse', 'contained', 'urgent'],
      ['repair', 'access', 'when', 'landlord'],
    ],
    keywords: ['leak', 'heating', 'repair', 'access', 'urgent', 'landlord'],
    expressions: {
      basic: ['The heater does not work.', 'There is water on the floor.'],
      standard: [
        'The leak started this morning and is getting worse.',
        'When can someone come to inspect it?',
      ],
      advanced: [
        'I have contained the water where it is safe to do so, but the leak is affecting the electrical area.',
        'Please confirm the urgent-repair process and how access will be arranged if I am away.',
      ],
    },
    openings: {
      basic: 'What is broken?',
      standard: 'Please describe the issue and how urgent it seems.',
      advanced:
        'Tell me what is happening, what area is affected, and whether there is any immediate safety concern requiring local professional help.',
    },
    imageAltZh: '公寓内物业人员检查漏水问题',
  },
] satisfies readonly SceneSeed[]

export const EMERGENCY_SCENES = defineScenes('emergency', 'emergency', scenes)
