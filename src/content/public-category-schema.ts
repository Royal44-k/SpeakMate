import { z } from 'zod'
import { CEFR_LEVELS, SCENE_CATEGORIES } from '@/domain/scenes/types'
import { gradedPackSchema } from './dialogues/graded/schema'
import { gradedSceneManifest } from './dialogues/graded/manifest'
import { analysisEntrySchema } from './analysis/schema'
import {
  microPracticeSchema,
  projectMicroPractice,
  currentMicroVersion,
} from './micro-practice'

export const publicCategorySchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    contentVersion: z.literal(1),
    category: z.enum(SCENE_CATEGORIES),
    packs: z.array(gradedPackSchema).length(30),
    analyses: z.array(analysisEntrySchema).min(6).max(24),
    microPractices: z.array(microPracticeSchema).min(1).max(120),
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
    const associations = data.analyses.flatMap((entry) =>
      data.packs
        .filter((pack) => pack.sceneId === entry.sceneId)
        .flatMap((pack) => {
          const targets = pack.questions.filter((question) =>
            entry.questionIds
              ? entry.questionIds.includes(question.id)
              : entry.intents.includes(question.intent),
          )
          return targets.length ? [{ entry, pack, targets }] : []
        }),
    )
    const microBad =
      data.microPractices.length !== associations.length ||
      new Set(data.microPractices.map((d) => d.id)).size !==
        associations.length ||
      associations.some(({ entry, pack, targets }) => {
        const desc = data.microPractices.find(
          (d) => d.analysisEntryId === entry.id && d.level === pack.level,
        )
        if (
          !desc ||
          desc.version !== currentMicroVersion(entry.id, pack.level) ||
          desc.targetQuestionIds.length !== targets.length ||
          targets.some((q) => !desc.targetQuestionIds.includes(q.id))
        )
          return true
        try {
          projectMicroPractice(pack, desc)
          return false
        } catch {
          return true
        }
      })
    if (bad || analysisBad || microBad)
      ctx.addIssue({
        code: 'custom',
        message:
          '公开分类语料不完整、版本不符或尚未校审。请重新准备此分类；不会替换为其他语料。',
      })
  })
export type PublicCategory = z.infer<typeof publicCategorySchema>
