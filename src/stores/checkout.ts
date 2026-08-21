import { defineStore } from 'pinia';
import { load, save } from '@/utils/storage';
import type { Address } from '@/models';
import { blankAddress } from './address';
export type PlaceState = 'idle' | 'validating' | 'processing' | 'success' | 'failure';
interface Draft { mode: 'saved' | 'new'; savedId: string | null; addr: Address;
  shippingMethodId: string; payMethod: string }
const fresh = (): Draft => ({ mode: 'saved', savedId: null, addr: blankAddress(),
  shippingMethodId: 'standard', payMethod: 'applePay' });
/** Persists non-sensitive checkout draft only. Card fields are NEVER stored. */
export const useCheckoutStore = defineStore('checkout', {
  state: () => ({ d: load<Draft>('kyoto.checkoutDraft', fresh()), placeState: 'idle' as PlaceState }),
  actions: {
    persist() { save('kyoto.checkoutDraft', JSON.parse(JSON.stringify(this.d))); },
    reset() { this.d = fresh(); this.placeState = 'idle'; this.persist(); },
  },
});
