import { Suspense } from 'react'
import { LegacyLearningShell } from '@/features/practice/legacy-learning-shell'

export default function LegacyPage() {
  return (
    <Suspense fallback={<main aria-busy="true">正在打开学习入口…</main>}>
      <LegacyLearningShell />
    </Suspense>
  )
}
