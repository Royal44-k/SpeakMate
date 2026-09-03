import { getSceneBySlug } from '@/content/scenes/catalog'
import { adaptScene } from '@/domain/scenes/adapt-scene'
import { CEFR_LEVELS, type CefrLevel } from '@/domain/scenes/types'
import { PracticeStage } from '@/features/practice/practice-stage'

export const metadata = { title: '对话练习' }

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ scene?: string; level?: string }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const definition = getSceneBySlug(query.scene ?? 'hotel-check-in') ?? getSceneBySlug('hotel-check-in')!
  const level = CEFR_LEVELS.includes(query.level as CefrLevel) ? query.level as CefrLevel : 'A2'
  return <PracticeStage scene={adaptScene(definition, level)} sessionId={id} />
}
