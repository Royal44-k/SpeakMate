import type { LearnerProfile } from './types'
import type { PracticeSession } from '@/domain/practice/types'
import type { SceneDefinition } from '@/domain/scenes/types'

export function recommendScene<
  T extends Pick<SceneDefinition, 'id' | 'category' | 'status'>,
>(
  profile: LearnerProfile,
  scenes: readonly T[],
  history: readonly PracticeSession[],
): T | undefined {
  const active = [...history]
    .filter((session) => session.status === 'active')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  if (active) return scenes.find((scene) => scene.id === active.sceneId)

  const practicedAt = new Map<string, string>()
  for (const session of history) {
    const existing = practicedAt.get(session.sceneId)
    if (!existing || session.updatedAt > existing) {
      practicedAt.set(session.sceneId, session.updatedAt)
    }
  }

  return [...scenes]
    .filter((scene) => scene.status === 'published')
    .sort((a, b) => {
      const aGoal = profile.goals.indexOf(a.category)
      const bGoal = profile.goals.indexOf(b.category)
      const aGoalScore = aGoal < 0 ? Number.MAX_SAFE_INTEGER : aGoal
      const bGoalScore = bGoal < 0 ? Number.MAX_SAFE_INTEGER : bGoal
      if (aGoalScore !== bGoalScore) return aGoalScore - bGoalScore

      const aLast = practicedAt.get(a.id)
      const bLast = practicedAt.get(b.id)
      if (!aLast && bLast) return -1
      if (aLast && !bLast) return 1
      if (aLast && bLast && aLast !== bLast) return aLast.localeCompare(bLast)
      return a.id.localeCompare(b.id)
    })[0]
}
