# SpeakMate 3.0：iPhone 文本选择与本地存储边界证据

访问日期：2026-09-09  
范围：仅补充 Task 4/6/7 的 iPhone/Safari 选择交互与 IndexedDB 持久性边界。标签含义：**来源事实**＝来源直接支持；**工程推断**＝据来源为 SpeakMate 提出的设计/测试约束；**真机未验证**＝本轮未在物理 iPhone 上验证。本文不作实现完成或兼容性结论。

## 1. 文本选择：可读取选区，不等于 Safari 菜单行为有保证

- **来源事实**：W3C Selection API（当前为 Working Draft）定义文档选区、`Range`、`selectstart` 与 `selectionchange`；文档选区变化时事件排到用户交互任务队列，`input`/`textarea` 自身提供文本选区时，`selectionchange` 目标是该元素。来源：[W3C Selection API](https://www.w3.org/TR/selection-api/)（访问 2026-09-09）。
- **来源事实**：普通文档文本可从 `Window.getSelection()` 取得当前 `Selection`；`input`/`textarea` 则有独立的文本控件选择模型。WHATWG 为它们定义 `selectionStart`、`selectionEnd`、`selectionDirection` 与 `setSelectionRange()`，并明确偏移量按 UTF-16 code unit 计；`input` 仅有特定文本类型适用。来源：[WHATWG HTML — APIs for the text control selections](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#textFieldSelection)（访问 2026-09-09）；辅助说明：[MDN `getSelection()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/getSelection)（访问 2026-09-09）。
- **来源事实**：`user-select: none` 使元素文字不可由用户选择，`user-select: text` 允许选择；`touch-action: auto` 允许浏览器处理平移与缩放，而 `touch-action: none` 禁止这些浏览器手势。来源：[MDN `user-select`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/user-select)（访问 2026-09-09）；[MDN `touch-action`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action)（访问 2026-09-09）。
- **规范没有保证**：上述来源定义的是选区状态、事件、文本偏移和浏览器是否可处理平移/缩放；它们没有规定 iPhone 的长按触发阈值、选区拖柄、原生复制/查询菜单的内容或位置、菜单在页面按钮取得焦点后是否保留，也没有承诺选区工具栏不遮挡内容。因此不能由“Selection API 存在”推出某版 iPhone Safari 的原生菜单、滚动和保存流程兼容。

### 对 Task 4 的具体含义

- **工程推断**：练习正文继续使用真实可选文本，并避免在正文祖先上设置 `user-select: none` 或 `touch-action: none`。选区监听只能做渐进增强，不能取消 `selectstart` 或把自制拖拽层置于正文上方；否则会直接削弱规范允许的原生选择、平移或缩放路径。
- **工程推断**：读取函数必须区分普通文档选区与 `input`/`textarea` 的 `selectionStart`/`selectionEnd`，校验非折叠、范围属于当前来源文本，并在 `selectionchange` 后保存不可变的文本/来源快照；不要假设用户随后点击按钮时活选区仍存在。
- **工程推断**：始终显示可聚焦的“保存词句”入口；无有效选区时仍可选择“单词 / 短语 / 整句”或直接保存整句，成功后留在练习并提供撤销。原生长按选择不是唯一保存入口，自制浮层也不是唯一入口。
- **真机未验证**：物理 iPhone Safari 上长按选词、调整拖柄、原生菜单、纵向滚动、200% 文本、VoiceOver，以及点显式保存按钮前后选区是否保留，均须在 Task 7 留证；桌面或通用 API 测试不能替代。

## 2. IndexedDB：默认尽力保存，安装 PWA 不等于永久保存

- **来源事实**：WHATWG Storage Standard 规定本地存储桶初始为 `best-effort`；存储压力下用户代理应优先清除尽力保存的桶。只有获得持久存储许可后才转为 `persistent`，且用户或源仍可参与清除。`usage` 是实现定义的粗略估计，`quota` 是实现定义的保守估计。来源：[WHATWG Storage Standard](https://storage.spec.whatwg.org/)（访问 2026-09-09）。
- **来源事实**：`navigator.storage.persist()` 只是请求持久模式，Promise 返回 `true` 才表示已获准，浏览器可按自身规则拒绝；`estimate()` 返回的 `usage`/`quota` 因压缩、去重和防指纹等原因并不精确。来源：[MDN `StorageManager.persist()`](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist)（访问 2026-09-09）；[MDN `StorageManager.estimate()`](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate)（访问 2026-09-09）。
- **来源事实（版本限定）**：WebKit 说明，自 Safari 17 / iOS 17 WebKit 起，独立运行的 Home Screen Web App 与浏览器 app 使用相同的 origin/overall quota。同文列出的浏览器回收条件包括总体配额、系统存储压力与一段时间没有用户交互；回收通常按整个 origin 进行，但处于持久模式的 origin 可能被排除。WebKit 还明确说 `estimate().quota` 是上限而非可写入保证，写入仍需处理 `QuotaExceededError`；`persist()` 是否批准采用启发式，是否作为 Home Screen Web App 打开只是其中一个因素。来源：[WebKit — Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/)（访问 2026-09-09）。
- **来源事实（历史策略说明）**：WebKit 曾明确把 Home Screen Web App 的第一方域排除在 ITP 七日清理之外，并说明其网站数据与 Safari 隔离；同文也说明 Safari Private Browsing 使用不写入磁盘的临时会话。该说明针对 Safari/iOS 14 时代的 ITP，不能替代当前设备验证，也不能推出主屏幕数据免受配额或用户清理影响。来源：[WebKit — CNAME Cloaking and Bounce Tracking Defense](https://webkit.org/blog/11338/cname-cloaking-and-bounce-tracking-defense/)（访问 2026-09-09）。
- **规范没有保证**：没有来源承诺“添加到主屏幕后永久保存”，也没有来源承诺 Safari 标签页与 Home Screen 容器自动共享/迁移数据。Storage API/IndexedDB 是本机、按存储键管理的浏览器存储机制；它们不定义跨设备同步。SpeakMate 的严格本地约束尤其不能暗示自动云同步。

### 对 Task 6 的具体含义

- **工程推断**：安装引导只能描述离线入口和可能改善的存储待遇，不能写“安装后永不丢失”“已安全备份”或“自动同步”。`persist()`/`persisted()` 和 `estimate()` 是可选增强，本笔记不批准把它们新增为 Task 6 必做功能；只有产品已选择暴露这些能力时，UI 才需按真实返回值呈现。此时也只能在 `persist()` 返回 `true` 或 `persisted() === true` 后显示“浏览器已授予持久存储”，返回 `false`、API 缺失或异常均保持诚实的“仍可能被清理”。
- **工程推断**：数据控制页提供显式导出与导入预览/确认。若记录导出状态，只能称“最近生成导出”或“最近请求导出”及其时间；浏览器开始下载不证明文件已经落盘、可读取或被用户妥善保存，因此不得显示“已安全备份”或无条件的“最近备份成功”。重要学习记录的提醒应引导用户定期导出文件，尤其在清理 Safari 数据、删除主屏幕 Web App、换机或大版本升级前；导出文件由用户自行确认并妥善保存。若产品已选择显示 `estimate()`，只能把它作为近似容量提示而非剩余可写空间承诺。
- **工程推断**：不能承诺跨设备连续学习。若用户换机，唯一受支持的本地路径应表述为手动导出/导入；Safari 与 Home Screen 数据是否可见也应由运行时实际结果决定，不做静默迁移假设。

### 对 Task 7 的具体含义

- **工程推断**：自动化应覆盖 IndexedDB `QuotaExceededError`/事务失败、导入取消与损坏文件；“导出后清空再导入”只允许使用合成 fixture 和明确隔离的测试浏览器 profile，绝不能清空用户的 Safari/PWA 数据。若产品选择暴露 `persist()`/`estimate()`，再条件性覆盖 true/false/缺失/异常或近似值分支；这不是新增的强制功能范围。失败时保留可恢复提示，不能把写入失败报告为已保存；下载已发起也不能断言导出文件已保存或备份成功。离线刷新验证不能证明长期不会回收。
- **工程推断**：若有物理 iPhone，分别记录普通 Safari 与 `display: standalone` 主屏幕启动的 iOS/Safari 版本、存储状态、重启/离线刷新、用户清理后表现，以及导出文件恢复。测试结论必须限定到所测版本与容器。
- **真机未验证**：本轮未执行 iPhone、Home Screen PWA、存储压力/长期闲置、私密浏览、换机或 Safari↔Home Screen 数据可见性测试；因此这些项目须在发布验证中明确列为未验证或附实测证据，不能以规范文字判定通过。

## 3. 测试断言边界

- 可以断言：代码保留可选文本与滚动、两类选区读取路径存在、显式保存替代可用、存储请求结果被诚实呈现、失败可恢复、备份可往返。
- 不可以仅凭通用规范/MDN 断言：某版 iPhone Safari 会显示特定原生菜单、按钮点击后选区不消失、Home Screen 安装保证永久存储、浏览器会批准 `persist()`、`estimate()` 是精确容量、数据会自动跨容器或跨设备同步。
