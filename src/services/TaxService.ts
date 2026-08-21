import type { Address } from '@/models';
/** Mock estimation only — future integration by shipping address. Never one global hard-coded rate in UI. */
export const TaxService = {
  async estimate(subtotal: number, addr: Partial<Address>): Promise<number> {
    const rate = addr.stateCode?.toUpperCase() === 'OR' ? 0 : 0.0875; // mock — per-state table in production
    return Math.round(subtotal * rate * 100) / 100;
  },
};
