import type { ContentProvider } from './dialogues/graded/provider'
import { gradedSceneManifest } from './dialogues/graded/manifest'
import {
  publicCategorySchema,
  type PublicCategory,
} from './public-category-schema'
import type { LearningAssistantProvider } from './analysis/provider'
import { matchAuthoredAnalysis } from './analysis/match-authored-analysis'
import { verifiedCategoryResponse } from './verified-category-response'

export function publicLearningAssistant(
  fetcher: typeof fetch = fetch,
): LearningAssistantProvider {
  return {
    async analyze(request) {
      const scene = gradedSceneManifest.find(
        (scene) => scene.sceneId === request.sceneId,
      )
      if (!scene) return matchAuthoredAnalysis(request, [])
      const data = await loadPublicCategory(scene.category, fetcher)
      return matchAuthoredAnalysis(request, data.analyses)
    },
  }
}

export async function loadPublicCategory(
  category: string,
  fetcher: typeof fetch = fetch,
): Promise<PublicCategory> {
  if (!gradedSceneManifest.some((scene) => scene.category === category))
    throw new Error('未知的公开语料分类。')
  const response =
    process.env.NODE_ENV === 'production'
      ? await verifiedCategoryResponse(category, fetcher)
      : await fetcher(`/content/v1/${category}`, {
          credentials: 'omit',
          cache: 'no-cache',
        })
  if (
    !response.ok ||
    !response.headers.get('content-type')?.includes('application/json')
  )
    throw new Error(
      '此分类尚未下载或暂时不可用，请联网后重试。已保存的练习仍保留。',
    )
  const text = await response.text()
  if (new TextEncoder().encode(text).byteLength > 6 * 1024 * 1024)
    throw new Error('公开语料包超出大小限制。')
  const parsed = publicCategorySchema.parse(JSON.parse(text))
  if (parsed.category !== category) throw new Error('公开语料分类不匹配。')
  return parsed
}

export function publicContentProvider(
  fetcher: typeof fetch = fetch,
): ContentProvider {
  return {
    async load(request) {
      const scene = gradedSceneManifest.find(
        (scene) => scene.sceneId === request.sceneId,
      )
      if (!scene) return { status: 'unavailable' }
      if (request.contentVersion !== undefined && request.contentVersion !== 1)
        return {
          status: 'version-unavailable',
          requestedVersion: request.contentVersion,
        }
      const data = await loadPublicCategory(scene.category, fetcher)
      const pack = data.packs.find(
        (pack) =>
          pack.sceneId === request.sceneId && pack.level === request.level,
      )
      return pack ? { status: 'available', pack } : { status: 'unavailable' }
    },
  }
}
