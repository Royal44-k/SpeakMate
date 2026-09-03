export interface AuthUser {
  id: string
  email?: string
}

export interface AuthAdapter {
  readonly enabled: boolean
  sendOtp(email: string): Promise<void>
  getUser(): Promise<AuthUser | null>
  signOut(): Promise<void>
}

export const localOnlyAuthAdapter: AuthAdapter = {
  enabled: false,
  async sendOtp() {
    throw new Error('SYNC_NOT_CONFIGURED')
  },
  async getUser() {
    return null
  },
  async signOut() {
    return undefined
  },
}
