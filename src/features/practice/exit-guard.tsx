'use client'

import { ArrowLeft, Warning } from '@phosphor-icons/react'
import Link from 'next/link'
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

import styles from './practice-stage.module.css'

export type ExitGuardState = 'clean' | 'draft' | 'recording' | 'processing'

const SENTINEL_KEY = '__speakmateExitGuard'
const ROUTE_STACK_KEY = 'speakmate-route-stack'

function getRouteStack() {
  try {
    const stored = window.sessionStorage.getItem(ROUTE_STACK_KEY)
    const parsed: unknown = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) && parsed.every((route) => typeof route === 'string')
      ? parsed
      : []
  } catch {
    return []
  }
}

function canReturnToExactRoute(fallbackHref: string) {
  return getRouteStack().at(-2) === fallbackHref
}

function resetRouteStack(fallbackHref: string) {
  window.sessionStorage.setItem(ROUTE_STACK_KEY, JSON.stringify([fallbackHref]))
}

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
  const current =
    state && typeof state === 'object' ? (state as Record<string, unknown>) : {}
  return { ...current, [SENTINEL_KEY]: id }
}

function removeSentinel(state: unknown, id: string) {
  if (!state || typeof state !== 'object') return state
  const current = state as Record<string, unknown>
  if (current[SENTINEL_KEY] !== id) return state
  const cleaned = { ...current }
  delete cleaned[SENTINEL_KEY]
  return Object.keys(cleaned).length ? cleaned : null
}

function GuardedExit({
  fallbackHref,
  onConfirmExit,
}: {
  fallbackHref: string
  onConfirmExit?: () => void
}) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const continueButtonRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLAnchorElement>(null)
  const restoreFocusRef = useRef(false)
  const confirmingRef = useRef(false)
  const returningToPreviousRef = useRef(false)
  const sentinelIdRef = useRef<string | undefined>(undefined)
  const sentinelCurrentRef = useRef(false)
  const cleanupVersionRef = useRef(0)
  const fallbackHrefRef = useRef(fallbackHref)
  const onConfirmExitRef = useRef(onConfirmExit)
  const replaceRef = useRef(router.replace)

  useLayoutEffect(() => {
    fallbackHrefRef.current = fallbackHref
    onConfirmExitRef.current = onConfirmExit
    replaceRef.current = router.replace
  }, [fallbackHref, onConfirmExit, router.replace])

  useLayoutEffect(() => {
    cleanupVersionRef.current += 1
    const sentinelId =
      sentinelIdRef.current ??
      `practice-exit-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`
    const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`
    sentinelIdRef.current = sentinelId

    if (
      (window.history.state as Record<string, unknown> | null)?.[
        SENTINEL_KEY
      ] !== sentinelId
    ) {
      window.history.pushState(
        sentinelState(window.history.state, sentinelId),
        '',
        currentHref,
      )
    }
    sentinelCurrentRef.current = true

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }

    function handlePopState(event: PopStateEvent) {
      sentinelCurrentRef.current = false
      if (confirmingRef.current) {
        onConfirmExitRef.current?.()
        if (returningToPreviousRef.current) return
        resetRouteStack(fallbackHrefRef.current)
        replaceRef.current(fallbackHrefRef.current)
        return
      }

      window.history.pushState(
        sentinelState(event.state, sentinelId),
        '',
        currentHref,
      )
      sentinelCurrentRef.current = true
      setDialogOpen(true)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
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
    const trigger = triggerRef.current
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
    returningToPreviousRef.current = canReturnToExactRoute(
      fallbackHrefRef.current,
    )
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

    onConfirmExitRef.current?.()
    if (returningToPreviousRef.current) {
      router.back()
      return
    }
    resetRouteStack(fallbackHrefRef.current)
    replaceRef.current(fallbackHrefRef.current)
  }

  return (
    <>
      <Link
        ref={triggerRef}
        className={styles.exitLink}
        href={fallbackHref}
        aria-label="退出本次练习"
        onClick={requestExit}
      >
        <ArrowLeft aria-hidden size={23} />
      </Link>

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
    <GuardedExit fallbackHref={fallbackHref} onConfirmExit={onConfirmExit} />
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
    if (canReturnToExactRoute(fallbackHref)) {
      router.back()
      return
    }
    resetRouteStack(fallbackHref)
    router.replace(fallbackHref)
  }

  return (
    <Link
      className={styles.exitLink}
      href={fallbackHref}
      aria-label="退出本次练习"
      onClick={exit}
    >
      <ArrowLeft aria-hidden size={23} />
    </Link>
  )
}
