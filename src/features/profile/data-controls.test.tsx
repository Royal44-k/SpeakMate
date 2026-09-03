import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DataControls } from './data-controls'

describe('DataControls', () => {
  it('requires the explicit word 清空 before destructive deletion', async () => {
    const onClear = vi.fn().mockResolvedValue(undefined)
    render(<DataControls onExport={vi.fn()} onClear={onClear} />)

    const clearButton = screen.getByRole('button', { name: '永久清空本机数据' })
    expect(clearButton).toBeDisabled()
    fireEvent.change(screen.getByLabelText('输入“清空”以确认'), { target: { value: '清空' } })
    expect(clearButton).toBeEnabled()
    fireEvent.click(clearButton)
    expect(onClear).toHaveBeenCalledOnce()
  })

  it('offers a versioned JSON export', () => {
    const onExport = vi.fn()
    render(<DataControls onExport={onExport} onClear={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '导出学习数据' }))
    expect(onExport).toHaveBeenCalledOnce()
  })
})
