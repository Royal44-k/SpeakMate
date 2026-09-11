import { Suspense } from 'react'
import { AppShell } from '@/components/app-shell/app-shell'
import { StaticLearningShell } from '@/features/practice/static-learning-shell'
export const metadata = { title: '词句记录' }
export default function NotePage() {
  return (
    <AppShell activeDestination="notebook" contentOwnsMain>
      <Suspense fallback={<main aria-busy="true">正在读取本机词句…</main>}>
        <StaticLearningShell kind="note" />
      </Suspense>
    </AppShell>
  )
}
