import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, it, expect, vi } from 'vitest'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import type {
  AnalysisResult,
  LearningAssistantProvider,
} from '@/content/analysis/provider'
import { NotebookNote } from './notebook-note'
import { NotebookHome } from './notebook-home'
vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn() }) }))
beforeEach(() => sessionStorage.clear())
it('shows a real due review queue with hidden recall and a distinct empty simulation list', async () => {
  const repo = await fixture()
  render(
    <NotebookHome
      repositories={repo}
      assistant={{ analyze: async () => unknown }}
    />,
  )
  await screen.findByText('blocker')
  fireEvent.click(screen.getByRole('tab', { name: '待复习' }))
  await screen.findByRole('button', { name: '已尝试回忆，查看原文' })
  expect(
    screen.queryByRole('heading', { name: 'blocker' }),
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '已尝试回忆，查看原文' }))
  fireEvent.click(screen.getByRole('button', { name: '记得' }))
  await screen.findByText('今天的待复习已完成')
  fireEvent.click(screen.getByRole('tab', { name: '模拟练习' }))
  await screen.findByText('还没有定向模拟练习')
  expect((await repo.exportLearnerData()).learningEvents).toHaveLength(1)
})
const unknown: AnalysisResult = {
  status: 'unknown',
  originalText: '',
  entries: [],
  explanationZh: '当前本地资料未收录',
  capabilities: ['save', 'note', 'self-recall'],
}
async function fixture() {
  const repo = createMemoryRepositories()
  const profile = await repo.profiles.ensureGuestProfile()
  await repo.notebook.save({
    id: 'a',
    profileId: profile.id,
    kind: 'word',
    text: 'blocker',
    normalizedText: '',
    notes: 'Personal note',
    tags: ['work'],
    favoriteIds: [],
    createdAt: '2026-09-11T00:00:00.000Z',
    updatedAt: '2026-09-11T00:00:00.000Z',
    sources: [
      {
        id: 'one',
        kind: 'turn',
        originalText: 'A blocker here',
        sceneId: 'work-02',
        level: 'C1',
        sessionId: 'gone',
        questionId: 'daily-standup.C1.blocker',
        createdAt: '2026-09-11T00:00:00.000Z',
      },
      {
        id: 'two',
        kind: 'manual',
        originalText: 'Another context',
        createdAt: '2026-09-11T00:00:00.000Z',
      },
    ],
  })
  return repo
}
it('opens through real feature/hook/repository, switches visible context, ignores stale analysis and keeps saved source after deletion', async () => {
  const repo = await fixture()
  let resolve!: (value: AnalysisResult) => void
  const assistant: LearningAssistantProvider = {
    analyze: vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((r) => {
            resolve = r
          }),
      )
      .mockResolvedValue(unknown),
  }
  render(<NotebookNote id="a" repositories={repo} assistant={assistant} />)
  await screen.findByRole('heading', { name: 'blocker' })
  expect(await screen.findByText('原练习已删除')).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('解析所用来源'), {
    target: { value: 'two' },
  })
  await screen.findAllByText('当前本地资料未收录')
  await act(async () =>
    resolve({
      ...unknown,
      status: 'exact',
      explanationZh: 'Stale exact explanation',
    }),
  )
  expect(screen.queryByText('Stale exact explanation')).not.toBeInTheDocument()
  expect(screen.getByText('Another context')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '编辑词句' }))
  fireEvent.change(screen.getByLabelText('原文'), {
    target: { value: 'Unlisted new expression' },
  })
  fireEvent.click(screen.getByRole('button', { name: '保存修改' }))
  await screen.findByRole('heading', { name: 'Unlisted new expression' })
  expect((await repo.notebook.get('a'))?.sources).toHaveLength(2)
  expect(assistant.analyze).toHaveBeenLastCalledWith(
    expect.objectContaining({
      text: 'Unlisted new expression',
      sceneId: undefined,
      questionId: undefined,
    }),
  )
})
it('keeps local search out of URL and makes legacy accepted note IDs readable in place', async () => {
  const repo = await fixture()
  const a = (await repo.notebook.get('a'))!
  await repo.notebook.save({
    ...a,
    id: '旧笔记',
    text: 'Legacy original',
    sources: [],
    favoriteIds: [],
  })
  const before = window.location.href
  render(
    <NotebookHome
      repositories={repo}
      assistant={{ analyze: async () => unknown }}
    />,
  )
  await screen.findByText('Legacy original')
  fireEvent.change(screen.getByLabelText('搜索词句与备注'), {
    target: { value: 'Legacy' },
  })
  expect(window.location.href).toBe(before)
  fireEvent.click(screen.getByRole('button', { name: '在此查看保留词句' }))
  await screen.findByRole('heading', { name: 'Legacy original' })
  expect(screen.getByText(/编号不能直接链接/)).toBeInTheDocument()
  expect(
    (await repo.exportLearnerData()).notebook.some((n) => n.id === '旧笔记'),
  ).toBe(true)
})
it('restores selected source on remount without putting personal context in URLs', async () => {
  const repo = await fixture()
  const assistant = { analyze: vi.fn().mockResolvedValue(unknown) }
  const first = render(
    <NotebookNote id="a" repositories={repo} assistant={assistant} />,
  )
  await screen.findByRole('heading', { name: 'blocker' })
  fireEvent.change(screen.getByLabelText('解析所用来源'), {
    target: { value: 'two' },
  })
  first.unmount()
  render(<NotebookNote id="a" repositories={repo} assistant={assistant} />)
  await screen.findByRole('heading', { name: 'blocker' })
  expect(screen.getByLabelText('解析所用来源')).toHaveValue('two')
})
it('locks pending edits, retains failure input, and resets editor/context for note A to B', async () => {
  const repo = await fixture()
  const original = (await repo.notebook.get('a'))!
  await repo.notebook.save({
    ...original,
    id: 'b',
    text: 'Another saved word',
    sources: [],
  })
  const assistant = { analyze: vi.fn().mockResolvedValue(unknown) }
  const view = render(
    <NotebookNote id="a" repositories={repo} assistant={assistant} />,
  )
  await screen.findByRole('heading', { name: 'blocker' })
  let rejectWrite!: (error: Error) => void
  vi.spyOn(repo.notebook, 'save').mockImplementationOnce(
    () =>
      new Promise((_, reject) => {
        rejectWrite = reject
      }),
  )
  fireEvent.click(screen.getByRole('button', { name: '编辑词句' }))
  fireEvent.change(screen.getByLabelText('原文'), {
    target: { value: 'Unsaved changed text' },
  })
  fireEvent.click(screen.getByRole('button', { name: '保存修改' }))
  expect(screen.getByLabelText('原文')).toBeDisabled()
  expect(screen.getByLabelText('个人备注')).toBeDisabled()
  expect(screen.getByRole('button', { name: '删除词句' })).toBeDisabled()
  await act(async () => rejectWrite(new Error('quota')))
  await screen.findByRole('alert')
  expect(screen.getByLabelText('原文')).toHaveValue('Unsaved changed text')
  expect((await repo.notebook.get('a'))!.text).toBe('blocker')
  view.rerender(
    <NotebookNote id="b" repositories={repo} assistant={assistant} />,
  )
  await screen.findByRole('heading', { name: 'Another saved word' })
  expect(screen.queryByLabelText('原文')).not.toBeInTheDocument()
  expect(screen.queryByText('A blocker here')).not.toBeInTheDocument()
  expect(document.documentElement.dataset.interactionBusy).toBeUndefined()
})
