'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  canonicalLegacyHref,
  documentNavigation,
} from '@/components/app-shell/learning-routes'

export function LegacyLearningShell() {
  const pathname = usePathname()
  const params = useSearchParams()
  const href = canonicalLegacyHref(`${pathname}?${params}`)
  useEffect(() => {
    if (href) documentNavigation.replace(href)
  }, [href])
  return (
    <main className="route-recovery">
      <h1 data-page-title tabIndex={-1}>
        {href
          ? '正在打开本地学习入口…'
          : '这个旧链接无法恢复，记录没有被修改。'}
      </h1>
      <a href={href ?? '/scenes'}>{href ? '继续打开' : '返回场景库'}</a>
    </main>
  )
}
