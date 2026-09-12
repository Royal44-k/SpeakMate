import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, it, expect, vi } from 'vitest'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import {
  createMemoryStorage,
  type LocalStoragePort,
} from '@/infrastructure/persistence/storage'
import { createLearningRepository } from '@/infrastructure/persistence/learning-repository'
import { createNotebookRepository } from '@/infrastructure/persistence/notebook-repository'
import type {
  AnalysisResult,
  LearningAssistantProvider,
} from '@/content/analysis/provider'
import { NotebookNote } from './notebook-note'
import { NotebookHome } from './notebook-home'
import { AppShell } from '@/components/app-shell/app-shell'
vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn() }) }))
beforeEach(() => sessionStorage.clear())
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function voicePlatform(localService = true) {
  class Utterance extends EventTarget {
    rate = 1
    voice?: SpeechSynthesisVoice
    constructor(public text: string) {
      super()
    }
  }
  const played: Utterance[] = []
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance)
  vi.stubGlobal('speechSynthesis', {
    cancel() {},
    getVoices: () => [{ lang: 'en-US', localService }],
    speak: (utterance: Utterance) => {
      played.push(utterance)
    },
  })
  return played
}
it.each([0.8, 1.15])(
  'reads a real stored %s rate at the notebook read-aloud entrance',
  async (speechRate) => {
    const repo = await fixture()
    const backup = await repo.exportLearnerData()
    backup.settings = {
      id: 'settings',
      speechRate: speechRate as 0.8 | 1.15,
      autoPlayAi: false,
      feedbackExpanded: false,
      updatedAt: '2026-09-12T00:00:00.000Z',
    }
    await repo.restoreLearnerData(
      await repo.previewRestore(JSON.stringify(backup)),
    )
    const played = voicePlatform()
    render(
      <NotebookNote
        id="a"
        repositories={repo}
        assistant={{ analyze: async () => unknown }}
      />,
    )
    fireEvent.click(await screen.findByRole('button', { name: '本地跟读原文' }))
    await waitFor(() => expect(played).toHaveLength(1))
    expect(played[0]).toMatchObject({
      text: 'blocker',
      rate: speechRate,
      voice: { localService: true },
    })
  },
)
it.each(['stop', 'unmount'])(
  'does not play a late settings read after %s',
  async (action) => {
    const repo = await fixture()
    const stored = repo.learning.getSettings()
    let release!: () => void
    repo.learning.getSettings = async () => {
      await new Promise<void>((resolve) => {
        release = resolve
      })
      return stored
    }
    const played = voicePlatform()
    const view = render(
      <NotebookNote
        id="a"
        repositories={repo}
        assistant={{ analyze: async () => unknown }}
      />,
    )
    fireEvent.click(await screen.findByRole('button', { name: '本地跟读原文' }))
    await waitFor(() => expect(typeof release).toBe('function'))
    if (action === 'stop')
      fireEvent.click(screen.getByRole('button', { name: '停止朗读' }))
    else view.unmount()
    await act(async () => {
      release?.()
      await stored
    })
    expect(played).toHaveLength(0)
  },
)
it('reports settings read failure without playing a default success', async () => {
  const repo = await fixture()
  repo.learning.getSettings = async () => {
    throw new Error('storage denied')
  }
  const played = voicePlatform()
  render(
    <NotebookNote
      id="a"
      repositories={repo}
      assistant={{ analyze: async () => unknown }}
    />,
  )
  fireEvent.click(await screen.findByRole('button', { name: '本地跟读原文' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('语音设置')
  expect(played).toHaveLength(0)
})
it('never substitutes a remote voice in the actual note entrance', async () => {
  const repo = await fixture()
  const played = voicePlatform(false)
  render(
    <NotebookNote
      id="a"
      repositories={repo}
      assistant={{ analyze: async () => unknown }}
    />,
  )
  fireEvent.click(await screen.findByRole('button', { name: '本地跟读原文' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('不会改用云端声音')
  expect(played).toHaveLength(0)
})
it('loads many notebook schedule heads in one bounded storage read and preserves alias, tie ordering and deleted-note behavior', async () => {
  const repo = await fixture()
  const base = (await repo.notebook.get('a'))!
  const storage = createMemoryStorage()
  await storage.change((state) => {
    state.notebook = Array.from({ length: 40 }, (_, n) => ({
      ...base,
      id: `note-${n}`,
      text: `word-${n}`,
      normalizedText: `word-${n}`,
      aliasIds: [`alias-${n}`],
      sources: [],
      updatedAt: `2026-09-11T00:00:${String(n).padStart(2, '0')}.000Z`,
    }))
    state.notebook[39].deletedAt = '2026-09-12T00:00:00.000Z'
    state.sessions = Array.from({ length: 12 }, (_, n) => ({
      id: `history-${n}`,
      profileId: base.profileId,
      sceneId: 'work-02',
      sceneVersion: 1,
      level: 'C1',
      status: 'completed',
      startedAt: '2026-09-11T00:00:00.000Z',
      updatedAt: '2026-09-11T00:05:00.000Z',
      completedAt: '2026-09-11T00:05:00.000Z',
      completedGoals: [],
    }))
    state.reviews = [
      { id: 'a', noteId: 'note-0', nextReviewAt: '2000-01-01T00:00:00.000Z' },
      { id: 'z', noteId: 'alias-0', nextReviewAt: '2099-01-01T00:00:00.000Z' },
      {
        id: 'future',
        noteId: 'alias-1',
        nextReviewAt: '2099-01-01T00:00:00.000Z',
      },
      {
        id: 'deleted',
        noteId: 'alias-39',
        nextReviewAt: '2099-01-01T00:00:00.000Z',
      },
    ].map((row) => ({
      ...row,
      profileId: base.profileId,
      eventId: row.id,
      rating: 'remember',
      reviewedAt: '2026-09-11T00:00:00.000Z',
      dateKey: '2026-09-11',
      scheduleStep: 0,
      intervalDays: 1,
      nextReviewDateKey: row.nextReviewAt.slice(0, 10),
    }))
  })
  let reads = 0
  const counted: LocalStoragePort = {
    change: storage.change,
    read: (select) => {
      reads++
      return storage.read(select)
    },
  }
  repo.notebook = createNotebookRepository(counted)
  repo.learning = createLearningRepository(counted)
  render(
    <NotebookHome
      repositories={repo}
      assistant={{ analyze: async () => unknown }}
    />,
  )
  await screen.findByText('word-0')
  expect(reads).toBe(2) // notebook list + one aggregate head read, independent of note count
  expect(screen.queryByText('word-39')).not.toBeInTheDocument()
  expect(
    (
      await repo.learning.getReviewSchedules([
        'alias-0',
        'note-0',
        'missing',
        'alias-39',
        'note-2',
      ])
    ).map((head) => head?.id),
  ).toEqual(['z', 'z', undefined, 'deleted', undefined])
  fireEvent.click(screen.getByRole('tab', { name: '待复习' }))
  await waitFor(() =>
    expect(
      screen.getAllByRole('button', { name: '已尝试回忆，查看原文' }),
    ).toHaveLength(37),
  )
})
it('keeps an explicit local return separate from saved source context and guards global navigation', async () => {
  const repo = await fixture()
  render(
    <AppShell activeDestination="notebook" contentOwnsMain>
      <NotebookNote
        id="a"
        repositories={repo}
        assistant={{ analyze: async () => unknown }}
        returnHref="/session/report?id=origin"
      />
    </AppShell>,
  )
  await screen.findByRole('heading', { name: 'blocker' })
  expect(screen.getByRole('link', { name: '返回来源页面' })).toHaveAttribute(
    'href',
    '/session/report?id=origin',
  )
  expect((await repo.notebook.get('a'))?.sources).toHaveLength(2)
  fireEvent.click(screen.getByRole('button', { name: '编辑词句' }))
  fireEvent.change(screen.getByLabelText('个人备注'), {
    target: { value: 'unsaved local draft' },
  })
  fireEvent.click(screen.getByRole('link', { name: '练习' }))
  expect(await screen.findByRole('alertdialog')).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: '继续练习' }))
  expect(screen.getByLabelText('个人备注')).toHaveValue('unsaved local draft')
  expect(screen.getByRole('link', { name: '练习' })).toHaveFocus()
})
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
