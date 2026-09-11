import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { localContentProvider } from '@/content/dialogues/graded/provider'
import { SCENE_METADATA } from '@/content/scenes/metadata'
import { ScenePreparation } from './scene-preparation'
import {
  visitRoute,
  readRouteHistory,
} from '@/components/app-shell/navigation-history'
const loader = vi.hoisted(() => vi.fn())
vi.mock('@/content/public-category', () => ({
  publicContentProvider: () => ({ load: loader }),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn() }) }))
describe('graded preparation', () => {
  it('loads selected level and exposes all lengths, full situation, exact opening and private-free launch', async () => {
    const result = await localContentProvider.load({
      sceneId: 'dining-01',
      level: 'C1',
    })
    if (result.status !== 'available') throw new Error('fixture')
    loader.mockResolvedValue(result)
    history.replaceState(
      { custom: 'keep' },
      '',
      '/scenes/prepare?scene=coffee-order&level=C1',
    )
    visitRoute('/scenes/prepare?scene=coffee-order&level=C1')
    const entry = history.state.__speakmateRouteEntry
    render(
      <ScenePreparation
        scene={{
          ...SCENE_METADATA.find((item) => item.id === 'dining-01')!,
          level: 'C1',
        }}
        mode="short"
        backHref="/scenes?level=C1&q=private"
      />,
    )
    expect(
      await screen.findByText(result.pack.variants[0].situationZh),
    ).toBeVisible()
    expect(screen.getByRole('radio', { name: /简短/ })).toBeChecked()
    fireEvent.click(screen.getByRole('radio', { name: /深入/ }))
    expect(history.state).toMatchObject({
      custom: 'keep',
      __speakmateRouteEntry: entry,
    })
    expect(readRouteHistory().entries).toHaveLength(1)
    const href = screen
      .getByRole('link', { name: '进入对话舞台' })
      .getAttribute('href')!
    expect(href).toContain('mode=extended')
    expect(href).not.toContain('private')
    expect(href).not.toContain('q%3D')
    expect(screen.getByText(/至少一次非空表达/)).toBeVisible()
    expect(screen.queryByText('本次任务')).not.toBeInTheDocument()
    const denied = vi.spyOn(history, 'replaceState').mockImplementation(() => {
      throw new Error('denied')
    })
    try {
      fireEvent.click(screen.getByRole('radio', { name: /标准/ }))
      expect(screen.getByRole('radio', { name: /标准/ })).toBeChecked()
      expect(
        screen.getByRole('link', { name: '进入对话舞台' }),
      ).toHaveAttribute('href', expect.stringContaining('mode=standard'))
      expect(location.pathname).toBe('/scenes/prepare')
    } finally {
      denied.mockRestore()
    }
  })
  it('distinguishes unavailable content from unknown analysis and supports explicit retry', async () => {
    loader.mockRejectedValueOnce(new Error('offline'))
    render(
      <ScenePreparation
        scene={{
          ...SCENE_METADATA.find((item) => item.id === 'study-06')!,
          level: 'B1',
        }}
        backHref="/scenes"
      />,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('下载或读取失败')
    expect(
      screen.queryByRole('link', { name: '进入对话舞台' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重试下载此分类' })).toBeEnabled()
    expect(
      screen.getByRole('heading', { level: 1, name: '老师答疑' }),
    ).toBeVisible()
  })
})
