import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DataControls } from './data-controls'
import { createMemoryRepositories } from '@/infrastructure/persistence/repositories'
import golden from '../../../tests/fixtures/learner-export-v1.json'

describe('DataControls', () => {
  it('keeps data untouched on quota failure and offers re-preview before retrying', async () => {
    const repositories = createMemoryRepositories()
    const failure = vi
      .spyOn(repositories, 'restoreLearnerData')
      .mockRejectedValueOnce(new DOMException('no space', 'QuotaExceededError'))
    render(<DataControls repositories={repositories} />)
    fireEvent.change(screen.getByLabelText('选择学习数据备份'), {
      target: { files: [new File([JSON.stringify(golden)], 'backup.json')] },
    })
    await screen.findByRole('heading', { name: '恢复预览' })
    fireEvent.click(screen.getByRole('button', { name: '确认合并恢复' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('存储空间不足')
    expect(await repositories.profiles.get()).toBeUndefined()
    failure.mockRestore()
    fireEvent.click(screen.getByRole('button', { name: '重新预览并重试' }))
    await screen.findByRole('heading', { name: '恢复预览' })
    fireEvent.click(screen.getByRole('button', { name: '确认合并恢复' }))
    expect(await screen.findByRole('status')).toHaveTextContent('恢复完成')
    expect(await repositories.sessions.list()).toHaveLength(1)
  })

  it('previews an actual backup and only restores after explicit confirmation', async () => {
    const repositories = createMemoryRepositories()
    render(<DataControls repositories={repositories} />)
    const file = new File([JSON.stringify(golden)], 'learner.json', {
      type: 'application/json',
    })
    fireEvent.change(screen.getByLabelText('选择学习数据备份'), {
      target: { files: [file] },
    })
    expect(
      await screen.findByRole('heading', { name: '恢复预览' }),
    ).toBeInTheDocument()
    expect(await repositories.profiles.get()).toBeUndefined()
    fireEvent.click(screen.getByRole('button', { name: '确认合并恢复' }))
    expect(await screen.findByRole('status')).toHaveTextContent('恢复完成')
    expect((await repositories.profiles.get())?.level).toBe('C1')
    expect(await repositories.notebook.list()).toHaveLength(1)
  })

  it('cancels preview without mutations and displays actionable validation failure', async () => {
    const repositories = createMemoryRepositories()
    render(<DataControls repositories={repositories} />)
    const picker = screen.getByLabelText('选择学习数据备份')
    fireEvent.change(picker, {
      target: { files: [new File([JSON.stringify(golden)], 'ok.json')] },
    })
    await screen.findByRole('heading', { name: '恢复预览' })
    fireEvent.click(screen.getByRole('button', { name: '取消恢复' }))
    expect(await repositories.profiles.get()).toBeUndefined()
    expect(
      screen.queryByRole('button', { name: '确认合并恢复' }),
    ).not.toBeInTheDocument()
    fireEvent.change(picker, {
      target: { files: [new File(['not json'], 'bad.json')] },
    })
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '请选择 SpeakMate JSON 备份',
    )
    expect(await repositories.sessions.list()).toEqual([])
  })

  it('requires the explicit word 清空 before destructive deletion', async () => {
    const onClear = vi.fn().mockResolvedValue(undefined)
    render(<DataControls onExport={vi.fn()} onClear={onClear} />)

    const clearButton = screen.getByRole('button', { name: '永久清空本机数据' })
    expect(clearButton).toBeDisabled()
    fireEvent.change(screen.getByLabelText('输入“清空”以确认'), {
      target: { value: '清空' },
    })
    expect(clearButton).toBeEnabled()
    fireEvent.click(clearButton)
    expect(onClear).toHaveBeenCalledOnce()
  })

  it('offers a versioned JSON export without claiming verified file storage', async () => {
    const onExport = vi.fn()
    render(<DataControls onExport={onExport} onClear={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '导出学习数据' }))
    expect(onExport).toHaveBeenCalledOnce()
    expect(await screen.findByRole('status')).toHaveTextContent('最近生成导出')
    expect(screen.getByRole('status')).toHaveTextContent('文件 App 确认')
  })

  it('does not claim deletion succeeded when storage rejects the request', async () => {
    const onClear = vi.fn().mockRejectedValue(new Error('blocked'))
    render(<DataControls onClear={onClear} />)
    fireEvent.change(screen.getByLabelText('输入“清空”以确认'), {
      target: { value: '清空' },
    })
    fireEvent.click(screen.getByRole('button', { name: '永久清空本机数据' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('没有完成')
    await waitFor(() =>
      expect(
        screen.queryByText('本机学习数据已清空。'),
      ).not.toBeInTheDocument(),
    )
  })
})
