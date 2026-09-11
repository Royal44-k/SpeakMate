'use client'
/* eslint-disable @next/next/no-html-link-for-pages -- Invalid query recovery uses the existing static document-navigation contract. */
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { GoalHome } from './goal-home'
import { validGoalDate } from '@/components/app-shell/learning-routes'
function GoalQuery() {
  const params = useSearchParams(),
    date = params.get('date') ?? undefined,
    task = params.get('task') ?? undefined
  if (
    params.getAll('date').length > 1 ||
    params.getAll('task').length > 1 ||
    (date !== undefined && !validGoalDate(date)) ||
    (task !== undefined &&
      !['warmup', 'scene', 'consolidation', 'extension'].includes(task))
  )
    return (
      <main className="route-recovery">
        <p>目标入口参数无效，本机记录未修改。</p>
        <a href="/">返回今天</a>
      </main>
    )
  return <GoalHome date={date} focusTask={task} />
}
/** Task6 mounts this inside the root welcome switch; it does not create another router. */
export function GoalHomeRoute() {
  return (
    <Suspense fallback={<p role="status">读取目标入口…</p>}>
      <GoalQuery />
    </Suspense>
  )
}
