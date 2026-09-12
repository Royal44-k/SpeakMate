import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { RecoveryPage } from './recovery-page'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it.each(['/sw.js', '/sw.js?v=2.3.0', '/sw.js?v=3.0.0'])(
  'does not confuse successful unregister of %s with release of the current controller',
  async (script) => {
    const worker = { scriptURL: `${location.origin}${script}` }
    const unregister = vi.fn().mockResolvedValue(true)
    const registration = {
      scope: `${location.origin}/`,
      active: worker,
      waiting: null,
      installing: null,
      unregister,
    }
    const serviceWorker = Object.assign(new EventTarget(), {
      controller: worker,
      getRegistrations: async () => [registration],
    })
    vi.stubGlobal(
      'navigator',
      Object.assign(Object.create(navigator), { serviceWorker }),
    )
    render(<RecoveryPage />)
    await screen.findByText(/当前页面仍受工作线程控制/)
    expect(unregister).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '注销本应用工作线程' }))
    await waitFor(() => expect(unregister).toHaveBeenCalledOnce())
    expect(screen.getByText(/注销请求成功/)).toBeVisible()
    expect(screen.getByText(/当前页面仍受工作线程控制/)).toBeVisible()
    expect(screen.queryByText(/当前页面没有工作线程控制器/)).toBeNull()
    expect(screen.getByText(/关闭所有 SpeakMate 标签页/)).toBeVisible()
    expect(
      screen.queryByRole('button', { name: /清空|导入|开始练习/ }),
    ).toBeNull()
  },
)

it('preserves registrations with any unknown script or scope and reports unregister rejection', async () => {
  const unregister = vi.fn()
  const ownFailure = vi.fn().mockRejectedValue(new Error('denied'))
  const serviceWorker = Object.assign(new EventTarget(), {
    controller: null,
    getRegistrations: async () => [
      ...['/sw.js?v=2.2.0', '/sw.js?v=3.0.0&x=1', '/sw.js#unknown'].map(
        (script) => ({
          scope: `${location.origin}/`,
          active: { scriptURL: `${location.origin}/sw.js?v=3.0.0` },
          installing: { scriptURL: `${location.origin}${script}` },
          unregister,
        }),
      ),
      {
        scope: `${location.origin}/other/`,
        active: { scriptURL: `${location.origin}/sw.js` },
        unregister,
      },
      {
        scope: `${location.origin}/`,
        active: { scriptURL: `${location.origin}/sw.js` },
        waiting: { scriptURL: `${location.origin}/other.js` },
        unregister,
      },
      {
        scope: `${location.origin}/`,
        active: { scriptURL: `${location.origin}/sw.js` },
        unregister: ownFailure,
      },
    ],
  })
  vi.stubGlobal(
    'navigator',
    Object.assign(Object.create(navigator), { serviceWorker }),
  )
  render(<RecoveryPage />)
  fireEvent.click(screen.getByRole('button', { name: '注销本应用工作线程' }))
  await screen.findByText(/注销没有完成/)
  expect(unregister).not.toHaveBeenCalled()
  expect(ownFailure).toHaveBeenCalledOnce()
})
