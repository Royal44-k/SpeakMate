'use client'

import { Suspense } from 'react'
import { LegacyLearningShell } from './legacy-learning-shell'

/** Compatibility only. An unmatched old shell must never default to id=new. */
export function OfflineSessionShell() {
  return (
    <Suspense fallback={<main aria-busy="true">正在检查旧版离线入口…</main>}>
      <LegacyLearningShell />
    </Suspense>
  )
}
