import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { InstallPrompt } from './install-prompt'

describe('InstallPrompt', () => {
  afterEach(() => vi.restoreAllMocks())

  it.each(['getItem', 'setItem'] as const)(
    'keeps manual guidance and dismissal working when localStorage.%s throws',
    (method) => {
      vi.spyOn(Storage.prototype, method).mockImplementation(() => {
        throw new DOMException('denied', 'SecurityError')
      })
      const { unmount } = render(
        <InstallPrompt platform="ios" standalone={false} />,
      )
      expect(screen.getByRole('tab', { name: 'iPhone' })).toBeVisible()
      fireEvent.click(screen.getByRole('button', { name: '关闭安装提示' }))
      expect(
        screen.queryByRole('button', { name: '关闭安装提示' }),
      ).not.toBeInTheDocument()
      unmount()
      render(
        <InstallPrompt platform="unknown" standalone={false} mode="page" />,
      )
      fireEvent.click(screen.getByRole('tab', { name: 'Android' }))
      expect(screen.getByText(/安装应用或添加到主屏幕/)).toBeVisible()
    },
  )

  it('retains manual guidance and reports a rejected native installation without claiming success', async () => {
    render(<InstallPrompt platform="android" standalone={false} mode="page" />)
    fireEvent(
      window,
      Object.assign(new Event('beforeinstallprompt'), {
        prompt: async () => {
          throw new Error('not available')
        },
        userChoice: Promise.resolve({ outcome: 'accepted' as const }),
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: '立即安装' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('手动')
    expect(screen.queryByText('已安装到主屏幕')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'iPhone' })).toBeVisible()
  })
  it('keeps both manual guides available when the platform is unknown', () => {
    render(<InstallPrompt platform="unknown" standalone={false} mode="page" />)

    expect(screen.getByRole('tab', { name: 'iPhone' })).toBeVisible()
    expect(screen.getByRole('tab', { name: 'Android' })).toBeVisible()
    expect(screen.getByText(/更多.*共享/)).toBeVisible()
    expect(screen.getByText(/网页 App.*添加/)).toBeVisible()

    fireEvent.click(screen.getByRole('tab', { name: 'Android' }))

    expect(screen.getByText(/安装应用或添加到主屏幕/)).toBeVisible()
    expect(screen.getByText('在系统提示中确认安装或添加')).toBeVisible()
  })

  it('offers a captured native install action only from the Android panel', async () => {
    render(<InstallPrompt platform="unknown" standalone={false} mode="page" />)
    const installEvent = Object.assign(new Event('beforeinstallprompt'), {
      prompt: async () => undefined,
      userChoice: Promise.resolve({ outcome: 'dismissed' as const }),
    })

    fireEvent(window, installEvent)

    expect(
      screen.queryByRole('button', { name: '立即安装' }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Android' }))
    expect(
      await screen.findByRole('button', { name: '立即安装' }),
    ).toBeVisible()
  })

  it('uses roving tab focus with Arrow, Home, and End keys', () => {
    render(<InstallPrompt platform="unknown" standalone={false} mode="page" />)

    const ios = screen.getByRole('tab', { name: 'iPhone' })
    const android = screen.getByRole('tab', { name: 'Android' })
    expect(ios).toHaveAttribute('tabindex', '0')
    expect(android).toHaveAttribute('tabindex', '-1')

    ios.focus()
    fireEvent.keyDown(ios, { key: 'ArrowRight' })
    expect(android).toHaveFocus()
    expect(android).toHaveAttribute('aria-selected', 'true')
    expect(android).toHaveAttribute('tabindex', '0')

    fireEvent.keyDown(android, { key: 'Home' })
    expect(ios).toHaveFocus()
    expect(ios).toHaveAttribute('aria-selected', 'true')

    fireEvent.keyDown(ios, { key: 'End' })
    expect(android).toHaveFocus()
    expect(android).toHaveAttribute('aria-selected', 'true')
  })

  it('confirms installation instead of hiding the page guide in standalone mode', () => {
    render(<InstallPrompt platform="ios" standalone mode="page" />)

    expect(screen.getByText('已安装到主屏幕')).toBeVisible()
  })

  it('directs WeChat visitors to a browser while retaining both manual guides', () => {
    render(<InstallPrompt platform="wechat" standalone={false} mode="page" />)

    expect(screen.getByText('请使用 Safari 或系统浏览器打开')).toBeVisible()
    expect(screen.getByRole('tab', { name: 'iPhone' })).toBeVisible()
    expect(screen.getByRole('tab', { name: 'Android' })).toBeVisible()
  })

  it('gives iPhone users accurate Safari installation steps', () => {
    render(<InstallPrompt platform="ios" standalone={false} />)

    expect(screen.getByText(/更多.*共享/)).toBeVisible()
    expect(screen.getByText(/添加到主屏幕.*编辑操作/)).toBeVisible()
  })

  it('hides installation guidance in standalone mode', () => {
    render(<InstallPrompt platform="ios" standalone />)

    expect(
      screen.queryByText('添加 SpeakMate 到主屏幕'),
    ).not.toBeInTheDocument()
  })

  it('lets a visitor dismiss guidance without trapping focus', () => {
    render(<InstallPrompt platform="ios" standalone={false} />)

    fireEvent.click(screen.getByRole('button', { name: '暂时不用' }))

    expect(
      screen.queryByText('添加 SpeakMate 到主屏幕'),
    ).not.toBeInTheDocument()
  })

  it('keeps installation guidance usable when display-mode media queries are unavailable', () => {
    expect(window.matchMedia).toBeUndefined()

    render(<InstallPrompt platform="ios" standalone={false} />)

    expect(screen.getByText('添加 SpeakMate 到主屏幕')).toBeVisible()
  })
})
