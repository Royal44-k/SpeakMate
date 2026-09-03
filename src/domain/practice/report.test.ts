import { describe, expect, it } from 'vitest'

import type { PracticeSession, PracticeTurn } from './types'
import { buildSessionReport } from './report'

const session: PracticeSession = {
  id: 'session_01',
  profileId: 'guest_01',
  sceneId: 'travel-01',
  sceneVersion: 1,
  level: 'B1',
  status: 'completed',
  startedAt: '2026-09-03T10:00:00.000Z',
  updatedAt: '2026-09-03T10:06:00.000Z',
  completedAt: '2026-09-03T10:06:00.000Z',
  completedGoals: ['travel-01-goal-1', 'travel-01-goal-2'],
}

const turns: PracticeTurn[] = [
  {
    id: 'turn_01', sessionId: session.id, index: 0,
    learnerText: 'I am agree. I want a quiet room.',
    aiText: 'Let me check that for you.', createdAt: '2026-09-03T10:01:00.000Z',
    feedback: { corrected: 'I agree. I would like a quiet room.', natural: 'I agree, and I would prefer a quiet room.', explanationZh: '注意 agree 用法。', tags: ['grammar', 'register'] },
  },
  {
    id: 'turn_02', sessionId: session.id, index: 1,
    learnerText: 'Could you tell me when breakfast starts?',
    aiText: 'Breakfast begins at seven.', createdAt: '2026-09-03T10:02:00.000Z',
    feedback: { corrected: 'Could you tell me when breakfast starts?', natural: 'What time does breakfast start?', explanationZh: '表达清楚。', tags: [] },
  },
]

describe('buildSessionReport', () => {
  it('builds explainable language and interaction metrics without fake pronunciation data', () => {
    const report = buildSessionReport(session, turns, 3)

    expect(report.metrics).toEqual(expect.objectContaining({
      grammar: expect.any(Number),
      vocabulary: expect.any(Number),
      naturalness: expect.any(Number),
      interaction: expect.any(Number),
    }))
    expect(report.metrics).not.toHaveProperty('pronunciation')
    expect(report.improvementThemes.length).toBeLessThanOrEqual(2)
    expect(report.bestExpressions).toContain('Could you tell me when breakfast starts?')
  })
})
