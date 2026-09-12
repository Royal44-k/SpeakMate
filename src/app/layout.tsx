import type { Metadata, Viewport } from 'next'
import { Suspense, type ReactNode } from 'react'

import '@fontsource/barlow-condensed/400.css'
import '@fontsource/barlow-condensed/700.css'
import '@fontsource/barlow-condensed/800.css'
import { ApplicationRuntime } from '@/components/app-shell/application-runtime'
import { RecoveryPage } from '@/features/recovery/recovery-page'

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

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        {process.env.NEXT_PUBLIC_RECOVERY_ONLY === 'true' ? (
          <RecoveryPage />
        ) : (
          <>
            {children}
            <Suspense fallback={null}>
              <ApplicationRuntime />
            </Suspense>
          </>
        )}
      </body>
    </html>
  )
}
