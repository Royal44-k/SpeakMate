'use client'

import { ArrowClockwise } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import packageJson from '../../../package.json'

import styles from './service-worker-registration.module.css'

const UPDATE_DISMISSAL_KEY = 'speakmate-update-dismissed-worker'
const WAITING_WORKER_FALLBACK_KEY = 'speakmate-pwa-update-v1'
const SERVICE_WORKER_URL = `/sw.js?v=${packageJson.version}`

export function shouldShowUpdate(
  pathname: string,
  interactionBusy: boolean,
): boolean {
  return (
    !interactionBusy &&
    pathname !== '/' &&
    pathname !== '/welcome' &&
    pathname !== '/session' &&
    pathname !== '/notebook/simulation' &&
    !pathname.startsWith('/session/')
  )
}

function getWaitingWorkerKey(worker: ServiceWorker, buildId?: string) {
  return (
    (worker.scriptURL || WAITING_WORKER_FALLBACK_KEY) +
    (buildId ? `#${buildId}` : '')
  )
}

function isDismissedForSession(worker: ServiceWorker, buildId?: string) {
  try {
    return (
      window.sessionStorage.getItem(UPDATE_DISMISSAL_KEY) ===
      getWaitingWorkerKey(worker, buildId)
    )
  } catch {
    return false
  }
}

export function ServiceWorkerRegistration() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [waitingBuildId, setWaitingBuildId] = useState<string>()
  const [interactionBusy, setInteractionBusy] = useState(false)
  const [updateFailure, setUpdateFailure] = useState('')
  const [updateDeferred, setUpdateDeferred] = useState(false)
  const waitingWorkerRef = useRef<ServiceWorker | null>(null)
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
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
      let active = true
      let reloading = false
      const handleControllerChange = () => {
        if (reloading || !refreshRequestedRef.current) return
        reloading = true
        clearTimeout(updateTimerRef.current)
        window.location.reload()
      }
      const handleMessage = (event: MessageEvent) => {
        if (!active || event.source !== waitingWorkerRef.current) return
        if (
          event.data?.type === 'BUILD_ID' &&
          typeof event.data.buildId === 'string' &&
          /^[\w-]{1,100}$/.test(event.data.buildId)
        ) {
          setWaitingBuildId(event.data.buildId)
          return
        }
        if (event.data?.type !== 'UPDATE_DEFERRED') return
        clearTimeout(updateTimerRef.current)
        refreshRequestedRef.current = false
        setUpdateDeferred(true)
      }
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        handleControllerChange,
      )
      navigator.serviceWorker.addEventListener('message', handleMessage)
      void navigator.serviceWorker
        .register(SERVICE_WORKER_URL, { updateViaCache: 'none' })
        .then((registration) => {
          if (!active) return
          const offer = (worker: ServiceWorker) => {
            if (!active) return
            waitingWorkerRef.current = worker
            setWaitingBuildId(undefined)
            setWaitingWorker(worker)
            try {
              worker.postMessage({ type: 'GET_BUILD_ID' })
            } catch {
              /* Older workers use script-URL dismissal only. */
            }
          }
          if (registration.waiting && navigator.serviceWorker.controller) {
            offer(registration.waiting)
          }
          registration.addEventListener('updatefound', () => {
            const installing = registration.installing
            installing?.addEventListener('statechange', () => {
              if (
                installing.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                offer(installing)
              }
            })
          })
        })
        .catch(() => {
          if (active) setUpdateFailure('更新检查暂时无法完成，请稍后重试。')
        })

      return () => {
        active = false
        clearTimeout(updateTimerRef.current)
        navigator.serviceWorker.removeEventListener(
          'controllerchange',
          handleControllerChange,
        )
        navigator.serviceWorker.removeEventListener('message', handleMessage)
      }
    }
  }, [])

  const visible =
    waitingWorker &&
    !isDismissedForSession(waitingWorker, waitingBuildId) &&
    shouldShowUpdate(pathname, interactionBusy)

  useEffect(() => {
    if (!visible) return

    const root = document.documentElement
    const updateNoticeHeight = () => {
      const height = Math.ceil(
        noticeRef.current?.getBoundingClientRect().height ?? 0,
      )
      root.style.setProperty('--update-notice-height', `${height}px`)
    }
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
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
      window.sessionStorage.setItem(
        UPDATE_DISMISSAL_KEY,
        getWaitingWorkerKey(waitingWorker, waitingBuildId),
      )
    } catch {
      // Keep the local dismissal useful when storage is unavailable.
    }
    setWaitingWorker(null)
  }

  function updateNow() {
    if (
      !waitingWorker ||
      document.documentElement.dataset.interactionBusy === 'true'
    )
      return

    try {
      refreshRequestedRef.current = true
      setUpdateDeferred(false)
      setUpdateFailure('')
      clearTimeout(updateTimerRef.current)
      updateTimerRef.current = setTimeout(() => {
        refreshRequestedRef.current = false
        setUpdateDeferred(true)
      }, 5000)
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    } catch {
      clearTimeout(updateTimerRef.current)
      refreshRequestedRef.current = false
      setUpdateFailure('更新暂时无法完成，请稍后重试。')
    }
  }

  return (
    <>
      {updateFailure ? (
        <span className="visually-hidden" role="status">
          {updateFailure}
        </span>
      ) : null}
      {visible ? (
        <aside className={styles.update} ref={noticeRef} role="status">
          <p>
            <strong>新版本已准备好</strong>
            <span>
              {updateDeferred
                ? '请先完成并关闭其他 SpeakMate 窗口，再重试更新；无法确认窗口状态时也会暂缓。'
                : '完成本轮并关闭其他窗口后，可重试更新。'}
            </span>
          </p>
          <button type="button" onClick={updateNow}>
            <ArrowClockwise aria-hidden size={18} weight="bold" />
            立即更新
          </button>
          <button type="button" className={styles.later} onClick={dismissLater}>
            稍后
          </button>
        </aside>
      ) : null}
    </>
  )
}
