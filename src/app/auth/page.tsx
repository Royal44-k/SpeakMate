import { AuthPanel } from '@/features/auth/auth-panel'

export const metadata = { title: '可选同步' }

export default function AuthPage() {
  return <AuthPanel url={process.env.NEXT_PUBLIC_SUPABASE_URL} anonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY} />
}
