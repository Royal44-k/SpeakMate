'use client'

import { useState, useSyncExternalStore } from 'react'
import { createRecoveryReadStorage } from '@/infrastructure/persistence/storage'
import { exportLearnerData } from '@/infrastructure/persistence/backup'
import styles from '@/features/goals/goals.module.css'

function subscribeControl(listener: () => void) {
  navigator.serviceWorker?.addEventListener('controllerchange', listener)
  return () =>
    navigator.serviceWorker?.removeEventListener('controllerchange', listener)
}
function readControl() {
  return !navigator.serviceWorker
    ? 'unsupported'
    : navigator.serviceWorker.controller
      ? 'controlled'
      : 'none'
}

export function RecoveryPage() {
  const control = useSyncExternalStore(
    subscribeControl,
    readControl,
    () => 'checking',
  )
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function unregister() {
    setBusy(true)
    setError('')
    setStatus('')
    try {
      if (!navigator.serviceWorker)
        throw new Error('浏览器不支持工作线程检查。')
      const registrations = await navigator.serviceWorker.getRegistrations()
      const ownScripts = new Set(
        ['/sw.js', '/sw.js?v=2.3.0', '/sw.js?v=3.0.0'].map(
          (path) => `${location.origin}${path}`,
        ),
      )
      let removed = 0
      let unknown = 0
      for (const registration of registrations) {
        const workers = [
          registration.active,
          registration.waiting,
          registration.installing,
        ].filter(Boolean)
        if (
          registration.scope !== `${location.origin}/` ||
          !workers.length ||
          workers.some((worker) => !ownScripts.has(worker!.scriptURL))
        ) {
          unknown += 1
          continue
        }
        if (!(await registration.unregister()))
          throw new Error('注销请求未成功。')
        removed += 1
      }
      setStatus(
        `${removed ? '本应用注销请求成功' : '未发现可注销的本应用注册'}；保留 ${unknown} 个未知注册。没有删除缓存或学习数据。注销成功不代表当前页面已脱离控制。`,
      )
    } catch (cause) {
      setError(
        `注销没有完成；本页面仍只读。${cause instanceof Error ? cause.message : '请重试。'}`,
      )
    } finally {
      setBusy(false)
    }
  }

  async function download() {
    setBusy(true)
    setError('')
    setStatus('')
    try {
      const data = await exportLearnerData(createRecoveryReadStorage())
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data)], { type: 'application/json' }),
      )
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `speakmate-recovery-${new Date().toISOString().slice(0, 10)}.json`
      anchor.click()
      // The browser consumes the click before the temporary download URL is released.
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setStatus(
        `已生成完整版本 2 备份：${data.sessions.length} 条练习、${data.notebook.length} 条笔记。请在文件 App 选择“我的 iPhone”并确认文件已保存；发起下载不等于已安全备份。`,
      )
    } catch (cause) {
      setError(
        `完整导出没有完成，未生成截断备份。${cause instanceof Error ? cause.message : '请重试；不要清空数据。'}`,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className={styles.page} data-recovery-only="true">
      <h1 tabIndex={-1}>只读数据恢复</h1>
      <p>
        SpeakMate 3.0 ·{' '}
        {process.env.NEXT_PUBLIC_RECOVERY_ONLY === 'true'
          ? '应急只读构建'
          : '正常构建的只读入口'}
      </p>
      <p>
        这里只读取已经升级到版本 2
        的本机数据并导出，不创建或升级数据库。不提供练习、继续、编辑、导入、清空或兑换。
      </p>
      <p>
        首次切换需要联网。旧学习窗口不会自动变成只读；请不要在其他窗口继续操作。
      </p>
      <section className={styles.card} aria-label="工作线程状态">
        <h2>先确认恢复入口</h2>
        <p role="status">
          {control === 'checking'
            ? '正在检查当前控制器…'
            : control === 'controlled'
              ? '当前页面仍受工作线程控制；本恢复界面保持只读。'
              : control === 'none'
                ? '当前页面没有工作线程控制器。此检查不能证明没有其他旧窗口。'
                : '无法检查工作线程；本恢复界面保持只读。'}
        </p>
        <button disabled={busy} onClick={() => void unregister()}>
          注销本应用工作线程
        </button>
        <p>
          注销后或遇到失败／仍受控制时，关闭所有 SpeakMate 标签页和已安装 PWA
          窗口，再联网重新打开本源的固定入口
          /recovery。不要清空站点数据；此页不会自动刷新。
        </p>
      </section>
      <section className={styles.card} aria-label="完整只读备份">
        <h2>保留完整学习数据</h2>
        <p>
          使用与正常版本相同的完整备份校验，包含记录、笔记、任务、事件、积分和奖励；不含临时录音。上限
          10 MiB，超限或数据不合法时明确失败，不截断、不修复原数据。
        </p>
        <button disabled={busy} onClick={() => void download()}>
          读取并导出完整备份
        </button>
      </section>
      {status ? <p role="status">{status}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </main>
  )
}
