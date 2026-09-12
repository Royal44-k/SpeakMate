'use client'
import { useEffect, useRef, useState } from 'react'
import type { Repositories } from '@/infrastructure/persistence/repositories'
import { createForegroundRecorder } from './foreground'
export function useForegroundTime(
  repo: Repositories,
  profileId: string | undefined,
  runId: string | undefined,
  active: boolean,
) {
  const activeRef = useRef(active)
  const updateVisibility = useRef<(() => void) | undefined>(undefined)
  const [error, setError] = useState(''),
    recorder = useRef<ReturnType<typeof createForegroundRecorder> | undefined>(
      undefined,
    )
  useEffect(() => {
    if (!profileId || !runId) return
    let mounted = true
    const tracker = createForegroundRecorder({
      profileId,
      runId: `${runId}_${crypto.randomUUID()}`,
      clock: () => new Date().toISOString(),
      monotonic: () => performance.now(),
      save: (event) => repo.learning.recordEvent(event),
    })
    recorder.current = tracker
    const flush = () => {
      void tracker
        .flush()
        .then(() => {
          if (mounted) setError('')
        })
        .catch(() => {
          if (mounted)
            setError('前台时长尚未保存，将重试；不影响练习完成和积分。')
        })
    }
    const visibility = () => {
      tracker.setVisible(
        activeRef.current && document.visibilityState === 'visible',
      )
      flush()
    }
    const pagehide = () => {
      tracker.setVisible(false)
      flush()
    }
    updateVisibility.current = visibility
    visibility()
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('pagehide', pagehide)
    const timer = setInterval(flush, 15000)
    return () => {
      mounted = false
      updateVisibility.current = undefined
      clearInterval(timer)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('pagehide', pagehide)
      tracker.setVisible(false)
      flush()
    }
  }, [repo, profileId, runId])
  useEffect(() => {
    activeRef.current = active
    updateVisibility.current?.()
  }, [active])
  return {
    error,
    retry: () => {
      void recorder.current
        ?.flush()
        .then(() => setError(''))
        .catch(() => setError('前台时长仍未保存，请保留页面再试。'))
    },
  }
}
