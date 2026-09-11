import { Suspense } from 'react'
import { StaticLearningShell } from '@/features/practice/static-learning-shell'
export const metadata = { title: '词句记录' }
export default function NotePage() {
  return (
    <Suspense fallback={<main aria-busy="true">正在读取本机词句…</main>}>
      <StaticLearningShell kind="note" />
    </Suspense>
  )
}
