'use client'

import { DownloadSimple, Trash } from '@phosphor-icons/react'
import { useState } from 'react'

import {
  createIndexedDbRepositories,
  type Repositories,
} from '@/infrastructure/persistence/repositories'
import type { RestorePreview } from '@/infrastructure/persistence/backup'

import styles from './data-controls.module.css'

function recoveryMessage(cause: unknown): string {
  if (cause && typeof cause === 'object' && 'name' in cause) {
    if (cause.name === 'QuotaExceededError')
      return '存储空间不足。请先保留已有备份，释放设备空间后重新预览并重试；不要清空浏览器学习数据。'
    if (cause.name === 'SecurityError')
      return '浏览器阻止了本地存储。请允许此站点保存数据后重试。'
  }
  return cause instanceof Error ? cause.message : '请重试。'
}

function downloadJson(value: unknown) {
  const blob = new Blob([JSON.stringify(value)], { type: 'application/json' })
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
  repositories,
}: {
  onExport?: () => void | Promise<void>
  onClear?: () => void | Promise<void>
  repositories?: Repositories
}) {
  const [repository] = useState(
    () => repositories ?? createIndexedDbRepositories(),
  )
  const [confirmation, setConfirmation] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<RestorePreview | null>(null)

  async function previewFile(value: File) {
    setFile(value)
    setPreview(null)
    setStatus(null)
    setError(null)
    setBusy(true)
    try {
      setPreview(await repository.previewRestore(value))
    } catch (cause) {
      setError(`恢复预览没有完成。${recoveryMessage(cause)}`)
    } finally {
      setBusy(false)
    }
  }

  async function restoreData() {
    if (!preview?.canImport) return
    setBusy(true)
    setError(null)
    setStatus(null)
    try {
      const result = await repository.restoreLearnerData(preview)
      const counts = Object.values(result.counts)
      setStatus(
        `恢复完成：新增 ${counts.reduce((sum, count) => sum + count.added, 0)} 条，更新 ${counts.reduce((sum, count) => sum + count.updated, 0)} 条。重复记录不会重复发放积分。`,
      )
      setPreview(null)
      setFile(null)
    } catch (cause) {
      setError(`恢复没有完成，本机数据未清空。${recoveryMessage(cause)}`)
    } finally {
      setBusy(false)
    }
  }

  async function exportData() {
    setBusy(true)
    setError(null)
    try {
      if (onExport) await onExport()
      else downloadJson(await repository.exportLearnerData())
      setStatus(
        `最近生成导出：${new Date().toLocaleString('zh-CN')}。请在文件 App 确认文件已保存；生成下载请求不等于已安全备份。`,
      )
    } catch (cause) {
      setStatus(null)
      setError(`数据导出没有完成，请稍后重试。${recoveryMessage(cause)}`)
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
      else await repository.clearLearnerData()
      setPreview(null)
      setFile(null)
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
      <p>
        建议每周及清理站点数据、升级或换设备前导出备份。清理浏览器数据或设备回收空间可能删除本地数据；浏览器即使允许持久存储也不能代替备份。本版没有跨设备自动同步。
      </p>
      <p>本地积分可自行修改，不代表经过验证的真实排行榜成绩。</p>
      <button
        type="button"
        className={styles.exportButton}
        disabled={busy}
        onClick={() => void exportData()}
      >
        <DownloadSimple aria-hidden size={20} />
        导出学习数据
      </button>
      <div className={styles.restoreZone}>
        <label htmlFor="restore-file">选择学习数据备份</label>
        <input
          id="restore-file"
          type="file"
          accept="application/json,.json"
          disabled={busy}
          onChange={(event) => {
            const selected = event.target.files?.[0]
            if (selected) void previewFile(selected)
            event.target.value = ''
          }}
        />
        <p>
          支持版本 1 / 2 JSON，最多 10
          MB。预览不会修改数据；确认后按时间合并，不覆盖较新的记录。
        </p>
        {busy ? <p aria-live="polite">正在处理本机数据…</p> : null}
        {preview ? (
          <section aria-labelledby="restore-preview-title">
            <h3 id="restore-preview-title">恢复预览</h3>
            <p>备份版本 {preview.sourceVersion}</p>
            <ul>
              {Object.entries(preview.counts)
                .filter(([, count]) => count.incoming > 0)
                .map(([name, count]) => (
                  <li key={name}>
                    {collectionNames[name] ?? name}：{count.incoming} 条，新增{' '}
                    {count.added}，更新 {count.updated}，保留 {count.unchanged}
                    ，移除 {count.removed}
                  </li>
                ))}
            </ul>
            {preview.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
            {preview.conflicts.length ? (
              <div role="alert">
                <p>以下冲突需要处理，当前不能恢复：</p>
                <ul>
                  {preview.conflicts.map((conflict) => (
                    <li key={conflict}>{conflict}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <button
              type="button"
              disabled={busy || !preview.canImport}
              onClick={() => void restoreData()}
            >
              确认合并恢复
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setPreview(null)
                setFile(null)
                setError(null)
              }}
            >
              取消恢复
            </button>
          </section>
        ) : null}
        {error && file ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void previewFile(file)}
          >
            重新预览并重试
          </button>
        ) : null}
      </div>
      <div className={styles.dangerZone}>
        <h3>清空本机数据</h3>
        <p>
          此操作无法撤销，将清空此浏览器内的学习记录、笔记、任务、积分与奖励。请先生成导出并确认文件已保存；本版没有云端副本。
        </p>
        <label htmlFor="clear-confirmation">输入“清空”以确认</label>
        <input
          id="clear-confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="off"
        />
        <button
          type="button"
          disabled={busy || confirmation !== '清空'}
          onClick={() => void clearData()}
        >
          <Trash aria-hidden size={19} />
          永久清空本机数据
        </button>
      </div>
      {status ? (
        <p className={styles.status} role="status">
          {status}
        </p>
      ) : null}
      {error ? (
        <p className={styles.status} role="alert">
          {error}
        </p>
      ) : null}
    </section>
  )
}

const collectionNames: Record<string, string> = {
  profile: '个人资料',
  settings: '偏好设置',
  sessions: '练习记录',
  turns: '对话轮次',
  favorites: '收藏',
  notebook: '笔记',
  reviews: '复习',
  dailyPlans: '每日计划',
  learningEvents: '学习事件',
  pointsLedger: '积分账本',
  rewardUnlocks: '已拥有奖励',
  outbox: '本地待处理记录',
}
