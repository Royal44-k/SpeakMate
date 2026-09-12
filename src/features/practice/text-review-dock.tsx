'use client'

import { useEffect, useRef } from 'react'

import styles from './text-review-dock.module.css'

function LocalRecordingAudio({ audio }: { audio: Blob }) {
  const element = useRef<HTMLAudioElement>(null)
  useEffect(() => {
    const player = element.current
    if (!player || typeof URL.createObjectURL !== 'function') return
    const url = URL.createObjectURL(audio)
    player.src = url
    return () => {
      player.removeAttribute('src')
      URL.revokeObjectURL(url)
    }
  }, [audio])
  return <audio ref={element} controls aria-label="回听本次录音" />
}

export function TextReviewDock({
  transcript,
  canSubmit,
  errorMessage,
  hasAudio,
  audio,
  onChange,
  onCancel,
  onSubmit,
}: {
  transcript: string
  canSubmit: boolean
  errorMessage?: string
  hasAudio: boolean
  audio?: Blob
  onChange: (transcript: string) => void
  onCancel: () => void
  onSubmit: () => void
}) {
  return (
    <section className={styles.dock} aria-labelledby="text-review-dock-title">
      <div className={styles.inner}>
        <div className={styles.heading}>
          <span>YOUR TURN</span>
          <h2 id="text-review-dock-title">确认你刚才说的话</h2>
        </div>
        <label htmlFor="turn-transcript">英文内容</label>
        <textarea
          id="turn-transcript"
          rows={3}
          autoFocus
          value={transcript}
          placeholder="例如：Hello, I have a reservation under the name Chen."
          onChange={(event) => onChange(event.target.value)}
        />
        {errorMessage ? <p role="alert">{errorMessage}</p> : null}
        {hasAudio ? (
          <>
            <p>录音仅用于本机回听。请输入或确认英文内容后才能提交。</p>
            {audio && typeof URL.createObjectURL === 'function' ? (
              <LocalRecordingAudio audio={audio} />
            ) : null}
          </>
        ) : null}
        <div className={styles.actions}>
          <button type="button" onClick={onCancel}>
            取消
          </button>
          <button type="button" disabled={!canSubmit} onClick={onSubmit}>
            提交这一轮
          </button>
        </div>
      </div>
    </section>
  )
}
