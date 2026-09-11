import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import { CaptureProvider, CaptureText, selectedBlockText } from './capture'

describe('practice capture', () => {
  it('pins the original selected block and question before a changed target rerenders', async () => {
    const repo = createMemoryRepositories()
    await repo.profiles.ensureGuestProfile()
    const before = {
      sceneId: 'work-05',
      level: 'C1' as const,
      sessionId: 'original',
      questionId: 'meeting-disagreement.C1.assumption',
    }
    const renderBlock = (text: string, questionId: string) => (
      <CaptureProvider repositories={repo}>
        <CaptureText text={text} source={{ ...before, questionId }} />
      </CaptureProvider>
    )
    const view = render(
      renderBlock('Could we test that assumption?', before.questionId),
    )
    const node = screen.getByText('Could we test that assumption?').firstChild!
    const range = document.createRange()
    range.setStart(node, 9)
    range.setEnd(node, 29)
    window.getSelection()!.removeAllRanges()
    window.getSelection()!.addRange(range)
    fireEvent(document, new Event('selectionchange'))
    view.rerender(
      renderBlock(
        'A different active question.',
        'meeting-disagreement.C1.reason',
      ),
    )
    fireEvent.click(screen.getByRole('button', { name: '记录词句' }))
    fireEvent.click(screen.getByRole('button', { name: '保存词句' }))
    await screen.findByText('已记录')
    expect((await repo.notebook.list())[0]).toMatchObject({
      text: 'test that assumption',
      sources: [
        expect.objectContaining({
          originalText: 'Could we test that assumption?',
          questionId: before.questionId,
        }),
      ],
    })
  })
  it('reads textarea selection through selectionStart/end instead of document ranges', () => {
    const input = document.createElement('textarea')
    input.value = 'One selected phrase'
    input.setSelectionRange(4, 12)
    expect(selectedBlockText(input)).toBe('selected')
  })
  it('previews a selected phrase before focus changes, cancels without saving, then saves and undoes in place', async () => {
    const repo = createMemoryRepositories()
    await repo.profiles.ensureGuestProfile()
    const user = userEvent.setup()
    render(
      <CaptureProvider repositories={repo}>
        <h1>Practice stays here</h1>
        <CaptureText
          text="Could we test that assumption?"
          source={{
            sceneId: 'work-05',
            level: 'C1',
            sessionId: 'source',
            questionId: 'meeting-disagreement.C1.assumption',
          }}
        />
      </CaptureProvider>,
    )
    const text = screen.getByText('Could we test that assumption?')
    const range = document.createRange()
    range.setStart(text.firstChild!, 9)
    range.setEnd(text.firstChild!, 29)
    window.getSelection()!.removeAllRanges()
    window.getSelection()!.addRange(range)
    fireEvent(document, new Event('selectionchange'))
    await user.click(screen.getByRole('button', { name: '记录词句' }))
    expect(screen.getByLabelText('待存原文')).toHaveValue(
      'test that assumption',
    )
    await user.click(screen.getByRole('button', { name: '取消' }))
    expect(await repo.notebook.list()).toEqual([])
    window.getSelection()!.removeAllRanges()
    fireEvent(document, new Event('selectionchange'))
    await user.click(screen.getByRole('button', { name: '记录词句' }))
    await user.click(screen.getByRole('button', { name: '保存词句' }))
    expect(await screen.findByText('已记录')).toBeInTheDocument()
    expect((await repo.notebook.list())[0].sources[0].questionId).toBe(
      'meeting-disagreement.C1.assumption',
    )
    expect(screen.getByText('Practice stays here')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '撤销记录' }))
    await waitFor(async () => expect(await repo.notebook.list()).toEqual([]))
  })
  it('offers keyboard word choices without requiring native selection', async () => {
    const repo = createMemoryRepositories()
    await repo.profiles.ensureGuestProfile()
    const user = userEvent.setup()
    render(
      <CaptureProvider repositories={repo}>
        <CaptureText
          text="A useful expression."
          source={{ sceneId: 'work-01', level: 'B1', sessionId: 'source' }}
        />
      </CaptureProvider>,
    )
    await user.click(screen.getByRole('button', { name: '记录词句' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: '选词' }))
    await user.click(within(dialog).getByRole('button', { name: 'useful' }))
    expect(screen.getByLabelText('待存原文')).toHaveValue('useful')
    await user.click(screen.getByRole('button', { name: '保存词句' }))
    await screen.findByText('已记录')
    expect((await repo.notebook.list())[0]).toMatchObject({
      kind: 'word',
      text: 'useful',
    })
  })
  it('protects the pending draft and retains editable text after a failed write', async () => {
    const repo = createMemoryRepositories()
    await repo.profiles.ensureGuestProfile()
    let rejectWrite!: (error: Error) => void
    vi.spyOn(repo.notebook, 'capture').mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectWrite = reject
        }),
    )
    const user = userEvent.setup()
    render(
      <CaptureProvider repositories={repo}>
        <CaptureText text="A useful expression." source={{}} />
      </CaptureProvider>,
    )
    await user.click(screen.getByRole('button', { name: '记录词句' }))
    await user.click(screen.getByRole('button', { name: '选词' }))
    await user.click(screen.getByRole('button', { name: 'useful' }))
    await user.click(screen.getByRole('button', { name: '保存词句' }))
    expect(screen.getByLabelText('待存原文')).toBeDisabled()
    expect(screen.getByLabelText('词句类型')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'useful' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '使用整句' })).toBeDisabled()
    rejectWrite(new Error('quota'))
    await screen.findByRole('alert')
    expect(screen.getByLabelText('待存原文')).toBeEnabled()
    expect(screen.getByLabelText('待存原文')).toHaveValue('useful')
    expect(await repo.notebook.list()).toEqual([])
    await user.click(screen.getByRole('button', { name: '保存词句' }))
    await screen.findByText('已记录')
    expect((await repo.notebook.list())[0].text).toBe('useful')
  })
})
