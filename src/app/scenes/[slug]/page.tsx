import { notFound } from 'next/navigation'

import { getSceneBySlug } from '@/content/scenes/catalog'
import { adaptScene } from '@/domain/scenes/adapt-scene'
import { CEFR_LEVELS, type CefrLevel } from '@/domain/scenes/types'
import { ScenePreparation } from '@/features/scenes/scene-preparation'

export default async function ScenePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ level?: string | string[]; from?: string | string[] }> }) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const scene = getSceneBySlug(slug)
  if (!scene) notFound()
  const level = CEFR_LEVELS.includes(query.level as CefrLevel) ? (query.level as CefrLevel) : 'A2'
  const backHref = typeof query.from === 'string' && query.from.startsWith('/scenes')
    ? query.from
    : `/scenes?level=${level}`
  return <ScenePreparation scene={adaptScene(scene, level)} backHref={backHref} />
}
