'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import styles from './scene-library.module.css'

const EDGE_TOLERANCE = 1

export function HorizontalFilterGroup({
  label,
  selectedValue,
  children,
}: {
  label: string
  selectedValue: string | number
  children: ReactNode
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)
  const [edges, setEdges] = useState({ atStart: true, atEnd: true })

  const updateEdges = useCallback(() => {
    const track = trackRef.current
    if (!track) return

    const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth)
    setEdges({
      atStart: track.scrollLeft <= EDGE_TOLERANCE,
      atEnd: maxScrollLeft - track.scrollLeft <= EDGE_TOLERANCE,
    })
  }, [])

  useLayoutEffect(() => {
    const track = trackRef.current
    activeRef.current =
      track?.querySelector<HTMLButtonElement>('[aria-pressed="true"]') ?? null

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    activeRef.current?.scrollIntoView?.({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center',
    })
    updateEdges()
  }, [selectedValue, updateEdges])

  useEffect(() => {
    const track = trackRef.current
    if (!track || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(updateEdges)
    observer.observe(track)
    return () => observer.disconnect()
  }, [updateEdges])

  return (
    <div
      className={styles.horizontalFilterGroup}
      data-at-start={edges.atStart}
      data-at-end={edges.atEnd}
    >
      <div
        ref={trackRef}
        className={styles.horizontalFilterTrack}
        role="group"
        aria-label={label}
        onScroll={updateEdges}
      >
        {children}
      </div>
    </div>
  )
}
