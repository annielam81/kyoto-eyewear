import { defineStore } from 'pinia';
import { AuthService, type AuthProvider } from '@/services/AuthService';
import { load, save } from '@/utils/storage';
export const useUserStore = defineStore('user', {
  state: () => ({ userId: load<string|null>('kyoto.userId', null), name: load<string>('kyoto.userName','') }),
  getters: { signedIn: s => !!s.userId },
  actions: {
    async signIn(p: AuthProvider, payload?: any) {
      const r = await AuthService.signIn(p, payload);
      if (r.ok) { this.userId = r.userId!; this.name = r.name!; save('kyoto.userId', this.userId); save('kyoto.userName', this.name); }
      return r;
    },
    async signOut() { await AuthService.signOut(); this.userId = null; this.name=''; save('kyoto.userId',''); },
  },
});
