# B／C／E 真实浏览器验收（进行中）

原任务7实施者明确请求控制器接手这一有界测试工作；仅修改 `tests/e2e/task7-settlement-browser.spec.ts` 与本目录证据，不改应用代码。原实施者继续 F／H、离线与多窗口测试。

用户已批准现有 Playwright 的独立本地合成测试。固定普通构建 `o3l7OUHwGtKTlz9pnpxMi`，测试通过子进程启动专属3132服务，发现端口占用即拒绝复用，afterAll只停止其自身服务。无真实记录、服务安装、收费、生产部署或外部模型。浏览器为已安装 Edge／Chromium 手机模拟390×844，不是实体手机。

本测试要捕获的实际错误：最后任务与10+5积分非原子提交；重试或双窗口重复发奖；finish/stop败方覆盖胜出状态；跨日归属/后台计时错误；重复兑换、负余额以及样式／资料未真实应用。所有积分来自原UI完成合成学习，克隆检查点也通过实际备份导出与恢复入口。故障仅注入原生IndexedDB的命名写入边界；不会新增业务测试接口。

## 当前命令与证据

`N` 为 `.superpowers/sdd/2026-09-09-speakmate-3/runtimes/node-v22.23.2-win-x64/node.exe`（22.23.2）。所有命令在本授权worktree执行，环境仅此命令设置 `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3132`，不改系统环境。运行中不重建 `.next`。

1. 新增 B／E 测试后 `N node_modules/typescript/bin/tsc --noEmit`：exit0，无输出；仅当时源码范围。
2. 首次 `N node_modules/@playwright/test/cli.js test tests/e2e/task7-settlement-browser.spec.ts --project=chromium-mobile --grep '^B:' --output=outputs/qa/task7-settlement-browser/run-01 --reporter=line`：exit1，No tests found。grep按完整测试标题匹配，开头锚点错误；没有启动浏览器或证明产品失败。
3. 改为 `--grep 'B:' --output=outputs/qa/task7-settlement-browser/run-02`，其余相同：2项通过，总18.1秒，exit0。实际存储abort后保持20分、同身份重试35分；从实际下载恢复的第二context双窗完成仍35分/4笔账本；完成与停止并发仅一个终态，败方有可理解提示且刷新保持。原生故障记录、真实20分检查点、竞态结果和所有请求审计已保存于run-02。pageerror、非GET/HEAD及外部源请求为空。
4. `--grep 'E:' --output=outputs/qa/task7-settlement-browser/run-03`：1项通过，总46.8秒，exit0。60次实际UI热身分别赚取10分；先10日得到100分实际导出，再分别恢复到两个隔离context测试同一奖励/不同奖励并发。每次只扣100，另一操作分别显示已拥有/余额不足；后续原context再完成20日/30日热身，实际购买并应用200分封面/阅读300分资料。累计600分、余额0、3份奖励，资料非空，重新打开不重复扣分，实际导出不含演示榜。两张原始样式截图已保存后重新打开；文件为设备像素1024×2216，对应主页面布局390×844。首跑额外恢复context使用默认桌面视口，不能将该部分称作手机视口证明。
5. 加入C后，`--grep 'C:' --output=outputs/qa/task7-settlement-browser/run-04`：失败于最后一个错误测试选择器（期望等级链接，但真实UI是“当前练习水平”下拉框且B2已选），之前跨日/时长/旧任务断言通过，不称整体通过。改为实际下拉框和准备链接后run-05又在读取新计划前未等异步页面就绪而失败；补充等待真实日期/等级可见，不改应用或放宽计划断言。
6. C相同命令，output改run-06：1项通过，总8.4秒，exit0。北京时间9月10日23:58开始场景、30秒前台/60秒模拟后台/210秒前台，到9月11日00:03；只累计240000ms，分别归9月10日60000ms与11日180000ms。真实完成10日场景及9日已开始热身，各奖励一次共20，两个学习打卡日期均11日；新11日计划未自动完成，刷新稳定。改个人B2后新练习下拉/准备链接为B2，旧会话/任务仍A2。时钟仅Playwright上下文、visibilityState仅测试文档受控信号；不改系统时钟，也不证明原生App切换事件。
7. 把额外恢复context显式设为390×844触摸移动布局，格式化仅本测试文件后，四项运行使用 `--output=outputs/qa/task7-settlement-browser/final-chromium --reporter=line`：B／B／C三项通过，E失败，总49.1秒、exit1。E已应用200分封面的提示出现后，测试直接goto('/')收到ERR_ABORTED；没有证据证明一定由beforeunload造成。保留原截图与trace，不称四项全通过。
8. 仅QA改为等待奖励卡“正在使用”真实状态，再使用原“查看我的个人卡／返回今日目标”链接；E单项output为final-reward：失败于第一日首次准备热身，尚未到奖励步骤。原图显示“资料准备或本机保存失败…重新读取”；测试等待“隐藏参考，开始回忆”直到300秒超时，exit1。该实际安全失败已交原实施者追查首次控制器／资料验证时序，不将其说成返回问题，也不自动重试掩盖。测试自有服务已退出。
9. E奖励专项明确以实际Service Worker已控制为前提（最多30秒，只读取原生状态，不替换worker或业务方法）；首次使用仍属单独未关闭验收门。补充失败时只读控制器／缓存／alert诊断，并把单次交互上限设15秒，避免整个测试超时才定位。使用 `--grep 'E:' --output=outputs/qa/task7-settlement-browser/reward-ready --reporter=line`：1项通过，总46.6秒，exit0。所有额外context也是390×844触摸移动布局；实际100／200目标链接返回、刷新和300资料再次阅读通过。三份请求审计分别1448／132／132条，pageerror、非GET/HEAD及外部源请求为空。最终两张PNG已重新打开检查。自有服务退出，3132无监听；已交回正常构建控制权。
10. 最终本测试文件 `N node_modules/eslint/bin/eslint.js tests/e2e/task7-settlement-browser.spec.ts --max-warnings=0`：exit0、无输出（4.83秒）；`N node_modules/typescript/bin/tsc --noEmit`：exit0、无输出（7.91秒）。不代表原实施者尚在修改的全部Task7已完成最终检查。

控制台原有 NO_COLOR／FORCE_COLOR 提示保留，不宣称输出全无警告。B领域内存适配器的故障测试由原实施者的既有测试证据覆盖，这里只声称真实IndexedDB和浏览器部分。通过的B／B／C来自final-chromium、通过的E来自reward-ready；不合并伪称同一次四项全绿。未关闭首次使用失败、实体iPhone或中国大陆运营商验收。

本目录JSON均为隔离的合成学习数据。原始失败trace.zip保留在本地对应run目录，未加入Git或部署；截图、测试错误上下文、真实下载、状态与网络证据纳入版本记录。未删除失败证据，也不通过重置用户数据解决问题。
