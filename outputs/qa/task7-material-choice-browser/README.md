# G：巩固材料启动的真实浏览器验证

原Task7实施者明确交接的有界测试：空记录簿启动事务失败／重试、两个真实来源并发绑定。控制器只编写QA，不改应用、奖励规则或实际学习记录。已安装Playwright，独立Edge手机模拟390×844；本地构建 `in2pG1ng-2S7-GB53eqAC`。首次控制器就绪是本专项前提，不以此关闭首次使用验收门。

## 实际路径与结果

1. 新用户真实完成A2／旅行／5分钟设置，三项计划中巩固目标明确为待选择，笔记、会话和积分为空。打开选择后刷新，计划不变。明确两次记录同一校审black词句，仍只有一个规范笔记；记录不等于启动或发奖。
2. 在原生 `dailyPlans.put` 写入巩固started的真实事务位置中止事务，保留此前从`sessions.put`观察到的本次ID。UI明确“词句已保存，练习尚未开始”；笔记／计划／会话／话轮／事件／账本与失败前完全相同。点击原“重试”，同一会话ID、规范笔记ID、所选来源、来源等级、描述版本、实际轮数及任务归属共同保存；不消耗换项机会、零积分，刷新不改变绑定。
3. 另一独立context从空计划出发，在咖啡A2与B2实际场景中分别记录black，得到一个规范笔记、两个真实来源。两页从原巩固任务分别选择A2／B2来源并启动，只生成一个带该任务归属的模拟。胜出页面保存回忆及造句；败方再次点原重试，仍不覆盖固定目标、笔记、会话、回忆或造句，不重复创建、不发奖。没有强制某一窗口胜出。

以上只覆盖G的两项命名异常和页面结果；分类包失配、冷启动、历史任务、F／H与其他SW边界由原任务继续验证。不是实体iPhone、真正后台切换或教师审阅证据。

## 命令与过程

`N` 为本worktree的 `.superpowers/sdd/2026-09-09-speakmate-3/runtimes/node-v22.23.2-win-x64/node.exe`（22.23.2）。环境仅当前命令设 `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3132`，不改系统环境。

- 首次类型检查exit1：测试误写描述字段contentVersion，真实类型为version；仅修正QA字段，无应用改动。重复记录后明确选择实际来源，再等待可开始状态，没有跳过来源确认。
- 先只读确认3132无监听及磁盘构建ID，再启动专用Next3132（ready333ms）。`N node_modules/@playwright/test/cli.js test tests/e2e/task7-material-choice-browser.spec.ts --project=chromium-mobile --output=outputs/qa/task7-material-choice-browser/run-01 --reporter=line`：2项通过，总13.6秒，exit0。测试进程退出后，仅用其原会话Ctrl-C结束自有服务（exit1主动停止），确认3132无监听。
- 为使测试可独立复跑，提取B／C／E原有自有服务生命周期到 `tests/e2e/task7-owned-local-server.ts`，G与原测试共用；原生存储及UI助手复用原实施者已有QA文件。发现端口占用即拒绝，隐藏启动，仅停止自身child，记录真实buildID；可用`TASK7_EXPECT_BUILD_ID`指定期待版本，不把中间构建ID永久硬编码进测试。
- 设 `TASK7_EXPECT_BUILD_ID=in2pG1ng-2S7-GB53eqAC` 后，同命令output为 `fixture-final`：2项通过，总12.2秒，exit0，验证抽取后的服务启动与退出；无手动遗留服务。随后只把容易被React规则误认的函数名useOwnedLocalServer改为registerOwnedLocalServer，没有关掉lint规则或改测试行为。
- 最终三份root-ownedQA文件ESLint `--max-warnings=0` 与当前源码 `tsc --noEmit` 均exit0、无输出。曾出现两条QA函数命名的hooks lint错误，已按上述方式消除；原NO_COLOR／FORCE_COLOR运行时提示保留。

`fixture-final` 中真实事务状态和双来源结果已再读取，网络证据无页面异常、非GET/HEAD请求或跨源调用。没有伪造已绑定目标、直接写积分、force-click或业务测试后门。本测试成功路径未要求截图，因此以可读取状态、请求审计和实际交互断言为证，不借其他页面图片代替。
