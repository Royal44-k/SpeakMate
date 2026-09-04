'use client'

import { ArrowClockwise } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'

import styles from './service-worker-registration.module.css'

export function ServiceWorkerRegistration() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const refreshRequestedRef = useRef(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      let reloading = false
      const handleControllerChange = () => {
        if (reloading || !refreshRequestedRef.current) return
        reloading = true
        window.location.reload()
      }
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
      void navigator.serviceWorker.register('/sw.js').then((registration) => {
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting)
        }
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing
          installing?.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(installing)
            }
          })
        })
      }).catch(() => undefined)

      return () => navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  if (!waitingWorker) return null

  return (
    <aside className={styles.update} role="status">
      <p><strong>新版本已准备好</strong><span>完成本轮后即可安全更新。</span></p>
      <button type="button" onClick={() => {
        refreshRequestedRef.current = true
        waitingWorker.postMessage({ type: 'SKIP_WAITING' })
      }}>
        <ArrowClockwise aria-hidden size={18} weight="bold" />
        立即更新
      </button>
      <button type="button" className={styles.later} onClick={() => setWaitingWorker(null)}>稍后</button>
    </aside>
  )
}
