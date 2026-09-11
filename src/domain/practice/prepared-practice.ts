import type { SceneMetadata } from '@/content/scenes/metadata'
import type {
  GradedPack,
  DialogueMode,
} from '@/content/dialogues/graded/schema'
import type { PracticePresentation } from './graded-evidence'
import type { CefrLevel } from '@/domain/scenes/types'

export interface PreparedPractice extends SceneMetadata {
  level: CefrLevel
  pack: GradedPack
  mode: DialogueMode
  variantId: string
  presentation?: PracticePresentation
}
