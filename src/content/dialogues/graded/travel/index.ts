import { airportPacks } from './airport-check-in'
import { securityPacks } from './security-screening'
import { connectionPacks } from './flight-connection'
import { immigrationPacks } from './immigration-interview'
import { hotelPacks } from './hotel-check-in'
import { roomProblemPacks } from './hotel-room-problem'
import type { CefrLevel } from '@/domain/scenes/types'
import type { GradedPack } from '../schema'
export const travelPacks: Record<string, Record<CefrLevel, GradedPack>> = {
  'travel-01': airportPacks,
  'travel-02': securityPacks,
  'travel-03': connectionPacks,
  'travel-04': immigrationPacks,
  'travel-05': hotelPacks,
  'travel-06': roomProblemPacks,
}
