import { request } from './client';
import type { CartItem } from '@/models';
import { load, save } from '@/utils/storage';
const KEY = 'kyoto.cart';
/** Cart persistence stays local & compatible with Phase 3 frontend. Guest→user merge is a future backend concern. */
export const CartApi = {
  get: () => request('/cart', () => load<CartItem[]>(KEY, [])),
  put: (items: CartItem[]) => request('/cart', () => { save(KEY, items); return items; }),
};
