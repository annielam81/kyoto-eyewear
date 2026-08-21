import type { CartItem, Address, Order } from '@/models';
import { OrdersApi } from '@/api/orders.api';
import { uid } from '@/utils/storage';
/** Facade preserved for Phase 3 callers; now routed through the API/repository layer. */
export const OrderService = {
  async place(items: CartItem[], totals: { subtotal:number; shipping:number; tax:number }, pay: string,
              addr: Address, rxNeeded: boolean, shippingMethodId = 'standard', idempotencyKey?: string): Promise<Order> {
    return OrdersApi.create({ items, totals, paymentMethod: pay, shippingAddress: addr,
      rxNeeded, shippingMethodId, idempotencyKey: idempotencyKey ?? uid() });
  },
  list(): Promise<Order[]> { return OrdersApi.list(); },
  byId(id: string): Promise<Order | null> { return OrdersApi.byId(id); },
};
