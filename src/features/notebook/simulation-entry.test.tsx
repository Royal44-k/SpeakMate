import { StrictMode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { GET } from '@/app/content/v1/[category]/route'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import { SimulationEntry } from './simulation-entry'
import { SessionResolver } from '@/features/practice/session-resolver'
import { newSimulation, simulationOptions } from './simulation-material'
import type { PracticeRecord } from '@/infrastructure/persistence/practice-repository'
vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn() }) }))
it.each(['cancel', 'submit'] as const)(
  'does not let a deferred recovery undo a simulation draft %s',
  async (action) => {
    const repo = createMemoryRepositories()
    const profile = await repo.profiles.ensureGuestProfile()
    const source = {
      id: 'source',
      kind: 'turn' as const,
      originalText: 'Could we test that assumption?',
      sceneId: 'work-05',
      level: 'C1' as const,
      questionId: 'meeting-disagreement.C1.assumption',
      createdAt: new Date().toISOString(),
    }
    const note = await repo.notebook.save({
      id: 'note',
      profileId: profile.id,
      text: source.originalText,
      kind: 'sentence',
      normalizedText: '',
      notes: '',
      tags: [],
      favoriteIds: [],
      sources: [source],
      createdAt: source.createdAt,
      updatedAt: source.createdAt,
    })
    const [option] = await simulationOptions(note, source, async () =>
      GET(new Request('https://local.test'), {
        params: Promise.resolve({ category: 'work' }),
      }),
    )
    const saved = (
      await repo.practice.commit({
        kind: 'create',
        session: newSimulation(note, source, option),
        simulationMaterial: option,
      })
    ).record
    render(
      <SessionResolver
        requestedId={saved.session.id}
        repositories={repo}
        simulationOnly
      />,
    )
    fireEvent.change(await screen.findByLabelText('我回忆的表达'), {
      target: { value: 'My real recall' },
    })
    const failure = vi
      .spyOn(repo.practice, 'commit')
      .mockRejectedValueOnce(new Error('quota'))
    fireEvent.click(screen.getByRole('button', { name: '保存回忆并查看' }))
    await screen.findByRole('alert')
    failure.mockRestore()
    let resolveRead!: (record: PracticeRecord) => void
    const delayed = vi.spyOn(repo.practice, 'read').mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRead = resolve
        }),
    )
    fireEvent.click(screen.getByRole('button', { name: '读取最新进度' }))
    fireEvent.click(
      screen.getByRole('button', {
        name: action === 'cancel' ? '取消本次输入' : '保存回忆并查看',
      }),
    )
    if (action === 'submit') await screen.findByLabelText('我的替换或造句')
    await act(async () => resolveRead(saved))
    delayed.mockRestore()
    if (action === 'cancel') {
      expect(screen.getByLabelText('我回忆的表达')).toHaveValue('')
      expect(
        (await repo.practice.read(saved.session.id))!.session.simulation!
          .recall,
      ).toBeUndefined()
    } else {
      expect(screen.getByLabelText('我的替换或造句')).toHaveValue('')
      expect(screen.queryByLabelText('我回忆的表达')).not.toBeInTheDocument()
      expect(
        (await repo.practice.read(saved.session.id))!.session.simulation!
          .recall!.text,
      ).toBe('My real recall')
    }
    expect(document.documentElement.dataset.interactionBusy).toBeUndefined()
  },
)
it.each([
  ['recall', 'composed'],
  ['recall', 'stopped'],
  ['recall', 'next-step'],
  ['compose', 'composed'],
  ['compose', 'stopped'],
] as const)(
  'preserves phase-owned %s edits across a deferred recovery into %s until explicit discard',
  async (phase, newerPhase) => {
    const repo = createMemoryRepositories()
    const profile = await repo.profiles.ensureGuestProfile()
    const source = {
      id: 'source',
      kind: 'turn' as const,
      originalText: 'Could we test that assumption?',
      sceneId: 'work-05',
      level: 'C1' as const,
      questionId: 'meeting-disagreement.C1.assumption',
      createdAt: new Date().toISOString(),
    }
    const note = await repo.notebook.save({
      id: 'note',
      profileId: profile.id,
      kind: 'sentence',
      text: source.originalText,
      normalizedText: '',
      notes: '',
      tags: [],
      favoriteIds: [],
      sources: [source],
      createdAt: source.createdAt,
      updatedAt: source.createdAt,
    })
    const [option] = await simulationOptions(note, source, async () =>
      GET(new Request('https://local.test'), {
        params: Promise.resolve({ category: 'work' }),
      }),
    )
    let saved = (
      await repo.practice.commit({
        kind: 'create',
        session: newSimulation(note, source, option),
        simulationMaterial: option,
      })
    ).record
    if (phase === 'compose')
      saved = (
        await repo.practice.commit({
          kind: 'recall',
          expected: saved.session,
          text: 'Stored recall',
          at: new Date().toISOString(),
        })
      ).record
    render(
      <SessionResolver
        requestedId={saved.session.id}
        repositories={repo}
        simulationOnly
      />,
    )
    const label = phase === 'recall' ? '我回忆的表达' : '我的替换或造句'
    await screen.findByLabelText(label)
    fireEvent.change(screen.getByLabelText(label), {
      target: { value: 'My unsaved phase draft' },
    })
    const failingCommit = vi
      .spyOn(repo.practice, 'commit')
      .mockRejectedValueOnce(new Error('quota'))
    fireEvent.click(
      screen.getByRole('button', {
        name: phase === 'recall' ? '保存回忆并查看' : '保存造句并应用',
      }),
    )
    await screen.findByRole('alert')
    failingCommit.mockRestore()
    if (!saved.session.simulation!.recall)
      saved = (
        await repo.practice.commit({
          kind: 'recall',
          expected: saved.session,
          text: 'Other window recall',
          at: new Date().toISOString(),
        })
      ).record
    if (newerPhase !== 'next-step')
      saved = (
        await repo.practice.commit(
          newerPhase === 'composed'
            ? {
                kind: 'compose',
                expected: saved.session,
                text: 'Other window composition',
                at: new Date().toISOString(),
              }
            : {
                kind: 'stop',
                expected: saved.session,
                at: new Date().toISOString(),
              },
        )
      ).record
    let resolveRead!: (record: PracticeRecord) => void
    const delayed = vi.spyOn(repo.practice, 'read').mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRead = resolve
        }),
    )
    fireEvent.click(screen.getByRole('button', { name: '读取最新进度' }))
    fireEvent.change(screen.getByLabelText(label), {
      target: { value: 'New edit while recovery is pending' },
    })
    await act(async () => resolveRead(saved))
    expect(screen.getByLabelText(label)).toHaveValue(
      'New edit while recovery is pending',
    )
    // A later intentional read may apply the new head, but cannot remove the old editor or relabel its phase.
    fireEvent.click(screen.getByRole('button', { name: '读取最新进度' }))
    await screen.findByText(/这份输入仍保留/)
    expect(screen.getByLabelText(label)).toHaveValue(
      'New edit while recovery is pending',
    )
    expect(
      screen.getByRole('button', {
        name: phase === 'recall' ? '保存回忆并查看' : '保存造句并应用',
      }),
    ).toBeDisabled()
    fireEvent.change(screen.getByLabelText(label), {
      target: { value: 'Still belongs to my original phase' },
    })
    expect(screen.getByLabelText(label)).toHaveValue(
      'Still belongs to my original phase',
    )
    expect(
      screen.getByRole('button', {
        name: phase === 'recall' ? '保存回忆并查看' : '保存造句并应用',
      }),
    ).toBeDisabled()
    expect(
      screen.queryByRole('heading', { name: 'Dialogue Stage' }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '取消本次输入' }))
    await screen.findByRole('heading', {
      name:
        newerPhase === 'next-step' ? '换一种说法，自己造句' : 'Dialogue Stage',
    })
    if (newerPhase === 'next-step')
      expect(screen.getByLabelText('我的替换或造句')).toHaveValue('')
    else expect(screen.queryByLabelText(label)).not.toBeInTheDocument()
    expect(document.documentElement.dataset.interactionBusy).toBeUndefined()
    delayed.mockRestore()
    expect((await repo.practice.read(saved.session.id))!.session).toEqual(
      saved.session,
    )
  },
)
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
