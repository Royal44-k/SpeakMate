import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { InstallPrompt } from './install-prompt'

describe('InstallPrompt', () => {
  it('keeps both manual guides available when the platform is unknown', () => {
    render(<InstallPrompt platform="unknown" standalone={false} mode="page" />)

    expect(screen.getByRole('tab', { name: 'iPhone' })).toBeVisible()
    expect(screen.getByRole('tab', { name: 'Android' })).toBeVisible()
    expect(screen.getByText('打开 Safari 的分享菜单')).toBeVisible()

    fireEvent.click(screen.getByRole('tab', { name: 'Android' }))

    expect(screen.getByText(/安装应用或添加到主屏幕/)).toBeVisible()
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

    expect(screen.getByText('打开 Safari 的分享菜单')).toBeVisible()
    expect(screen.getByText('选择“添加到主屏幕”')).toBeVisible()
  })

  it('hides installation guidance in standalone mode', () => {
    render(<InstallPrompt platform="ios" standalone />)

    expect(screen.queryByText('添加 SpeakMate 到主屏幕')).not.toBeInTheDocument()
  })

  it('lets a visitor dismiss guidance without trapping focus', () => {
    render(<InstallPrompt platform="ios" standalone={false} />)

    fireEvent.click(screen.getByRole('button', { name: '暂时不用' }))

    expect(screen.queryByText('添加 SpeakMate 到主屏幕')).not.toBeInTheDocument()
  })

  it('keeps installation guidance usable when display-mode media queries are unavailable', () => {
    expect(window.matchMedia).toBeUndefined()

    render(<InstallPrompt platform="ios" standalone={false} />)

    expect(screen.getByText('添加 SpeakMate 到主屏幕')).toBeVisible()
  })
})
