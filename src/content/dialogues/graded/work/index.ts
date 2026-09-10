import type { CefrLevel } from '@/domain/scenes/types'
import type { GradedPack } from '../schema'
import { introductionPacks } from './work-introduction'
import { standupPacks } from './daily-standup'
import { progressPacks } from './progress-update'
import { deadlinePacks } from './deadline-negotiation'
import { disagreementPacks } from './meeting-disagreement'
import { interviewPacks } from './job-interview'
export const workPacks: Record<string, Record<CefrLevel, GradedPack>> = {
  'work-01': introductionPacks,
  'work-02': standupPacks,
  'work-03': progressPacks,
  'work-04': deadlinePacks,
  'work-05': disagreementPacks,
  'work-06': interviewPacks,
}
