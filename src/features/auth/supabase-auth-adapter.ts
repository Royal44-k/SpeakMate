import { createClient } from '@supabase/supabase-js'

import type { AuthAdapter } from './auth-adapter'

export function createSupabaseAuthAdapter(url: string, anonKey: string): AuthAdapter {
  const client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  return {
    enabled: true,
    async sendOtp(email) {
      const { error } = await client.auth.signInWithOtp({
        email,
        options: typeof window === 'undefined'
          ? undefined
          : { emailRedirectTo: `${window.location.origin}/auth` },
      })
      if (error) throw error
    },
    async getUser() {
      const { data, error } = await client.auth.getUser()
      if (error || !data.user) return null
      return { id: data.user.id, email: data.user.email }
    },
    async signOut() {
      const { error } = await client.auth.signOut()
      if (error) throw error
    },
  }
}
