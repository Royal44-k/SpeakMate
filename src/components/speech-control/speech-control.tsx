'use client'

import { Keyboard, Microphone, Stop, Waveform } from '@phosphor-icons/react'
import { useRef } from 'react'

import type { PracticeStatus } from '@/domain/practice/machine'

import styles from './speech-control.module.css'

interface SpeechControlProps {
  status: PracticeStatus
  elapsedSeconds?: number
  amplitude?: number
  onStart: () => void
  onStop: () => void
  onOpenKeyboard: () => void
}

function formatDuration(seconds: number) {
  return `00:${Math.min(30, seconds).toString().padStart(2, '0')} / 00:30`
}

export function SpeechControl({
  status,
  elapsedSeconds = 0,
  amplitude = 0,
  onStart,
  onStop,
  onOpenKeyboard,
}: SpeechControlProps) {
  const suppressClick = useRef(false)
  const isRecording = status === 'recording'
  const isProcessing = ['submitting', 'receiving', 'requesting-permission'].includes(status)
  const label = isRecording ? '停止录音' : isProcessing ? '正在分析表达' : '开始录音'

  function handleClick() {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    if (isRecording) onStop()
    else onStart()
  }

  return (
    <section className={styles.control} aria-label="语音输入">
      {status === 'text-only' ? (
        <p className={styles.notice}>无法使用麦克风，你仍可输入英文继续练习。</p>
      ) : null}
      <div className={styles.controlsRow}>
        <div className={styles.voiceRow}>
          <Waveform className={styles.wave} aria-hidden size={54} weight="duotone" />
          <button
            type="button"
            className={isRecording ? styles.recordingButton : styles.recordButton}
            aria-label={label}
            disabled={isProcessing}
            style={{ '--amplitude': Math.max(0, Math.min(1, amplitude)) } as React.CSSProperties}
            onClick={handleClick}
            onPointerDown={(event) => {
              if (event.pointerType === 'mouse' || isProcessing || isRecording) return
              suppressClick.current = true
              onStart()
            }}
            onPointerUp={(event) => {
              if (event.pointerType === 'mouse' || !isRecording) return
              onStop()
            }}
          >
            {isRecording ? <Stop aria-hidden size={33} weight="fill" /> : isProcessing ? <Waveform aria-hidden size={35} /> : <Microphone aria-hidden size={35} weight="fill" />}
            <span>{isRecording ? '点击结束' : isProcessing ? '分析中' : '按住说英语'}</span>
          </button>
          <Waveform className={styles.wave} aria-hidden size={54} weight="duotone" />
        </div>
        <div className={styles.caption} aria-live="polite">
          <span>{isRecording ? formatDuration(elapsedSeconds) : '最长 30 秒 · 录音不会保存'}</span>
        </div>
        <button type="button" className={styles.keyboardButton} disabled={isProcessing} onClick={onOpenKeyboard} aria-label="改用键盘输入">
          <Keyboard aria-hidden size={22} /><strong>键盘输入</strong>
        </button>
      </div>
    </section>
  )
}
