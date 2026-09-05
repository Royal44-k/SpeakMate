import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  ServiceWorkerRegistration as ServiceWorkerRegistrationComponent,
  shouldShowUpdate,
} from './service-worker-registration'

const { navigation } = vi.hoisted(() => ({ navigation: { pathname: '/practice' } }))

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
}))

type WaitingWorker = Pick<ServiceWorker, 'postMessage' | 'scriptURL'>

function installWaitingWorker(worker: WaitingWorker) {
  const registration = {
    waiting: worker,
    installing: null,
    addEventListener: vi.fn(),
  } as unknown as ServiceWorkerRegistration

  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      controller: {},
      addEventListener: vi.fn(),
      register: vi.fn().mockResolvedValue(registration),
      removeEventListener: vi.fn(),
    },
  })
}

afterEach(() => {
  vi.unstubAllEnvs()
  document.documentElement.dataset.interactionBusy = ''
  navigation.pathname = '/practice'
})

describe('shouldShowUpdate', () => {
  it.each([
    ['/practice', false, true],
    ['/welcome', false, false],
    ['/session/abc', false, false],
    ['/practice', true, false],
  ])('keeps update notices safe on %s when interaction is %s', (pathname, interactionBusy, visible) => {
    expect(shouldShowUpdate(pathname, interactionBusy)).toBe(visible)
  })
})

describe('ServiceWorkerRegistration', () => {
  it('keeps a later dismissal hidden for the same waiting worker during this browser session', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const worker = {
      postMessage: vi.fn(),
      scriptURL: 'https://speakmate.test/sw.js?v=2.1.2',
    } as unknown as WaitingWorker
    installWaitingWorker(worker)

    const firstRender = render(<ServiceWorkerRegistrationComponent />)

    expect(await screen.findByRole('status')).toHaveTextContent('新版本已准备好')

    fireEvent.click(screen.getByRole('button', { name: '稍后' }))

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    firstRender.unmount()

    render(<ServiceWorkerRegistrationComponent />)
    await new Promise((resolve) => window.setTimeout(resolve, 0))

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
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
})
