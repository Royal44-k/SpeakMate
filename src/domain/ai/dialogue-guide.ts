import { DIALOGUE_PACKS } from '@/content/dialogues/catalog'
import type { AdaptedScene } from '@/domain/scenes/types'

export function normalizeUtterance(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

export function guideQuestions(scene: AdaptedScene, topicIndex: number) {
  const topic = DIALOGUE_PACKS[scene.slug]?.[topicIndex]
  if (!topic) return []
  const order =
    scene.level === 'C1' ? [2, 0, 1] : scene.level === 'B2' ? [2, 1, 0] : [0, 1]
  return order
    .map((index) => {
      let question = topic.questions[index]
      if (question.split(/\s+/).length < scene.constraints.minAiWords) {
        question +=
          scene.level === 'C1'
            ? ' Please explain your preference and any practical constraints.'
            : ' What would work for you?'
      }
      return question
    })
    .filter(
      (question) =>
        question.split(/\s+/).length <= scene.constraints.maxAiWords,
    )
}

export function replySuggestions(
  scene: AdaptedScene,
  reply: string,
  completedGoalIds: string[],
  spoken: string[],
) {
  const pack = DIALOGUE_PACKS[scene.slug]
  if (!pack) return []
  const matched = pack.findIndex((_, index) =>
    guideQuestions(scene, index).includes(reply),
  )
  const next = scene.goals.findIndex(
    (goal) => !completedGoalIds.includes(goal.id),
  )
  const topic = pack[matched < 0 ? Math.max(0, next) : matched]
  const used = new Set(spoken.map(normalizeUtterance))
  const order =
    scene.level === 'C1' || scene.level === 'B2'
      ? [2, 1, 0]
      : scene.level === 'B1'
        ? [1, 0, 2]
        : [0, 1, 2]
  const labels = ['简短回应', '自然表达', '进阶拓展']
  return order
    .filter((index) => !used.has(normalizeUtterance(topic.answers[index])))
    .map((index) => ({ label: labels[index], text: topic.answers[index] }))
}
