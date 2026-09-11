import { describe, expect, it, vi } from 'vitest'

import type { LearnerDataExport } from './repositories'
import { mergeGuestData, uploadLearnerData } from './sync'
import { createMemoryRepositories } from './repositories'

function dataset(sessionId: string, updatedAt: string): LearnerDataExport {
  return {
    schemaVersion: 1,
    exportedAt: updatedAt,
    sessions: [
      {
        id: sessionId,
        profileId: 'guest',
        sceneId: 'travel-01',
        sceneVersion: 1,
        level: 'A2',
        status: 'completed',
        startedAt: updatedAt,
        updatedAt,
        completedGoals: [],
      },
    ],
    turns: [],
    favorites: [],
  }
}

describe('mergeGuestData', () => {
  it('preserves schema2 notes and immutable learning events without enabling remote writes', async () => {
    const repository = createMemoryRepositories()
    const profile = await repository.profiles.ensureGuestProfile()
    await repository.favorites.save({
      id: 'favorite_sync',
      expression: 'Hello!',
      createdAt: '2026-09-09T00:00:00.000Z',
      updatedAt: '2026-09-09T00:00:00.000Z',
    })
    await repository.learning.recordEvent({
      id: 'event_sync',
      type: 'warmup-completed',
      runId: 'run_sync',
      profileId: profile.id,
      recalledNoteIds: [],
      recalledStarterExpressionIds: ['starter'],
      recallResponses: [{ id: 'starter', kind: 'starter', text: 'Hello!' }],
      occurredAt: '2026-09-09T00:00:00.000Z',
      dateKey: '2026-09-09',
    })
    const local = await repository.exportLearnerData()
    const merged = mergeGuestData(
      local,
      await createMemoryRepositories().exportLearnerData(),
    )
    expect(merged.schemaVersion).toBe(2)
    if (merged.schemaVersion !== 2) throw new Error('lost schema2')
    expect(merged.notebook[0].text).toBe('Hello!')
    expect(merged.learningEvents).toHaveLength(1)
  })
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

describe('remote sync release gate', () => {
  it('does not write learning data through the dormant backend adapter', async () => {
    const from = vi.fn()
    const client = { from }

    await expect(
      uploadLearnerData(
        client as never,
        'future-user',
        dataset('local-only', '2026-09-09T00:00:00.000Z'),
      ),
    ).rejects.toThrow('REMOTE_LEARNING_DATA_DISABLED')
    expect(from).not.toHaveBeenCalled()
  })
})
