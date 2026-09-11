'use client'
import {
  House,
  SquaresFour,
  UserCircle,
  Target,
  Notebook,
} from '@phosphor-icons/react'
import { useLayoutEffect, useRef } from 'react'

import styles from './app-shell.module.css'

export type AppDestination = 'goals' | 'practice' | 'scenes' | 'notebook' | 'me'

const destinations = [
  { key: 'goals', label: '目标', href: '/', Icon: Target },
  { key: 'practice', label: '练习', href: '/practice', Icon: House },
  { key: 'scenes', label: '场景', href: '/scenes', Icon: SquaresFour },
  { key: 'notebook', label: '记录簿', href: '/notebook', Icon: Notebook },
  { key: 'me', label: '我的', href: '/me', Icon: UserCircle },
] as const

export function BottomNavigation({ active }: { active: AppDestination }) {
  const nav = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const root = document.documentElement
    const measure = () => {
      const height = nav.current?.getBoundingClientRect().height
      if (height && Number.isFinite(height))
        root.style.setProperty('--footer-height', `${Math.ceil(height)}px`)
    }
    root.dataset.footerVisible = 'true'
    measure()
    const observer =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(measure)
        : undefined
    if (nav.current) observer?.observe(nav.current)
    window.addEventListener('resize', measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
      root.style.removeProperty('--footer-height')
      delete root.dataset.footerVisible
    }
  }, [])
  return (
    <nav ref={nav} className={styles.navigation} aria-label="主要导航">
      {destinations.map(({ key, label, href, Icon }) => {
        const current = key === active
        return (
          <a
            className={
              current ? styles.navigationLinkActive : styles.navigationLink
            }
            href={href}
            key={key}
            aria-current={current ? 'page' : undefined}
          >
            <Icon aria-hidden size={23} weight={current ? 'fill' : 'regular'} />
            <span>{label}</span>
          </a>
        )
      })}
    </nav>
  )
}
