import { Suspense } from 'react'
import { StaticLearningShell } from '@/features/practice/static-learning-shell'
export const metadata = { title: '对话练习' }
export default function SessionPage() {
  return (
    <Suspense fallback={<main aria-busy="true">正在读取本地练习…</main>}>
      <StaticLearningShell kind="session" />
    </Suspense>
  )
}
