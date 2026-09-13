# SpeakMate / 口语搭子

**随时开口，练真实英语。把“会做题”练成“能开口”——随时随地自在说英语！**

面向 A1–C1 学习者的移动端英语口语 PWA。无需微信登录或原生安装包；学习在设备本地进行。3.0 将目标、场景对话、记录簿、复习和数字奖励连接成一套学习流程。

- 新版 3.0：[SpeakMate 新版](https://speakmate-v3.vercel.app/)
- 旧版 2.3：[SpeakMate 旧版（保留，不覆盖）](https://speakmate-pwa.vercel.app/)
- 目标仓库：[Royal44-k/SpeakMate](https://github.com/Royal44-k/SpeakMate)
- 阅读入口：[文档中心](docs/README.md) · [使用教程](docs/guides/USER_GUIDE.md) · [iPhone 安装](docs/guides/3.0-iphone-setup-and-checks.md) · [开发规格](APP_SPEC.md)

## 版本与实际状态

本交付对应 **3.0.0**。应用源码基准 `c2af548`，后续 `9b61835` 为审查状态文档；本次归档只补充文档、资产和交付工具，不改动应用逻辑。

2026-09-13，新版已在 **`speakmate-v3.vercel.app` 独立上线**，旧版 **`speakmate-pwa.vercel.app` 保持 2.3.0，不覆盖、不重定向**。两个入口的匿名首页及健康接口均返回 HTTP 200；新版线上 16 个页面壳、70 个静态资源、7 类语料包共 93 项与其构建清单的大小和 SHA256 全部一致。详见[独立网址发布记录](docs/releases/3.0.0-independent-url-2026-09-13.md)；历史构建与测试范围见[候选记录](docs/releases/3.0.0-deployment-2026-09-13.md)及[验证记录](docs/releases/3.0.0-verification.md)。这不是实体 iPhone 或中国大陆所有网络已通过的结论。

**新旧网址的本地记录不自动共享。** 有旧数据时先在旧版导出备份，再到新版“我的”中预览、确认恢复；不要删除旧入口或清空旧数据。iPhone 请从新版网址另行添加主屏幕入口，可命名为“SpeakMate 3.0”。详见[迁移与备份](docs/guides/3.0-local-data-and-backup.md)。

## 能做什么

| 导航 | 功能 |
| --- | --- |
| 目标 | 欢迎指导、5/10/15 分钟计划、每日任务、打卡、积分与数字奖励 |
| 练习 | 开启新对话、继续已有对话、录音回听与文字确认、反馈与复盘 |
| 场景 | 七类 42 个场景、A1–C1 分层、搜索/清除、短练/标准/拓展 |
| 记录簿 | 保存词句与来源、本地覆盖解析、备注、复习、自我回忆与模拟练习 |
| 我的 | 学习统计、历史、示例好友榜、设置、备份与恢复 |

已收录表达由校审资料和规则解释，不是可以理解任意输入的云端生成式 AI。参考句不等于唯一正确答案，匹配结果不是发音或英语能力评分。

## 第一次使用

1. 打开网址，在“目标”选择等级、兴趣和每日时长。
2. 点击任务卡，或在“场景”选择情境；先看背景和角色，再开始练习。
3. 尝试回答，需要时展开参考表达。录音不支持本地转写时，回听后用文字确认。
4. 用“记录”按钮或原生选区保存词句。完成练习后确认结束，再查看报告。
5. 到“记录簿”复习；到“我的”导出本地备份并确认文件已保存。

没有资料缓存时需先联网；完成离线准备后再断网尝试。手机使用不依赖电脑开机或 MySQL。

## 本地开发

要求 Node.js **22.x**、pnpm **11.19.0**。首次安装依赖需要网络；无需服务密钥或数据库。

```bash
git clone https://github.com/Royal44-k/SpeakMate.git
cd SpeakMate
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm dev
```

访问 `http://localhost:3000`。也可解压交付源码包，在解压根目录执行版本检查及安装命令；归档包保留其对应提交时点，不会随 GitHub 后续更新自动变化。

```bash
# 生产构建（包括离线清单生成）
pnpm build
pnpm start

# 本地检查；结果以本次命令真实输出为准
pnpm verify
pnpm test:e2e
```

详见[开发手册](docs/engineering/DEVELOPMENT.md)、[测试手册](docs/engineering/TESTING.md)与[3.0 部署手册](docs/engineering/DEPLOYMENT_3.md)。历史测试记录不等于在你的新电脑上已通过；浏览器模拟也不代替实体 iPhone。

## 严格本地与费用边界

- 不启用 MySQL、云数据库、云模型、微信登录、订阅支付或同步；未来适配器保持关闭，不能靠填写旧密钥开启本版云功能。
- 练习正文、录音、笔记和积分不上传；托管平台仍会收到页面及公共资料请求的常规网络元数据。
- 原始录音仅当前练习临时使用，不进入长期备份。没有确认的本地英语音色时，不暗中切到远程朗读。
- 本地记录可能因清除数据或系统回收丢失。设备之间不自动同步，备份含私人内容，**不要把个人备份提交到 GitHub**。
- 积分用于自我激励；数字奖励不是实物，好友榜持续标注示例。未来真实后台不能直接信任本地余额。
- 新旧入口共用现有免费 Vercel 项目，但分别绑定不同部署；没有新增项目、付费服务或自动部署。后续发布只更新新版域名，禁止整体 Promote 或不带 `--skip-domain` 的生产发布覆盖旧入口。免费托管有适用范围与额度，详见部署手册；不承诺中国大陆所有网络均可达。

## 项目结构

```text
src/app/                 页面、固定离线路由及公共内容接口
src/features/            目标、练习、场景、记录簿、个人中心
src/domain/              对话、任务、积分和学习数据规则
src/infrastructure/      IndexedDB、备份、语音、本地能力闸门
src/content/             分级语料、解析资料与审校记录
src/components/          移动端外壳与通用界面
public/                  图标、场景图片、Service Worker
design-system/           视觉规范
docs/                    产品、设计、教程、架构、历史和发布证据
tests/、src/**/*.test.*   自动化与合成数据夹具
outputs/qa/              分版本、分构建的测试证据（含历史失败）
scripts/                 构建清单与界面取证工具
```

## 从初版到现在

[演进年表](docs/history/EVOLUTION.md)涵盖微信小程序设想、PWA 首版、2.x 手机体验修复以及 3.0 本地学习闭环。保留原 214 次提交历史；初始微信方案仅作为历史设想存档，不伪称已交付 Taro/NestJS 小程序或原生 iOS 客户端。

[资产清单](docs/archive/ASSET_INVENTORY.md)说明包含什么、排除什么、如何校验归档。[GitHub 交接](docs/archive/GITHUB_HANDOFF.md)说明完整历史的上传与恢复。Figma 留存的是空白文件链接和交接规范，并非已完成的全套设计文件。

## 安全与维护

请阅读 [SECURITY.md](SECURITY.md)、[贡献说明](CONTRIBUTING.md)及[素材与许可说明](NOTICE.md)。没有擅自选择 MIT 等开源许可证；代码和第三方依赖、字体、图像的权利边界应分别确认。
