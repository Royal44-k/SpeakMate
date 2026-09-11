'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { replaceLocalFilterHref } from '@/components/app-shell/learning-routes'

import { CEFR_LEVELS, type CefrLevel } from '@/domain/scenes/types'
import {
  createIndexedDbRepositories,
  type Repositories,
} from '@/infrastructure/persistence/repositories'

import {
  restoreSceneFilters,
  rememberSceneFilters,
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
  const searchParams = useSearchParams()
  const levelParam = searchParams.get('level')
  const [profiles] = useState(
    () => profileRepository ?? createIndexedDbRepositories().profiles,
  )
  const [profileFallback, setProfileFallback] = useState<
    { request: string; level: CefrLevel } | undefined
  >()
  const [profileLoadFailed, setProfileLoadFailed] = useState(false)
  const [profileLoadAttempt, setProfileLoadAttempt] = useState(0)
  const [levelSaveError, setLevelSaveError] = useState(false)
  const levelSaveQueue = useRef(Promise.resolve())
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  const fallbackRequest = levelParam ?? ''

  useEffect(() => {
    if (isLevel(levelParam)) return

    let active = true
    void profiles
      .ensureGuestProfile()
      .then((profile) => {
        if (active) {
          setProfileFallback({ request: fallbackRequest, level: profile.level })
          setProfileLoadFailed(false)
        }
      })
      .catch(() => {
        if (active) {
          setProfileFallback({ request: fallbackRequest, level: 'A2' })
          setProfileLoadFailed(true)
        }
      })

    return () => {
      active = false
    }
  }, [fallbackRequest, levelParam, profileLoadAttempt, profiles])

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

  const publicQuery = searchParams.toString()
  useEffect(() => {
    if (!fallbackLevel || !new URLSearchParams(publicQuery).has('q')) return
    const restored = restoreSceneFilters(
      new URLSearchParams(publicQuery),
      fallbackLevel,
    )
    rememberSceneFilters(restored)
    replaceLocalFilterHref(sceneLibraryHref(restored))
  }, [publicQuery, fallbackLevel])

  if (!fallbackLevel) {
    return (
      <main aria-busy="true" aria-label="场景库加载中">
        正在加载场景库…
      </main>
    )
  }

  const initialState = restoreSceneFilters(
    new URLSearchParams(searchParams.toString()),
    fallbackLevel,
  )

  function handleStateChange(
    next: SceneFilterState,
    source: 'search' | 'filter',
  ) {
    rememberSceneFilters(next)
    const replace = () => replaceLocalFilterHref(sceneLibraryHref(next))

    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (source === 'search') {
      searchTimer.current = setTimeout(replace, 250)
      return
    }

    replace()
  }

  return (
    <>
      {levelSaveError ? (
        <p className="route-recovery" role="alert">
          本次筛选已生效，但默认水平未能保存。请重新选择水平再试。
        </p>
      ) : null}
      {profileLoadFailed ? (
        <section className="route-recovery" role="alert">
          <p>无法读取本地水平，已暂用 A2。你的学习记录没有被删除。</p>
          <button
            type="button"
            onClick={() => {
              setProfileLoadFailed(false)
              setProfileLoadAttempt((attempt) => attempt + 1)
            }}
          >
            重试读取水平
          </button>
        </section>
      ) : null}
      <SceneLibrary
        initialState={initialState}
        onStateChange={handleStateChange}
        onLevelChange={(level) => {
          levelSaveQueue.current = levelSaveQueue.current
            .then(async () => {
              const profile = await profiles.ensureGuestProfile()
              await profiles.save({
                ...profile,
                level,
                updatedAt: new Date().toISOString(),
              })
              setLevelSaveError(false)
            })
            .catch(() => setLevelSaveError(true))
        }}
      />
    </>
  )
}
