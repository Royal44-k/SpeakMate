import type { ReactNode } from 'react'

import { BottomNavigation, type AppDestination } from './bottom-navigation'
import styles from './app-shell.module.css'

export function AppShell({
  activeDestination,
  children,
  immersive = false,
  contentOwnsMain = false,
}: {
  activeDestination: AppDestination
  children: ReactNode
  immersive?: boolean
  contentOwnsMain?: boolean
}) {
  return (
    <div className={immersive ? styles.shellImmersive : styles.shell}>
      {contentOwnsMain ? (
        <div className={styles.content}>{children}</div>
      ) : (
        <main className={styles.content}>{children}</main>
      )}
      <BottomNavigation active={activeDestination} />
    </div>
  )
}
