/**
 * 认证与角色 helper。
 * 后台是独立账号体系（admin_profiles），没有"顾客"概念。
 */
import { getProvider } from './provider';
import type { AdminProfile } from '../../../supabase/kyoto';

export async function signIn(email: string, password: string) {
  return getProvider().signIn(email, password);
}

export async function signOut() {
  return getProvider().signOut();
}

/** 角色 helper：UI 显示控制 + 路由守卫用。真正的 publish 拒绝在 provider 层。 */
export const isOwner = (p: AdminProfile | null | undefined): boolean => p?.role === 'owner';
export const isAdmin = (p: AdminProfile | null | undefined): boolean =>
  p?.role === 'owner' || p?.role === 'admin';
export const canPublish = (p: AdminProfile | null | undefined): boolean => !!p?.canPublish;
export const canAccessPrescriptions = (p: AdminProfile | null | undefined): boolean =>
  !!p?.canAccessPrescriptions;
