import { Suspense } from 'react'
import { StaticLearningShell } from '@/features/practice/static-learning-shell'
export const metadata = { title: '准备练习' }
export default function PreparePage() {
  return (
    <Suspense fallback={<main aria-busy="true">正在准备场景…</main>}>
      <StaticLearningShell kind="prepare" />
    </Suspense>
  )
}
