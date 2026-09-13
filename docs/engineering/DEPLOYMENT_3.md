# SpeakMate 3.0 部署与应急手册

更新：2026-09-13。适用于本仓库的严格本地版；[旧部署手册](../DEPLOYMENT.md)仅作 2.x 历史。**归档上传与应用发布是两件事，本次归档不推广生产域名。**

## 1. 费用与权限前提

- 继续使用现有 `speakmate-pwa` Vercel 项目和原账号，不创建第二个项目，不开通数据库、模型、存储、Analytics、定时任务或付费套餐。
- 当前记录为 Hobby。Hobby 有额度且限制个人非商业用途；未来收费或商业运营必须重新评估条款与费用，不能将“零费用”承诺扩展成无限量商业托管。[Vercel Hobby 官方说明](https://vercel.com/docs/plans/hobby)
- 发布者必须有目标项目权限，GitHub 账号与 Vercel 账号分别认证。凭据不写进源码、文档或 Git URL，不向协作者发送明文 Token。
- 首先核对 [实际部署记录](../releases/3.0.0-deployment-2026-09-13.md)。READY 只说明平台构建就绪，不代表正式网址、iPhone 和大陆网络都通过。

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

## 3. 发布前本地检查

1. 使用干净的已审查源码及锁文件；运行[测试与构建检查](TESTING.md)。有失败如实记录，不只挑成功片段。
2. 确认 `.vercelignore` 排除文档、QA、历史档案、环境文件和依赖缓存，同时包含 `scripts/offline-manifest.mjs`、实际源码及图片。
3. 验证本次上传清单与 TypeScript 依赖闭包，不把 GitHub 整体归档 ZIP 上传作部署输入。
4. 先准备普通构建及可读当前 schema 2/12 表的应急构建；不要通过清空数据验证回退。

## 4. 建立候选，不抢占正式网址

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

保留 CLI 实际返回的候选 URL/ID、构建日志、SHA、构建 ID。受保护的候选可能需要部署账号登录；SSO 的 302 不是应用健康成功。这里使用 staged production；普通 Preview 的推广可能重新构建，不能一概声称 promote 永不构建。[Vercel 推广机制](https://vercel.com/docs/deployments/promoting-a-deployment)

## 5. 候选验收与推广

1. 用 Chrome/Safari 实际打开候选。只读检查 `/api/v1/health`：版本 3.0.0、mode `local-learning`、aiMode `local`、SHA 与发布来源一致。
2. 取得在线 `/offline-build.js`，逐项检查公共壳、语料与静态资源字节/哈希；不得用本地或旧云构建清单代替。
3. 检查 manifest、图标、工作线程更新、安全头及主要页面。使用隔离测试环境，不在正式域名写入合成学习记录。
4. 验证应急候选只读模式及 schema 兼容；保留相同域名恢复的操作方案。
5. 经发布负责人确认后，在 Vercel 控制台选中该 **staged production** 部署，执行 Promote；核对将关联的域名确实为 `speakmate-pwa.vercel.app`。
6. 再次读取正式域名健康信息、构建 SHA 与资源，记录推广时间和部署 ID。CLI 的团队 alias 提示不等于精确正式域名已切换。

本次归档时第 5 步未执行。不要因为用户能打开某个候选就自动跳过上述门槛。大陆网络可用性与实体手机清单仍分别记录。

## 6. 只读应急构建

构建时设置 `NEXT_PUBLIC_RECOVERY_ONLY=true`，部署级输出目录设置 `.next-recovery`。不要修改普通版项目的全局输出目录来迁就应急版。此前恢复候选曾因平台默认查找 `.next/routes-manifest.json` 失败；部署级纠正后 READY，源码无需改动。

应急入口 `/recovery` 只读已存在 v2 数据库，提供完整导出，不允许练习、导入、编辑、兑换、创建或降级数据库。独立候选域名不能读取正式域名的学习记录。真正应急时需要同源接管并处理旧工作线程与仍打开的窗口，具体步骤见[恢复设计](../design/3.0-recovery-build.md)。

禁止用清库、删除 PWA 或直接把旧 2.3 指向已升级设备作为数据恢复办法。保留旧部署只表示有代码回退点，不证明数据库兼容。

## 7. GitHub 与 Vercel 的连接

本次只归档上传，不添加自动部署 Workflow，也不自动连接 Git 集成。将来连接现有项目时，先核对生产分支、自动域名分配、环境变量和免费额度；一次代码 push 可能触发构建/发布，应在负责人明确同意后启用。[Vercel Git 集成](https://vercel.com/docs/git)

不要把 `out/` 或源码压缩包上传 GitHub Pages 代替当前架构，现有项目依赖 Next.js 路由和构建流程；若要纯静态托管需另行适配、测试和批准。
