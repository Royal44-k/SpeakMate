import { Suspense } from 'react'
import { StaticLearningShell } from '@/features/practice/static-learning-shell'
export const metadata = { title: '定向模拟练习' }
export default function SimulationPage() {
  return (
    <Suspense fallback={<main aria-busy="true">正在读取本机模拟练习…</main>}>
      <StaticLearningShell kind="simulation" />
    </Suspense>
  )
}
