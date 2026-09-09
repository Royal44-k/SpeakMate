# SpeakMate 本地学习与原创分级语料证据笔记

日期：2026-09-09  
范围：A1–C1 原创口语语料、严格本地 PWA、浏览器语音能力与 iOS 可访问交互。本文只记录官方资料与产品设计推断，不复制第三方课程正文，不宣称语料已获语言学专家或机构认证。

## 1. CEFR：可作为分级设计依据，但不是现成题库或认证

### 来源事实

- Council of Europe 将 CEFR 能力组织为 A1–C2 六级，并说明描述符是按交际活动分类的、可独立使用的 “can-do” 参照；2020 Companion Volume 更新并扩展了描述符。官方入口：[CEFR descriptors](https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors)，官方 2020 全文：[CEFR Companion Volume](https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4)。
- 2020 Companion Volume 同时警告：描述符是开放、非穷尽、用于课程开发的示例，不是自动构成完整测评量表；某描述符出现于某级，也不表示它只适用于该级（正文 40 页）。因此把内容标为 “CEFR A1/B2” 只能表示设计对齐，不能推出测评效度或官方认证。
- “Overall oral interaction” 的 A1–C1 进阶主轴（正文 71 页）可简要转写为：A1 在慢速、重复、改述和帮助下处理即时需要或非常熟悉话题；A2 完成可预测日常情境中的简短、直接交换；B1 能较有信心处理熟悉及部分非例行情境、交换/核对信息并说明问题；B2 能在广泛话题中较流利准确地互动、解释和支撑观点；C1 能近乎自然流利地表达，以广泛词汇、迂回表达和话语组织处理较复杂概念。以上均为中文概括，不是原文复制。
- Companion Volume 还把口语互动拆成会话、信息交换、取得商品和服务、目标导向协作、澄清等不同量表（正文 70–71 页）；分级不能只靠句长或替换词汇。

### 产品设计推断

- 五级的实质差异应同时体现在：任务复杂度、信息可预测性、对对方帮助的依赖、话轮持续度、解释/论证深度、语域与修复策略。仅把同一问句加形容词、同义改写或机械延长，不构成新的级别覆盖。
- 建议的原创策略：A1 聚焦单一步骤和具体需要；A2 做两三步日常交换并允许模板支架；B1 加入非例行问题、经历与简短理由；B2 加入权衡、建议、协商和有依据的观点；C1 加入语域调整、隐含意图、细致限定、复杂异议与自然修复。该映射是 SpeakMate 的课程设计推断，不是 Council of Europe 对本产品的认可。

## 2. British Council：可参考任务类型，Speaking 专区实际只到 B2

### 来源事实

- British Council LearnEnglish 的 Speaking 总页明确说该自学专区按 CEFR 编排，并让学习者从 A1 选择到 B2；页面只列 A1、A2、B1、B2 四个 speaking 分区：[Speaking](https://learnenglish.britishcouncil.org/free-resources/speaking)。官方站点地图也在 Speaking 下只列这四级：[Sitemap](https://learnenglish.britishcouncil.org/sitemap)。
- 各级页面展示的任务类型从熟悉日常交际逐步走向互动管理与观点处理，例如 A1 的确认理解/建议/初次见面、A2 的道歉/指示/兴趣与工作、B1 的同意异议/请求帮助/维持会话、B2 的挑战观点/处理问题/利弊/劝说。官方页面：[A1](https://learnenglish.britishcouncil.org/free-resources/speaking/a1)、[A2](https://learnenglish.britishcouncil.org/free-resources/speaking/a2)、[B1](https://learnenglish.britishcouncil.org/free-resources/speaking/b1)、[B2](https://learnenglish.britishcouncil.org/free-resources/speaking/b2)。

### 产品设计推断与版权边界

- British Council 页面可用于核对“交际功能/任务类型”的层级合理性，不能支撑 SpeakMate 的 C1 内容；C1 必须回到 CEFR 2020，并通过原创编写与单独审校建立证据链。
- 不复制或近似改写其视频台词、练习题、答案、人物、情节或固定表达编排。记录来源时只写“任务类型参考”，SpeakMate 的每个问题、答案和情境约束都应从空白稿原创。

## 3. 严格本地语音：能力证实后才启动，绝不静默转云端

### 来源事实

- MDN 说明 `SpeechRecognition.processLocally = true` 要求识别在设备本地进行；默认 `false` 时由浏览器决定本地或远端。该属性仍标为实验性，生产使用必须检查兼容性：[processLocally](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/processLocally)。
- `SpeechRecognition.available()` 用来检查指定语言、质量和本地处理条件是否可用；其结果包含 `available`、`downloadable`、`downloading`、`unavailable`。本地语言包未安装时直接启动可能产生 `language-not-supported`；安装需另用同样为实验性的 `install()`：[available()](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/available_static)、[install()](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/install_static)。`available()`/`install()` 还受 `on-device-speech-recognition` Permissions Policy 控制，默认 allowlist 为 `self`：[Permissions Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy/on-device-speech-recognition)。
- `SpeechSynthesisVoice.localService` 为只读布尔值，`true` 表示声音由本地合成服务提供，`false` 表示远程服务：[localService](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService)。

### SpeakMate 安全门（产品设计推断）

1. 同时做特性检测：存在 `SpeechRecognition`、实例支持 `processLocally`、构造器支持 `available()`；任一不满足即不启动识别。
2. 固定显式 BCP 47 英语语言标签，先调用 `available({ langs, processLocally: true, ... })`；只有返回 `available` 才设置 `processLocally = true` 并 `start()`。
3. `downloadable`、`downloading`、`unavailable`、异常或策略阻止都视为“当前不可严格本地识别”。不把 `processLocally` 改回 `false`，不调用云识别，不上传录音。语言包安装只能由用户明确触发；不得为练习静默下载。
4. TTS 只从 `getVoices()` 中选 `localService === true` 且语言匹配的英语 voice，并处理异步 `voiceschanged`。找不到时显示可理解提示并保留文本；不要让未指定 voice 的默认合成替代，因为默认 voice 未被本地属性验证。
5. 会话卸载/切换时 `abort()`/停止监听；识别失败只影响语音输入，不阻断键盘输入、文本确认或已录音的本地试听。

### 设备端降级顺序

- 首选：已证实可用的本地识别 → 用户核对/编辑转写 → 明确确认后提交。
- 无本地识别：直接键盘输入；可选仅在内存或本地存储中试听录音，但不把音频当作已回答、不做伪造转写/音素分数、不上传。
- 无本地英语 voice：继续显示英文文本、音标/节奏提示（仅限人工编写且已审校内容）和手动跟读，不调用远程 voice。
- 离线或 API 不兼容：完整练习仍应能靠静态语料、键盘与本地持久化完成；UI 明示“此设备暂不支持本地语音识别/朗读”，而不是暗示故障或自动联网。

## 4. iOS/PWA 文本选择与可访问替代

### 来源事实

- W3C Selection API 定义了读取用户所选文档片段或关注点的标准接口：[Selection API](https://www.w3.org/TR/selection-api/)。
- Apple 建议核心功能不要只依赖手势，应提供屏幕控件等替代方式，并要求正确标注控件以支持 VoiceOver、Voice Control、AssistiveTouch、Full Keyboard Access 和 Switch Control；iOS/iPadOS 默认推荐控件尺寸为 44×44 pt：[Apple Accessibility HIG](https://developer.apple.com/design/human-interface-guidelines/accessibility)。
- WCAG 2.2 AA 的指针目标最低为 24×24 CSS px（或满足间距/等价控件等例外），AAA 的增强目标为 44×44 CSS px；文本还应可放大到 200% 且不丢内容或功能：[2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)、[2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html)、[1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)。

### 产品设计推断

- 保留 Safari 原生长按选词、复制、滚动和缩放：正文使用真实文本，不全局禁用 `user-select`，不以 `preventDefault()` 劫持触摸起点。Selection API 只做渐进增强，失败时不影响阅读。
- 为“保存到词句本”提供可聚焦的显式按钮，并让用户选择“单词 / 短语 / 整句”；这既是长按选择失败时的替代路径，也避免把精细拖拽手柄设为唯一入口。按钮采用语义 HTML、可见焦点、清晰名称，关键操作目标按 44×44 CSS px 设计。
- 选区菜单、保存结果和错误使用可读文本与适当的 live region；音效必须同时有视觉状态。以真实 iPhone Safari + VoiceOver、键盘、200% 字号检查选择、滚动、焦点次序和撤销，而不把桌面模拟器通过视为 iOS 已验证。

## 5. 原创语料编写与审校清单

目标规模是 **42 场景 × 5 级 × 12 个实质问题 = 2,520 个问题；每题至少 2 个相关且实质不同的答案 = 5,040 个答案；每个“场景×级别”至少 6 个意图**。数字达标必须建立在逐条实质内容检查之上，填充、重复、仅同义替换的变体不计覆盖。

### 编写前

- 为每个场景写清角色、现实目标、边界条件、可能障碍和至少 6 个不同意图；先验证意图能自然发生，不为凑数硬塞。
- 为五级分别写“能做什么、需要多少支架、话轮深度、信息复杂度、修复方式、语域要求”，并关联到 CEFR 2020 的具体量表/页码，而非只标一个总级别。
- 建立条目元数据：`sceneId`、`level`、`intent`、`sourceBasis`（只存官方依据与页码/URL）、`contentVersion`、`author`、`reviewState`、`reviewer`、`reviewedAt`、`reviewNotes`。`sourceBasis` 不等于版权来源，正文必须原创。

### 每题编写

- 问题必须推进该意图或核实尚未完成的事实，且与角色/场景一致；不能只是换人名、数字、语序或礼貌词。
- 两个答案都要直接回应问题，但在事实、立场、策略或约束上实质不同；不能是标点、缩写、单复数或同义词替换。
- A1/A2 允许清晰支架和较短表达；B1 需要连接信息与简短理由；B2 要求权衡、协商或论证；C1 要求精确限定、适切语域和复杂互动管理。难度不能仅由词数决定。
- 同一“场景×级别”的 12 题应覆盖至少 6 个已命名意图，并包含自然的澄清、拒绝/改选、理解困难或偏题修复路径；终止状态不再提出新问题。
- 禁止抄录 British Council 课程内容；禁止声称自动规则、测试通过或 CEFR 标签等同人工语言审校。

### 双层复核与放行

1. **结构复核**：唯一 ID、数量、意图覆盖、答案相关性、事实推进、终止逻辑、无重复/填充、元数据完整。
2. **逐条语言复核**：人工阅读自然度、语法、搭配、语域、文化/安全风险、级别适切性和两答案实质差异；记录具体改动与结论。没有实际复核的条目标 `draft`，不得伪标 `reviewed`。
3. **抽样回归不是全量认证**：自动测试可发现重复、缺字段、意图不足和状态机错误，但不能证明语言自然或 CEFR 有效。报告应分别列出“结构通过数”“人工已读数”“draft/待复核数”和实际短板。
4. 只有 210 个“场景×级别”组合均满足 12 个实质问题、≥6 意图，且 2,520 题各有 2 个相关实质答案时，才可报告目标完整；否则报告真实缺口，不用机械变体补齐。

## 结论

CEFR 2020 足以提供 A1–C1 原创口语任务的分级轴，但不会自动赋予 SpeakMate 测评效度或语言认证；British Council Speaking 只能作为 A1–B2 任务类型的辅助参照。严格本地 PWA 必须把语音识别和 TTS 当作可选增强：只有浏览器明确证明本地能力时启用，任何不确定状态都退回文本/本地试听，不转云、不上传。iOS 上同时保留原生选择并提供显式可访问控件，才能避免把关键学习操作绑死在长按手势或实验性 API 上。
