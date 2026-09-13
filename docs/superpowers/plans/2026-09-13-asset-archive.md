# SpeakMate 全资产归档与 GitHub 交接计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement a future code implementation plan task-by-task. This deliverable is a sequential asset/document curation, not a new application implementation or reopening of the completed 3.0 development plan. Steps use checkbox syntax for handoff.

**Goal:** 整理最初设想到 3.0 的可交付资产，补齐中文规格/使用/开发/部署文档，生成可校验的源码与历史归档，取得目标权限后上传 Royal44-k/SpeakMate。

**Architecture:** 从可达 Git 历史创建独立副本，叠加明确的工作文档及筛选资产；保留原应用逻辑和原开发目录。用户隐私、凭据、运行时和大体积临时文件留在原机，清单说明排除。

**Tech Stack:** Git、Node.js 标准库、PowerShell；不新增依赖或云资源。

**Spec:** 用户 2026-09-13 资产整理/上传请求，既有严格本地、零新增费用约束及 APP_SPEC.md。

## Global Constraints

- 不重写原 214 次提交；不 force-push，不替用户选择开源许可证。
- 不自动推广 Vercel 或启用 Git 集成/Actions，不接触真实学习数据。
- 原文件缺失时标记缺口，不能把整理稿说成原件；历史测试不包装成新验收。
- 远端写权限是上传门槛，本地完成不等于远端已提交。

## Task 1：清点与筛查

- [x] 核对源码、工作文档、214 次历史和目标仓库。
- [x] 扫描可达历史与基线工作文件，禁入路径与密钥规则没有未解决命中。
- [x] 独立克隆并复制有来源的文档、24 张历史截图及白名单合成 QA，保留排除清单。

## Task 2：交付文档

- [x] 更新 README 与文档中心，区分当前/历史/用户反馈/待验证。
- [x] 添加用户教程、架构数据、开发、测试、3.0 部署/恢复、历史和安全说明。
- [x] 保留历史规格及微信概念来源说明，不复制凭据或假造 Figma 文件。

## Task 3：归档验收

- [x] 检查新增文档链接、运行文件与基准一致，复查最终文件的敏感模式。
- [x] 生成逐文件 SHA256 清单、源码 ZIP、完整 Git bundle 和交付校验记录。
- [x] 实际读取 ZIP、校验哈希、验证 bundle/提交历史及恢复说明。

## Task 4：上传门槛与远端核验

- [x] 找到并核对本机已有 Royal44-k 登录态；三分支原子推送 dry-run 成功，未读取秘密，不必更换连接器。
- [x] 写入前重查仓库，确认仍为空，不强制覆盖。
- [x] 明确推送 main 和两条归档分支，读取远端 SHA 及代表文件 blob 核对。
- [x] 填写真实上传结果与提交链接，见 docs/archive/2026-09-13-delivery-record.md；收尾文档提交后再次同步校验清单和最终包。
