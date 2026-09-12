import type { ReactNode } from 'react'

import { SmartBackLink } from './smart-back-link'
import styles from './mobile-page-header.module.css'

export function MobilePageHeader({
  title,
  eyebrow,
  fallbackHref,
  backLabel,
  trailing,
}: {
  title: string
  eyebrow?: string
  fallbackHref: string
  backLabel?: string
  trailing?: ReactNode
}) {
  const destination = (
    {
      '/': '今日目标',
      '/me': '我的练习',
      '/scenes': '场景库',
      '/practice': '今日练习',
      '/notebook': '记录簿',
      '/rewards': '数字奖励',
    } as Record<string, string>
  )[fallbackHref.split(/[?#]/)[0]]
  return (
    <header className={styles.header}>
      <SmartBackLink
        fallbackHref={fallbackHref}
        ariaLabel={
          backLabel ?? (destination ? `返回${destination}` : '返回来源页面')
        }
      />
      <div>
        {eyebrow ? <p>{eyebrow}</p> : null}
        <h1 data-page-title tabIndex={-1}>
          {title}
        </h1>
      </div>
      {trailing ? <div className={styles.trailing}>{trailing}</div> : null}
    </header>
  )
}
