import { z } from 'zod'
import { CEFR_LEVELS, SCENE_CATEGORIES } from '@/domain/scenes/types'
import { gradedPackSchema } from './dialogues/graded/schema'
import { gradedSceneManifest } from './dialogues/graded/manifest'
import { analysisEntrySchema } from './analysis/schema'

export const publicCategorySchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    contentVersion: z.literal(1),
    category: z.enum(SCENE_CATEGORIES),
    packs: z.array(gradedPackSchema).length(30),
    analyses: z.array(analysisEntrySchema).min(6).max(24),
  })
  .superRefine((data, ctx) => {
    const expected = gradedSceneManifest
      .filter((scene) => scene.category === data.category)
      .flatMap((scene) =>
        CEFR_LEVELS.map((level) => `${scene.sceneId}:${level}`),
      )
    const actual = data.packs.map((pack) => `${pack.sceneId}:${pack.level}`)
    const bad =
      expected.length !== 30 ||
      new Set(actual).size !== 30 ||
      expected.some((key) => !actual.includes(key)) ||
      data.packs.some(
        (pack) =>
          pack.category !== data.category ||
          pack.contentVersion !== 1 ||
          pack.questions.length !== 12 ||
          new Set(pack.questions.map((q) => q.intent)).size < 6 ||
          pack.questions.some(
            (q) =>
              q.review.state !== 'model-reviewed' ||
              q.answers.some((a) => a.review.state !== 'model-reviewed'),
          ) ||
          pack.variants.some((v) => v.review.state !== 'model-reviewed'),
      )
    const analysisBad =
      data.analyses.length !== (data.category === 'dining' ? 21 : 6) ||
      new Set(data.analyses.map((entry) => entry.id)).size !==
        data.analyses.length ||
      data.analyses.some(
        (entry) =>
          entry.review.state !== 'model-reviewed' ||
          !data.packs.some((pack) => pack.sceneId === entry.sceneId) ||
          entry.questionIds?.some(
            (id) =>
              !data.packs.some(
                (pack) =>
                  pack.sceneId === entry.sceneId &&
                  pack.questions.some((q) => q.id === id),
              ),
          ),
      )
    if (bad || analysisBad)
      ctx.addIssue({
        code: 'custom',
        message:
          '公开分类语料不完整、版本不符或尚未校审。请重新准备此分类；不会替换为其他语料。',
      })
  })
export type PublicCategory = z.infer<typeof publicCategorySchema>
