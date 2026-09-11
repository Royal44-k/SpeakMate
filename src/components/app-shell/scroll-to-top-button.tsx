'use client'

import { ArrowUp } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

const buttonStyle = {
  position: 'fixed',
  zIndex: 19,
  right: 'max(18px, calc((100vw - var(--content-max)) / 2 + 18px))',
  bottom:
    'calc(var(--footer-height, env(safe-area-inset-bottom)) + var(--update-clearance, 0px) + 12px)',
  display: 'grid',
  width: '48px',
  height: '48px',
  placeItems: 'center',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-atlantic-800)',
  boxShadow: '0 9px 24px rgb(12 42 67 / 22%)',
  color: 'var(--color-white)',
  cursor: 'pointer',
} as const

export function ScrollToTopButton({
  thresholdViewports = 2,
}: {
  thresholdViewports?: number
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const updateVisibility = () => {
      setVisible(window.scrollY > window.innerHeight * thresholdViewports)
    }

    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })
    window.addEventListener('resize', updateVisibility)
    return () => {
      window.removeEventListener('scroll', updateVisibility)
      window.removeEventListener('resize', updateVisibility)
    }
  }, [thresholdViewports])

  if (!visible) return null

  function handleClick() {
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      aria-label="返回顶部"
      title="返回顶部"
      style={buttonStyle}
      onClick={handleClick}
    >
      <ArrowUp aria-hidden size={22} weight="bold" />
    </button>
  )
}
