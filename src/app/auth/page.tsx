import { MobilePageHeader } from '@/components/app-shell/mobile-page-header'
import { AuthPanel } from '@/features/auth/auth-panel'
import { AppShell } from '@/components/app-shell/app-shell'

export const metadata = { title: '本机数据' }

export default function AuthPage() {
  return (
    <AppShell activeDestination="me" contentOwnsMain>
      <main>
        <MobilePageHeader
          title="本机学习记录"
          eyebrow="LOCAL DATA"
          fallbackHref="/me"
        />
        <AuthPanel />
      </main>
    </AppShell>
  )
}
