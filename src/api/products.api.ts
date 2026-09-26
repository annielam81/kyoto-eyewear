import { request } from './client';
import type { PageRequest, PageResult, ProductFilter, ProductSort } from './types';
import type { Frame } from '@/models';
import { customerProductToFrame, getCatalog, getCatalogItem } from '@/services/catalog';
import { toCents } from '@/utils/money';

/**
 * Backend-first 商品仓库：Supabase 已发布商品优先，失败时静态兜底。
 * filter / sort / 分页仍在内存里做，签名与行为与之前一致。
 * 发售期的太阳镜过滤仍在 product store（sellableOnly）里，不在这里。
 */
export const ProductsApi = {
  list(page: PageRequest = {}, filter: ProductFilter = {}, sort: ProductSort = 'featured'): Promise<PageResult<Frame>> {
    return request('/products', async () => {
      const catalog = await getCatalog();
      let items = catalog.map(customerProductToFrame);
      if (filter.shape) items = items.filter(f => f.frameShape === filter.shape);
      if (filter.fsaEligible != null) items = items.filter(f => f.fsaEligible === filter.fsaEligible);
      if (filter.priceMinCents != null) items = items.filter(f => toCents(f.price) >= filter.priceMinCents!);
      if (filter.priceMaxCents != null) items = items.filter(f => toCents(f.price) <= filter.priceMaxCents!);
      if (sort === 'price_low_high') items.sort((a, b) => a.price - b.price);
      if (sort === 'price_high_low') items.sort((a, b) => b.price - a.price);
      const limit = page.limit ?? 50;
      const start = page.cursor ? parseInt(page.cursor, 10) : 0;
      const slice = items.slice(start, start + limit);
      const next = start + limit < items.length ? String(start + limit) : null;
      return { items: slice, cursor: next, hasMore: next != null };
    });
  },
  byId(id: string): Promise<Frame | null> {
    return request(`/products/${id}`, async () => {
      const cp = await getCatalogItem(id);
      return cp ? customerProductToFrame(cp) : null;
    });
  },
};
