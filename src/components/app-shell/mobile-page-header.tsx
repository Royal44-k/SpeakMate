import type { ReactNode } from 'react'

import { SmartBackLink } from './smart-back-link'
import styles from './mobile-page-header.module.css'

export function MobilePageHeader({
  title,
  eyebrow,
  fallbackHref,
  trailing,
}: {
  title: string
  eyebrow?: string
  fallbackHref: string
  trailing?: ReactNode
}) {
  return (
    <header className={styles.header}>
      <SmartBackLink fallbackHref={fallbackHref} ariaLabel={`返回${title}`} />
      <div>
        {eyebrow ? <p>{eyebrow}</p> : null}
        <h1 data-page-title tabIndex={-1}>{title}</h1>
      </div>
      {trailing ? <div className={styles.trailing}>{trailing}</div> : null}
    </header>
  )
}
