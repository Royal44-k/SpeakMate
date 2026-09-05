import { MobilePageHeader } from '@/components/app-shell/mobile-page-header'
import { AuthPanel } from '@/features/auth/auth-panel'

export const metadata = { title: '可选同步' }

export default function AuthPage() {
  return (
    <main>
      <MobilePageHeader title="同步学习记录" eyebrow="OPTIONAL SYNC" fallbackHref="/me" />
      <AuthPanel
        enabled={process.env.NEXT_PUBLIC_SYNC_ENABLED === 'true'}
        url={process.env.NEXT_PUBLIC_SUPABASE_URL}
        anonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}
      />
    </main>
  )
}
