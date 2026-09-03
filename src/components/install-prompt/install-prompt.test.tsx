import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { InstallPrompt } from './install-prompt'

describe('InstallPrompt', () => {
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
})
