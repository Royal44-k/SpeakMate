'use client'

import styles from './text-review-dock.module.css'

export function TextReviewDock({
  transcript,
  canSubmit,
  errorMessage,
  hasAudio,
  onChange,
  onCancel,
  onSubmit,
}: {
  transcript: string
  canSubmit: boolean
  errorMessage?: string
  hasAudio: boolean
  onChange: (transcript: string) => void
  onCancel: () => void
  onSubmit: () => void
}) {
  return (
    <section
      className={styles.dock}
      aria-labelledby="text-review-dock-title"
    >
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
        {hasAudio && !transcript.trim() ? (
          <p>
            录音已准备，将先尝试云端识别；若当前为基础模式，再请你输入英文确认。
          </p>
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
