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
    if (request.sceneId !== 'dining-01') return { status: 'unavailable' }
    if (request.contentVersion !== undefined && request.contentVersion !== 1)
      return {
        status: 'version-unavailable',
        requestedVersion: request.contentVersion,
      }
    // Literal import boundary: only this requested category is loaded. No text goes over a port.
    const { coffeePacks } = await import('./coffee-order')
    return {
      status: 'available',
      pack: gradedPackSchema.parse(coffeePacks[request.level]),
    }
  },
}
