# SpeakMate / 口语搭子

面向 A1–C1 学习者的移动端英语口语 PWA。用户无需注册即可使用 42 个分级场景，完成“场景准备 → 语音或文字对话 → 单轮反馈 → 场景复盘”的完整闭环。

当前发布候选版本为 **2.2.0**。本版本统一了手机端导航与返回行为，让场景筛选可由 URL 恢复，并用互斥的语音/文字确认 Dock 保证输入和提交操作不被固定层或移动键盘遮挡。

## 本地运行

要求 Node.js 22+ 和 pnpm 11。

```bash
pnpm install
pnpm dev
```

浏览器访问 `http://localhost:3000`。应用默认使用确定性的本地陪练，不需要云账号或付费资源。

## 移动端交互约定

- 一级目的地固定为“练习”`/practice`、“场景”`/scenes` 和“我的”`/me`；次级页面共用顶部返回栏，直接打开深链时仍有确定的安全返回目标。
- 前进导航会聚焦并播报新页面标题；历史返回保留场景列表的筛选 URL 与滚动位置。存在录音、草稿或提交中任务时，离开练习会先确认。
- 场景筛选以 URL 为公开状态，例如 `/scenes?category=social&level=B1&duration=5`，可刷新、分享并从详情页返回恢复。
- 对话页同一时刻只显示一个底部操作区：语音模式使用 Speech Dock，确认转写时以 Text Review Dock 替换，处理中禁用重复提交。
- `/install` 始终提供 iPhone 与 Android 两套手动安装说明；iPhone 使用 Safari“分享 → 添加到主屏幕”，Android 使用浏览器菜单“安装应用/添加到主屏幕”。

## 可选配置

复制 `.env.example` 为 `.env.local`，按需填写：

- `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_API_TOKEN`：启用 Cloudflare Workers AI 的英文 ASR 与结构化对话；缺失、超时或失败时自动回退本地陪练。
- `NEXT_PUBLIC_SYNC_ENABLED=true` 与 Supabase 公共配置：仅供后续完成跨设备数据闭环后显式开放；当前正式版保持关闭，游客本机数据是唯一承诺的体验。

模型名称经过服务端白名单约束，密钥不得使用 `NEXT_PUBLIC_` 前缀，也不得提交到 Git。

## 验证

```bash
pnpm verify
pnpm test:e2e
```

2.2.0 发布候选的最新本地基线：37 个 Vitest 文件、194 项测试全部通过；Playwright 在 Chromium Mobile 与 WebKit iPhone 共运行 96 项，其中 91 项通过、5 项按浏览器能力有明确原因地跳过。跳过项仅限 Chromium 不执行 iPhone 安装文案、WebKit 自动化不提供 Safari Full Keyboard Access、Chromium 专用 MediaRecorder 模拟，以及两项 Chromium 专属 Service Worker 离线验证。

自动化不能代替实体设备：发布前仍需在真实 iPhone Safari/主屏 PWA 与 Android Chrome/已安装 PWA 上复测安全区、动态浏览器工具栏、系统键盘、麦克风权限、录音中断和主屏安装。

产品规格见 [APP_SPEC.md](./APP_SPEC.md)，设计验收见 [design-qa.md](./design-qa.md)，发布与 iPhone/Android 安装步骤见 [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)。
