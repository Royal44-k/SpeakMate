'use client'

import { ArrowClockwise } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import packageJson from '../../../package.json'

import styles from './service-worker-registration.module.css'

const UPDATE_DISMISSAL_KEY = 'speakmate-update-dismissed-worker'
const WAITING_WORKER_FALLBACK_KEY = 'speakmate-pwa-update-v1'
const SERVICE_WORKER_URL = `/sw.js?v=${packageJson.version}`

export function shouldShowUpdate(pathname: string, interactionBusy: boolean): boolean {
  return !interactionBusy
    && pathname !== '/'
    && pathname !== '/welcome'
    && pathname !== '/session'
    && !pathname.startsWith('/session/')
}

function getWaitingWorkerKey(worker: ServiceWorker) {
  return worker.scriptURL || WAITING_WORKER_FALLBACK_KEY
}

function isDismissedForSession(worker: ServiceWorker) {
  try {
    return window.sessionStorage.getItem(UPDATE_DISMISSAL_KEY) === getWaitingWorkerKey(worker)
  } catch {
    return false
  }
}

export function ServiceWorkerRegistration() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [interactionBusy, setInteractionBusy] = useState(false)
  const [updateFailure, setUpdateFailure] = useState('')
  const refreshRequestedRef = useRef(false)
  const noticeRef = useRef<HTMLElement>(null)
  const pathname = usePathname() ?? ''

  useEffect(() => {
    const root = document.documentElement
    const syncInteractionBusy = () => {
      setInteractionBusy(root.dataset.interactionBusy === 'true')
    }
    const observer = new MutationObserver(syncInteractionBusy)

    syncInteractionBusy()
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-interaction-busy'],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      let reloading = false
      const handleControllerChange = () => {
        if (reloading || !refreshRequestedRef.current) return
        reloading = true
        window.location.reload()
      }
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
      void navigator.serviceWorker.register(SERVICE_WORKER_URL).then((registration) => {
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
      }).catch(() => setUpdateFailure('更新检查暂时无法完成，请稍后重试。'))

      return () => navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  const visible = waitingWorker
    && !isDismissedForSession(waitingWorker)
    && shouldShowUpdate(pathname, interactionBusy)

  useEffect(() => {
    if (!visible) return

    const root = document.documentElement
    const updateNoticeHeight = () => {
      const height = Math.ceil(noticeRef.current?.getBoundingClientRect().height ?? 0)
      root.style.setProperty('--update-notice-height', `${height}px`)
    }
    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? undefined
      : new ResizeObserver(updateNoticeHeight)

    root.dataset.updateNoticeVisible = 'true'
    updateNoticeHeight()
    if (noticeRef.current) resizeObserver?.observe(noticeRef.current)

    return () => {
      resizeObserver?.disconnect()
      delete root.dataset.updateNoticeVisible
      root.style.removeProperty('--update-notice-height')
    }
  }, [visible])

  function dismissLater() {
    if (!waitingWorker) return

    try {
      window.sessionStorage.setItem(UPDATE_DISMISSAL_KEY, getWaitingWorkerKey(waitingWorker))
    } catch {
      // Keep the local dismissal useful when storage is unavailable.
    }
    setWaitingWorker(null)
  }

  function updateNow() {
    if (!waitingWorker) return

    try {
      refreshRequestedRef.current = true
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    } catch {
      refreshRequestedRef.current = false
      setUpdateFailure('更新暂时无法完成，请稍后重试。')
    }
  }

  return (
    <>
      {updateFailure ? <span className="visually-hidden" role="status">{updateFailure}</span> : null}
      {visible ? (
        <aside className={styles.update} ref={noticeRef} role="status">
          <p><strong>新版本已准备好</strong><span>完成本轮后即可安全更新。</span></p>
          <button type="button" onClick={updateNow}>
            <ArrowClockwise aria-hidden size={18} weight="bold" />
            立即更新
          </button>
          <button type="button" className={styles.later} onClick={dismissLater}>稍后</button>
        </aside>
      ) : null}
    </>
  )
}
