'use client'

import { ArrowLeft, Warning } from '@phosphor-icons/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from 'react'

import type { PracticeStatus } from '@/domain/practice/machine'

import styles from './practice-stage.module.css'

export type ExitGuardState = 'clean' | 'draft' | 'recording' | 'processing'

const SENTINEL_KEY = '__speakmateExitGuard'

export function exitGuardState(
  status: PracticeStatus,
  draftTranscript: string,
  hasAudio: boolean,
): ExitGuardState {
  if (status === 'recording') return 'recording'
  if (status === 'submitting' || status === 'receiving') return 'processing'
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
  const continueButtonRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLAnchorElement>(null)
  const confirmingRef = useRef(false)
  const sentinelIdRef = useRef<string | undefined>(undefined)
  const sentinelCurrentRef = useRef(false)
  const fallbackHrefRef = useRef(fallbackHref)
  const onConfirmExitRef = useRef(onConfirmExit)
  const replaceRef = useRef(router.replace)

  useLayoutEffect(() => {
    fallbackHrefRef.current = fallbackHref
    onConfirmExitRef.current = onConfirmExit
    replaceRef.current = router.replace
  }, [fallbackHref, onConfirmExit, router.replace])

  useLayoutEffect(() => {
    const sentinelId = `practice-exit-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`
    const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`
    sentinelIdRef.current = sentinelId

    window.history.pushState(
      sentinelState(window.history.state, sentinelId),
      '',
      currentHref,
    )
    sentinelCurrentRef.current = true

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }

    function handlePopState(event: PopStateEvent) {
      sentinelCurrentRef.current = false
      if (confirmingRef.current) {
        onConfirmExitRef.current?.()
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
    }
  }, [])

  useEffect(() => {
    if (dialogOpen) continueButtonRef.current?.focus()
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
    setDialogOpen(false)
    triggerRef.current?.focus()
  }

  function confirmExit() {
    setDialogOpen(false)
    confirmingRef.current = true
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
      window.history.back()
      return
    }

    onConfirmExitRef.current?.()
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

      {dialogOpen ? (
        <div
          className={styles.exitBackdrop}
          onKeyDown={(event) => {
            if (event.key === 'Escape') continuePractice()
          }}
        >
          <section
            className={styles.exitDialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="practice-exit-title"
            aria-describedby="practice-exit-description"
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
          </section>
        </div>
      ) : null}
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
    return (
      <Link
        className={styles.exitLink}
        href={fallbackHref}
        aria-label="退出本次练习"
      >
        <ArrowLeft aria-hidden size={23} />
      </Link>
    )
  }

  return (
    <GuardedExit
      fallbackHref={fallbackHref}
      onConfirmExit={onConfirmExit}
    />
  )
}
