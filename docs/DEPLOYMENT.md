# SpeakMate 发布与 iPhone 使用手册

## 1. 当前发布策略

- 首发形态：Next.js 移动端 PWA。
- 托管：Vercel Hobby 个人空间；不绑定数据库、付费模型、Blob、队列、Cron 或付费 Marketplace 资源。
- 地区：中国大陆用户优先使用新加坡 `sin1` Serverless 区域；静态资源仍由 Vercel 全球边缘网络提供。
- 默认能力：42 个场景、游客本地档案、本地对话反馈、历史记录、学习报告、数据导出与清空均可零配置运行。
- 可选能力：Cloudflare Workers AI 只有在密钥、共享额度保护和显式发布闸门同时就绪后才启用；Supabase 仍需单独显式开启；云端错误会进入本地陪练降级路径。

## 2. 电脑端本地预览

```powershell
cd D:\Codex-chat\SpeakMate
pnpm install
pnpm verify
pnpm dev
```

打开 `http://localhost:3000`。首次进入选择英语等级、学习目标和每日时长，然后在场景准备页进入对话。电脑必须允许浏览器使用麦克风；如果拒绝，仍可点“键盘输入”完成全流程。

同一 Wi-Fi 下也可临时在 iPhone Safari 访问开发电脑的局域网地址，但这不是正式发布方式，Windows 防火墙、网络隔离和非 HTTPS 会影响录音权限。正式体验应使用下方 Vercel HTTPS 地址。

## 3. Vercel 首次发布

1. 安装并登录 Vercel CLI：

   ```powershell
   pnpm dlx vercel@latest login
   pnpm dlx vercel@latest whoami
   ```

2. 在项目根目录创建或连接一个名为 `speakmate-pwa` 的个人项目：

   ```powershell
   pnpm dlx vercel@latest link --yes --project speakmate-pwa
   ```

3. 创建不占用生产域名的预览部署：

   ```powershell
   pnpm dlx vercel@latest deploy --yes
   ```

4. 对预览 URL 验收 `/api/v1/health`、PWA manifest、Service Worker、游客首轮对话和 iPhone WebKit 路径。

5. 验收通过后，将同一构建晋升到生产：

   ```powershell
   pnpm dlx vercel@latest promote <preview-url> --yes
   ```

6. 查看生产部署与最近错误：

   ```powershell
   pnpm dlx vercel@latest inspect <production-url>
   pnpm dlx vercel@latest logs <production-url> --level error --since 1h
   ```

`.vercel/` 保存本机项目关联，已经被 Git 忽略。不要提交 `.env.local`、Vercel Token 或任何 AI 密钥。

若通过本机 CLI 直接创建生产部署而非 Git 集成发布，请把当前提交短 SHA 作为仅该部署使用的运行变量传入，例如 `--env SPEAKMATE_RELEASE_SHA=<commit>`，使健康接口仍能准确报告发布来源。

## 4. 可选的真实 AI 配置

当前生产发布不需要以下变量。需要真实 ASR/LLM 时，在 Vercel 项目设置中只为所需环境添加：

```text
AI_MODE=auto
AI_SHARED_RATE_LIMIT_READY=true
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ASR_MODEL=@cf/openai/whisper
CLOUDFLARE_LLM_MODEL=@cf/zai-org/glm-4.7-flash
```

- Token 仅用于服务端，不可添加 `NEXT_PUBLIC_` 前缀。
- 模型必须位于服务端白名单中。
- 在设置 `AI_SHARED_RATE_LIMIT_READY=true` 之前，必须先用平台防火墙或共享存储实现跨实例、按用户/IP 的额度限制，并完成并发与故障测试；该变量只是运维确认闸门，不会自行创建限流。
- 先在 Preview 环境验证，再复制到 Production 并重新部署。
- 若希望保持严格零费用，继续留空即可；健康接口会显示 `local` 模式。

Supabase 适配器属于后续同步脚手架，当前正式版必须保持 `NEXT_PUBLIC_SYNC_ENABLED=false`。只有数据表、读取/合并、删除和端到端验收全部完成后，才可同时配置公共项目 URL、anon key 并显式开启该开关。

## 5. iPhone 安装与使用

1. 在 iPhone 上用 Safari 打开生产 HTTPS 地址；不要使用微信内置浏览器完成安装。
2. 点 Safari 底部的“分享”按钮。
3. 在操作列表中选择“添加到主屏幕”，确认名称为 SpeakMate 后点“添加”。
4. 从主屏幕打开 SpeakMate。独立窗口启动即表示 PWA 安装成功。
5. 第一次点麦克风时选择“允许”。如曾拒绝：进入 iPhone“设置 → App → Safari → 麦克风”，或 Safari 地址栏的网站设置中重新允许。
6. 网络异常时仍可浏览已缓存的公开场景，并通过不含用户标识的通用离线壳恢复本机会话；AI/ASR 和未缓存资源仍需要网络。不要关闭或清理 Safari 网站数据，否则游客档案和本机历史会被移除。

## 6. 中国大陆访问说明

Vercel 官方说明指出，未使用其中国合作网络的部署在中国大陆可能出现延迟、丢包或间歇性不可达；`*.vercel.app` 也不能作为大陆长期稳定性的承诺。当前路线适合快速内测和验证，不等同于大陆生产 SLA。

正式面向大陆规模化发布前应：

- 绑定自有域名并从多个大陆省份和运营商持续监测首屏、API 和音频链路。
- 准备完成 ICP 备案的大陆云托管备选；若访问质量不达标，将 Next.js 容器/API 迁移到国内云并使用国内 CDN。
- 保持浏览器端 IndexedDB 与本地陪练可独立工作，降低云端波动对核心练习的影响。

参考：[Vercel 官方：中国大陆访问说明](https://vercel.com/kb/guide/accessing-vercel-hosted-sites-from-mainland-china)。

## 7. 发布验收清单

- `/api/v1/health` 返回 200，并明确当前 AI 模式。
- `/manifest.webmanifest`、`/sw.js` 返回 200；生产地址为 HTTPS。
- iPhone Safari 可显示“添加到主屏幕”步骤，独立模式可启动。
- 游客首次引导、场景筛选、首轮文字/语音输入、反馈、刷新恢复和报告可用。
- 麦克风拒绝、WebKit 无 MediaRecorder 和 AI 请求失败均进入可恢复的键盘/本地反馈路径。
- 生产环境没有意外的 Cloudflare、Supabase 或其他付费资源。
- Vercel 最近一小时错误日志无新增应用错误。

## 8. 2026-09-03 生产发布记录

- 生产 URL：<https://speakmate-pwa.vercel.app>
- 当前 Vercel 部署 ID：`dpl_AUENsa2CW3fP76zjdS65QxNUcvuM`
- 账户：个人 Hobby；环境变量列表为空，未启用付费云资源。
- 状态：`READY`；Node.js 固定为 22.x，Next.js 函数部署到 `sin1`。
- 远端健康检查：200，`version: 2.0.0`，`aiMode: local`。
- 远端资源检查：首页、欢迎页、场景库、动态会话页、manifest、Service Worker、能力接口均返回 200。
- 远端对话检查：`POST /api/v1/turns` 返回 200，并由 `local` provider 生成下一轮回复。
- 错误日志：发布后一小时内未发现 error 级别日志。

当前中国大陆网络的浏览器自动化无法直接完成线上 UI 复测：系统 DNS 将 `*.vercel.app` 解析到非 Vercel 地址，Chromium/WebKit 均在导航阶段超时；同一部署经独立 HTTPS 客户端及 Vercel 部署状态检查正常。这是域名网络可达性限制，不是页面或 API 执行失败。上线前仍需用实际 iPhone 的 Wi-Fi 和蜂窝网络分别测试；若不稳定，下一步是绑定用户自有域名，或采用完成 ICP 备案的大陆镜像。

## 9. 2026-09-05 生产发布记录

- 公共生产 URL：<https://speakmate-pwa.vercel.app>
- Vercel 部署 ID：`dpl_FwV45ugpo992BTjuktFUUq6ZTsG8`
- 代码提交：`c44cabc`；健康接口通过该次部署专用的 `SPEAKMATE_RELEASE_SHA` 返回同一短 SHA。
- 状态：`READY`；目标为 Production；Node.js 22.x；Next.js 16.3.4；Serverless Functions 区域为 `sin1`。
- 远端健康检查：200，`version: 2.1.1`、`aiMode: local`、`buildSha: c44cabc`。
- 远端能力检查：云 ASR、云对话和邮箱同步均为 `false`；没有启用可能产生费用的云能力。
- 远端资源检查：首页、欢迎页、场景库、动态会话页、固定离线会话壳、Manifest 与 Service Worker 均返回 200；Worker 版本为 `speakmate-shell-v2.1.1`。
- 远端安全检查：CSP 和 `Permissions-Policy` 存在；同源文字对话返回 200 和 `local` provider，跨站提交返回 403。
- 私有缓存检查：`/session/:id` 使用 `cacheResponse=false`，活动会话 ID 不写入 CacheStorage；本地 Chromium 实测可从固定壳恢复 IndexedDB 会话。
- 自动化验证：92 项单元/组件测试通过；Playwright 24 项通过、4 项按浏览器能力跳过；发布后 error 级别日志为空。

本记录只证明自动化 iPhone WebKit 路径和公开 HTTPS 端点通过，不声称已经在用户的实体 iPhone 上完成验收。中国大陆访问质量仍取决于实际网络，必须按第 5、6 节用 Wi-Fi 与蜂窝网络各测试一次。
