import { defineStore } from 'pinia';
import { ProductsApi } from '@/api/products.api';
import type { PageResult } from '@/api/types';
import { isSunglassesAvailable } from '@/config/launch-availability.config';
import { isBrandDeal } from '@/config/pricing.config';
import type { Frame } from '@/models';
/** 发售期隐藏的品类在此统一过滤（数据保留，只是不对客户展示）。 */
const sellableOnly = (frames: Frame[]): Frame[] =>
  isSunglassesAvailable() ? frames : frames.filter(f => f.category !== 'sun');
/** 名牌特价专区商品：tags 含 brand-deal（约定见 supabase/kyoto.ts 的 BRAND_DEAL_TAG）。 */
const brandDealsOnly = (frames: Frame[]): Frame[] => frames.filter(isBrandDeal);
export const useProductStore = defineStore('product', {
  state: () => ({ frames: [] as Frame[], loaded: false, filter: 'all' as string }),
  getters: {
    /** 客户可见的可售商品（已剔除发售期隐藏品类）。页面列表一律用它，不用 frames。 */
    sellable(s): Frame[] { return sellableOnly(s.frames); },
    /**
     * 名牌特价专区商品，直接从全量 frames 取（含太阳镜款）。
     * 品牌太阳镜是店主明确要在特价区售卖的（仅镜架、不可配处方），
     * 不走 sellable 的发售期太阳镜过滤；自有太阳镜没有 brand-deal 标记，仍然隐藏。
     */
    brandDeals(s): Frame[] { return brandDealsOnly(s.frames); },
    /** 特价区出现过的品牌名（collectionName），动态生成：品牌增减自动跟随，不写死清单。 */
    brands(s): string[] {
      return [...new Set(brandDealsOnly(s.frames).map(f => (f.collectionName ?? '').trim()).filter(Boolean))].sort();
    },
    filtered(s): Frame[] {
      // 名牌特价：'brand-deal' = 全部品牌；'brand:<品牌名>' = 单个品牌
      if (s.filter === 'brand-deal') return brandDealsOnly(s.frames);
      if (s.filter.startsWith('brand:')) {
        const name = s.filter.slice('brand:'.length);
        return brandDealsOnly(s.frames).filter(f => (f.collectionName ?? '').trim() === name);
      }
      const pool = sellableOnly(s.frames);
      // 系列筛选只含自有系列商品：品牌特价不混进三档系列列表
      if (s.filter === 'essential' || s.filter === 'signature' || s.filter === 'atelier') {
        return pool.filter(f => f.series === s.filter && !isBrandDeal(f));
      }
      return pool.filter(f => s.filter === 'all' || f.category === s.filter || f.frameShape === s.filter || (f as any).series === s.filter);
    },
  },
  actions: {
    /** 全量加载：逐页拉完为止（品牌特价可能过百款，不能只取第一页）。 */
    async ensure() {
      if (this.loaded) return;
      const all: Frame[] = [];
      let cursor: string | null = null;
      for (let i = 0; i < 50; i++) {
        const page: PageResult<Frame> = await ProductsApi.list({ limit: 100, cursor });
        all.push(...page.items);
        if (!page.hasMore || !page.cursor) break;
        cursor = page.cursor;
      }
      this.frames = all;
      this.loaded = true;
    },
    byId(id: string) { return this.frames.find(f => f.id === id); },
  },
});
