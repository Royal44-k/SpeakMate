'use client'

import { EnvelopeSimple, HardDrive } from '@phosphor-icons/react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { localOnlyAuthAdapter } from './auth-adapter'
import { createSupabaseAuthAdapter } from './supabase-auth-adapter'
import styles from './auth-panel.module.css'

export function AuthPanel({ url, anonKey }: { url?: string; anonKey?: string }) {
  const adapter = useMemo(() => url && anonKey
    ? createSupabaseAuthAdapter(url, anonKey)
    : localOnlyAuthAdapter, [anonKey, url])
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!adapter.enabled || !email.trim()) return
    setSending(true)
    setStatus(null)
    try {
      await adapter.sendOtp(email.trim())
      setStatus('登录链接已发送，请在同一设备上打开邮件完成登录。')
    } catch {
      setStatus('邮件暂时未发送成功；本机练习不受影响，请稍后再试。')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>OPTIONAL SYNC</p>
      <h1>练习不登录，也能继续。</h1>
      <p className={styles.intro}>账号只用于跨设备同步。不会影响免费练习，也不需要微信或手机号。</p>
      {adapter.enabled ? (
        <form onSubmit={(event) => void submit(event)}>
          <label htmlFor="sync-email">邮箱</label>
          <input id="sync-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          <button type="submit" disabled={sending}><EnvelopeSimple aria-hidden size={20} />{sending ? '正在发送…' : '发送邮箱登录链接'}</button>
          <p>登录后可选择合并本机记录；原始录音不会上传。</p>
        </form>
      ) : (
        <section className={styles.localOnly}><HardDrive aria-hidden size={25} /><div><h2>当前仅保存在本机</h2><p>部署者尚未配置 Supabase Free，因此同步入口已安全隐藏。</p></div></section>
      )}
      {status ? <p className={styles.status} role="status">{status}</p> : null}
      <Link href="/me">返回学习中心</Link>
    </main>
  )
}
