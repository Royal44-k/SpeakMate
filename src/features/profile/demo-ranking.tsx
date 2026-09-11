import styles from '@/features/goals/goals.module.css'
// Presentation-only examples. Never read or write learner statistics here.
export function DemoRanking() {
  return (
    <section className={styles.card} aria-label="示例榜单">
      <h2>看看一周练习节奏</h2>
      <p>示例数据，非真实好友排名</p>
      <ol>
        <li>示例学习者 A · 5 天</li>
        <li>示例学习者 B · 4 天</li>
        <li>示例学习者 C · 3 天</li>
      </ol>
      <p>
        这些数字仅演示界面，不计入你的统计、积分或备份；没有邀请好友或同步排名。
      </p>
    </section>
  )
}
