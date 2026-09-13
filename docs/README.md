# SpeakMate 文档中心

更新：2026-09-13。当前功能以 3.0 源码和开发规格为准；历史文档中的“当前”“待执行”只代表当时，不覆盖新版发布记录。

当前入口：[新版 3.0](https://speakmate-v3.vercel.app/) · [旧版 2.3（保留）](https://speakmate-pwa.vercel.app/)。新版独立发布，不覆盖旧网址；本地记录不自动共享。域名与验证依据见[独立网址发布记录](releases/3.0.0-independent-url-2026-09-13.md)。

## 按阅读目的进入

| 想做什么 | 从这里开始 |
| --- | --- |
| 使用 App | [用户教程](guides/USER_GUIDE.md)、[iPhone 安装](guides/3.0-iphone-setup-and-checks.md) |
| 理解规则与限制 | [本地学习助手](guides/3.0-local-practice-assistant.md)、[数据与备份](guides/3.0-local-data-and-backup.md) |
| 接手产品与开发 | [完整规格](../APP_SPEC.md)、[架构与数据](engineering/ARCHITECTURE.md)、[开发手册](engineering/DEVELOPMENT.md) |
| 测试、上线、应急 | [测试](engineering/TESTING.md)、[3.0 部署](engineering/DEPLOYMENT_3.md)、[只读恢复设计](design/3.0-recovery-build.md) |
| 看已完成与未验证事项 | [独立网址发布](releases/3.0.0-independent-url-2026-09-13.md)、[3.0 验证记录](releases/3.0.0-verification.md)、[历史候选部署](releases/3.0.0-deployment-2026-09-13.md) |
| 看素材与历史 | [演进年表](history/EVOLUTION.md)、[资产清单](archive/ASSET_INVENTORY.md)、[完整历史交接](archive/GITHUB_HANDOFF.md) |

本次实际归档上传结果见 [2026-09-13 交付记录](archive/2026-09-13-delivery-record.md)。

## 产品、设计与语料

- [设计系统](../design-system/speakmate/MASTER.md)、[界面交互契约](design/3.0-interaction-contracts.md)、[29 项实施决策](design/3.0-implementation-decisions.md)。
- [目标启动](design/3.0-goal-launch.md)、[记录簿流程](design/3.0-notebook-flow.md)、[来源与离线路由](design/3.0-offline-routing.md)、[练习持久化](design/3.0-practice-persistence.md)。
- [内容质量门](design/3.0-content-quality-gate.md)、[语料分批方案](design/3.0-corpus-delivery.md)、[场景身份](design/3.0-scene-identities.md)、[验收案例](design/3.0-learning-acceptance-cases.md)。
- [场景图生成说明](design/image-prompts.md)、[Figma 历史交接](design/figma-handoff.md)。Figma 文件曾因免费额度停止编辑，不能把规范文档当作已实现的设计节点。
- 语料与审校原件位于 `src/content/dialogues/graded/`；研究依据位于 `docs/research/`。不将资料来源网站的课程当作本项目拥有的完整资产。

## 历史资料的优先级

1. 当前应用行为与可执行类型/测试需与 [APP_SPEC.md](../APP_SPEC.md) 相互核对。
2. 本次真实状态看 `docs/releases/3.0.0-*`；不能把早期阶段成功扩大为整版通过。
3. [2.3 规格](releases/2.3.0-APP_SPEC.md)、[2.3 修复记录](releases/2.3.0-mobile-dialogue-repair.md)、[2.x 发布手册](DEPLOYMENT.md)用于历史追溯，不能用于开启当前云功能。
4. [原始 PWA 规格快照](history/specs/2026-09-03-first-pwa-spec.md)和旧 README 是按提交逐字提取的档案，其相对链接需在对应 Git 提交目录读取。

本次未添加自动触发部署或消耗云资源的 CI 工作流。所有测试资料均需结合构建 ID、命令和是否为合成数据来解释。
