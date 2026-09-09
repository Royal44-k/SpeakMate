'use client'

import { HardDrive } from '@phosphor-icons/react'
import Link from 'next/link'

import styles from './auth-panel.module.css'

export function AuthPanel({
  url,
  anonKey,
  enabled = false,
}: {
  url?: string
  anonKey?: string
  enabled?: boolean
}) {
  void enabled
  void url
  void anonKey

  return (
    <section className={styles.page}>
      <h2>练习不登录，也能继续。</h2>
      <p className={styles.intro}>当前版本不连接账号或云端学习服务，也不需要微信、手机号或邮箱。</p>
      <section className={styles.localOnly}><HardDrive aria-hidden size={25} /><div><h2>仅保存在本机</h2><p>学习记录保存在这台设备；你无需登录即可免费练习。</p></div></section>
      <Link href="/me">返回学习中心</Link>
    </section>
  )
}
