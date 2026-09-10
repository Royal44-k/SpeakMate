import type { CefrLevel } from '@/domain/scenes/types'
import { gradedPackSchema, type GradedPack } from './schema'

export type ContentRequest = {
  sceneId: string
  level: CefrLevel
  contentVersion?: number
}
export type ContentResult =
  | { status: 'available'; pack: GradedPack }
  | { status: 'unavailable' }
  | { status: 'version-unavailable'; requestedVersion: number }
export interface ContentProvider {
  load(request: ContentRequest): Promise<ContentResult>
}

export const localContentProvider: ContentProvider = {
  async load(request) {
    const daily = [
      'daily-01',
      'daily-02',
      'daily-03',
      'daily-04',
      'daily-05',
      'daily-06',
    ].includes(request.sceneId)
    const travel = [
      'travel-01',
      'travel-02',
      'travel-03',
      'travel-04',
      'travel-05',
      'travel-06',
    ].includes(request.sceneId)
    const remainingDining = [
      'dining-02',
      'dining-03',
      'dining-04',
      'dining-05',
      'dining-06',
    ].includes(request.sceneId)
    if (
      request.sceneId !== 'dining-01' &&
      !remainingDining &&
      !travel &&
      !daily
    )
      return { status: 'unavailable' }
    if (request.contentVersion !== undefined && request.contentVersion !== 1)
      return {
        status: 'version-unavailable',
        requestedVersion: request.contentVersion,
      }
    if (daily) {
      const { dailyPacks } = await import('./daily')
      return {
        status: 'available',
        pack: gradedPackSchema.parse(
          dailyPacks[request.sceneId][request.level],
        ),
      }
    }
    if (travel) {
      const { travelPacks } = await import('./travel')
      return {
        status: 'available',
        pack: gradedPackSchema.parse(
          travelPacks[request.sceneId][request.level],
        ),
      }
    }
    if (remainingDining) {
      const { remainingDiningPacks } = await import('./dining')
      return {
        status: 'available',
        pack: gradedPackSchema.parse(
          remainingDiningPacks[request.sceneId][request.level],
        ),
      }
    }
    // Literal import boundary: only this requested category is loaded. No text goes over a port.
    const { coffeePacks } = await import('./coffee-order')
    return {
      status: 'available',
      pack: gradedPackSchema.parse(coffeePacks[request.level]),
    }
  },
}
