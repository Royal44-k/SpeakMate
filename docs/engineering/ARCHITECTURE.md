# SpeakMate 3.0 架构、数据与扩展规格

更新：2026-09-13；按本次源码核对。产品范围见 [APP_SPEC.md](../../APP_SPEC.md)，取舍见 [实施决策](../design/3.0-implementation-decisions.md)。本页不是旧微信后端的实施说明。

## 1. 系统边界

```text
Vercel / Next.js：页面壳、静态图标图片、版本化公共语料、健康信息
                          ↓ 首次下载 / 校验 / 缓存
手机浏览器 PWA
  五项导航 → 功能组件 → 本地对话 / 任务 / 复习 / 奖励规则
                                ↓ 事务
                 IndexedDB：个人学习数据
  录音：内存 / Blob 临时回听；备份：用户主动下载的 JSON
```

学习正文不提交服务器。Next.js 服务仍用于托管页面与公共资料，所以并非直接双击 HTML 的纯静态站。浏览器首次下载需要网络，缓存成功不等于语音能力可用。部署主机可能记录常规 HTTP 元数据，不把“学习本地化”表述为互联网完全零请求。

## 2. 代码分层与依赖

| 层 | 目录 | 职责 |
| --- | --- | --- |
| 页面 | `src/app` | App Router、固定页面壳、公共资源与兼容入口 |
| UI | `src/components`、`src/features` | 手机布局、来源返回、录音与表单状态、用户操作反馈 |
| 领域 | `src/domain` | 分级对话状态、目标计划、复习、完成证据与积分规则 |
| 基础设施 | `src/infrastructure` | 存储事务、导入校验、语音能力检测、被关闭的远端适配器 |
| 内容 | `src/content` | 场景、已校审问答、词句解释、奖励资料和版本元数据 |

Next.js 16.3.4、React 19.2.8、TypeScript 5.9.3；运行时 Node 22.x，包管理器 pnpm 11.19.0。具体依赖版本以 `package.json` 与 `pnpm-lock.yaml` 为准。Zustand 管理界面状态，IndexedDB/idb 保存持久数据，Zod 校验恢复输入。没有新增 Taro、NestJS、Redis、COS 或 MySQL 服务。

## 3. 页面与返回契约

主入口：`/`（目标）、`/practice`、`/scenes`、`/notebook`、`/me`。

固定可缓存详情入口包括 `/scenes/prepare`、`/session`、`/session/report`、`/notebook/note` 和 `/notebook/simulation`。身份与公开选项由已校验的 URL 参数携带；词句正文、私人搜索、备注不放 URL。旧 `/scenes/[slug]`、`/session/[id]` 等入口保留兼容，不能绕过固定壳与参数校验。准确参数及历史回退策略以 `src/components/app-shell/learning-routes.ts` 为可执行依据。

用户已保存的旧编号即使不适用于新路由，也不得改写或丢弃；提供原地只读历史与导出。返回要携带笔记/任务来源；退出、草稿、新一轮和完成确认分别处理。详见 [离线路由](../design/3.0-offline-routing.md)与[练习持久化](../design/3.0-practice-persistence.md)。

## 4. 数据字典摘要

数据库名 **`speakmate-v1`**，数据库版本 **2**；名字里的 v1 不是当前 schema 版本。定义见 `src/infrastructure/persistence/db.ts`，所有表以 `id` 为主键。

| Store | 数据与关联 |
| --- | --- |
| `profile` | 本地访客资料、等级、兴趣、目标设置 |
| `sessions` | 场景与等级快照、状态、来源及练习进度；按状态/更新时间索引 |
| `turns` | 单轮文字、角色与反馈；`sessionId` 关联会话并有索引 |
| `favorites` | 旧收藏兼容记录；迁移和记录簿关联保留 |
| `settings` | 语速、自动播放等用户偏好 |
| `outbox` | 旧同步兼容结构；本版不消费、不发起上传 |
| `notebook` | 原文、标准化值、多个来源上下文、备注、标签及删除状态 |
| `reviews` | 记录簿自评与复习安排 |
| `dailyPlans` | 北京时间日期、等级/兴趣/时长快照、任务与进度 |
| `learningEvents` | 完成、复习、前台时长、奖励等不可变学习事件与来源 |
| `pointsLedger` | 事件、规则及版本、正负积分条目；余额由账本计算 |
| `rewardUnlocks` | 本地数字奖励所有权与兑换关联 |

完整字段分别见 `src/domain/learning/types.ts`、`practice/types.ts`、`notebook/types.ts`、`goals/types.ts`；JSON 校验在 `src/infrastructure/persistence/backup-schemas.ts`。本页不维护另一份容易漂移的完整类型副本。

## 5. 数据不变量

- 旧收藏迁移在升级事务内完成；关联不明确则中止并保留原数据，不猜测归属、不清库。
- 同一任务、完成事件和积分规则不能重复结算。任务、事件及账本写入使用本地事务，多窗口与失败重试保持一致。
- 改等级、时长和新一天不修改既有练习快照；旧版练习不追溯发放新任务积分。
- 删除原对话与已保存笔记上下文分离；删除状态和备份合并优先级由恢复校验处理。
- 导入先校验/预览/确认，再原子合并。不信任导入余额，拒绝冲突身份、破损关联、非法格式与超限文件。
- 导出 schema 2，兼容受支持的旧 schema 1 输入；上限 10 MiB，包含全部 12 表，不含原始录音。

## 6. 公共 HTTP 与本地接口

| 接口 | 当前用途与限制 |
| --- | --- |
| `GET /api/v1/health` | `status/version/mode/aiMode/buildSha`；部署来源检查，不读取用户数据 |
| `GET /api/v1/capabilities` | 云 ASR、云对话、邮件同步均为 false；声明文字降级与音频大小上限 |
| `GET /content/v1/{category}` | 只读公开分类语料；未知分类 404 |
| `GET /offline-build.js`、`/sw.js` | 构建生成的离线清单与工作线程；必须与同一构建资源一致 |
| `POST /api/v1/turns` | 旧兼容端点；3.0 客户端不调用，不作为新功能提交学习正文的 API |

本地 `ConversationProvider.nextTurn` 接口保留未来替换能力；3.0 直接走本地对话引擎。`NotebookRepository` 提供 capture/undo/list/get/save/remove/restore，备份端口提供预览与恢复，学习仓库负责原子结算。以对应 TypeScript 接口和测试作为契约，不声称已交付初始规划的后端 OpenAPI、账户/支付服务或后台管理站。

## 7. 语料、语音与离线

七类 42 场景 × 五等级构成 210 单元；目标质量门为每单元至少 12 问、每问两答及六类意图，不以机械拉长句子区分等级。实际数量、状态推进与人工/模型辅助审校分别留证。公共内容按类别下载，正在进行的会话引用固定快照，不中途替换版本。

`scripts/offline-manifest.mjs` 必须在 `next build` 后执行，生成当前构建的壳/资产/语料字节与哈希。不能提交旧生成文件替代新构建。Service Worker 更新与数据库迁移独立；更新时保护当前练习，不通过清空数据完成升级。

只在确认 `processLocally` 等能力条件满足时启用本地转写；否则录音回听＋文字确认。TTS 只选已确认 `localService` 的英语音色。无音色、权限拒绝、取消和后台打断都应可恢复，绝不默认调用远程服务。

## 8. 安全、应急与未来接口

`remoteLearningServicesEnabled()` 当前固定 false。Supabase/Cloudflare 相关依赖和类型为历史适配边界，旧环境变量不能绕过本版闸门。未来要启用账号、MySQL、云 AI 或付费服务，必须重新设计认证、权限、同意、数据迁移、计费上限与服务端可信积分规则，并取得单独授权；不在当前页面直接耦合 SQL 或供应商。

应急构建 `NEXT_PUBLIC_RECOVERY_ONLY=true` 使用 `.next-recovery`，只读已存在 schema 2/12 表，未知库拒绝操作。普通版故障时需在**相同来源域名**提供恢复入口；另一个候选域名无法读取原域名 IndexedDB。旧 2.3 回滚不是数据库 v2 的安全恢复方案。
