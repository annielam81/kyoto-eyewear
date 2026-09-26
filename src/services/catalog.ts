/**
 * 顾客端商品数据层：backend-first。
 *
 * - VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY 都存在 → SupabaseCatalogProvider
 *  （GET {URL}/rest/v1/api_published_products?select=*，publish 后自动上架，无需改代码）
 * - 未配置或请求失败 → StaticCatalogProvider（FRAMES 静态兜底，行为与今天一致）
 *
 * 价格铁律：本文件只做只读映射，不发明、不改写任何价格。
 * Frame.price = CustomerProduct.price（= launchPrice ?? regularPrice），
 * regularPrice 另行保留给删除线；开业优惠 / launch-availability / 镜片规则一律不动。
 */
import type {
  CustomerCatalogProvider,
  CustomerProduct,
  ProductRow,
} from '../../supabase/kyoto';
import { toCustomerProduct } from '../../supabase/kyoto';
import type { Frame } from '@/models';
import { FRAMES } from './ProductService';

/* ------------------------------------------------------------------ */
/* Supabase 配置：只从环境变量读，永不提交 secret                          */
/* ------------------------------------------------------------------ */

function supabaseConfig(): { url: string; anonKey: string } | null {
  const env = (import.meta as any).env ?? {};
  const url = env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = env.VITE_SUPABASE_ANON_KEY as string | undefined;
  return url && anonKey ? { url, anonKey } : null;
}

export function isSupabaseConfigured(): boolean {
  return supabaseConfig() != null;
}

/* ------------------------------------------------------------------ */
/* 后端行归一化：视图默认返回 CustomerProduct 形状；                       */
/* 若返回的是 ProductRow 形状，则走契约唯一的 toCustomerProduct 映射        */
/* ------------------------------------------------------------------ */

function normalizeCustomerProduct(raw: unknown): CustomerProduct {
  const r = raw as Record<string, any>;
  if (!r || typeof r !== 'object') throw new Error('catalog row is not an object');

  if (typeof r.legacyId === 'string' && typeof r.regularPrice === 'number') {
    const images = Array.isArray(r.images)
      ? r.images.filter((i: any) => i && typeof i.publicUrl === 'string')
      : [];
    const inv =
      typeof r.onHand === 'number'
        ? {
            onHand: r.onHand,
            reserved: typeof r.reserved === 'number' ? r.reserved : 0,
            lowStockThreshold:
              typeof r.lowStockThreshold === 'number' ? r.lowStockThreshold : 0,
          }
        : null;
    return toCustomerProduct(r as ProductRow, images, inv);
  }

  if (typeof r.id === 'string' && typeof r.price === 'number') {
    return {
      ...(r as object),
      regularPrice: typeof r.regularPrice === 'number' ? r.regularPrice : r.price,
      frameShape: typeof r.frameShape === 'string' ? r.frameShape : 'round',
      images: Array.isArray(r.images) ? r.images : [],
      inStock: r.inStock !== false,
      lowStock: r.lowStock === true,
    } as CustomerProduct;
  }

  throw new Error('unrecognized catalog row shape');
}

async function fetchPublished(): Promise<CustomerProduct[]> {
  const cfg = supabaseConfig();
  if (!cfg) throw new Error('supabase catalog not configured');
  const res = await fetch(`${cfg.url}/rest/v1/api_published_products?select=*`, {
    headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}` },
  });
  if (!res.ok) throw new Error(`supabase catalog request failed: ${res.status}`);
  const payload: unknown = await res.json();
  if (!Array.isArray(payload)) throw new Error('supabase catalog payload is not an array');
  return payload.map(normalizeCustomerProduct);
}

/** 后端 provider：失败抛错，由 getCatalog() 捕获后走静态兜底。 */
export const supabaseCatalogProvider: CustomerCatalogProvider = {
  name: 'supabase',
  async listPublished(): Promise<CustomerProduct[]> {
    return fetchPublished();
  },
  async getPublished(id: string): Promise<CustomerProduct | null> {
    const items = await fetchPublished();
    return items.find(p => p.id === id) ?? null;
  },
};

/* ------------------------------------------------------------------ */
/* 静态兜底：FRAMES → CustomerProduct（inStock 按 inventoryStatus）          */
/* ------------------------------------------------------------------ */

export function frameToCustomerProduct(f: Frame): CustomerProduct {
  return {
    id: f.id, // = legacyId：Favorites / Cart / Try-On 的稳定键
    sku: f.sku,
    slug: f.slug,
    name: f.name,
    collectionName: f.collectionName,
    nameZH: f.nameZH,
    series: f.series,
    price: f.price,
    regularPrice: f.regularPrice ?? f.price,
    category: f.category,
    frameShape: f.frameShape,
    frameMaterial: f.frameMaterial,
    colors: f.colors,
    sizes: f.sizes,
    defaultSize: f.defaultSize,
    art: f.art,
    description: f.description,
    fit: f.fit,
    tags: f.tags,
    prescriptionCompatible: f.prescriptionCompatible,
    rxRange: f.rxRange,
    availableLensMaterials: f.availableLensMaterials,
    featured: f.featured ?? false,
    newArrival: f.newArrival ?? false,
    bestSeller: f.bestSeller ?? false,
    fsaEligible: f.fsaEligible,
    rating: f.rating,
    reviewCount: f.reviewCount,
    images: [],
    inStock: f.inventoryStatus !== 'out',
    lowStock: f.inventoryStatus === 'low',
  };
}

export const staticCatalogProvider: CustomerCatalogProvider = {
  name: 'static',
  async listPublished(): Promise<CustomerProduct[]> {
    return FRAMES.map(frameToCustomerProduct);
  },
  async getPublished(id: string): Promise<CustomerProduct | null> {
    const f = FRAMES.find(x => x.id === id);
    return f ? frameToCustomerProduct(f) : null;
  },
};

/* ------------------------------------------------------------------ */
/* 入口：优先 Supabase，失败则静态兜底（console.info 说明走了哪路）            */
/* ------------------------------------------------------------------ */

export async function getCatalog(): Promise<CustomerProduct[]> {
  if (isSupabaseConfigured()) {
    try {
      const items = await supabaseCatalogProvider.listPublished();
      console.info('[catalog] provider=supabase');
      return items;
    } catch (e) {
      console.info('[catalog] supabase failed, fallback to static', e);
    }
  } else {
    console.info('[catalog] supabase not configured, using static');
  }
  return staticCatalogProvider.listPublished();
}

export async function getCatalogItem(id: string): Promise<CustomerProduct | null> {
  const items = await getCatalog();
  return items.find(p => p.id === id) ?? null;
}

/* ------------------------------------------------------------------ */
/* CustomerProduct → Frame（顾客端唯一映射；Favorites/Cart/Try-On 靠 id）   */
/* ------------------------------------------------------------------ */

const KNOWN_SHAPES = ['round', 'square', 'cat-eye', 'aviator'] as const;
type KnownShape = (typeof KNOWN_SHAPES)[number];

/** 未知 shape 不崩：回退 'round'。 */
function mapFrameShape(shape: string): KnownShape {
  return (KNOWN_SHAPES as readonly string[]).includes(shape) ? (shape as KnownShape) : 'round';
}

/** tint 不在顾客 DTO 里；沿用静态数据的既有 tint，保证已上架 6 款视觉不变。新品无 tint 时 FrameArt 默认空类。 */
const STATIC_TINT = new Map(FRAMES.map(f => [f.id, f.tint]));

function firstPhotoUrl(cp: CustomerProduct): string | undefined {
  const img = (cp.images ?? []).find(
    i => i && i.kind !== 'original' && typeof i.url === 'string' && i.url.length > 0,
  );
  return img?.url;
}

export function customerProductToFrame(cp: CustomerProduct): Frame {
  return {
    id: cp.id,
    sku: cp.sku,
    slug: cp.slug,
    name: cp.name,
    collectionName: cp.collectionName,
    nameZH: cp.nameZH,
    series: cp.series,
    price: cp.price, // = launchPrice ?? regularPrice；只读，不改写
    regularPrice: cp.regularPrice, // 删除线用；静态兜底时 = price
    category: cp.category,
    frameShape: mapFrameShape(cp.frameShape),
    frameMaterial: cp.frameMaterial,
    colors: cp.colors,
    sizes: cp.sizes,
    defaultSize: cp.defaultSize,
    art: cp.art ?? 'round', // 空 → 通用线稿
    tint: STATIC_TINT.get(cp.id) ?? '',
    fit: cp.fit,
    description: cp.description,
    prescriptionCompatible: cp.prescriptionCompatible,
    rxRange: cp.rxRange,
    availableLensMaterials: cp.availableLensMaterials,
    tags: cp.tags,
    inventoryStatus: !cp.inStock ? 'out' : cp.lowStock ? 'low' : 'in_stock',
    featured: cp.featured,
    newArrival: cp.newArrival,
    bestSeller: cp.bestSeller,
    fsaEligible: cp.fsaEligible,
    rating: cp.rating,
    reviewCount: cp.reviewCount,
    photoUrl: firstPhotoUrl(cp),
  };
}
