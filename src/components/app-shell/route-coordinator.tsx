'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import {
  visitRoute,
  nativeEntryId,
  prepareRouteNavigation,
  commitPendingNavigation,
  cancelRouteNavigation,
} from './navigation-history'
import { safeSourceHref } from './learning-routes'

const SCROLL_KEY = 'speakmate-route-scroll-v1'
function getScrolls(): Array<[string, number, string?, string?]> {
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
            ((value.length === 3 ||
              (value.length === 4 &&
                typeof value[3] === 'string' &&
                /^[\w-]{1,100}$/.test(value[3]))) &&
              typeof value[2] === 'string' &&
              value[2].length <= 2000 &&
              (!!safeSourceHref(value[2]) ||
                (value.length === 4 && value[2] === '')))) &&
          typeof value[0] === 'string' &&
          value[0].length <= 2000 &&
          Number.isFinite(value[1]) &&
          value[1] >= 0 &&
          value[1] <= 1000000,
      )
      ? values
          .map(
            (value) =>
              (value.length === 4
                ? [
                    safeSourceHref(value[0]) ?? '',
                    value[1],
                    safeSourceHref(value[2]) ?? '',
                    value[3],
                  ]
                : value[2]
                  ? [
                      safeSourceHref(value[0]) ?? '',
                      value[1],
                      safeSourceHref(value[2]),
                    ]
                  : [safeSourceHref(value[0]) ?? '', value[1]]) as [
                string,
                number,
                string?,
                string?,
              ],
          )
          .filter((value) => !!value[0])
      : []
  } catch {
    return []
  }
}

export function RouteCoordinator() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const announcementRef = useRef<HTMLSpanElement>(null)
  const traversalPending = useRef(false)
  const [traversal, setTraversal] = useState(0)
  useEffect(() => {
    const changed = () => {
      traversalPending.current = true
      cancelRouteNavigation()
      setTraversal((value) => value + 1)
    }
    const leaving = (event: BeforeUnloadEvent) => {
      queueMicrotask(() => {
        if (event.defaultPrevented) cancelRouteNavigation()
      })
    }
    const clicked = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>('a[href]')
          : null
      if (!link || link.target === '_blank' || link.hasAttribute('download'))
        return
      const target = new URL(link.href, location.href)
      prepareRouteNavigation(
        target.origin === location.origin
          ? target.pathname + target.search
          : '/',
        link.hasAttribute('data-return-to-source') ? 'return' : 'forward',
        false,
      )
    }
    window.addEventListener('popstate', changed)
    window.addEventListener('pageshow', changed)
    document.addEventListener('click', clicked)
    window.addEventListener('pagehide', commitPendingNavigation)
    window.addEventListener('pointerdown', cancelRouteNavigation, true)
    window.addEventListener('keydown', cancelRouteNavigation, true)
    window.addEventListener('beforeunload', leaving)
    return () => {
      window.removeEventListener('popstate', changed)
      window.removeEventListener('pageshow', changed)
      document.removeEventListener('click', clicked)
      window.removeEventListener('pagehide', commitPendingNavigation)
      window.removeEventListener('pointerdown', cancelRouteNavigation, true)
      window.removeEventListener('keydown', cancelRouteNavigation, true)
      window.removeEventListener('beforeunload', leaving)
    }
  }, [])
  const search = searchParams.toString()
  const route =
    safeSourceHref(search ? `${pathname}?${search}` : pathname) ?? pathname

  useEffect(() => {
    // Next restores native traversal in a transition. Do not pair the new
    // history identity with still-rendered hooks/DOM from the previous route.
    if (traversalPending.current) {
      const destination = safeSourceHref(location.pathname + location.search)
      if (destination !== route) return
      traversalPending.current = false
    }
    const nextHistory = visitRoute(route)
    const entryId = nativeEntryId()

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
              ...getScrolls().filter((value) =>
                entryId ? value[3] !== entryId : value[0] !== route,
              ),
              entryId
                ? [route, top, focused ?? '', entryId]
                : focused
                  ? [route, top, focused]
                  : [route, top],
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
    if (nextHistory.kind === 'same') return dispose
    if (nextHistory.kind === 'traverse' || nextHistory.kind === 'return') {
      const saved = getScrolls()
        .reverse()
        .find((value) =>
          nextHistory.kind === 'return'
            ? value[0] === route
            : value[3]
              ? value[3] === entryId
              : value[0] === route,
        )
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
  }, [pathname, route, traversal])

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
