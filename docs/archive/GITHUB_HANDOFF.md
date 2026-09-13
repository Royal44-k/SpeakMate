# GitHub 上传与完整历史交接

目标：`https://github.com/Royal44-k/SpeakMate.git`，保持原公开可见性，不新建仓库、不强制覆盖。

## 当前状态

2026-09-13 只读检查：目标仓库存在、公开、默认 `main`，初始无分支/内容。连接器账号只有读取权限；随后核对本机 Git Credential Manager，仓库所有者 Royal44-k 已登录，三条目标分支的原子推送 dry-run 成功。没有提取凭据或改全局 Git 信任，只有独立归档目录的单次安全目录配置。**预检成功不等于文件已上传；实际远端 SHA 核验另行记录。**

归档目录 `repository/` 是独立 Git 副本，原开发目录保持不变。`main` 包含最新源码及文档；`archive/2.3` 保留 `aacbffd`；`archive/3.0-source` 保留 `9b61835`。标签如用于里程碑一律 `archive-*` 命名，不冒充生产正式发布。

## 1. 恢复或使用交付包

源码 ZIP：解压后在含 `package.json` 的目录按开发手册运行。源码包不包含 `.git`、依赖与环境秘密。

需要完整提交历史时，在一个不存在的新目录克隆随包的 bundle：

```bash
git clone --branch main SpeakMate-history-2026-09-13.bundle SpeakMate-restored
cd SpeakMate-restored
git log --all --oneline --reverse
git fsck --full
```

不要覆盖已有工程。bundle 是可恢复的 Git 归档，不是聊天对话全文或浏览器学习数据备份。

## 2. 使用有权限的账号

通过你信任的 GitHub 连接、Git Credential Manager 或 GitHub Desktop 登录 **Royal44-k 或已有目标仓库写权限的账号**。不要发送密码或 Token 给助手，不给不认识的连接账号新增协作者权限。连接器登录与本机 Git 登录可能不同，需分别核对。

先读取目标仓库与分支；若仓库已被其他人填入内容，先比较历史，保留对方改动并协商合并，不使用 `--force` 或 `--mirror`。官方流程参考：[GitHub：上传本地 Git 仓库](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)。

## 3. 上传到已确认的空仓库

以下在独立交付 `repository/` 内操作。归档副本的 `origin` 已指向用户指定网址；先检查，不盲目覆盖已存在远端。

```bash
git remote -v
git status --short
git fsck --full
git ls-remote origin
```

确认空仓库、有写权限且本地内容审查通过后：

```bash
git push --dry-run origin main archive/2.3 archive/3.0-source
git push --atomic -u origin main archive/2.3 archive/3.0-source
git ls-remote origin refs/heads/main refs/heads/archive/2.3 refs/heads/archive/3.0-source
git rev-parse main archive/2.3 archive/3.0-source
```

三项远端 SHA 应与本地逐一相同，再只读核对 README、文档和代表性二进制素材。先前空仓库检查可能过期，写入前应重查。`--atomic` 若服务器不支持，停止并说明，不默默降级成部分发布。

本次不自动创建 Release、不选择开源许可、不更改仓库可见性、不启用 Actions/自动 Vercel 发布。上传后 GitHub “Code → Download ZIP”提供最新文件；完整历史通过 Git clone 获取，离线完整备份使用随包 bundle。

## 4. 交接后维护

主分支以后新增功能前更新规格与测试。源代码、数据格式、语料、部署以及版权各有独立版本边界；可运行不等于正式发布、真人审校或真机验收。新维护者先读 [文档中心](../README.md)，然后核对实际发布记录。
