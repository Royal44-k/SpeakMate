'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { trackRoute } from './navigation-history'
import { safeSourceHref, semanticRouteIdentity } from './learning-routes'

const ROUTE_STACK_KEY = 'speakmate-route-stack'
const SCROLL_KEY = 'speakmate-route-scroll-v1'
function getScrolls(): Array<[string, number, string?]> {
  try {
    const values: unknown = JSON.parse(
      window.sessionStorage.getItem(SCROLL_KEY) ?? '[]',
    )
    return Array.isArray(values) &&
      values.length <= 24 &&
      values.every(
        (value) =>
          Array.isArray(value) &&
          (value.length === 2 ||
            (value.length === 3 &&
              typeof value[2] === 'string' &&
              value[2].length <= 2000 &&
              !!safeSourceHref(value[2]))) &&
          typeof value[0] === 'string' &&
          value[0].length <= 2000 &&
          Number.isFinite(value[1]) &&
          value[1] >= 0 &&
          value[1] <= 1000000,
      )
      ? values
          .map(
            (value) =>
              (value[2]
                ? [
                    safeSourceHref(value[0]) ?? '',
                    value[1],
                    safeSourceHref(value[2]),
                  ]
                : [safeSourceHref(value[0]) ?? '', value[1]]) as [
                string,
                number,
                string?,
              ],
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
      const focused =
        document.activeElement instanceof HTMLAnchorElement
          ? safeSourceHref(
              document.activeElement.getAttribute('href') ?? undefined,
            )
          : undefined
      try {
        window.sessionStorage.setItem(
          SCROLL_KEY,
          JSON.stringify(
            [
              ...getScrolls().filter((value) => value[0] !== route),
              focused ? [route, top, focused] : [route, top],
            ].slice(-24),
          ),
        )
      } catch {
        /* Explicit return still works without position storage. */
      }
    }
    window.addEventListener('pagehide', saveScroll)
    window.addEventListener('scroll', saveScroll, { passive: true })
    window.addEventListener('pointerdown', stopRestoring, { once: true })
    window.addEventListener('keydown', stopRestoring, { once: true })
    window.addEventListener('wheel', stopRestoring, {
      once: true,
      passive: true,
    })
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
      const saved = getScrolls().find((value) => value[0] === route)
      const top = saved?.[1]
      if (top !== undefined) {
        restoring = true
        const restore = () => {
          window.scrollTo({ top, behavior: 'instant' })
          const source = saved?.[2]
          const control = source
            ? Array.from(
                document.querySelectorAll<HTMLAnchorElement>('a[href]'),
              ).find(
                (link) =>
                  safeSourceHref(link.getAttribute('href') ?? undefined) ===
                  source,
              )
            : undefined
          control?.focus({ preventScroll: true })
          if (Math.abs(window.scrollY - top) < 2 && (!source || control))
            stopRestoring()
        }
        restore()
        if (restoring) {
          observer = new MutationObserver(restore)
          observer.observe(document.body, { childList: true, subtree: true })
          timer = setTimeout(stopRestoring, 3000)
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
      const task =
        document.querySelector<HTMLElement>('[data-focus-task]')?.dataset
          .focusTask
      const card =
        task && ['warmup', 'scene', 'consolidation', 'extension'].includes(task)
          ? document.getElementById(`task-${task}`)
          : undefined
      ;(card ?? title).focus({ preventScroll: true })
      card?.scrollIntoView?.({ block: 'start' })
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
