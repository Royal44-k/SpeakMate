'use client'

import { ArrowLeft } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import type { MouseEvent } from 'react'

import { canGoBackWithinApp } from './navigation-history'
import { safeSourceHref } from './learning-routes'
import styles from './mobile-page-header.module.css'

const ROUTE_STACK_KEY = 'speakmate-route-stack'

type GuardState = 'clean' | 'draft' | 'recording' | 'processing'

function getRouteStack() {
  try {
    const storedStack = window.sessionStorage.getItem(ROUTE_STACK_KEY)
    const parsedStack: unknown = storedStack ? JSON.parse(storedStack) : []

    return Array.isArray(parsedStack) &&
      parsedStack.length <= 24 &&
      parsedStack.every(
        (route) =>
          typeof route === 'string' &&
          route.length <= 2000 &&
          safeSourceHref(route),
      )
      ? parsedStack.map((route) => safeSourceHref(route)!)
      : []
  } catch {
    return []
  }
}

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

    const stack = getRouteStack()
    if (canGoBackWithinApp(stack) && stack.at(-2) === source) {
      event.preventDefault()
      router.back()
    }
  }

  return (
    <a
      className={styles.backLink}
      href={source}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      <ArrowLeft aria-hidden size={22} weight="bold" />
    </a>
  )
}
