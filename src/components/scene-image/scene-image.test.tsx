import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SceneImage } from './scene-image'
describe('fixed offline scene media', () => {
  it.each([
    'travel',
    'dining',
    'daily',
    'work',
    'social',
    'study',
    'emergency',
    'hotel',
  ])('renders %s directly without an optimizer dependency', (key) => {
    render(
      <SceneImage image={{ key, altZh: '场景插图', focalPoint: '50% 45%' }} />,
    )
    const image = screen.getByRole('img', { name: '场景插图' })
    expect(image).toHaveAttribute('src', `/scenes/${key}.webp`)
    expect(image).not.toHaveAttribute('srcset')
    expect(image).toHaveAttribute('loading', 'lazy')
    expect(image).toHaveStyle({
      objectPosition: '50% 45%',
      position: 'absolute',
    })
  })
})
