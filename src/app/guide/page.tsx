/* eslint-disable @next/next/no-html-link-for-pages -- Binding offline-routing contract: static cross-shell document links do not request RSC. */
import styles from '@/features/goals/goals.module.css'
import { AppShell } from '@/components/app-shell/app-shell'
export const metadata = { title: '本机练习指南' }
export default function GuidePage() {
  return (
    <AppShell activeDestination="goals" contentOwnsMain>
      <main className={styles.page}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>PRACTICE, AT YOUR PACE</p>
          <h1 data-page-title tabIndex={-1}>
            本机练习指南
          </h1>
          <p>文字练习可用；麦克风、朗读和跟读是可选辅助，没有语音也能继续。</p>
        </header>
        <section className={styles.card}>
          <h2>今日目标</h2>
          <p>
            北京时间每天一份本机计划。5、10、15 分钟是估算；15
            分钟另有一项可选拓展。先看参考再隐藏回忆、完成固定场景、用真实记录簿材料做定向应用。
          </p>
          <p>
            每项核心任务完成后获得 10 积分，三项全部完成再得 5
            积分；可选拓展另得 10。35／45
            是一份计划的奖励，不是同一天的积分上限。
          </p>
          <p>
            任务已开始后保留等级和材料。跨天继续原任务，积分归原计划，打卡归实际完成日。等级和兴趣修改用于未来计划，自由新练习使用当前选择。
          </p>
        </section>
        <section className={styles.card}>
          <h2>什么算完成</h2>
          <p>
            主动回忆、提交表达并明确确认完成才记录学习。按所选路径练习，即使表达不完美也算真实练习；不会用语法、发音或智能评分门槛卡住积分。
          </p>
          <p>
            打开页面、隐藏参考前的阅读、计时、记录词句和兑换本身都不打卡。前台练习时间隐藏时暂停，跨北京时间午夜分开统计。
          </p>
        </section>
        <section className={styles.card}>
          <h2>记录与资料</h2>
          <p>
            未知原文仍然可以记录、阅读和导出；没有已覆盖来源时不生成定向练习。可以明确选择校审备用词句。保存词句与启动练习是两步；后一步失败时词句仍保留，可重试。
          </p>
          <p>
            公开资料需要先准备。下载或本机保存失败不会代替完成，也不会自动换目标。请保留页面重试，或查看离线与更新说明。
          </p>
        </section>
        <section className={styles.card}>
          <h2>奖励与本机数据</h2>
          <p>
            六份数字奖励：两种个人卡各 100 积分，两种目标封面各
            200，两份原创练习资料各
            300。兑换减少余额，不减少累计获得；已有奖励不重复扣分，核心内容不锁定。
          </p>
          <p>
            数据只在这个浏览器保存。清理浏览器数据可能丢失本机记录，请定期导出备份。示例榜单不是真实好友排名，没有好友邀请、云同步或后台推送。
          </p>
        </section>
        <nav className={styles.actions} aria-label="指南返回">
          <a href="/">今日目标</a>
          <a href="/practice">自由练习</a>
          <a href="/rewards">数字奖励</a>
          <a href="/install">离线与更新</a>
          <a href="/privacy">导出备份</a>
        </nav>
      </main>
    </AppShell>
  )
}
