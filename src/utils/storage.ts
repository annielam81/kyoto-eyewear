export function load<T>(key: string, fallback: T): T {
  try { const v = uni.getStorageSync(key); return v === '' || v == null ? fallback : (v as T); }
  catch { return fallback; }
}
export function save(key: string, value: unknown): void {
  try { uni.setStorageSync(key, value as any); } catch { /* noop */ }
}
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
