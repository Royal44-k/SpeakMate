'use client'
import { useEffect, useState } from 'react'
import type { SceneCategory } from '@/domain/scenes/types'

/** Actual controlling worker verifies cached build hashes, not merely navigator.onLine. */
export function useOfflineReadiness(
  category: SceneCategory,
  refreshToken: unknown,
) {
  const [readiness, setReadiness] = useState<{
    category: SceneCategory
    shell: boolean
    content: boolean
  }>()
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const serviceWorker = navigator.serviceWorker
    const worker = serviceWorker.controller
    if (!worker) return
    let active = true
    function receive(event: MessageEvent) {
      const value = event.data
      if (
        !active ||
        event.source !== worker ||
        value?.type !== 'OFFLINE_STATUS' ||
        typeof value.shellReady !== 'boolean' ||
        typeof value.categories?.[category] !== 'boolean'
      )
        return
      setReadiness({
        category,
        shell: value.shellReady,
        content: value.categories[category],
      })
    }
    const request = () => {
      try {
        if (active) worker.postMessage({ type: 'OFFLINE_STATUS' })
      } catch {
        /* Unknown controller readiness is not content readiness. */
      }
    }
    serviceWorker.addEventListener('message', receive)
    request()
    // A category fetch may finish just before its cache.put completes.
    const retry = setTimeout(request, 500)
    return () => {
      active = false
      clearTimeout(retry)
      serviceWorker.removeEventListener('message', receive)
    }
  }, [category, refreshToken])
  return readiness?.category === category ? readiness : undefined
}
