import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { getProvider } from '@/lib/provider';
import { signIn as doSignIn, signOut as doSignOut } from '@/lib/auth';
import type { Session } from '../../../supabase/kyoto';

export const useSessionStore = defineStore('session', () => {
  const session = ref<Session | null>(null);
  const loaded = ref(false);
  const providerName = ref<'supabase' | 'mock'>(getProvider().name);

  const isLoggedIn = computed(() => !!session.value);
  const profile = computed(() => session.value?.profile ?? null);
  const isOwner = computed(() => profile.value?.role === 'owner');
  const isAdmin = computed(() => profile.value?.role === 'owner' || profile.value?.role === 'admin');
  const canPublish = computed(() => !!profile.value?.canPublish);
  const canAccessPrescriptions = computed(() => !!profile.value?.canAccessPrescriptions);

  async function init() {
    try {
      session.value = await getProvider().getSession();
    } catch {
      session.value = null;
    } finally {
      loaded.value = true;
    }
  }

  async function signIn(email: string, password: string) {
    session.value = await doSignIn(email, password);
  }

  async function signOut() {
    await doSignOut();
    session.value = null;
  }

  return {
    session, loaded, providerName,
    isLoggedIn, profile, isOwner, isAdmin, canPublish, canAccessPrescriptions,
    init, signIn, signOut,
  };
});
