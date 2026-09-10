import type { CefrLevel } from '@/domain/scenes/types'
import type { GradedPack } from '../schema'
import { pharmacyMedicine } from './pharmacy-medicine'
import { describeSymptoms } from './describe-symptoms'
import { doctorAppointment } from './doctor-appointment'
import { emergencyCall } from './emergency-call'
import { lostProperty } from './lost-property'
import { rentalRepair } from './rental-repair'

export const emergencyPacks: Record<string, Record<CefrLevel, GradedPack>> = {
  'emergency-01': pharmacyMedicine,
  'emergency-02': describeSymptoms,
  'emergency-03': doctorAppointment,
  'emergency-04': emergencyCall,
  'emergency-05': lostProperty,
  'emergency-06': rentalRepair,
}
