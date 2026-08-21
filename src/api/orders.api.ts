import { request } from './client';
import { ApiError } from './types';
import type { CartItem, Address, Order } from '@/models';
import { load, save, uid } from '@/utils/storage';

const KEY = 'kyoto.orders';
const IDEM_KEY = 'kyoto.orderIdemKeys';

/** Mock order repository with idempotent creation.
 *  Live impl: POST /orders with Idempotency-Key header; backend must dedupe. */
export const OrdersApi = {
  list(): Promise<Order[]> { return request('/orders', () => load<Order[]>(KEY, [])); },
  byId(id: string): Promise<Order | null> {
    return request(`/orders/${id}`, () => load<Order[]>(KEY, []).find(o => o.orderId === id) ?? null);
  },
  create(input: {
    items: CartItem[]; totals: { subtotal: number; shipping: number; tax: number };
    paymentMethod: string; shippingAddress: Address; rxNeeded: boolean;
    shippingMethodId: string; idempotencyKey: string;
  }): Promise<Order> {
    return request('/orders', () => {
      const idem = load<Record<string, string>>(IDEM_KEY, {});
      const all = load<Order[]>(KEY, []);
      if (idem[input.idempotencyKey]) {
        const existing = all.find(o => o.orderId === idem[input.idempotencyKey]);
        if (existing) return existing;             // duplicate Place Order → same order, no dupe
      }
      if (!input.items.length) throw new ApiError('VALIDATION_ERROR', 'empty cart');
      const order: Order = {
        orderId: uid(),                            // internal id
        number: 'KE-' + Math.floor(10000 + Math.random() * 89999),  // customer-facing (mock format only)
        createdAt: new Date().toISOString(),
        items: JSON.parse(JSON.stringify(input.items)),   // immutable snapshot
        subtotal: input.totals.subtotal, shipping: input.totals.shipping, tax: input.totals.tax,
        total: +(input.totals.subtotal + input.totals.shipping + input.totals.tax).toFixed(2),
        paymentMethod: input.paymentMethod,
        status: input.rxNeeded ? 'rx_needed' : 'rx_verification',
        shippingAddress: JSON.parse(JSON.stringify(input.shippingAddress)),
        shippingMethodId: input.shippingMethodId,
      };
      all.unshift(order); save(KEY, all);
      idem[input.idempotencyKey] = order.orderId; save(IDEM_KEY, idem);
      return order;
    });
  },
};
