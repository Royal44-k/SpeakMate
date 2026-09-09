'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { SCENE_CATALOG, getSceneBySlug } from '@/content/scenes/catalog'
import type { PracticeSession } from '@/domain/practice/types'
import { adaptScene } from '@/domain/scenes/adapt-scene'
import {
  CEFR_LEVELS,
  type AdaptedScene,
  type CefrLevel,
} from '@/domain/scenes/types'
import {
  createIndexedDbRepositories,
  type Repositories,
} from '@/infrastructure/persistence/repositories'
import { isSceneLibraryHref } from '@/features/scenes/scene-filter-state'

import { PracticeStage } from './practice-stage'
import styles from './session-resolver.module.css'

interface SessionResolverProps {
  requestedId: string
  queryScene?: string
  queryLevel?: string
  queryFrom?: string
  queryRound?: string
  repositories?: Repositories
}

type Resolution =
  | { status: 'loading' }
  | {
      status: 'ready'
      requestKey: string
      scene: AdaptedScene
      sessionId: string
      completed: boolean
    }
  | { status: 'error'; requestKey: string; message: string }

function queryLevelOrDefault(value?: string): CefrLevel {
  return CEFR_LEVELS.includes(value as CefrLevel) ? (value as CefrLevel) : 'A2'
}

function restoreScene(session: PracticeSession): AdaptedScene | undefined {
  if (
    session.sceneSnapshot &&
    session.sceneSnapshot.id === session.sceneId &&
    session.sceneSnapshot.version === session.sceneVersion &&
    session.sceneSnapshot.level === session.level
  ) {
    return session.sceneSnapshot
  }
  const definition = SCENE_CATALOG.find(
    (scene) =>
      scene.id === session.sceneId && scene.version === session.sceneVersion,
  )
  return definition ? adaptScene(definition, session.level) : undefined
}

export function SessionResolver({
  requestedId,
  queryScene,
  queryLevel,
  queryFrom,
  queryRound,
  repositories,
}: SessionResolverProps) {
  const [repository] = useState(
    () => repositories ?? createIndexedDbRepositories(),
  )
  const [resolution, setResolution] = useState<Resolution>({
    status: 'loading',
  })
  const requestKey =
    requestedId === 'new'
      ? `new:${queryScene ?? 'hotel-check-in'}:${queryLevelOrDefault(queryLevel)}:${queryRound?.slice(0, 100) ?? ''}`
      : `session:${requestedId}`

  useEffect(() => {
    let active = true
    const resolve = async () => {
      if (requestedId === 'new') {
        const definition = getSceneBySlug(queryScene ?? 'hotel-check-in')
        if (!definition) {
          if (active)
            setResolution({
              status: 'error',
              requestKey,
              message: '这个练习场景不存在或已下线。',
            })
          return
        }
        if (active) {
          setResolution({
            status: 'ready',
            requestKey,
            scene: adaptScene(definition, queryLevelOrDefault(queryLevel)),
            sessionId: requestedId,
            completed: false,
          })
        }
        return
      }

      try {
        const session = await repository.sessions.get(requestedId)
        const scene = session ? restoreScene(session) : undefined
        if (!session || !scene) {
          if (active) {
            setResolution({
              status: 'error',
              requestKey,
              message:
                '暂时无法恢复这次练习：记录不存在，或对应的场景版本已不可用。',
            })
          }
          return
        }
        if (active)
          setResolution({
            status: 'ready',
            requestKey,
            scene,
            sessionId: session.id,
            completed: session.status === 'completed',
          })
      } catch {
        if (active) {
          setResolution({
            status: 'error',
            requestKey,
            message: '暂时无法恢复这次练习，请刷新页面后重试。',
          })
        }
      }
    }
    void resolve()
    return () => {
      active = false
    }
  }, [queryLevel, queryScene, repository, requestKey, requestedId])

  if (resolution.status === 'loading' || resolution.requestKey !== requestKey) {
    return (
      <main className={styles.state} aria-busy="true">
        正在恢复练习…
      </main>
    )
  }

  if (resolution.status === 'error') {
    return (
      <main className={styles.state} role="alert">
        <h1 data-page-title tabIndex={-1}>
          暂时无法恢复这次练习
        </h1>
        <p>{resolution.message}</p>
        <Link href="/practice">返回今日练习</Link>
      </main>
    )
  }

  return (
    <PracticeStage
      key={`${resolution.requestKey}:${resolution.scene.id}:${resolution.scene.version}:${resolution.scene.level}`}
      scene={resolution.scene}
      sessionId={resolution.sessionId}
      completed={resolution.completed}
      exitHref={
        `/scenes/${resolution.scene.slug}?level=${resolution.scene.level}` +
        (isSceneLibraryHref(queryFrom)
          ? `&from=${encodeURIComponent(queryFrom)}`
          : '')
      }
    />
  )
}
