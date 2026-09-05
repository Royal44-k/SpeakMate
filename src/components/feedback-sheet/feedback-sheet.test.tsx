import { readFileSync } from 'node:fs'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FeedbackSheet } from './feedback-sheet'

const feedback = {
  heard: 'I need a room.',
  corrected: null,
  naturalAlternative: null,
  explanationZh: '表达清楚。',
  issueTags: [],
}
const originalScrollIntoView = Object.getOwnPropertyDescriptor(
  Element.prototype,
  'scrollIntoView',
)

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  if (originalScrollIntoView) {
    Object.defineProperty(
      Element.prototype,
      'scrollIntoView',
      originalScrollIntoView,
    )
  } else {
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView
  }
})

describe('FeedbackSheet', () => {
  it('connects its disclosure button to the expanded content', () => {
    render(
      <FeedbackSheet
        feedback={feedback}
        expanded
        contentId="turn-feedback-details"
        onToggle={vi.fn()}
      />,
    )

    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-controls',
      'turn-feedback-details',
    )
    expect(document.getElementById('turn-feedback-details')).toBeVisible()
  })

  it('scrolls newly expanded feedback into view in one animation frame', async () => {
    const user = userEvent.setup()
    const onExpanded = vi.fn()
    const scrollIntoView = vi.fn()
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        frames.push(callback)
        return frames.length
      }),
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })

    function Harness() {
      const [expanded, setExpanded] = useState(false)
      return (
        <FeedbackSheet
          feedback={feedback}
          expanded={expanded}
          contentId="turn-feedback-details"
          onToggle={() => setExpanded((value) => !value)}
          onExpanded={onExpanded}
        />
      )
    }

    render(<Harness />)
    await user.click(screen.getByRole('button'))

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1)
    frames[0]?.(0)
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
    expect(onExpanded).toHaveBeenCalledTimes(1)
  })

  it('reserves scroll clearance above the practice dock', () => {
    const styles = readFileSync(
      'src/components/feedback-sheet/feedback-sheet.module.css',
      'utf8',
    )

    expect(styles).toMatch(
      /\.details\s*{[^}]*scroll-margin-bottom:\s*calc\(var\(--speech-dock-height\) \+ 24px\);/s,
    )
  })
})
