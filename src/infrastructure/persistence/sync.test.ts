import { describe, expect, it } from 'vitest'

import type { LearnerDataExport } from './repositories'
import { mergeGuestData } from './sync'

function dataset(sessionId: string, updatedAt: string): LearnerDataExport {
  return {
    schemaVersion: 1,
    exportedAt: updatedAt,
    sessions: [{
      id: sessionId, profileId: 'guest', sceneId: 'travel-01', sceneVersion: 1,
      level: 'A2', status: 'completed', startedAt: updatedAt, updatedAt,
      completedGoals: [],
    }],
    turns: [],
    favorites: [],
  }
}

describe('mergeGuestData', () => {
  it('keeps local-only and remote-only learning records', () => {
    const merged = mergeGuestData(
      dataset('session_local', '2026-09-03T09:00:00.000Z'),
      dataset('session_remote', '2026-09-03T10:00:00.000Z'),
    )
    expect(merged.sessions).toHaveLength(2)
  })

  it('uses the newest updated entity when ids collide and never adds audio', () => {
    const local = dataset('same', '2026-09-03T11:00:00.000Z')
    const remote = dataset('same', '2026-09-03T10:00:00.000Z')
    const merged = mergeGuestData(local, remote)

    expect(merged.sessions).toHaveLength(1)
    expect(merged.sessions[0].updatedAt).toBe('2026-09-03T11:00:00.000Z')
    expect(JSON.stringify(merged)).not.toContain('audio')
  })
})
