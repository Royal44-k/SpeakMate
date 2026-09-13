# 本地开发与维护手册

## 环境

Node.js 22.x、pnpm 11.19.0、Git。首次安装依赖需要网络；不需要 MySQL、Docker、微信开发者工具、Xcode、Vercel Token 或云模型密钥。使用 Windows/macOS/Linux 均应按实际结果验证，不以此文宣称每种平台已测。

```bash
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm dev
```

若没有所需 pnpm，可在已安装 Node 的环境自行安装指定版本：`npm install -g pnpm@11.19.0`。这会修改本机全局工具，不是项目运行必需的额外云服务。版本不一致先调整，不通过删锁文件绕过。

浏览器打开 `http://localhost:3000`。不用创建 `.env.local` 即可运行本地学习。需要显式配置时参考根目录 `.env.example`；不要复制历史文档的云服务密钥。

## 生产形态预览

开发服务器不能代表 Service Worker 的实际生产缓存。测试前另选本机测试端口，避免访问日常学习入口：

```bash
pnpm build
pnpm exec next start -p 3100
```

`pnpm build` 包括 `next build && node scripts/offline-manifest.mjs`。不要只执行前半段，也不要复用另一个构建的 `public/offline-build.js`。构建失败则保留日志并修复，不能把缓存生成成功当作完整构建通过。

## 开发工作流

1. 先读 `AGENTS.md`、当前规格和对应设计契约；改 Next.js 代码前阅读所安装版本随包文档。
2. 新功能或修复先建立对应失败测试，独立分支实施，不改动用户真实 IndexedDB 记录。
3. 修改数据结构时同步类型、Zod 校验、迁移、事务、旧备份和应急恢复测试。
4. 修改语料时同步版本、来源依据、问题/答案对应关系及语言审校记录；测试数量不能替代语言质量。
5. 执行 lint、类型、相关测试与生产构建；涉及导航/缓存/布局再运行本地浏览器回归。
6. 更新规格、交互取舍和带源码 SHA 的验证记录后再申请发布。不要让 Git 推送自动代替发布验收。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 开发服务器 |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript 检查 |
| `pnpm test` | Vitest 单元/组件/数据测试 |
| `pnpm test:watch` | 本地测试观察模式 |
| `pnpm build` | 正式构建与离线清单 |
| `pnpm start` | 启动已构建应用 |
| `pnpm verify` | lint → typecheck → test → build |
| `pnpm test:e2e` | 使用 Playwright 配置运行端到端测试 |

Windows Playwright 的 `chromium-mobile` 当前选择已安装 Edge 通道，`webkit-iphone` 是桌面 WebKit 模拟。它们不等于“Google Chrome 真机”或“实体 iPhone Safari”；需要 Chrome 专项时单独记录配置与结果，不能偷偷替换证据名称。

## 不应提交

`.env*`（安全示例除外）、`.vercel`、CLI auth 配置、`node_modules`、`.next`、`.next-recovery`、个人学习备份、录音、浏览器 profile、Playwright trace、体积大的运行产物。历史 Git 中只保留了三个明确的工程报告/核验脚本，不包含整个任务运行目录。公共 QA 使用隔离合成数据，并需专门审查后显式纳入版本控制。

素材许可参见 [NOTICE](../../NOTICE.md)。安全问题不要把秘密写进公开 Issue；仓库当前未提供自动化密钥托管或付费服务初始化流程。
