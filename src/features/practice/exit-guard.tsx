'use client'

import { ArrowLeft, Warning } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import { createPortal } from 'react-dom'

import type { PracticeStatus } from '@/domain/practice/machine'
import {
  canReturnToRoute,
  registerSavedNavigationRelease,
  ROUTE_ENTRY_KEY,
} from '@/components/app-shell/navigation-history'
import {
  navigateLocalHref,
  safeSourceHref,
} from '@/components/app-shell/learning-routes'

import styles from './practice-stage.module.css'

export type ExitGuardState = 'clean' | 'draft' | 'recording' | 'processing'

const SENTINEL_KEY = '__speakmateExitGuard'

export function exitGuardState(
  status: PracticeStatus,
  draftTranscript: string,
  hasAudio: boolean,
): ExitGuardState {
  if (status === 'recording') return 'recording'
  if (
    status === 'submitting' ||
    status === 'receiving' ||
    status === 'completing'
  )
    return 'processing'
  if (draftTranscript.trim() || hasAudio) return 'draft'
  return 'clean'
}

function sentinelState(state: unknown, id: string) {
  return {
    ...(state && typeof state === 'object' ? state : {}),
    [SENTINEL_KEY]: id,
  }
}

function removeSentinel(state: unknown, id: string) {
  if (!state || typeof state !== 'object') return state
  const current = state as Record<string, unknown>
  if (current[SENTINEL_KEY] !== id) return state
  // Back cannot erase the forward-retained physical entry. It is not proof
  // that one later Back reaches the previous app route, even with the same ID.
  const next: Record<string, unknown> = {
    ...current,
    __speakmateRoutePlaceholder: true,
  }
  delete next[SENTINEL_KEY]
  return next
}

function GuardedExit({
  fallbackHref,
  onConfirmExit,
  state,
}: {
  fallbackHref: string
  onConfirmExit?: () => void
  state: ExitGuardState
}) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const continueButtonRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLAnchorElement>(null)
  const requestedHrefRef = useRef<string | undefined>(undefined)
  const requestedReturnRef = useRef(true)
  const requestedTriggerRef = useRef<HTMLAnchorElement | null>(null)
  const restoreFocusRef = useRef(false)
  const confirmingRef = useRef(false)
  const returningToPreviousRef = useRef(false)
  const sentinelIdRef = useRef<string | undefined>(undefined)
  const sentinelCurrentRef = useRef(false)
  const cleanupVersionRef = useRef(0)
  const stateRef = useRef(state)
  const navigationRelease = useRef<
    | {
        resolve: () => void
        reject: (error: Error) => void
        timer: ReturnType<typeof setTimeout>
        sourceId: unknown
      }
    | undefined
  >(undefined)
  const releaseAttempted = useRef(false)
  const fallbackHrefRef = useRef(fallbackHref)
  const onConfirmExitRef = useRef(onConfirmExit)
  const replaceRef = useRef((href: string) =>
    navigateLocalHref(
      href,
      true,
      requestedReturnRef.current ? 'return' : 'forward',
    ),
  )

  useLayoutEffect(() => {
    stateRef.current = state
    fallbackHrefRef.current = fallbackHref
    onConfirmExitRef.current = onConfirmExit
    replaceRef.current = (href: string) =>
      navigateLocalHref(
        href,
        true,
        requestedReturnRef.current ? 'return' : 'forward',
      )
  }, [fallbackHref, onConfirmExit, router.replace, state])

  useLayoutEffect(() => {
    cleanupVersionRef.current += 1
    const sentinelId =
      sentinelIdRef.current ??
      `practice-exit-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`
    const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`
    const sourceId = window.history.state?.[ROUTE_ENTRY_KEY]
    sentinelIdRef.current = sentinelId

    if (
      (window.history.state as Record<string, unknown> | null)?.[
        SENTINEL_KEY
      ] !== sentinelId
    ) {
      try {
        window.history.pushState(
          sentinelState(window.history.state, sentinelId),
          '',
          currentHref,
        )
      } catch {
        /* Explicit confirmation and beforeunload still guard drafts. */
      }
    }
    sentinelCurrentRef.current = history.state?.[SENTINEL_KEY] === sentinelId
    const unregisterRelease = registerSavedNavigationRelease((target) => {
      if (
        stateRef.current !== 'processing' ||
        confirmingRef.current ||
        navigationRelease.current ||
        !sentinelCurrentRef.current ||
        history.state?.[SENTINEL_KEY] !== sentinelId
      )
        return Promise.reject(
          new Error('当前输入尚未释放，请保留已保存记录并重试入口。'),
        )
      return new Promise<void>((resolve, reject) => {
        releaseAttempted.current = true
        const timer = setTimeout(() => {
          navigationRelease.current = undefined
          reject(
            new Error('等待返回原历史条目超时；记录已保存，请使用保留入口。'),
          )
        }, 1500)
        navigationRelease.current = { resolve, reject, timer, sourceId }
        confirmingRef.current = true
        try {
          // A forward-retained placeholder must never retain the obsolete id=new URL.
          const placeholder = {
            ...history.state,
            __speakmateRoutePlaceholder: true,
          }
          delete placeholder[SENTINEL_KEY]
          history.replaceState(placeholder, '', target)
          sentinelCurrentRef.current = false
          history.back()
        } catch {
          clearTimeout(timer)
          navigationRelease.current = undefined
          reject(new Error('浏览器历史不可用；记录已保存，请使用保留入口。'))
        }
      })
    })

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (confirmingRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }

    function handlePopState(event: PopStateEvent) {
      sentinelCurrentRef.current = false
      const pending = navigationRelease.current
      if (pending) {
        clearTimeout(pending.timer)
        navigationRelease.current = undefined
        if (
          `${location.pathname}${location.search}${location.hash}` !==
            currentHref ||
          event.state?.[ROUTE_ENTRY_KEY] !== pending.sourceId ||
          event.state?.[SENTINEL_KEY]
        )
          pending.reject(new Error('返回条目不匹配；没有执行旧跳转。'))
        else pending.resolve()
        return
      }
      if (releaseAttempted.current) return
      if (confirmingRef.current) {
        if (returningToPreviousRef.current) return
        replaceRef.current(fallbackHrefRef.current)
        return
      }

      try {
        window.history.pushState(
          sentinelState(event.state, sentinelId),
          '',
          currentHref,
        )
      } catch {
        /* Fall back to explicit guarded links. */
      }
      sentinelCurrentRef.current = history.state?.[SENTINEL_KEY] === sentinelId
      requestedHrefRef.current = undefined
      requestedReturnRef.current = true
      requestedTriggerRef.current = null
      setDialogOpen(true)
    }

    function handleDocumentClick(event: globalThis.MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      )
        return
      const anchor =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>('a[href]')
          : null
      if (
        !anchor ||
        anchor === triggerRef.current ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download')
      )
        return
      const url = new URL(anchor.href, window.location.href)
      const href =
        url.origin === window.location.origin
          ? safeSourceHref(url.pathname + url.search)
          : undefined
      if (!href || href === currentHref) return
      event.preventDefault()
      event.stopPropagation()
      if (releaseAttempted.current) return
      requestedHrefRef.current = href
      requestedReturnRef.current = anchor.hasAttribute('data-return-to-source')
      requestedTriggerRef.current = anchor
      setDialogOpen(true)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)
    document.addEventListener('click', handleDocumentClick, true)

    return () => {
      unregisterRelease()
      const pending = navigationRelease.current
      if (pending) {
        clearTimeout(pending.timer)
        navigationRelease.current = undefined
        pending.reject(new Error('页面已卸载；没有执行旧跳转。'))
      }
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
      document.removeEventListener('click', handleDocumentClick, true)
      const cleanupVersion = ++cleanupVersionRef.current

      queueMicrotask(() => {
        if (cleanupVersionRef.current !== cleanupVersion) return
        if (
          sentinelCurrentRef.current &&
          (window.history.state as Record<string, unknown> | null)?.[
            SENTINEL_KEY
          ] === sentinelId
        ) {
          window.history.replaceState(
            removeSentinel(window.history.state, sentinelId),
            '',
          )
          sentinelCurrentRef.current = false
          window.history.back()
        }
        sentinelIdRef.current = undefined
      })
    }
  }, [])

  useLayoutEffect(() => {
    if (!dialogOpen) return

    const dialog = dialogRef.current
    const trigger = requestedTriggerRef.current ?? triggerRef.current
    if (!dialog) return
    const isolatedElements = Array.from(document.body.children)
      .filter((element): element is HTMLElement => {
        return element instanceof HTMLElement && element !== dialog
      })
      .map((element) => ({
        element,
        hadInert: element.hasAttribute('inert'),
        ariaHidden: element.getAttribute('aria-hidden'),
      }))

    if (typeof dialog.showModal === 'function') {
      dialog.showModal()
    } else {
      dialog.setAttribute('open', '')
    }
    continueButtonRef.current?.focus()
    for (const { element } of isolatedElements) {
      element.setAttribute('inert', '')
      element.setAttribute('aria-hidden', 'true')
    }

    return () => {
      if (typeof dialog.close === 'function' && dialog.open) {
        dialog.close()
      } else {
        dialog.removeAttribute('open')
      }
      for (const { element, hadInert, ariaHidden } of isolatedElements) {
        if (!hadInert) element.removeAttribute('inert')
        if (ariaHidden === null) {
          element.removeAttribute('aria-hidden')
        } else {
          element.setAttribute('aria-hidden', ariaHidden)
        }
      }
      if (restoreFocusRef.current) {
        restoreFocusRef.current = false
        trigger?.focus()
      }
    }
  }, [dialogOpen])

  function requestExit(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }

    event.preventDefault()
    if (releaseAttempted.current) return
    requestedHrefRef.current = undefined
    requestedReturnRef.current = true
    requestedTriggerRef.current = null
    setDialogOpen(true)
  }

  function continuePractice() {
    restoreFocusRef.current = true
    setDialogOpen(false)
  }

  function keepFocusInDialog(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      continuePractice()
      return
    }
    if (event.key !== 'Tab') return

    const dialog = dialogRef.current
    if (!dialog) return
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    )
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) {
      event.preventDefault()
      return
    }

    if (
      event.shiftKey &&
      (document.activeElement === first ||
        !dialog.contains(document.activeElement))
    ) {
      event.preventDefault()
      last.focus()
    } else if (
      !event.shiftKey &&
      (document.activeElement === last ||
        !dialog.contains(document.activeElement))
    ) {
      event.preventDefault()
      first.focus()
    }
  }

  function confirmExit() {
    setDialogOpen(false)
    confirmingRef.current = true
    if (requestedHrefRef.current)
      fallbackHrefRef.current = requestedHrefRef.current
    onConfirmExitRef.current?.()
    returningToPreviousRef.current =
      requestedReturnRef.current && canReturnToRoute(fallbackHrefRef.current)
    const sentinelId = sentinelIdRef.current
    if (
      sentinelId &&
      sentinelCurrentRef.current &&
      (window.history.state as Record<string, unknown> | null)?.[
        SENTINEL_KEY
      ] === sentinelId
    ) {
      window.history.replaceState(
        removeSentinel(window.history.state, sentinelId),
        '',
      )
      sentinelCurrentRef.current = false
      if (returningToPreviousRef.current) {
        window.history.go(-2)
      } else {
        window.history.back()
      }
      return
    }

    if (returningToPreviousRef.current) {
      router.back()
      return
    }
    replaceRef.current(fallbackHrefRef.current)
  }

  return (
    <>
      <a
        ref={triggerRef}
        className={styles.exitLink}
        href={fallbackHref}
        aria-label="退出本次练习"
        onClick={requestExit}
      >
        <ArrowLeft aria-hidden size={23} />
      </a>

      {dialogOpen
        ? createPortal(
            <dialog
              ref={dialogRef}
              className={styles.exitDialog}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="practice-exit-title"
              aria-describedby="practice-exit-description"
              onCancel={(event) => {
                event.preventDefault()
                continuePractice()
              }}
              onKeyDown={keepFocusInDialog}
            >
              <span className={styles.exitWarning}>
                <Warning aria-hidden size={24} weight="fill" />
              </span>
              <h2 id="practice-exit-title">退出本次练习？</h2>
              <p id="practice-exit-description">
                当前这轮还没有完成，退出后未提交的录音或文字会丢失。
              </p>
              <div className={styles.exitActions}>
                <button
                  ref={continueButtonRef}
                  type="button"
                  onClick={continuePractice}
                >
                  继续练习
                </button>
                <button type="button" onClick={confirmExit}>
                  退出
                </button>
              </div>
            </dialog>,
            document.body,
          )
        : null}
    </>
  )
}

export function ExitGuard({
  state,
  fallbackHref,
  onConfirmExit,
}: {
  state: ExitGuardState
  fallbackHref: string
  onConfirmExit?: () => void
}) {
  if (state === 'clean') {
    return <CleanExit fallbackHref={fallbackHref} />
  }

  return (
    <GuardedExit
      state={state}
      fallbackHref={fallbackHref}
      onConfirmExit={onConfirmExit}
    />
  )
}

function CleanExit({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter()

  function exit(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }

    event.preventDefault()
    if (canReturnToRoute(fallbackHref)) {
      router.back()
      return
    }
    navigateLocalHref(fallbackHref, true, 'return')
  }

  return (
    <a
      className={styles.exitLink}
      href={fallbackHref}
      aria-label="退出本次练习"
      onClick={exit}
    >
      <ArrowLeft aria-hidden size={23} />
    </a>
  )
}
