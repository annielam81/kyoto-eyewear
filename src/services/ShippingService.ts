import { SHIPPING_METHODS, type ShippingMethod } from '@/config/shipping-methods.config';
export const ShippingService = {
  methods(): ShippingMethod[] { return SHIPPING_METHODS; },
  price(methodId: string, subtotal: number): number {
    const m = SHIPPING_METHODS.find(x => x.id === methodId) ?? SHIPPING_METHODS[0];
    if (m.freeOver != null && subtotal >= m.freeOver) return 0;
    return subtotal === 0 ? 0 : m.price;
  },
  etaRange(methodId: string): [number, number] {
    return (SHIPPING_METHODS.find(x => x.id === methodId) ?? SHIPPING_METHODS[0]).etaDays;
  },
};
