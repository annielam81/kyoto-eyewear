import { defineStore } from 'pinia';
import { ProductsApi } from '@/api/products.api';
import type { Frame } from '@/models';
export const useProductStore = defineStore('product', {
  state: () => ({ frames: [] as Frame[], loaded: false, filter: 'all' as string }),
  getters: {
    filtered(s): Frame[] {
      return s.frames.filter(f => s.filter==='all' || f.category===s.filter || f.frameShape===s.filter || (f as any).series===s.filter);
    },
  },
  actions: {
    async ensure() { if (!this.loaded) { const page = await ProductsApi.list({ limit: 100 }); this.frames = page.items; this.loaded = true; } },
    byId(id: string) { return this.frames.find(f => f.id === id); },
  },
});
