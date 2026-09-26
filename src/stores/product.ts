import { defineStore } from 'pinia';
import { ProductsApi } from '@/api/products.api';
import { isSunglassesAvailable } from '@/config/launch-availability.config';
import type { Frame } from '@/models';
/** 发售期隐藏的品类在此统一过滤（数据保留，只是不对客户展示）。 */
const sellableOnly = (frames: Frame[]): Frame[] =>
  isSunglassesAvailable() ? frames : frames.filter(f => f.category !== 'sun');
export const useProductStore = defineStore('product', {
  state: () => ({ frames: [] as Frame[], loaded: false, filter: 'all' as string }),
  getters: {
    /** 客户可见的可售商品（已剔除发售期隐藏品类）。页面列表一律用它，不用 frames。 */
    sellable(s): Frame[] { return sellableOnly(s.frames); },
    filtered(s): Frame[] {
      return sellableOnly(s.frames).filter(f => s.filter==='all' || f.category===s.filter || f.frameShape===s.filter || (f as any).series===s.filter);
    },
  },
  actions: {
    async ensure() { if (!this.loaded) { const page = await ProductsApi.list({ limit: 100 }); this.frames = page.items; this.loaded = true; } },
    byId(id: string) { return this.frames.find(f => f.id === id); },
  },
});
