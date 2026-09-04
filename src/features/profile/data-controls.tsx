'use client'

import { DownloadSimple, Trash } from '@phosphor-icons/react'
import { useState } from 'react'

import { createIndexedDbRepositories } from '@/infrastructure/persistence/repositories'

import styles from './data-controls.module.css'

function downloadJson(value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `speakmate-export-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function DataControls({
  onExport,
  onClear,
}: {
  onExport?: () => void | Promise<void>
  onClear?: () => void | Promise<void>
}) {
  const [confirmation, setConfirmation] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function exportData() {
    setBusy(true)
    setError(null)
    try {
      if (onExport) await onExport()
      else downloadJson(await createIndexedDbRepositories().exportLearnerData())
      setStatus('学习数据已导出。')
    } catch {
      setStatus(null)
      setError('数据导出没有完成，请稍后重试。')
    } finally {
      setBusy(false)
    }
  }

  async function clearData() {
    if (confirmation !== '清空') return
    setBusy(true)
    setError(null)
    try {
      if (onClear) await onClear()
      else await createIndexedDbRepositories().clearLearnerData()
      setConfirmation('')
      setStatus('本机学习数据已清空。')
    } catch {
      setStatus(null)
      setError('清空操作没有完成，请关闭其他 SpeakMate 页面后重试。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={styles.controls} aria-labelledby="data-title">
      <h2 id="data-title">你的数据</h2>
      <p>练习记录默认只保存在这台设备。导出文件不包含原始录音。</p>
      <button type="button" className={styles.exportButton} disabled={busy} onClick={() => void exportData()}><DownloadSimple aria-hidden size={20} />导出学习数据</button>
      <div className={styles.dangerZone}>
        <h3>清空本机数据</h3>
        <p>此操作无法撤销；若未来启用同步，不会自动删除云端账号数据。</p>
        <label htmlFor="clear-confirmation">输入“清空”以确认</label>
        <input id="clear-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" />
        <button type="button" disabled={busy || confirmation !== '清空'} onClick={() => void clearData()}><Trash aria-hidden size={19} />永久清空本机数据</button>
      </div>
      {status ? <p className={styles.status} role="status">{status}</p> : null}
      {error ? <p className={styles.status} role="alert">{error}</p> : null}
    </section>
  )
}
