import { defineStore } from 'pinia';
import { load, save, uid } from '@/utils/storage';
import { TREATMENTS, TYPE_PRICES } from '@/config/treatments.config';
import { LENS_MATERIALS } from '@/config/lens-materials.config';
import type { CartItem, LensConfiguration } from '@/models';
export const useCartStore = defineStore('cart', {
  state: () => ({ items: load<CartItem[]>('kyoto.cart', []) }),
  getters: {
    count: s => s.items.reduce((a,b)=>a+b.quantity,0),
    subtotal: s => s.items.reduce((a,b)=>a+b.subtotal*b.quantity,0),
    shipping(): number { return this.subtotal >= 50 || this.subtotal === 0 ? 0 : 6; },
    rxNeeded: s => s.items.some(i => i.config?.prescriptionMethod === 'later'),
  },
  actions: {
    addFrameOnly(frameId: string, sku: string, colorKey: string, sizeKey: string, framePrice: number) {
      this.push({ cartItemId: uid(), frameId, sku, colorKey, sizeKey, framePrice,
        config: null, lensMaterialPrice: 0, treatmentPrices: {}, typePrice: 0,
        quantity: 1, subtotal: framePrice });
    },
    addConfigured(frameId: string, sku: string, colorKey: string, sizeKey: string, framePrice: number, config: LensConfiguration) {
      const matPrice = LENS_MATERIALS.find(m=>m.id===config.materialId)?.price ?? 0;
      const typePrice = TYPE_PRICES[config.type ?? ''] ?? 0;
      const tp: Record<string,number> = {};
      for (const id of config.treatmentIds) tp[id] = TREATMENTS.find(t=>t.id===id)?.price ?? 0;
      const subtotal = framePrice + matPrice + typePrice + Object.values(tp).reduce((a,b)=>a+b,0);
      this.push({ cartItemId: uid(), frameId, sku, colorKey, sizeKey, framePrice,
        config: JSON.parse(JSON.stringify(config)), lensMaterialPrice: matPrice, treatmentPrices: tp,
        typePrice, quantity: 1, subtotal });
    },
    push(i: CartItem) { this.items.push(i); this.persist(); },
    replaceConfigured(cartItemId: string, frameId: string, sku: string, colorKey: string, sizeKey: string, framePrice: number, config: LensConfiguration) {
      const idx = this.items.findIndex(x => x.cartItemId === cartItemId);
      if (idx < 0) { this.addConfigured(frameId, sku, colorKey, sizeKey, framePrice, config); return; }
      const keepQty = this.items[idx].quantity;
      this.items.splice(idx, 1);
      this.addConfigured(frameId, sku, colorKey, sizeKey, framePrice, config);
      this.items[this.items.length-1].quantity = keepQty;
      // keep position stable
      const it = this.items.pop()!; this.items.splice(idx, 0, it);
      this.persist();
    },
    setQty(id: string, q: number) {
      const it = this.items.find(x=>x.cartItemId===id); if (!it) return;
      q <= 0 ? this.items.splice(this.items.indexOf(it),1) : it.quantity = q; this.persist();
    },
    clear() { this.items = []; this.persist(); },
    persist() { save('kyoto.cart', JSON.parse(JSON.stringify(this.items))); },
  },
});
