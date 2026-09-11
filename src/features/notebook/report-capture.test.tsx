import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { localContentProvider } from '@/content/dialogues/graded/provider'
import { createDialogue } from '@/domain/ai/graded-dialogue'
import {
  createMemoryRepositories,
  createIndexedDbRepositories,
} from '@/infrastructure/persistence/repositories'
import { deleteDatabase } from '@/infrastructure/persistence/db'
import { SessionReportView } from '@/features/practice/session-report'
vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn() }) }))
afterEach(deleteDatabase)
it('captures the actual historical work C1 learner question after advancing and retains it after source deletion into both backup destinations', async () => {
  const repo = createMemoryRepositories()
  const profile = await repo.profiles.ensureGuestProfile()
  const content = await localContentProvider.load({
    sceneId: 'work-05',
    level: 'C1',
  })
  if (content.status !== 'available') throw Error('fixture')
  const start = createDialogue(content.pack, {
    mode: 'extended',
    variantId: content.pack.variants[0].id,
  })
  let record = (
    await repo.practice.commit({
      kind: 'create',
      session: {
        id: 'source-work',
        profileId: profile.id,
        sceneId: 'work-05',
        sceneVersion: 1,
        level: 'C1',
        status: 'active',
        startedAt: '2026-09-11T00:00:00.000Z',
        updatedAt: '2026-09-11T00:00:00.000Z',
        completedGoals: [],
        openingText: start.reply,
        gradedDialogue: start.snapshot,
      },
    })
  ).record
  for (let n = 1; n <= 6; n++) {
    const q = record.session.gradedDialogue!.pack.questions.find(
      (q) => q.id === record.session.gradedDialogue!.state.currentQuestionId,
    )!
    record = (
      await repo.practice.commit({
        kind: 'advance',
        expected: record.session,
        turnId: `work-${n}`,
        input: {
          text: n === 5 ? 'Could we test that assumption?' : q.answers[0].text,
        },
        at: `2026-09-11T00:0${n}:00.000Z`,
      })
    ).record
  }
  expect(record.session.gradedDialogue!.state.currentQuestionId).not.toBe(
    'meeting-disagreement.C1.assumption',
  )
  render(<SessionReportView sessionId="source-work" repositories={repo} />)
  await screen.findByText('原始对话与本题反馈')
  const block = screen
    .getAllByText('Could we test that assumption?')
    .find((node) => node.closest('[data-capture-block]'))
    ?.closest('[data-capture-block]')
  expect(block).toBeTruthy()
  fireEvent.click(
    within(block as HTMLElement).getByRole('button', { name: '记录词句' }),
  )
  fireEvent.click(screen.getByRole('button', { name: '保存词句' }))
  await screen.findByText('已记录')
  const backup = await repo.exportLearnerData()
  backup.sessions = []
  backup.turns = []
  for (const make of [createMemoryRepositories, createIndexedDbRepositories]) {
    const destination = make()
    await destination.restoreLearnerData(
      await destination.previewRestore(JSON.stringify(backup)),
    )
    const [note] = await destination.notebook.list()
    expect(note.sources[0]).toMatchObject({
      sessionId: 'source-work',
      turnId: 'work-5',
      questionId: 'meeting-disagreement.C1.assumption',
      originalText: 'Could we test that assumption?',
    })
    expect(await destination.practice.read('source-work')).toBeUndefined()
  }
})
