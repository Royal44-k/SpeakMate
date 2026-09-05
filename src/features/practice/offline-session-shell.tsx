'use client'

import { useSyncExternalStore } from 'react'

import { SessionResolver } from './session-resolver'

interface OfflineTarget {
  id: string
  scene?: string
  level?: string
}

export function OfflineSessionShell() {
  const clientReady = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )

  if (!clientReady) {
    return (
      <main aria-busy="true" className="route-status">
        正在恢复离线练习…
      </main>
    )
  }

  const url = new URL(window.location.href)
  const match = url.pathname.match(/^\/session\/([^/]+)$/)
  const target: OfflineTarget = {
    id: match ? decodeURIComponent(match[1]) : 'new',
    scene: url.searchParams.get('scene') ?? undefined,
    level: url.searchParams.get('level') ?? undefined,
  }

  return (
    <SessionResolver
      requestedId={target.id}
      queryScene={target.scene}
      queryLevel={target.level}
    />
  )
}
