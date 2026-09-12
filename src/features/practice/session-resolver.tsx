'use client'

import { useEffect, useState } from 'react'
import { SCENE_METADATA } from '@/content/scenes/metadata'
import { publicContentProvider } from '@/content/public-category'
import { selectedPracticePresentation } from '@/content/scenes/practice-presentation'
import type { PreparedPractice } from '@/domain/practice/prepared-practice'
import { CEFR_LEVELS, type CefrLevel } from '@/domain/scenes/types'
import { modeSchema } from '@/content/dialogues/graded/schema'
import {
  createIndexedDbRepositories,
  type Repositories,
} from '@/infrastructure/persistence/repositories'
import type { PracticeRecord } from '@/infrastructure/persistence/practice-repository'
import {
  buildLearningHref,
  safeSourceHref,
} from '@/components/app-shell/learning-routes'
import { PracticeStage } from './practice-stage'
import { HistoricalPracticeRecord } from './historical-practice-record'
import styles from './session-resolver.module.css'

interface Props {
  requestedId: string
  queryScene?: string
  queryLevel?: string
  queryMode?: string
  queryFrom?: string
  queryRound?: string
  repositories?: Repositories
  simulationOnly?: boolean
}
type Resolution = { requestKey: string } & (
  | { status: 'ready'; scene: PreparedPractice; completed: boolean }
  | { status: 'historical'; record: PracticeRecord }
  | { status: 'error'; message: string }
)
export function SessionResolver({
  requestedId,
  queryScene,
  queryLevel,
  queryMode,
  queryFrom,
  queryRound,
  repositories,
  simulationOnly = false,
}: Props) {
  const [repository] = useState(
    () => repositories ?? createIndexedDbRepositories(),
  )
  const [resolution, setResolution] = useState<Resolution>()
  const [retry, setRetry] = useState(0)
  const requestKey =
    requestedId === 'new'
      ? JSON.stringify([
          requestedId,
          queryScene,
          queryLevel,
          queryMode,
          queryRound,
        ])
      : `session:${requestedId}`
  useEffect(() => {
    let active = true
    async function resolve() {
      if (requestedId === 'new') {
        const metadata = SCENE_METADATA.find((item) => item.slug === queryScene)
        if (
          !metadata ||
          (queryLevel && !CEFR_LEVELS.includes(queryLevel as CefrLevel))
        )
          throw new Error('场景或等级无效，未新建任何记录。')
        const mode = modeSchema.parse(queryMode ?? 'standard')
        const level = (queryLevel ?? 'A2') as CefrLevel
        const result = await publicContentProvider().load({
          sceneId: metadata.id,
          level,
        })
        if (
          result.status !== 'available' ||
          result.pack.sceneId !== metadata.id ||
          result.pack.level !== level
        )
          throw new Error(
            '所选语料尚未下载或不可用，请重试；不会替换为别的场景或等级。',
          )
        let variantId = result.pack.variants[0].id
        if (queryRound) {
          const [previous, profile] = await Promise.all([
            repository.practice.read(queryRound),
            repository.profiles.get(),
          ])
          const snapshot = previous?.session.gradedDialogue
          if (
            !previous ||
            previous.status !== 'ready' ||
            !profile ||
            previous.session.profileId !== profile.id ||
            previous.session.sceneId !== metadata.id ||
            previous.session.level !== level ||
            previous.session.provenance ||
            previous.session.simulation ||
            !snapshot ||
            snapshot.state.mode !== mode ||
            snapshot.pack.contentVersion !== result.pack.contentVersion
          )
            throw new Error(
              '上一轮记录缺失或与本次自由练习不匹配，请返回场景准备；未修改上一轮。',
            )
          const index = result.pack.variants.findIndex(
            (variant) => variant.id === snapshot.state.variantId,
          )
          if (index < 0)
            throw new Error('上一轮情境不在当前校审资料中，请返回场景准备。')
          variantId =
            result.pack.variants[(index + 1) % result.pack.variants.length].id
        }
        const scene = {
          ...metadata,
          level,
          mode,
          variantId,
          pack: result.pack,
          presentation: selectedPracticePresentation(result.pack, variantId),
        }
        if (active)
          setResolution({
            status: 'ready',
            requestKey,
            scene,
            completed: false,
          })
        return
      }
      const saved = await repository.practice.read(requestedId)
      if (saved && simulationOnly && !saved.session.simulation)
        throw new Error('此编号不是定向模拟练习，未修改原记录。')
      if (!saved)
        throw new Error(
          '记录不存在。请检查本机记录或备份，不会把缺失的 ID 当作新建。',
        )
      if (saved.status === 'historical') {
        if (active)
          setResolution({ status: 'historical', requestKey, record: saved })
        return
      }
      if (saved.status !== 'ready')
        throw new Error(
          saved.message ??
            '保存的分级状态无法继续，原始记录仍保留，可导出备份后检查。',
        )
      const metadata = SCENE_METADATA.find(
        (item) => item.id === saved.session.sceneId,
      )
      if (!metadata)
        throw new Error(
          '此历史场景没有可用的显示入口，记录仍保留，请查看备份。',
        )
      const snapshot = saved.session.gradedDialogue!
      const scene: PreparedPractice = {
        ...metadata,
        version: saved.session.sceneVersion,
        level: saved.session.level,
        pack: snapshot.pack,
        mode: snapshot.state.mode,
        variantId: snapshot.state.variantId,
        ...(saved.session.presentation
          ? { presentation: saved.session.presentation }
          : {}),
      }
      if (active)
        setResolution({
          status: 'ready',
          requestKey,
          scene,
          completed: saved.session.status === 'completed',
        })
    }
    void resolve().catch((error) => {
      if (active)
        setResolution({
          status: 'error',
          requestKey,
          message:
            requestedId === 'new'
              ? `所选语料下载或验证失败。${error instanceof Error ? error.message : '请重试。'}`
              : error instanceof Error
                ? error.message
                : '本机读取失败，请重试，记录不会被清除。',
        })
    })
    return () => {
      active = false
    }
  }, [
    queryLevel,
    queryMode,
    queryRound,
    queryScene,
    repository,
    requestKey,
    requestedId,
    retry,
    simulationOnly,
  ])
  if (!resolution || resolution.requestKey !== requestKey)
    return (
      <main className={styles.state} aria-busy="true">
        正在恢复练习…
      </main>
    )
  if (resolution.status === 'error')
    return (
      <main className={styles.state} role="alert">
        <h1 data-page-title tabIndex={-1}>
          暂时无法恢复这次练习
        </h1>
        <p>{resolution.message}</p>
        <button
          type="button"
          onClick={() => {
            setResolution(undefined)
            setRetry((value) => value + 1)
          }}
        >
          重试读取
        </button>
        <a href="/practice">返回今日练习</a>
        <a href="/me">查看本机记录与备份</a>
      </main>
    )
  if (resolution.status === 'historical')
    return (
      <HistoricalPracticeRecord
        record={resolution.record}
        repositories={repository}
      />
    )
  return (
    <PracticeStage
      key={requestKey}
      scene={resolution.scene}
      sessionId={requestedId}
      completed={resolution.completed}
      repositories={repository}
      returnHref={safeSourceHref(queryFrom)}
      exitHref={buildLearningHref({
        kind: 'prepare',
        scene: resolution.scene.slug,
        level: resolution.scene.level,
        mode: resolution.scene.mode,
        from: safeSourceHref(queryFrom),
      })}
    />
  )
}
