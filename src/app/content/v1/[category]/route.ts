import { CEFR_LEVELS, SCENE_CATEGORIES } from '@/domain/scenes/types'
import { gradedSceneManifest } from '@/content/dialogues/graded/manifest'
import { localContentProvider } from '@/content/dialogues/graded/provider'
import { publicCategorySchema } from '@/content/public-category-schema'
import { buildMicroPractices } from '@/content/micro-practice-authoring'

export const dynamic = 'force-static'
export const dynamicParams = false
export function generateStaticParams() {
  return SCENE_CATEGORIES.map((category) => ({ category }))
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ category: string }> },
) {
  const { category } = await context.params
  if (!SCENE_CATEGORIES.includes(category as (typeof SCENE_CATEGORIES)[number]))
    return new Response('Unknown public category', { status: 404 })
  const scenes = gradedSceneManifest.filter(
    (scene) => scene.category === category,
  )
  const packs = await Promise.all(
    scenes.flatMap((scene) =>
      CEFR_LEVELS.map(async (level) => {
        const content = await localContentProvider.load({
          sceneId: scene.sceneId,
          level,
          contentVersion: 1,
        })
        if (content.status !== 'available')
          throw new Error('PUBLIC_CORPUS_INCOMPLETE')
        return content.pack
      }),
    ),
  )
  const analyses =
    category === 'travel'
      ? (await import('@/content/analysis/travel')).travelAnalysis
      : category === 'daily'
        ? (await import('@/content/analysis/daily')).dailyAnalysis
        : category === 'work'
          ? (await import('@/content/analysis/work')).workAnalysis
          : category === 'social'
            ? (await import('@/content/analysis/social')).socialAnalysis
            : category === 'study'
              ? (await import('@/content/analysis/study')).studyAnalysis
              : category === 'emergency'
                ? (await import('@/content/analysis/emergency'))
                    .emergencyAnalysis
                : [
                    ...(await import('@/content/analysis/coffee'))
                      .coffeeAnalysis,
                    ...(await import('@/content/analysis/dining'))
                      .diningAnalysis,
                  ]
  return Response.json(
    publicCategorySchema.parse({
      schemaVersion: 1,
      contentVersion: 1,
      category,
      packs,
      analyses,
      microPractices: buildMicroPractices(packs, analyses),
    }),
  )
}
