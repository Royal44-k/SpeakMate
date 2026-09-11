'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { trackRoute } from './navigation-history'
import { safeSourceHref, semanticRouteIdentity } from './learning-routes'

const ROUTE_STACK_KEY = 'speakmate-route-stack'
const SCROLL_KEY = 'speakmate-route-scroll-v1'
function getScrolls(): Array<[string, number]> {
  try {
    const values: unknown = JSON.parse(
      window.sessionStorage.getItem(SCROLL_KEY) ?? '[]',
    )
    return Array.isArray(values) &&
      values.length <= 24 &&
      values.every(
        (value) =>
          Array.isArray(value) &&
          value.length === 2 &&
          typeof value[0] === 'string' &&
          value[0].length <= 2000 &&
          Number.isFinite(value[1]) &&
          value[1] >= 0 &&
          value[1] <= 1000000,
      )
      ? values
          .map(
            (value) =>
              [safeSourceHref(value[0]) ?? '', value[1]] as [string, number],
          )
          .filter((value) => !!value[0])
      : []
  } catch {
    return []
  }
}

function getRouteStack() {
  try {
    const storedStack = window.sessionStorage.getItem(ROUTE_STACK_KEY)
    const parsedStack: unknown = storedStack ? JSON.parse(storedStack) : []

    return Array.isArray(parsedStack) &&
      parsedStack.length <= 24 &&
      parsedStack.every(
        (route) => typeof route === 'string' && route.length <= 2000,
      )
      ? parsedStack
          .map((route) => safeSourceHref(route))
          .filter((route): route is string => !!route)
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
  const route =
    safeSourceHref(search ? `${pathname}?${search}` : pathname) ?? pathname

  useEffect(() => {
    const currentHistory = getRouteStack()
    const previousIdentity = currentHistory.at(-1)
      ? semanticRouteIdentity(currentHistory.at(-1)!)
      : undefined
    const nextHistory = trackRoute(currentHistory, route)
    try {
      window.sessionStorage.setItem(
        ROUTE_STACK_KEY,
        JSON.stringify(nextHistory.stack),
      )
    } catch {
      /* Navigation remains usable; no saved-position claim. */
    }

    let observer: MutationObserver | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    let restoring = false
    const stopRestoring = () => {
      restoring = false
      observer?.disconnect()
      clearTimeout(timer)
    }
    const saveScroll = () => {
      if (restoring) return
      const top = Math.max(0, Math.min(1000000, window.scrollY))
      try {
        window.sessionStorage.setItem(
          SCROLL_KEY,
          JSON.stringify(
            [
              ...getScrolls().filter((value) => value[0] !== route),
              [route, top],
            ].slice(-24),
          ),
        )
      } catch {
        /* Explicit return still works without position storage. */
      }
    }
    window.addEventListener('pagehide', saveScroll)
    window.addEventListener('scroll', saveScroll, { passive: true })
    const dispose = () => {
      stopRestoring()
      window.removeEventListener('pagehide', saveScroll)
      window.removeEventListener('scroll', saveScroll)
      window.removeEventListener('pointerdown', stopRestoring)
      window.removeEventListener('keydown', stopRestoring)
      window.removeEventListener('wheel', stopRestoring)
    }
    if (
      nextHistory.kind !== 'forward' ||
      previousIdentity === semanticRouteIdentity(route)
    ) {
      const top = getScrolls().find((value) => value[0] === route)?.[1]
      if (top !== undefined) {
        restoring = true
        const restore = () => {
          window.scrollTo({ top, behavior: 'instant' })
          if (Math.abs(window.scrollY - top) < 2) stopRestoring()
        }
        restore()
        if (restoring) {
          observer = new MutationObserver(restore)
          observer.observe(document.body, { childList: true, subtree: true })
          timer = setTimeout(stopRestoring, 3000)
          window.addEventListener('pointerdown', stopRestoring, { once: true })
          window.addEventListener('keydown', stopRestoring, { once: true })
          window.addEventListener('wheel', stopRestoring, {
            once: true,
            passive: true,
          })
        }
      }
      return dispose
    }

    const focusPageTitle = () => {
      const title = document.querySelector<HTMLElement>('[data-page-title]')
      if (!title) return false
      if (announcementRef.current) {
        announcementRef.current.textContent = title.textContent?.trim() ?? ''
      }
      title.focus({ preventScroll: true })
      return true
    }

    if (focusPageTitle()) return dispose

    observer = new MutationObserver(() => {
      if (focusPageTitle()) observer?.disconnect()
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return dispose
  }, [pathname, route])

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
