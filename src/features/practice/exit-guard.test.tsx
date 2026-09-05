import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ExitGuard, exitGuardState } from './exit-guard'

const { routerReplace } = vi.hoisted(() => ({
  routerReplace: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: routerReplace }),
}))

describe('exitGuardState', () => {
  it.each([
    ['recording', '', false, 'recording'],
    ['reviewing', 'hello', false, 'draft'],
    ['reviewing', '', true, 'draft'],
    ['submitting', 'hello', false, 'processing'],
    ['receiving', '', true, 'processing'],
    ['ready', '', false, 'clean'],
  ] as const)(
    'maps %s with transcript %j and audio %s to %s',
    (status, transcript, hasAudio, expected) => {
      expect(exitGuardState(status, transcript, hasAudio)).toBe(expected)
    },
  )
})

describe('ExitGuard', () => {
  beforeEach(() => {
    routerReplace.mockReset()
    vi.spyOn(window.history, 'back').mockImplementation(() => undefined)
    window.history.replaceState(null, '', '/session/session-draft')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    window.history.replaceState(null, '', '/')
  })

  it('asks before a guarded topbar exit and lets the learner continue', async () => {
    const user = userEvent.setup()
    render(<ExitGuard state="draft" fallbackHref="/scenes/hotel-check-in" />)

    await user.click(screen.getByRole('link', { name: '退出本次练习' }))

    const dialog = screen.getByRole('alertdialog', {
      name: '退出本次练习？',
    })
    expect(dialog).toBeVisible()
    expect(
      screen.getByRole('button', { name: '继续练习' }),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: '退出' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: '继续练习' }))

    expect(dialog).not.toBeInTheDocument()
    expect(routerReplace).not.toHaveBeenCalled()
  })

  it('replaces the guarded route after confirmed exit', async () => {
    const user = userEvent.setup()
    const onConfirmExit = vi.fn()
    render(
      <ExitGuard
        state="recording"
        fallbackHref="/scenes/hotel-check-in?level=B1"
        onConfirmExit={onConfirmExit}
      />,
    )

    await user.click(screen.getByRole('link', { name: '退出本次练习' }))
    await user.click(screen.getByRole('button', { name: '退出' }))

    expect(window.history.back).toHaveBeenCalledTimes(1)
    expect(routerReplace).not.toHaveBeenCalled()

    fireEvent.popState(window, { state: null })

    expect(onConfirmExit).toHaveBeenCalledTimes(1)
    expect(routerReplace).toHaveBeenCalledWith(
      '/scenes/hotel-check-in?level=B1',
    )
  })

  it('reopens the guarded session when browser back is requested', () => {
    const pushState = vi.spyOn(window.history, 'pushState')
    render(<ExitGuard state="processing" fallbackHref="/practice" />)
    pushState.mockClear()

    fireEvent.popState(window, { state: null })

    expect(pushState).toHaveBeenCalledTimes(1)
    expect(pushState.mock.calls[0]?.[2]).toBe('/session/session-draft')
    expect(
      screen.getByRole('alertdialog', { name: '退出本次练习？' }),
    ).toBeVisible()
  })

  it('registers unload protection only while guarded', () => {
    const { rerender } = render(
      <ExitGuard state="draft" fallbackHref="/practice" />,
    )
    const guardedUnload = new Event('beforeunload', { cancelable: true })

    window.dispatchEvent(guardedUnload)

    expect(guardedUnload.defaultPrevented).toBe(true)

    rerender(<ExitGuard state="clean" fallbackHref="/practice" />)
    const cleanUnload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(cleanUnload)

    expect(cleanUnload.defaultPrevented).toBe(false)
  })

  it('removes its sentinel history entry when returning to clean', () => {
    const { rerender } = render(
      <ExitGuard state="draft" fallbackHref="/practice" />,
    )

    rerender(<ExitGuard state="clean" fallbackHref="/practice" />)

    expect(window.history.back).toHaveBeenCalledTimes(1)
  })

  it('does not intercept the topbar exit while clean', () => {
    render(<ExitGuard state="clean" fallbackHref="/practice" />)

    expect(screen.getByRole('link', { name: '退出本次练习' })).toHaveAttribute(
      'href',
      '/practice',
    )
    expect(
      screen.queryByRole('alertdialog', { name: '退出本次练习？' }),
    ).not.toBeInTheDocument()
  })
})
