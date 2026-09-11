import styles from './goals.module.css'
export function CheckInCalendar({
  today,
  completedDates,
}: {
  today: string
  completedDates: readonly string[]
}) {
  const month = today.slice(0, 7),
    days = new Date(Date.parse(month + '-01T00:00:00Z') + 32 * 86400000)
  days.setUTCDate(0)
  const completed = new Set(completedDates)
  const offset = (new Date(month + '-01T00:00:00Z').getUTCDay() + 6) % 7
  return (
    <section className={styles.card} aria-label="打卡日历">
      <h2>{month} 打卡日历</h2>
      <p>标记表示当天有真实学习完成；未标记不扣分。</p>
      <div className={styles.days} aria-hidden="true">
        {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <ol className={styles.days}>
        {Array.from({ length: offset }, (_, index) => (
          <li key={`space-${index}`} aria-hidden="true" />
        ))}
        {Array.from({ length: days.getUTCDate() }, (_, index) => {
          const dateKey = `${month}-${String(index + 1).padStart(2, '0')}`,
            done = completed.has(dateKey)
          return (
            <li key={dateKey} data-done={done}>
              <span aria-label={`${dateKey}${done ? ' 已打卡' : ' 未打卡'}`}>
                {index + 1}
                {done ? ' ✓' : ''}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
