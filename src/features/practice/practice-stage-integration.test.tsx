import { StrictMode } from 'react'
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { localContentProvider } from '@/content/dialogues/graded/provider'
import { SCENE_METADATA } from '@/content/scenes/metadata'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import { PracticeStage } from './practice-stage'
import {
  goalFixture,
  sceneCandidate,
  simulationCandidate,
  goalAt,
} from '@/infrastructure/persistence/goal-fixtures'
import { practiceFlow } from '@/domain/practice/graded-evidence'

// Only the host router is absent in this DOM harness; stage/hook/storage stay real.
vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn() }) }))
afterEach(() => vi.restoreAllMocks())

it.each(['scene', 'simulation'] as const)(
  'offers explicit confirmation for a real terminal %s task and settles only through the original transaction',
  async (kind) => {
    // This consumer test has no host router. Native sentinel traversal is verified
    // in the real browser; do not let jsdom's deferred Back leak into the next case.
    vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const repositories = createMemoryRepositories()
    const { plan } = await goalFixture(repositories)
    const simulation =
      kind === 'simulation'
        ? await simulationCandidate(repositories, plan)
        : undefined
    let session = simulation?.session ?? (await sceneCandidate(plan))
    await repositories.practice.commit({
      kind: 'create',
      session,
      ...(simulation ? { simulationMaterial: simulation.material } : {}),
      taskLaunch: {
        planId: plan.id,
        taskId: plan.tasks[kind === 'scene' ? 1 : 2].id,
      },
    })
    if (simulation) {
      session = (
        await repositories.practice.commit({
          kind: 'recall',
          expected: session,
          text: 'for example',
          at: goalAt(15),
        })
      ).record.session
      session = (
        await repositories.practice.commit({
          kind: 'compose',
          expected: session,
          text: 'For example, I read every day.',
          at: goalAt(16),
        })
      ).record.session
    }
    const cap = practiceFlow(session.gradedDialogue!).requiredUserTurns
    for (let n = 0; n < cap; n++) {
      session = (
        await repositories.practice.commit({
          kind: 'advance',
          expected: session,
          turnId: `actual-task-${n}`,
          input:
            n === 0
              ? { action: 'answer', text: 'My nonempty imperfect answer' }
              : { action: 'struggle', text: '' },
          at: goalAt(20 + n),
        })
      ).record.session
    }
    window.history.replaceState(null, '', `/session?id=${session.id}`)
    const snapshot = session.gradedDialogue!
    render(
      <PracticeStage
        sessionId={session.id}
        repositories={repositories}
        scene={{
          ...SCENE_METADATA.find((item) => item.id === session.sceneId)!,
          level: session.level,
          pack: snapshot.pack,
          mode: snapshot.state.mode,
          variantId: snapshot.state.variantId,
        }}
      />,
    )
    const confirm = await screen.findByRole('button', {
      name: '确认结束并保存复盘',
    })
    expect(await repositories.learning.balance(plan.profileId)).toBe(0)
    expect(screen.queryByRole('button', { name: '改用键盘输入' })).toBeNull()
    const commit = vi
      .spyOn(repositories.practice, 'commit')
      .mockRejectedValueOnce(new Error('quota'))
    fireEvent.click(confirm)
    await screen.findByRole('button', { name: '读取最新记录并重新确认' })
    expect(await repositories.learning.balance(plan.profileId)).toBe(0)
    expect((await repositories.practice.read(session.id))?.session.status).toBe(
      'active',
    )
    fireEvent.click(screen.getByRole('button', { name: '确认结束并保存复盘' }))
    await screen.findByRole('heading', { name: '这轮已保存。' })
    expect(await repositories.learning.balance(plan.profileId)).toBe(10)
    expect((await repositories.practice.read(session.id))?.session.status).toBe(
      'completed',
    )
    expect(commit.mock.calls[0][0]).toEqual(commit.mock.calls[1][0])
  },
)

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
  expect(screen.getByRole('group', { name: '当前应答问题' })).toHaveFocus()
  expect(await repositories.turns.listBySession(saved.id)).toHaveLength(0)
  fireEvent.click(
    within(screen.getByRole('region', { name: '当前问题' })).getByRole(
      'button',
      { name: '记录词句' },
    ),
  )
  fireEvent.click(screen.getByRole('button', { name: '保存词句' }))
  await screen.findByText('已记录')
  expect((await repositories.notebook.list())[0].sources[0]).toMatchObject({
    sessionId: saved.id,
    questionId: firstQuestion.id,
    originalText: firstQuestion.text,
  })
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
