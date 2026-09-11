'use client'
import { useEffect } from 'react'
/** Reuses the app update notice's existing busy contract; no independent guard store. */
export function useGoalInteraction(busy: boolean) {
  useEffect(() => {
    if (!busy) return
    const root = document.documentElement,
      previous = root.dataset.interactionBusy
    root.dataset.interactionBusy = 'true'
    return () => {
      if (previous === undefined) delete root.dataset.interactionBusy
      else root.dataset.interactionBusy = previous
    }
  }, [busy])
}
