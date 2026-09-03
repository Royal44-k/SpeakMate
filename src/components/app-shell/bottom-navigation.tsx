import { House, SquaresFour, UserCircle } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

import styles from './app-shell.module.css'

export type AppDestination = 'practice' | 'scenes' | 'me'

const destinations = [
  { key: 'practice', label: '练习', href: '/practice', Icon: House },
  { key: 'scenes', label: '场景', href: '/scenes', Icon: SquaresFour },
  { key: 'me', label: '我的', href: '/me', Icon: UserCircle },
] as const

export function BottomNavigation({ active }: { active: AppDestination }) {
  return (
    <nav className={styles.navigation} aria-label="主要导航">
      {destinations.map(({ key, label, href, Icon }) => {
        const current = key === active
        return (
          <Link
            className={current ? styles.navigationLinkActive : styles.navigationLink}
            href={href}
            key={key}
            aria-current={current ? 'page' : undefined}
          >
            <Icon aria-hidden size={23} weight={current ? 'fill' : 'regular'} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
