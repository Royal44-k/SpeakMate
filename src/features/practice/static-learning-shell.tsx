/* eslint-disable @next/next/no-html-link-for-pages -- Binding offline-routing contract: cross-shell learning links require document navigation, never RSC prefetch. */
'use client'

import { useSearchParams } from 'next/navigation'
import { SCENE_METADATA } from '@/content/scenes/metadata'
import {
  parseLearningTarget,
  safeSourceHref,
} from '@/components/app-shell/learning-routes'
import { SessionResolver } from './session-resolver'
import { SessionReportView } from './session-report'
import { ScenePreparation } from '@/features/scenes/scene-preparation'

export function StaticLearningShell({
  kind,
}: {
  kind: 'session' | 'report' | 'prepare'
}) {
  const params = useSearchParams()
  const path =
    kind === 'session'
      ? '/session'
      : kind === 'report'
        ? '/session/report'
        : '/scenes/prepare'
  const result = parseLearningTarget(`${path}?${params}`)
  if (result.status === 'invalid')
    return (
      <main className="route-recovery" role="alert">
        <h1 data-page-title tabIndex={-1}>
          无法打开这个学习入口
        </h1>
        <p>{result.message}</p>
        <a href="/scenes">返回场景库</a>
      </main>
    )
  const target = result.target
  if (target.kind === 'session')
    return (
      <SessionResolver
        requestedId={target.id}
        queryScene={target.scene}
        queryLevel={target.level}
        queryMode={target.mode}
        queryFrom={target.from}
        queryRound={target.round}
      />
    )
  if (target.kind === 'report')
    return <SessionReportView key={target.id} sessionId={target.id} />
  if (target.kind === 'prepare') {
    const definition = SCENE_METADATA.find(
      (scene) => scene.slug === target.scene,
    )
    if (!definition)
      return (
        <main role="alert">
          <h1 data-page-title tabIndex={-1}>
            场景不存在。你的记录没有被修改。
          </h1>
          <a href="/scenes">返回场景库</a>
        </main>
      )
    const level = target.level ?? 'A2'
    return (
      <ScenePreparation
        key={`${target.scene}:${level}`}
        scene={{ ...definition, level }}
        mode={target.mode}
        backHref={safeSourceHref(target.from) ?? `/scenes?level=${level}`}
      />
    )
  }
  return null
}
