import { ApiError, type ApiEnvelope, type ApiErrorCode } from './types';
import { uid } from '@/utils/storage';

/** Base URL from environment — never hard-coded in business logic.
 *  dev/staging/production are selected via VITE_API_BASE_URL (.env.example). */
export const API_BASE_URL: string = (import.meta as any).env?.VITE_API_BASE_URL ?? '/api-mock';
export const API_MODE: 'mock' | 'live' = 'mock';   // Phase 4A: mock adapter only

/** QA hook: localStorage 'kyoto.mockNet' = 'offline' | 'timeout' | '500' simulates failures. */
function simulatedFailure(): ApiErrorCode | null {
  try {
    const v = uni.getStorageSync('kyoto.mockNet');
    if (v === 'offline') return 'NETWORK_ERROR';
    if (v === 'timeout') return 'TIMEOUT';
    if (v === '500') return 'SERVER_ERROR';
  } catch { /* noop */ }
  return null;
}

/** Central request wrapper. In mock mode `handler` produces the data locally;
 *  in live mode this becomes fetch(API_BASE_URL + path). Same envelope either way. */
export async function request<T>(_path: string, handler: () => T | Promise<T>): Promise<T> {
  const requestId = uid();
  const fail = simulatedFailure();
  await new Promise(r => setTimeout(r, 80));      // mock latency
  if (fail) throw new ApiError(fail, `simulated ${fail} (${requestId})`);
  try {
    const data = await handler();
    const envelope: ApiEnvelope<T> = { success: true, data, error: null, message: null, requestId };
    return envelope.data as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    // Never leak raw internal errors to customers — wrap as SERVER_ERROR.
    throw new ApiError('SERVER_ERROR', `internal (${requestId})`);
  }
}
