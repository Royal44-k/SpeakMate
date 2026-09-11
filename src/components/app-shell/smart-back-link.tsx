'use client'

import { ArrowLeft } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import type { MouseEvent } from 'react'

import { canReturnToRoute } from './navigation-history'
import { safeSourceHref } from './learning-routes'
import styles from './mobile-page-header.module.css'

type GuardState = 'clean' | 'draft' | 'recording' | 'processing'

export function SmartBackLink({
  fallbackHref,
  ariaLabel,
  guardState = 'clean',
  onGuardedBack,
}: {
  fallbackHref: string
  ariaLabel: string
  guardState?: GuardState
  onGuardedBack?: () => void
}) {
  const router = useRouter()
  const source = safeSourceHref(fallbackHref) ?? '/'

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
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

    if (guardState !== 'clean') {
      if (onGuardedBack) {
        event.preventDefault()
        onGuardedBack()
      }
      return
    }

    if (canReturnToRoute(source)) {
      event.preventDefault()
      router.back()
    }
  }

  return (
    <a
      data-return-to-source
      className={styles.backLink}
      href={source}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      <ArrowLeft aria-hidden size={22} weight="bold" />
    </a>
  )
}
