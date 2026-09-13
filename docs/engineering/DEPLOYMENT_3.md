# SpeakMate 3.0 部署与应急手册

更新：2026-09-13。适用于本仓库的严格本地版；[旧部署手册](../DEPLOYMENT.md)仅作 2.x 历史。**新版独立上线，不覆盖旧版网址。此规则替代此前“推广至原网址”的计划。**

| 入口 | 用途 | 本次部署 |
| --- | --- | --- |
| [speakmate-v3.vercel.app](https://speakmate-v3.vercel.app/) | 新版 3.0，后续更新只操作此域名 | `dpl_8R4ZRiUuh8BGk2GZBUR5dAREW4rx` |
| [speakmate-pwa.vercel.app](https://speakmate-pwa.vercel.app/) | 旧版 2.3，保留，不覆盖、不重定向 | `dpl_EUHHJUXwxLJw7FjFjntkrf2ZE1Fh` |

两个域名在同一现有项目中分别指向不同部署，不是两个项目。新旧站 IndexedDB 按来源隔离；不得用切换域名声称用户数据已迁移。

## 1. 费用与权限前提

- 继续使用现有 `speakmate-pwa` Vercel 项目和原账号，不创建第二个项目，不开通数据库、模型、存储、Analytics、定时任务或付费套餐。
- 当前记录为 Hobby。Hobby 有额度且限制个人非商业用途；未来收费或商业运营必须重新评估条款与费用，不能将“零费用”承诺扩展成无限量商业托管。[Vercel Hobby 官方说明](https://vercel.com/docs/plans/hobby)
- 发布者必须有目标项目权限，GitHub 账号与 Vercel 账号分别认证。凭据不写进源码、文档或 Git URL，不向协作者发送明文 Token。
- 首先核对 [最新独立网址发布记录](../releases/3.0.0-independent-url-2026-09-13.md)。READY 只说明平台构建就绪，不代表匿名访问、iPhone 和大陆网络都通过。

## 2. 构建配置

| 配置 | 普通版 | 只读应急版 |
| --- | --- | --- |
| Framework | Next.js | Next.js |
| Node | 22.x | 22.x |
| Package manager | pnpm 11.19.0 | pnpm 11.19.0 |
| Install | `pnpm install --frozen-lockfile` | 同左 |
| Build | `pnpm build` | 同左 |
| Output Directory | Next 默认 `.next` | 部署级 `.next-recovery` |
| `AI_MODE` | `local` | `local` |
| `NEXT_PUBLIC_SYNC_ENABLED` | `false` | `false` |
| `NEXT_PUBLIC_RECOVERY_ONLY` | `false` | `true` |
| `SPEAKMATE_RELEASE_SHA` | 实际源码提交 SHA | 实际源码提交 SHA |

带 `NEXT_PUBLIC_` 的值必须在构建期正确设置，运行期改值不能替代重新构建。删掉历史云服务配置需求，不填入 Cloudflare、Supabase 等密钥。本版安全闸门固定关闭远端学习能力。

仓库 `package.json` 的 `engines.node` 为 `22.x`；本次普通/应急候选的实际部署配置也为 `22.x`。项目全局 Node 设置仍为 `24.x`，本次未改动；后续必须检查实际部署配置与构建日志，不能把项目默认值当成这份候选的运行证据。不要为文档更新重建未变应用。

## 3. 发布前本地检查

1. 使用干净的已审查源码及锁文件；运行[测试与构建检查](TESTING.md)。有失败如实记录，不只挑成功片段。
2. 确认 `.vercelignore` 排除文档、QA、历史档案、环境文件和依赖缓存，同时包含 `scripts/offline-manifest.mjs`、实际源码及图片。
3. 验证本次上传清单与 TypeScript 依赖闭包，不把 GitHub 整体归档 ZIP 上传作部署输入。
4. 先准备普通构建及可读当前 schema 2/12 表的应急构建；不要通过清空数据验证回退。

## 4. 建立候选，不自动接管任何生产域名

使用已有安装的 Vercel CLI，先查看 `vercel --version` 及 `vercel deploy --help`，记录版本。未安装时再按官方文档安装并固定本次核对的版本；本手册不要求自动下载安装最新版本。

在仓库根目录执行：

```powershell
vercel login
vercel whoami
vercel link --project speakmate-pwa
```

关联时选择**现有正确账号/团队和项目**；如果提示新建项目或升级套餐，先退出。`.vercel/` 只留在本机，不纳入 Git。核对根目录是 Next 项目根目录，不是外层归档目录。

显式设置构建和运行值，再创建不自动分配生产域名的候选：

```powershell
$releaseSha = git rev-parse HEAD
vercel deploy --prod --skip-domain --build-env AI_MODE=local --env AI_MODE=local --build-env NEXT_PUBLIC_SYNC_ENABLED=false --env NEXT_PUBLIC_SYNC_ENABLED=false --build-env NEXT_PUBLIC_RECOVERY_ONLY=false --env NEXT_PUBLIC_RECOVERY_ONLY=false --build-env SPEAKMATE_RELEASE_SHA=$releaseSha --env SPEAKMATE_RELEASE_SHA=$releaseSha
```

保留 CLI 实际返回的候选 URL/ID、构建日志、SHA、构建 ID。受保护的候选可能需要部署账号登录；SSO 的 302 不是应用健康成功。此命令建立 staged production，但**本项目不得再执行整体 Promote、普通 `vercel --prod` 或项目级 Rollback**，因为自动域名分配可能同时改动旧入口。若当前 CLI 不支持 `--skip-domain`，停止操作并核对官方版本说明，不能删掉该参数继续。

## 5. 只将新版域名绑定到已核对候选

1. 发布前记录两个精确域名的部署 ID 和健康响应；旧域名必须仍为上表的 2.3 部署，发现不同先停止。核对新候选来源、READY 状态及已完成的测试，不仅看团队默认 alias。
2. 新域名必须存在于项目 **Settings → Domains** 中，且没有重定向。2026-09-13 已登记并验证，不需每次重加。首次设置可用 `vercel domains add speakmate-v3.vercel.app speakmate-pwa`；不要使用 `--force` 抢占其他项目的域名，不购买域名或套餐。[Vercel 项目域名](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
3. 仅绑定新版域名。下面命令对应本次已验证构建；未来将左侧候选 URL 替换为真实审查后的新部署，右侧始终为新版域名：

```powershell
vercel alias set speakmate-cffj1r5ry-lirongouyang522-3492s-projects.vercel.app speakmate-v3.vercel.app
```

4. 不带账户凭据、共享访问 Token 或 cookies，检查新旧入口首页及 `/api/v1/health`。新版应返回 3.0.0、`mode: local-learning`、`aiMode: local` 和正确 SHA，旧版仍 2.3.0。精确域名的部署 ID 也要再次核对；命令成功不等于匿名可访问。
5. 从**新版独立域名**取得 `/offline-build.js`，检查清单内页面、语料、资源大小及 SHA256，另检 manifest、图标和工作线程。不要拿本地或历史构建清单替代。只读检查脚本见下文；实际浏览器更新、主要交互与安全头按发布风险另行检查，不在正式站写入合成学习记录。
6. 记录时间、来源、部署映射、资源结果及失败；若需要撤销新版发布，只将 `speakmate-v3.vercel.app` 指回已验证、数据兼容的上一份 3.x/只读部署，仍不得改旧域名。应急方案须满足第 6 节的同源、schema 与工作线程门槛。

本次先添加 alias 时匿名访问出现 SSO 302；查明新 alias 尚未登记为项目域名后补齐登记，再次绑定即返回 200。原访问保护 `all_except_custom_domains` 保持不变，生成的候选 URL 仍可能需要部署账号登录。以后遇到同类问题先核对域名登记和候选映射，**不要关闭整个项目的 Deployment Protection，也不要把共享访问凭据贴进文档**。[手动 alias](https://vercel.com/docs/cli/alias)、[部署保护](https://vercel.com/docs/deployment-protection)

本次只读核验可在 PowerShell 7 中复现：

```powershell
./docs/releases/tools/verify-independent-urls.ps1 -ReportPath ./release-http-check.json
```

脚本固定本次 3.0/2.3 SHA 和构建 ID，适用于复核此发布快照；以后发布需要审查后更新预期值并另存报告，不覆盖历史证据。结果是 HTTP 资源核验，不是 PWA 安装或实体 iPhone 测试。

## 6. 只读应急构建

构建时设置 `NEXT_PUBLIC_RECOVERY_ONLY=true`，部署级输出目录设置 `.next-recovery`。不要修改普通版项目的全局输出目录来迁就应急版。此前恢复候选曾因平台默认查找 `.next/routes-manifest.json` 失败；部署级纠正后 READY，源码无需改动。

应急入口 `/recovery` 只读已存在 v2 数据库，提供完整导出，不允许练习、导入、编辑、兑换、创建或降级数据库。独立候选域名不能读取新版 `speakmate-v3.vercel.app` 的学习记录，旧 2.3 网址也不是新版恢复入口。真正应急时需在**发生故障的新版同源域名**接管，并处理旧工作线程与仍打开的窗口；不得为此覆盖旧版 2.3 域名。具体步骤见[恢复设计](../design/3.0-recovery-build.md)。只读应急候选的远端 HTTP 验收尚未完成，不因本次普通版资源通过而扩大为应急方案全项通过。

禁止用清库、删除 PWA 或直接把旧 2.3 指向已升级设备作为数据恢复办法。保留旧部署只表示有代码回退点，不证明数据库兼容。

## 7. GitHub 与 Vercel 的连接

2026-09-13 实际检查现有项目未连接 Git 集成；本次只补充文档和发布证据，不添加自动部署 Workflow。将来连接项目时，必须先制定不会接管旧域名的发布隔离方案，再核对生产分支、自动域名分配、环境变量和免费额度；一次 push 可能触发构建/发布，应在负责人明确同意后启用。当前“同项目两域名”是人工绑定策略，不是自动部署的隔离保证。[Vercel Git 集成](https://vercel.com/docs/git)

不要把 `out/` 或源码压缩包上传 GitHub Pages 代替当前架构，现有项目依赖 Next.js 路由和构建流程；若要纯静态托管需另行适配、测试和批准。
