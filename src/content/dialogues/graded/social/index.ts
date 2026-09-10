import type { CefrLevel } from '@/domain/scenes/types'
import type { GradedPack } from '../schema'
import { firstSmallTalk } from './first-small-talk'
import { networkingEvent } from './networking-event'
import { makeInvitation } from './make-invitation'
import { politeRefusal } from './polite-refusal'
import { discussOpinions } from './discuss-opinions'
import { apologyRepair } from './apology-repair'

export const socialPacks: Record<string, Record<CefrLevel, GradedPack>> = {
  'social-01': firstSmallTalk,
  'social-02': networkingEvent,
  'social-03': makeInvitation,
  'social-04': politeRefusal,
  'social-05': discussOpinions,
  'social-06': apologyRepair,
}
