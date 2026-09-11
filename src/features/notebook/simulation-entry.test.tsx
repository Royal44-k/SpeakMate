import { StrictMode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { GET } from '@/app/content/v1/[category]/route'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import { SimulationEntry } from './simulation-entry'
import { SessionResolver } from '@/features/practice/session-resolver'
vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn() }) }))
it('uses real entry, local lookup and repository: explicit source launch creates once, hides recall, persists composition before the same engine', async () => {
  const repo = createMemoryRepositories()
  const profile = await repo.profiles.ensureGuestProfile()
  await repo.notebook.save({
    id: '旧笔记',
    profileId: profile.id,
    kind: 'sentence',
    text: 'Could we test that assumption?',
    normalizedText: '',
    notes: '',
    tags: [],
    favoriteIds: [],
    createdAt: '2026-09-11T00:00:00.000Z',
    updatedAt: '2026-09-11T00:00:00.000Z',
    sources: [
      {
        id: 'same-id',
        kind: 'turn',
        originalText: 'Could we test that assumption?',
        sceneId: 'work-05',
        level: 'C1',
        questionId: 'meeting-disagreement.C1.assumption',
        createdAt: '2026-09-11T00:00:00.000Z',
      },
    ],
  })
  const fetcher = vi.fn<typeof fetch>(async () =>
    GET(new Request('https://local.test'), {
      params: Promise.resolve({ category: 'work' }),
    }),
  )
  const onCreated = vi.fn()
  const firstMount = render(
    <StrictMode>
      <SimulationEntry
        noteId="旧笔记"
        repositories={repo}
        fetcher={fetcher as typeof fetch}
        onCreated={onCreated}
      />
    </StrictMode>,
  )
  await screen.findByRole('button', { name: '开始这次定向练习' })
  expect((await repo.exportLearnerData()).sessions).toHaveLength(0)
  const createCommit = repo.practice.commit
  const creates = vi
    .spyOn(repo.practice, 'commit')
    .mockRejectedValueOnce(new Error('quota'))
    .mockImplementation(createCommit)
  fireEvent.click(screen.getByRole('button', { name: '开始这次定向练习' }))
  await screen.findByRole('alert')
  expect(screen.getByLabelText('本次使用的来源')).toBeDisabled()
  expect(screen.getByLabelText('本次练习的已覆盖表达')).toBeDisabled()
  const failedCreate = creates.mock.calls[0][0]
  fireEvent.click(screen.getByRole('button', { name: '重试' }))
  await screen.findByRole('heading', { name: '先回忆，再查看原文' })
  expect(creates.mock.calls[1][0]).toEqual(failedCreate)
  creates.mockRestore()
  expect(
    screen.queryByText('Could we test that assumption?'),
  ).not.toBeInTheDocument()
  expect(onCreated).toHaveBeenCalledTimes(1)
  fireEvent.change(screen.getByLabelText('我回忆的表达'), {
    target: { value: 'Could we test that assumption?' },
  })
  fireEvent.click(screen.getByRole('button', { name: '保存回忆并查看' }))
  await screen.findByRole('heading', { name: '换一种说法，自己造句' })
  const initialId = (await repo.sessions.list())[0].id
  firstMount.unmount()
  render(
    <SessionResolver
      requestedId={initialId}
      repositories={repo}
      simulationOnly
    />,
  )
  await screen.findByRole('heading', { name: '换一种说法，自己造句' })
  const realCommit = repo.practice.commit
  const commits = vi
    .spyOn(repo.practice, 'commit')
    .mockRejectedValueOnce(new Error('quota'))
    .mockImplementation(realCommit)
  fireEvent.change(screen.getByLabelText('我的替换或造句'), {
    target: { value: 'Could we test the main assumption first?' },
  })
  fireEvent.click(screen.getByRole('button', { name: '保存造句并应用' }))
  await screen.findByRole('alert')
  expect(screen.getByLabelText('我的替换或造句')).toHaveValue(
    'Could we test the main assumption first?',
  )
  const failed = commits.mock.calls[0][0]
  fireEvent.click(screen.getByRole('button', { name: '保存造句并应用' }))
  await screen.findByRole('heading', { name: 'Dialogue Stage' })
  expect(commits.mock.calls[1][0]).toEqual(failed)
  const saved = (await repo.exportLearnerData()).sessions
  expect(saved).toHaveLength(1)
  expect(saved[0].simulation?.source.noteId).toBe('旧笔记')
  expect(saved[0].simulation?.composition?.text).toBe(
    'Could we test the main assumption first?',
  )
  expect(saved[0].gradedDialogue?.pack.questions).toHaveLength(3)
  expect(
    fetcher.mock.calls.every(
      (call) => call.length === 2 && call[0] === '/content/v1/work',
    ),
  ).toBe(true)
  await waitFor(() =>
    expect(document.documentElement.dataset.interactionBusy).toBeUndefined(),
  )
  for (let n = 0; n < 3; n++) {
    fireEvent.click(screen.getByRole('button', { name: '使用参考 1 并确认' }))
    fireEvent.click(screen.getByRole('button', { name: '提交这一轮' }))
    await waitFor(async () =>
      expect((await repo.practice.read(initialId))!.turns).toHaveLength(n + 1),
    )
  }
  fireEvent.click(
    await screen.findByRole('button', { name: '确认结束并保存复盘' }),
  )
  await screen.findByRole('heading', { name: '这轮已保存。' })
  const completed = (await repo.practice.read(initialId))!.session
  expect(completed.status).toBe('completed')
  expect(completed.completionEvidence?.submittedTurns).toBe(3)
  expect(
    screen.getByRole('link', { name: '返回词句或记录簿' }),
  ).toHaveAttribute('href', '/notebook')
  expect((await repo.exportLearnerData()).learningEvents).toEqual([])
})
