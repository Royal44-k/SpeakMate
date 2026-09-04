import { AuthPanel } from '@/features/auth/auth-panel'

export const metadata = { title: '可选同步' }

export default function AuthPage() {
  return (
    <AuthPanel
      enabled={process.env.NEXT_PUBLIC_SYNC_ENABLED === 'true'}
      url={process.env.NEXT_PUBLIC_SUPABASE_URL}
      anonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}
    />
  )
}
