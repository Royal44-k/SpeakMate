import type { AdaptedScene, CefrLevel, SceneDefinition } from './types'
import { DIALOGUE_PACKS } from '@/content/dialogues/catalog'
import { guideQuestions } from '@/domain/ai/dialogue-guide'

export function adaptScene(
  scene: SceneDefinition,
  level: CefrLevel,
): AdaptedScene {
  const { keywords, exampleExpressions, openingLines, constraints, ...base } =
    scene
  const pack = DIALOGUE_PACKS[scene.slug]
  const band = level === 'C1' || level === 'B2' ? 2 : level === 'B1' ? 1 : 0
  const extraExpressions =
    pack?.flatMap((topic) => [
      topic.answers[band],
      topic.answers[band === 2 ? 1 : band + 1],
    ]) ?? []
  const adapted: AdaptedScene = {
    ...base,
    level,
    keywords: [...keywords[level]],
    exampleExpressions: [
      ...new Set([...exampleExpressions[level], ...extraExpressions]),
    ].slice(0, 10),
    openingLines: [...openingLines[level]],
    constraints: { ...constraints[level] },
  }
  adapted.openingLines = [
    ...new Set([...adapted.openingLines, ...guideQuestions(adapted, 0)]),
  ].slice(0, 6)
  return adapted
}
