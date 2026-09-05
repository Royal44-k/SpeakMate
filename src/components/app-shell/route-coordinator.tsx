'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { trackRoute } from './navigation-history'

const ROUTE_STACK_KEY = 'speakmate-route-stack'

function getRouteStack() {
  try {
    const storedStack = window.sessionStorage.getItem(ROUTE_STACK_KEY)
    const parsedStack: unknown = storedStack ? JSON.parse(storedStack) : []

    return Array.isArray(parsedStack) && parsedStack.every((route) => typeof route === 'string')
      ? parsedStack
      : []
  } catch {
    return []
  }
}

export function RouteCoordinator() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const announcementRef = useRef<HTMLSpanElement>(null)
  const search = searchParams.toString()
  const route = search ? `${pathname}?${search}` : pathname

  useEffect(() => {
    const nextHistory = trackRoute(getRouteStack(), route)
    window.sessionStorage.setItem(ROUTE_STACK_KEY, JSON.stringify(nextHistory.stack))

    if (nextHistory.kind !== 'forward') return

    const title = document.querySelector<HTMLElement>('[data-page-title]')
    if (announcementRef.current) {
      announcementRef.current.textContent = title?.textContent?.trim() ?? ''
    }

    if (document.activeElement === document.body) {
      title?.focus()
    }
  }, [route])

  return (
    <span
      aria-atomic="true"
      aria-live="polite"
      ref={announcementRef}
      role="status"
      style={{
        blockSize: 1,
        clipPath: 'inset(50%)',
        inlineSize: 1,
        overflow: 'hidden',
        position: 'absolute',
        whiteSpace: 'nowrap',
      }}
    >
      {' '}
    </span>
  )
}
