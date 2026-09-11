import { StrictMode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { localContentProvider } from '@/content/dialogues/graded/provider'
import { SCENE_METADATA } from '@/content/scenes/metadata'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import { PracticeStage } from './practice-stage'

// Only the host router is absent in this DOM harness; stage/hook/storage stay real.
vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn() }) }))
afterEach(() => vi.restoreAllMocks())

it('renders new through the real stage and hook, creates one pinned record and replaces its address', async () => {
  const repositories = createMemoryRepositories()
  const commit = vi.spyOn(repositories.practice, 'commit')
  const content = await localContentProvider.load({
    sceneId: 'dining-01',
    level: 'C1',
  })
  if (content.status !== 'available') throw new Error('fixture missing')
  window.history.replaceState(
    null,
    '',
    '/session?id=new&scene=coffee-order&level=C1&mode=short',
  )
  render(
    <StrictMode>
      <PracticeStage
        sessionId="new"
        repositories={repositories}
        scene={{
          ...SCENE_METADATA.find((scene) => scene.id === 'dining-01')!,
          level: 'C1',
          pack: content.pack,
          mode: 'short',
          variantId: 'counter',
        }}
      />
    </StrictMode>,
  )
  expect(screen.getByText('正在准备对话舞台…')).toBeInTheDocument()
  await screen.findByRole('heading', { name: 'Dialogue Stage' })
  await waitFor(async () =>
    expect(await repositories.sessions.list()).toHaveLength(1),
  )
  const [saved] = await repositories.sessions.list()
  expect(commit.mock.calls).toHaveLength(1)
  expect(commit.mock.calls[0][0].kind).toBe('create')
  expect(saved.id).not.toBe('new')
  expect(window.location.pathname).toBe('/session')
  expect(new URLSearchParams(window.location.search).get('id')).toBe(saved.id)
  expect(saved.gradedDialogue?.state).toMatchObject({
    mode: 'short',
    variantId: 'counter',
    turns: [],
  })
  expect(saved.gradedDialogue?.pack).toEqual(content.pack)
  const firstQuestion = content.pack.questions.find(
    (question) => question.id === saved.gradedDialogue?.state.currentQuestionId,
  )!
  expect(screen.getByText(firstQuestion.text)).toBeInTheDocument()
  expect(await repositories.turns.listBySession(saved.id)).toHaveLength(0)
})

it('keeps a newer visible draft through a delayed local recovery read and submits that draft', async () => {
  const repositories = createMemoryRepositories()
  const content = await localContentProvider.load({
    sceneId: 'dining-01',
    level: 'C1',
  })
  if (content.status !== 'available') throw new Error('fixture missing')
  window.history.replaceState(
    null,
    '',
    '/session?id=new&scene=coffee-order&level=C1&mode=short',
  )
  render(
    <PracticeStage
      sessionId="new"
      repositories={repositories}
      scene={{
        ...SCENE_METADATA.find((scene) => scene.id === 'dining-01')!,
        level: 'C1',
        pack: content.pack,
        mode: 'short',
        variantId: 'counter',
      }}
    />,
  )
  await screen.findByRole('heading', { name: 'Dialogue Stage' })
  fireEvent.click(screen.getByRole('button', { name: /键盘/ }))
  fireEvent.change(screen.getByRole('textbox', { name: '英文内容' }), {
    target: { value: 'Draft A' },
  })
  vi.spyOn(repositories.practice, 'commit').mockRejectedValueOnce(
    new Error('PRACTICE_STALE'),
  )
  fireEvent.click(screen.getByRole('button', { name: '提交这一轮' }))
  await screen.findByRole('button', { name: '读取最新记录并重新确认' })
  const [session] = await repositories.sessions.list()
  const original = (await repositories.practice.read(session.id))!
  let resolveRead!: (value: typeof original) => void
  vi.spyOn(repositories.practice, 'read').mockReturnValueOnce(
    new Promise((resolve) => {
      resolveRead = resolve
    }),
  )
  fireEvent.click(
    screen.getByRole('button', { name: '读取最新记录并重新确认' }),
  )
  expect(screen.getByRole('status')).toHaveTextContent('仍可编辑')
  expect(
    screen.getByRole('button', { name: '读取最新记录并重新确认' }),
  ).toBeDisabled()
  fireEvent.change(screen.getByRole('textbox', { name: '英文内容' }), {
    target: { value: 'Draft B' },
  })
  await act(async () => resolveRead(original))
  expect(screen.getByRole('textbox', { name: '英文内容' })).toHaveValue(
    'Draft B',
  )
  fireEvent.click(screen.getByRole('button', { name: '提交这一轮' }))
  await waitFor(async () =>
    expect(await repositories.turns.listBySession(session.id)).toHaveLength(1),
  )
  expect(
    (await repositories.turns.listBySession(session.id))[0].learnerText,
  ).toBe('Draft B')
})
