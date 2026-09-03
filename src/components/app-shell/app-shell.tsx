import type { ReactNode } from 'react'

import { BottomNavigation, type AppDestination } from './bottom-navigation'
import styles from './app-shell.module.css'

export function AppShell({
  activeDestination,
  children,
  immersive = false,
}: {
  activeDestination: AppDestination
  children: ReactNode
  immersive?: boolean
}) {
  return (
    <div className={immersive ? styles.shellImmersive : styles.shell}>
      <main className={styles.content}>{children}</main>
      <BottomNavigation active={activeDestination} />
    </div>
  )
}
