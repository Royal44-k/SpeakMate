import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SceneLibrary } from './scene-library'

describe('SceneLibrary', () => {
  it('searches bilingual titles and filters by category', () => {
    render(<SceneLibrary initialLevel="B1" />)

    expect(screen.getByText('42 个真实对话场景')).toBeVisible()
    fireEvent.change(screen.getByLabelText('搜索场景'), {
      target: { value: 'hotel' },
    })
    expect(screen.getByText('Hotel check-in')).toBeVisible()
    expect(screen.queryByText('Daily stand-up')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('搜索场景'), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByRole('button', { name: '职场' }))
    expect(screen.getAllByTestId('scene-card')).toHaveLength(6)
  })

  it('adapts visible language support when the CEFR filter changes', () => {
    render(<SceneLibrary initialLevel="A1" />)

    fireEvent.click(screen.getByRole('button', { name: 'C1' }))
    expect(screen.getByText('C1')).toBeVisible()
    expect(screen.getAllByTestId('scene-card')[0]).toHaveTextContent('5 个关键词')
  })

  it('filters scenes by estimated practice duration', () => {
    render(<SceneLibrary initialLevel="A2" />)

    fireEvent.click(screen.getByRole('button', { name: '3 分钟' }))

    expect(screen.getAllByTestId('scene-card')).toHaveLength(7)
    screen.getAllByTestId('scene-card').forEach((card) => {
      expect(card).toHaveTextContent('3 分钟')
    })
  })
})
