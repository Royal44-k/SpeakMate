# Task7 本地学习闭环验收证据

2026-09-12。仅独立本地源、合成数据、已安装 Playwright；无部署、真实学习数据、付费服务或新增依赖。作者自查完成后仍须控制器独立代码审查，不能把本文件当发布许可。

## 最终产物与静态检查

- 普通构建 `AtPYHPSa17zmdWZFKkUAi`；只读应急构建 `fSQ0KjjPzm1yRggFV4QwF`。构建期间应用源未改变；之后仅修正旧测试断言与整理证据。
- Node22.23.2，Next16.3.4。普通构建编译2.3s／类型13.4s／32页生成1842ms，exit0；应急编译1700ms／类型18.6s／32页生成1971ms，exit0。
- 正常生成器输出16页面外壳、70共享资源、共享5,014,664B、七类资料5,411,091B。应急构建不覆盖正常清单。正常 manifest SHA256：`a6f69e857c05491a29e035163a2948c94557aafa699574c5f481807841e754dc`。`next typegen`正常模式恢复正常类型引用，exit0。
- 最终整套 unit：**104文件，103通过／1失败；6409项，6408通过／1失败／0pending**，16:42:19开始，203.56s，exit1。唯一失败是旧测试仍找“返回初次寒暄”，实际目的地为“返回场景库”，原精确href和结构断言保留。QA-only更新后完整 `scene-library.test.tsx` **25项通过／25.29s／exit0**。按控制器 full-suite-once 要求未重跑整套；不称单次全量全绿。
- 最终 `eslint . --max-warnings=0` exit0（session41116，初次等待10.004s后无输出完成）；最终QA格式化加 `tsc --noEmit` 合并命令exit0／8.133s，不当作类型单独耗时。先前lint失败来自私有构建快照及浏览器 trace 中下载的压缩JS，分别以 `.superpowers/**` 和 `outputs/**/.playwright-artifacts-*/**` 窄排除；应用、测试和手写QA仍参与检查。
- Git LF→CRLF 提示及 Playwright NO_COLOR/FORCE_COLOR 提示保留，不称所有命令零提示。整套原始JSON在本地 `final-unit-results.json`，精简失败原文在 [verification-summary.json](verification-summary.json)。
- 暂存后全范围 `git diff --cached --check` exit1，仅7份原始失败 `error-context.md` 内28行代码摘录的尾空格；为保留原件哈希未格式化这些生成证据。排除这类原始错误附件的同一检查exit0／0.424s，应用、测试及手写文档无空白错误。

## 精确复跑命令约定

工作目录为隔离 worktree；`N` 是 `.superpowers/sdd/2026-09-09-speakmate-3/runtimes/node-v22.23.2-win-x64/node.exe`。先使用匹配构建，明确设置 `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3130`。普通运行器命令：

```text
N node_modules/@playwright/test/cli.js test <下表文件> --project=<项目> --output=outputs/qa/task7/<目录> --reporter=line
```

不要复用3100或3114。学习离线的 `TASK7_SERVER_DOWN=1` 专项和 recovery 测试独占3131，并在结束时关闭自己的进程；不能同时运行这两项。更新测试另需旧o3构建的完整 `.next` + 匹配 `public` 快照，使用 `task7-build-host.mjs <快照路径> 3133`，测试自己的3134代理只透明转发两构建原始响应。普通/只读的独立输出目录须先都构建：普通 `NEXT_PUBLIC_RECOVERY_ONLY` 空；应急 `true`。应急模式缺少练习等功能，首次切换需联网。

|目录／测试文件（均 tests/e2e/ 下）|实际结果与适用范围|
|---|---|
|final-chromium / task7-learning.spec.ts + task7-storage.spec.ts|Chromium 3PASS／23.4s／exit0；真实在线与断网后全新ID各0→35，终局刷新、分阶段模拟、报告、实际下载；恢复取消/重复/损坏/冲突/删除撤销。此次离线附件实际保留。|
|final-webkit / task7-learning.spec.ts + task7-mobile-fixes.spec.ts + pwa.spec.ts，`--grep-invert 'A/G offline'`|WebKit 3PASS／1FAIL，总1.3m，exit1；在线闭环、手机修复和manifest通过。唯一失败是旧安装文案“分享”已改Apple菜单“共享”。|
|final-pwa-webkit / pwa.spec.ts，`-g 'shows iPhone'`|WebKit 1PASS／2.0s／exit0；保留三步真实iPhone tabpanel，更新上述旧QA，不改应用。仅网页指引，不是实体安装。|
|final-webkit-server-down / task7-learning.spec.ts，`TASK7_SERVER_DOWN=1 -g 'A/G offline'`|WebKit 1PASS／46.4s／exit0；真实关闭自有3131、Node确认不可达后仍创建新记录并完成35分与下载。navigator.onLine=true，不冒称 context.setOffline 或飞行模式通过。|
|final-recovery-webkit / task7-recovery-build.spec.ts|WebKit 1PASS／51.0s／exit0；原v1六表升级、实际学习/记录、同源切换只读、旧controller下固定/recovery可达、明确注销仍受控、关页重开无controller/注册、完整下载全12表不变；28深链首帧/水合后零DB开库/事务/写界面；无库/v1/v3/缺表/损坏拒绝；真实已知active+未知waiting混合注册拒绝注销且无库不创建。|
|fh-complete-01 / task7-notebook-native.spec.ts + task7-phase-browser.spec.ts，`-g 'composition\|F/H:'`|Chromium 4PASS／19.9s／exit0；真实for-example两来源/当前B2来源A2/五问/完整非零列表→词句→模拟→报告→词句→列表返回；造句abort后迟到读取不能覆盖编辑/取消/提交。|
|phase-01 / task7-phase-browser.spec.ts|Chromium 原回忆三种操作3PASS／11.6s；与造句新增三项不同。|
|native-scroll-04 / task7-native-scroll.spec.ts|Chromium 1PASS／7.5s；9次真实捕获，1792px列表位置，原生IDB成功交付延迟，原生Back/Forward和denied sessionStorage安全返回。|
|simulation-return-01 / task7-simulation-return.spec.ts|Chromium 3PASS／15.9s；/me来源的三个阶段退出、两个旧阶段面对另一窗停止仍保留草稿。|
|coverage-02 / task7-coverage-browser.spec.ts|Chromium 1PASS／9.0s；实际部分片段选择、未知自评、HTML备注不执行、命名旧来源编号碰撞导入后不跨笔记选错上下文。|
|in2-fh / task7-micro-v2.spec.ts|五组v2实际另放/不要辣椒、两规范笔记/零奖励通过；同批另一个原滚动测试当时失败，后有native-scroll-04，不称整批全绿。|
|legacy-micro-03 / task7-legacy-micro.spec.ts|Chromium 1PASS／7.1s；合法历史v1实际导入、离线恢复、完成、再导出，未按v2重写。|
|retained-05 / task7-retained-history.spec.ts|Chromium 1PASS／8.7s；121历史、121字符ASCII与Unicode编号完整页内读取/删除撤销，2,929,305B实际导出；2真实完成+119历史终局合成样本，不是121次赚分。|
|cap-legacy-red / task7-backup-cap.spec.ts|容量项通过：481笔记实际9,917,267B完整文件；551笔记超10MiB明确错误、无下载、全12不变。大型原文件仅本地保留，哈希见清单。同批旧offline源码grep失败。|
|legacy-offline-final / offline.spec.ts + pwa.spec.ts|Chromium 4PASS／1原有平台skip／8.9s；旧2.3源码grep改为真实16页面/manifest/native proof，不disable原可运行项。|
|cache-privacy-02 / task7-cache-privacy.spec.ts|Chromium 1PASS／15.3s；两处私有搜索不进入新URL/请求、legacyq仅初次来路；损坏/未下载类别503，70资源+16实际导航哈希，RSC不返回HTML、固定WebP/已存快照仍可读。|
|update-capture-06 / task7-update-browser.spec.ts，`-g 'real waiting build'`|Chromium 1PASS／13.2s；真实o3→in2双构建，笔记/模拟/捕获草稿阻止更新；70旧懒资源保持原哈希；200%导航span、更新提示、返回顶端不重叠；新窗竞态保守拒绝后重试，全12不变。|
|category-fault-02 / task7-update-browser.spec.ts，`-g 'native category'`|1PASS／1FAIL／2.1m；真实正文交付30s超时通过，controller测试旧waiting快照等待错误未通过。|
|controller-fault-04 / 同文件，`-g 'native category controller-change'`|Chromium 1PASS／4.3s；同一真实registration等到waiting后直接发原SKIP_WAITING，原生controllerchange中止请求，释放真实正文不产生迟到写入。协议故障注入，不是busy时用户可点的更新路径。|
|final-communication-03 / task7-communication-browser.spec.ts|Chromium 1PASS／7.2s；实际“我不想说私人原因”作为普通回答完成；虚构预约准备/原结尾/保存提示不宣称真实服务；旧导航数组恢复后明确返回，数据不变。前两次只修测试定位阶段和重复结尾选择器。|

## 已完成的父任务独立有界 QA

- [B/C/E结算、跨日、实际兑换100/200/300](../task7-settlement-browser/README.md)：真实UI赚600，不受信任余额种子；日期/visibility信号明确模拟。
- [G绑定失败与两窗选择](../task7-material-choice-browser/README.md)：原生事务abort、同ID重试、胜出来源固定。
- [首用控制器与10秒期限](../task7-cold-browser/README.md)：Chromium5PASS46.7s、WebKit5PASS1.4m；实际旧2.3原字节、503拒绝、不支持能力显式模拟。
- [29状态手机视觉原始审查](../task7-root-mobile-audit/README.md)：修复前原图保留，未被本次新图覆盖。

## 原始失败与证据边界

`terminal-red`、`notebook-03` 保留真实旧finish禁令与dock遮挡的失败；根早期热身不可见原图另存原目录。`webkit-offline-red` 保留 WebKit context.setOffline 内部导航失败，不修改为通过。其余中间失败分别是源选择器、实际问题文案、真实异步加载/foreground提交、旧测试契约或等待句柄问题，详尽时间线在原任务报告。最终通过目录与中间失败目录并存是有意保留审计历史。

`selected-artifacts.json` 列出115份已审读组内原文件的字节与SHA256；113份小于1MB的JSON/PNG/错误说明入库，大型容量/历史备份原文件仍本地保留，不改写原件。zip和下载的压缩JS trace资源不入Git，也未删除。33份网络记录共8008条均本地GET/HEAD；其中29份含原始空errors数组，另外4份学习闭环仅保存请求数组，页面异常为空仅由原测试的实际断言证明，附件本身未序列化该字段，汇总保留null。旧审计曾漏计这4份共1312请求，修复后重新读取原文件，未重跑浏览器。不同运行/观测层不能合并称独立用户请求。`audit-evidence.mjs` 显式校验两种真实格式，未知格式失败，只读证据并生成索引，不访问应用或替代浏览器测试。

最终手机8张原PNG作者均重新打开；390×844、320×568、390×430首题/回答路径、打字焦点、200%五个span在可点链接与视口内，/me成绩和独立示例可见。长页面PNG中的固定导航位于拍摄时视口底部，不代表固定在整页中段。短视口不等于系统键盘；脚本数值不代替辅助技术或色彩对比度评估。

## 尼尔森十项定点观察

|原则|实际观察／修正及证据|限制|
|---|---|---|
|状态可见|热身首次进入现在聚焦可见；首用失败解释任务未改变；terminal-red→最终闭环|不代表真实手机启动延迟|
|贴近现实|社交隐私边界是回答，医疗仅虚构请求；final-communication-03|无教师／临床认证|
|用户控制|输入取消、退出确认、删除撤销、更新延期；F/H/D/update|无法证明任意外部脚本历史操作|
|一致性|五栏顺序、目的地返回标签、/me示例独立；final-mobile＋root29图|旧已安装metadata需真机重开验证|
|防错|原生abort全12回滚、未验证分类不替代、未知SW不注销|无法防本机用户篡改积分|
|减少记忆|当前问题首次进入可见，完整背景仍保留，来源等级明确|不评价长期学习效果|
|操作效率|记录成功普通点击可达；非零来源恢复，历史按需读取|不等同手机性能基准|
|简洁呈现|保留完整材料，定点定位当前问题；独立示例不混真积分|目标首屏设置偏密仍属非阻断观察|
|错误恢复|同ID重试、明确只读/recovery、超限不截断|10MiB限额可能限制长期大历史|
|帮助说明|三份本地/备份/iPhone指南、实际安装三步与数据限制|实体iPhone清单仍未验证|

## 不应扩大解释的结论

Windows WebKit不是实体iPhone；WebKit自动断网控制失败与服务器不可达成功分开。没有OS键盘/麦克风/选区/音色/真实安装、全运营商网络或教师认证结果。音频Blob生命周期由实际组件回归验证，不宣称实体麦克风录音通过。语料全630模式由源引擎遍历，不称630次浏览器人工流程。证明字段错误细分沿用命名unit证据；真实corrupt503不等于客户端header mismatch。多窗枚举不是原子锁，只有请求更新的页面自动重载；旧窗不会自动只读。应急入口首次需联网，不可练习/导入/删除/兑换，仍10MiB上限。源打包规则测试通过不等于真实Vercel CLI上传清单；后者及发布/最终独立审查由控制器处理。
