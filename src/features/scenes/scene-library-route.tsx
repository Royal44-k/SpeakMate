'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { CEFR_LEVELS, type CefrLevel } from '@/domain/scenes/types'
import {
  createIndexedDbRepositories,
  type Repositories,
} from '@/infrastructure/persistence/repositories'

import {
  parseSceneFilterState,
  sceneLibraryHref,
  type SceneFilterState,
} from './scene-filter-state'
import { SceneLibrary } from './scene-library'

interface SceneLibraryRouteProps {
  profileRepository?: Repositories['profiles']
}

function isLevel(value: string | null): value is CefrLevel {
  return CEFR_LEVELS.includes(value as CefrLevel)
}

export function SceneLibraryRoute({
  profileRepository,
}: SceneLibraryRouteProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const levelParam = searchParams.get('level')
  const [profiles] = useState(
    () => profileRepository ?? createIndexedDbRepositories().profiles,
  )
  const [profileFallback, setProfileFallback] = useState<
    { request: string; level: CefrLevel } | undefined
  >()
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  const fallbackRequest = levelParam ?? ''

  useEffect(() => {
    if (isLevel(levelParam)) return

    let active = true
    void profiles.ensureGuestProfile().then((profile) => {
      if (active) {
        setProfileFallback({ request: fallbackRequest, level: profile.level })
      }
    })

    return () => {
      active = false
    }
  }, [fallbackRequest, levelParam, profiles])

  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    },
    [],
  )

  const fallbackLevel = isLevel(levelParam)
    ? levelParam
    : profileFallback?.request === fallbackRequest
      ? profileFallback.level
      : undefined

  if (!fallbackLevel) {
    return (
      <main aria-busy="true" aria-label="场景库加载中">
        正在加载场景库…
      </main>
    )
  }

  const initialState = parseSceneFilterState(
    new URLSearchParams(searchParams.toString()),
    fallbackLevel,
  )

  function handleStateChange(
    next: SceneFilterState,
    source: 'search' | 'filter',
  ) {
    const replace = () =>
      router.replace(sceneLibraryHref(next), { scroll: false })

    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (source === 'search') {
      searchTimer.current = setTimeout(replace, 250)
      return
    }

    replace()
  }

  return (
    <SceneLibrary
      key={searchParams.toString()}
      initialState={initialState}
      onStateChange={handleStateChange}
    />
  )
}
