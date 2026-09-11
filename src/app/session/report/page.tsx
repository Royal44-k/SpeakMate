import { Suspense } from 'react'
import { StaticLearningShell } from '@/features/practice/static-learning-shell'
export const metadata = { title: '场景复盘' }
export default function ReportPage() {
  return (
    <Suspense fallback={<main aria-busy="true">正在读取本地报告…</main>}>
      <StaticLearningShell kind="report" />
    </Suspense>
  )
}
