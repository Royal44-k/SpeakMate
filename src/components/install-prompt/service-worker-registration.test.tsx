import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  ServiceWorkerRegistration as ServiceWorkerRegistrationComponent,
  shouldShowUpdate,
} from './service-worker-registration'

const { navigation } = vi.hoisted(() => ({
  navigation: { pathname: '/practice' },
}))

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
}))

type WaitingWorker = Pick<ServiceWorker, 'postMessage' | 'scriptURL'>

function installWaitingWorker(worker: WaitingWorker) {
  const listeners = new Map<string, (event: MessageEvent) => void>()
  const register = vi.fn().mockResolvedValue({
    waiting: worker,
    installing: null,
    addEventListener: vi.fn(),
  } as unknown as ServiceWorkerRegistration)
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      controller: {},
      addEventListener: vi.fn((name, listener) =>
        listeners.set(name, listener),
      ),
      register,
      removeEventListener: vi.fn(),
    },
  })

  return {
    register,
    message: (data: unknown) =>
      act(() =>
        listeners.get('message')?.({
          data,
          source: worker,
        } as unknown as MessageEvent),
      ),
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
  document.documentElement.dataset.interactionBusy = ''
  delete document.documentElement.dataset.updateNoticeVisible
  document.documentElement.style.removeProperty('--update-notice-height')
  navigation.pathname = '/practice'
})

describe('shouldShowUpdate', () => {
  it.each([
    ['/practice', false, true],
    ['/welcome', false, false],
    ['/session/abc', false, false],
    ['/practice', true, false],
  ])(
    'keeps update notices safe on %s when interaction is %s',
    (pathname, interactionBusy, visible) => {
      expect(shouldShowUpdate(pathname, interactionBusy)).toBe(visible)
    },
  )
})

describe('ServiceWorkerRegistration', () => {
  it('shows a new build after dismissing another build served from the same worker URL', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const worker = {
      postMessage: vi.fn(),
      scriptURL: 'https://speakmate.test/sw.js?v=2.3.0',
    }
    const first = installWaitingWorker(worker)
    const rendered = render(<ServiceWorkerRegistrationComponent />)
    await screen.findByRole('status')
    first.message({ type: 'BUILD_ID', buildId: 'build-one' })
    fireEvent.click(screen.getByRole('button', { name: '稍后' }))
    rendered.unmount()
    const second = installWaitingWorker({ ...worker, postMessage: vi.fn() })
    render(<ServiceWorkerRegistrationComponent />)
    await act(async () => undefined)
    second.message({ type: 'BUILD_ID', buildId: 'build-two' })
    expect(await screen.findByRole('status')).toHaveTextContent(
      '新版本已准备好',
    )
  })
  it('keeps a later dismissal hidden for the same worker version but shows a new version', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const worker = {
      postMessage: vi.fn(),
      scriptURL: 'https://speakmate.test/sw.js?v=2.3.0',
    } as unknown as WaitingWorker
    installWaitingWorker(worker)

    const firstRender = render(<ServiceWorkerRegistrationComponent />)

    expect(await screen.findByRole('status')).toHaveTextContent(
      '新版本已准备好',
    )

    fireEvent.click(screen.getByRole('button', { name: '稍后' }))

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    firstRender.unmount()

    installWaitingWorker(worker)
    const sameVersionRender = render(<ServiceWorkerRegistrationComponent />)
    await new Promise((resolve) => window.setTimeout(resolve, 0))

    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    const nextWorker = {
      postMessage: vi.fn(),
      scriptURL: 'https://speakmate.test/sw.js?v=2.2.1',
    } as unknown as WaitingWorker
    sameVersionRender.unmount()
    installWaitingWorker(nextWorker)
    render(<ServiceWorkerRegistrationComponent />)

    expect(await screen.findByRole('status')).toHaveTextContent(
      '新版本已准备好',
    )
  })

  it('registers the service worker with the current app version', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const worker = {
      postMessage: vi.fn(),
      scriptURL: 'https://speakmate.test/sw.js?v=2.3.0',
    } as unknown as WaitingWorker
    const { register } = installWaitingWorker(worker)

    render(<ServiceWorkerRegistrationComponent />)

    await screen.findByRole('status')
    expect(register).toHaveBeenCalledWith('/sw.js?v=2.3.0', {
      updateViaCache: 'none',
    })
  })

  it('adds document scroll clearance only while the update Snackbar is visible', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const worker = {
      postMessage: vi.fn(),
      scriptURL: 'https://speakmate.test/sw.js?v=2.3.0',
    } as unknown as WaitingWorker
    installWaitingWorker(worker)

    render(<ServiceWorkerRegistrationComponent />)

    await screen.findByRole('status')
    expect(document.documentElement).toHaveAttribute(
      'data-update-notice-visible',
      'true',
    )
    expect(
      document.documentElement.style.getPropertyValue('--update-notice-height'),
    ).not.toBe('')

    fireEvent.click(screen.getByRole('button', { name: '稍后' }))

    expect(document.documentElement).not.toHaveAttribute(
      'data-update-notice-visible',
    )
    expect(
      document.documentElement.style.getPropertyValue('--update-notice-height'),
    ).toBe('')
  })

  it('announces an update failure without leaving the page', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const worker = {
      postMessage: vi.fn(() => {
        throw new Error('worker stopped')
      }),
      scriptURL: 'https://speakmate.test/sw.js?v=2.1.2',
    } as unknown as WaitingWorker
    installWaitingWorker(worker)

    render(<ServiceWorkerRegistrationComponent />)
    fireEvent.click(await screen.findByRole('button', { name: '立即更新' }))

    const failure = screen.getByText('更新暂时无法完成，请稍后重试。')
    expect(failure).toHaveClass('visually-hidden')
    expect(failure).toHaveAttribute('role', 'status')
  })

  it('visibly explains a multi-window deferral and allows retry without reload', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const worker = {
      postMessage: vi.fn(),
      scriptURL: 'https://speakmate.test/sw.js?v=deferral',
    }
    const { message } = installWaitingWorker(worker)
    render(<ServiceWorkerRegistrationComponent />)
    fireEvent.click(await screen.findByRole('button', { name: '立即更新' }))
    message({ type: 'UPDATE_DEFERRED' })
    expect(
      screen.getByText(/请先完成并关闭其他 SpeakMate 窗口/),
    ).not.toHaveClass('visually-hidden')
    fireEvent.click(screen.getByRole('button', { name: '立即更新' }))
    expect(
      worker.postMessage.mock.calls.filter(
        (call) => call[0].type === 'SKIP_WAITING',
      ),
    ).toHaveLength(2)
  })
})
