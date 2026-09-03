import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'SpeakMate｜口语搭子',
    template: '%s｜SpeakMate',
  },
  description: '随时随地练习真实场景英语口语，免登录即可开始。',
  applicationName: 'SpeakMate',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SpeakMate',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#123b5d',
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
