import type { SceneDefinition } from '@/domain/scenes/types'

import { DAILY_SCENES } from './categories/daily'
import { DINING_SCENES } from './categories/dining'
import { EMERGENCY_SCENES } from './categories/emergency'
import { SOCIAL_SCENES } from './categories/social'
import { STUDY_SCENES } from './categories/study'
import { TRAVEL_SCENES } from './categories/travel'
import { WORK_SCENES } from './categories/work'

export const SCENE_CATALOG: readonly SceneDefinition[] = Object.freeze([
  ...TRAVEL_SCENES,
  ...DINING_SCENES,
  ...DAILY_SCENES,
  ...WORK_SCENES,
  ...SOCIAL_SCENES,
  ...STUDY_SCENES,
  ...EMERGENCY_SCENES,
])

export function getSceneBySlug(slug: string): SceneDefinition | undefined {
  return SCENE_CATALOG.find((scene) => scene.slug === slug)
}

export function getPublishedScenes(): SceneDefinition[] {
  return SCENE_CATALOG.filter((scene) => scene.status === 'published')
}
