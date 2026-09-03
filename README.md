# SpeakMate / 口语搭子

面向 A1–C1 学习者的移动端英语口语 PWA。用户无需注册即可使用 42 个分级场景，完成“场景准备 → 语音或文字对话 → 单轮反馈 → 场景复盘”的完整闭环。

## 本地运行

要求 Node.js 22+ 和 pnpm 11。

```bash
pnpm install
pnpm dev
```

浏览器访问 `http://localhost:3000`。应用默认使用确定性的本地陪练，不需要云账号或付费资源。

## 可选配置

复制 `.env.example` 为 `.env.local`，按需填写：

- `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_API_TOKEN`：启用 Cloudflare Workers AI 的英文 ASR 与结构化对话；缺失、超时或失败时自动回退本地陪练。
- `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`：启用可选的邮箱同步登录；游客本机数据仍是默认体验。

模型名称经过服务端白名单约束，密钥不得使用 `NEXT_PUBLIC_` 前缀，也不得提交到 Git。

## 验证

```bash
pnpm verify
pnpm test:e2e
```

产品规格见 [APP_SPEC.md](./APP_SPEC.md)，设计验收见 [design-qa.md](./design-qa.md)，发布与 iPhone 安装步骤见 [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)。
