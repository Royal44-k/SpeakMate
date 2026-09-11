'use client'
import { useEffect, useState, type ReactNode } from 'react'
import type { Repositories } from '@/infrastructure/persistence/repositories'
import { ExitGuard } from '@/features/practice/exit-guard'
import { CaptureProvider } from './capture'
export function RecordCaptureFrame({
  children,
  repositories,
  returnTo = '/me',
}: {
  children: ReactNode
  repositories: Repositories
  returnTo?: string
}) {
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!busy) return
    const root = document.documentElement
    const previous = root.dataset.interactionBusy
    root.dataset.interactionBusy = 'true'
    return () => {
      if (previous === undefined) delete root.dataset.interactionBusy
      else root.dataset.interactionBusy = previous
    }
  }, [busy])
  return (
    <CaptureProvider repositories={repositories} onBusyChange={setBusy}>
      {busy ? (
        <ExitGuard
          state="draft"
          fallbackHref={returnTo}
          onConfirmExit={() => {}}
        />
      ) : null}
      {children}
    </CaptureProvider>
  )
}
