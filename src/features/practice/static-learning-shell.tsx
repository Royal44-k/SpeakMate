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
import { NotebookNote } from '@/features/notebook/notebook-note'
import { SimulationEntry } from '@/features/notebook/simulation-entry'

export function StaticLearningShell({
  kind,
}: {
  kind: 'session' | 'report' | 'prepare' | 'note' | 'simulation'
}) {
  const params = useSearchParams()
  const path =
    kind === 'session'
      ? '/session'
      : kind === 'report'
        ? '/session/report'
        : kind === 'note'
          ? '/notebook/note'
          : kind === 'simulation'
            ? '/notebook/simulation'
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
  if (target.kind === 'note')
    return <NotebookNote key={target.id} id={target.id} />
  if (target.kind === 'simulation')
    return target.id === 'new' ? (
      <SimulationEntry key={`new:${target.source}`} noteId={target.source!} />
    ) : (
      <SessionResolver key={target.id} requestedId={target.id} simulationOnly />
    )
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
