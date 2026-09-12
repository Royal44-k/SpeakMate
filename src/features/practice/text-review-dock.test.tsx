import { StrictMode } from 'react'
import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { TextReviewDock } from './text-review-dock'

afterEach(() => vi.unstubAllGlobals())

it('owns only the current Blob URL through replacement, removal and StrictMode unmount', () => {
  let sequence = 0
  const active = new Set<string>()
  const createObjectURL = vi.fn(() => {
    const url = `blob:recording-${++sequence}`
    active.add(url)
    return url
  })
  const revokeObjectURL = vi.fn((url: string) => {
    active.delete(url)
  })
  vi.stubGlobal(
    'URL',
    Object.assign(class extends URL {}, { createObjectURL, revokeObjectURL }),
  )
  const first = new Blob(['first'])
  const second = new Blob(['second'])
  const props = {
    transcript: '',
    hasAudio: true,
    canSubmit: false,
    onChange: vi.fn(),
    onCancel: vi.fn(),
    onSubmit: vi.fn(),
  }
  const view = render(
    <StrictMode>
      <TextReviewDock {...props} audio={first} />
    </StrictMode>,
  )
  const firstUrl = screen.getByLabelText('回听本次录音').getAttribute('src')!
  expect(active).toEqual(new Set([firstUrl]))
  const player = screen.getByLabelText('回听本次录音')
  view.rerender(
    <StrictMode>
      <TextReviewDock {...props} audio={first} transcript="A" canSubmit />
    </StrictMode>,
  )
  expect(screen.getByLabelText('回听本次录音')).toBe(player)
  expect(player).toHaveAttribute('src', firstUrl)
  expect(active).toEqual(new Set([firstUrl]))
  view.rerender(
    <StrictMode>
      <TextReviewDock {...props} audio={second} />
    </StrictMode>,
  )
  const secondUrl = screen.getByLabelText('回听本次录音').getAttribute('src')!
  expect(secondUrl).not.toBe(firstUrl)
  expect(active).toEqual(new Set([secondUrl]))
  view.rerender(
    <StrictMode>
      <TextReviewDock {...props} hasAudio={false} />
    </StrictMode>,
  )
  expect(active.size).toBe(0)
  expect(screen.queryByLabelText('回听本次录音')).toBeNull()
  view.rerender(
    <StrictMode>
      <TextReviewDock {...props} audio={first} />
    </StrictMode>,
  )
  expect(active.size).toBe(1)
  view.unmount()
  expect(active.size).toBe(0)
  expect(revokeObjectURL).toHaveBeenCalledTimes(
    createObjectURL.mock.calls.length,
  )
})

it('keeps typed confirmation usable when object URLs are unavailable', () => {
  vi.stubGlobal(
    'URL',
    Object.assign(class extends URL {}, { createObjectURL: undefined }),
  )
  render(
    <TextReviewDock
      transcript="A synthetic reply."
      hasAudio
      audio={new Blob(['local'])}
      canSubmit
      onChange={vi.fn()}
      onCancel={vi.fn()}
      onSubmit={vi.fn()}
    />,
  )
  expect(screen.getByLabelText('英文内容')).toHaveValue('A synthetic reply.')
  expect(screen.getByRole('button', { name: '提交这一轮' })).toBeEnabled()
  expect(screen.queryByLabelText('回听本次录音')).toBeNull()
})
