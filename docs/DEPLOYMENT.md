# SpeakMate 发布与 iPhone 使用手册

## 1. 当前发布策略

- 首发形态：Next.js 移动端 PWA。
- 托管：Vercel Hobby 个人空间；不绑定数据库、付费模型、Blob、队列、Cron 或付费 Marketplace 资源。
- 地区：中国大陆用户优先使用新加坡 `sin1` Serverless 区域；静态资源仍由 Vercel 全球边缘网络提供。
- 默认能力：42 个场景、游客本地档案、本地对话反馈、历史记录、学习报告、数据导出与清空均可零配置运行。
- 可选能力：Cloudflare Workers AI 和 Supabase 只有在明确配置环境变量后才启用；任何云端错误都会回退到本地陪练。

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

## 4. 可选的真实 AI 配置

当前生产发布不需要以下变量。需要真实 ASR/LLM 时，在 Vercel 项目设置中只为所需环境添加：

```text
AI_MODE=auto
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ASR_MODEL=@cf/openai/whisper
CLOUDFLARE_LLM_MODEL=@cf/zai-org/glm-4.7-flash
```

- Token 仅用于服务端，不可添加 `NEXT_PUBLIC_` 前缀。
- 模型必须位于服务端白名单中。
- 先在 Preview 环境验证，再复制到 Production 并重新部署。
- 若希望保持严格零费用，继续留空即可；健康接口会显示 `local` 模式。

可选 Supabase 同步只需要公开项目 URL 和 anon key，但它会引入外部服务依赖。MVP 正式版保持游客优先，不配置也不会影响练习。

## 5. iPhone 安装与使用

1. 在 iPhone 上用 Safari 打开生产 HTTPS 地址；不要使用微信内置浏览器完成安装。
2. 点 Safari 底部的“分享”按钮。
3. 在操作列表中选择“添加到主屏幕”，确认名称为 SpeakMate 后点“添加”。
4. 从主屏幕打开 SpeakMate。独立窗口启动即表示 PWA 安装成功。
5. 第一次点麦克风时选择“允许”。如曾拒绝：进入 iPhone“设置 → App → Safari → 麦克风”，或 Safari 地址栏的网站设置中重新允许。
6. 网络异常时仍可浏览已缓存的公开场景和使用本地陪练；不要关闭或清理 Safari 网站数据，否则游客档案和本机历史会被移除。

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
