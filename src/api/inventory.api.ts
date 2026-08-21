import { request } from './client';
import type { InventoryRecord } from '@/models/domain';
import { FRAMES } from '@/services/ProductService';
/** Mock inventory: everything in stock. Reservation/locking documented in docs/backend-architecture.md. */
export const InventoryApi = {
  bySku: (sku: string): Promise<InventoryRecord | null> =>
    request(`/inventory/${sku}`, () => {
      const f = FRAMES.find(x => x.sku === sku);
      return f ? { sku, variantId: f.id, availableQty: 25, reservedQty: 0, status: 'in_stock' } : null;
    }),
};
