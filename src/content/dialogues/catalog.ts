import { dailyDialogues } from './daily'
import { diningDialogues } from './dining'
import { emergencyDialogues } from './emergency'
import { socialDialogues } from './social'
import { studyDialogues } from './study'
import { travelDialogues } from './travel'
import { workDialogues } from './work'
import type { DialoguePack } from './types'

export const DIALOGUE_PACKS: Record<string, DialoguePack> = {
  ...dailyDialogues,
  ...diningDialogues,
  ...emergencyDialogues,
  ...socialDialogues,
  ...studyDialogues,
  ...travelDialogues,
  ...workDialogues,
}
