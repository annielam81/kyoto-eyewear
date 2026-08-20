/** Provider interfaces only. NO production OAuth credentials in Phase 3. */
export type AuthProvider = 'email' | 'apple' | 'google' | 'xhs';
export interface AuthResult { ok: boolean; userId?: string; name?: string; mock: true }
export const AuthService = {
  async signIn(provider: AuthProvider, _payload?: { email?: string; password?: string }): Promise<AuthResult> {
    // PRODUCTION-INTEGRATION-REQUIRED: replace with real provider SDK flows.
    await new Promise(r => setTimeout(r, 400));
    return { ok: true, userId: 'mock-user', name: 'Anni', mock: true };
  },
  async signOut(): Promise<void> { /* mock */ },
};
