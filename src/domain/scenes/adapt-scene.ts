import type { AdaptedScene, CefrLevel, SceneDefinition } from './types'

export function adaptScene(
  scene: SceneDefinition,
  level: CefrLevel,
): AdaptedScene {
  const { keywords, exampleExpressions, openingLines, constraints, ...base } = scene

  return {
    ...base,
    level,
    keywords: [...keywords[level]],
    exampleExpressions: [...exampleExpressions[level]],
    openingLines: [...openingLines[level]],
    constraints: { ...constraints[level] },
  }
}
