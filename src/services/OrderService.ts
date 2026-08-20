import type { Order, CartItem, Address } from '@/models';
import { uid, load, save } from '@/utils/storage';
export const OrderService = {
  async place(items: CartItem[], totals: { subtotal:number; shipping:number; tax:number }, pay: string, addr: Address, rxNeeded: boolean): Promise<Order> {
    const order: Order = { orderId: uid(), number: 'KE-' + Math.floor(10000 + Math.random()*89999),
      createdAt: new Date().toISOString(), items,
      subtotal: totals.subtotal, shipping: totals.shipping, tax: totals.tax,
      total: totals.subtotal + totals.shipping + totals.tax,
      paymentMethod: pay, status: rxNeeded ? 'rx_needed' : 'rx_verification', shippingAddress: addr };
    const all = load<Order[]>('kyoto.orders', []); all.unshift(order); save('kyoto.orders', all);
    return order;
  },
  async list(): Promise<Order[]> { return load<Order[]>('kyoto.orders', []); },
  async byId(id: string): Promise<Order | undefined> { return (await this.list()).find(o => o.orderId === id); },
};
