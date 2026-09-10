import type { CefrLevel } from '@/domain/scenes/types'
import type { GradedPack } from '../schema'
import { directionsPacks } from './ask-directions'
import { taxiPacks } from './taxi-ride'
import { bankPacks } from './bank-card-problem'
import { parcelPacks } from './collect-parcel'
import { haircutPacks } from './haircut-request'
import { phonePacks } from './phone-repair'
export const dailyPacks: Record<string, Record<CefrLevel, GradedPack>> = {
  'daily-01': directionsPacks,
  'daily-02': taxiPacks,
  'daily-03': bankPacks,
  'daily-04': parcelPacks,
  'daily-05': haircutPacks,
  'daily-06': phonePacks,
}
