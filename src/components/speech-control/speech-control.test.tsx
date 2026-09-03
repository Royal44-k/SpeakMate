import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SpeechControl } from './speech-control'

describe('SpeechControl', () => {
  it('supports click-to-start and click-to-stop recording', () => {
    const onStart = vi.fn()
    const onStop = vi.fn()
    const { rerender } = render(
      <SpeechControl status="ready" onStart={onStart} onStop={onStop} onOpenKeyboard={vi.fn()} />,
    )

    fireEvent.click(screen.getByRole('button', { name: '开始录音' }))
    expect(onStart).toHaveBeenCalledOnce()

    rerender(
      <SpeechControl status="recording" elapsedSeconds={3} onStart={onStart} onStop={onStop} onOpenKeyboard={vi.fn()} />,
    )
    fireEvent.click(screen.getByRole('button', { name: '停止录音' }))
    expect(onStop).toHaveBeenCalledOnce()
    expect(screen.getByText('00:03 / 00:30')).toBeVisible()
  })

  it('keeps a keyboard alternative available when microphone access is denied', () => {
    const onOpenKeyboard = vi.fn()
    render(
      <SpeechControl status="text-only" onStart={vi.fn()} onStop={vi.fn()} onOpenKeyboard={onOpenKeyboard} />,
    )

    expect(screen.getByText('无法使用麦克风，你仍可输入英文继续练习。')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '改用键盘输入' }))
    expect(onOpenKeyboard).toHaveBeenCalledOnce()
  })

  it('disables recording while a turn is being processed', () => {
    render(
      <SpeechControl status="submitting" onStart={vi.fn()} onStop={vi.fn()} onOpenKeyboard={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: '正在分析表达' })).toBeDisabled()
  })
})
