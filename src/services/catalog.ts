/**
 * 顾客端商品数据层：backend-first。
 *
 * - VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY 都存在 → SupabaseCatalogProvider
 *  （GET {URL}/rest/v1/api_published_products?select=*，
 *   + api_published_product_images 视图按商品关联公开图片，
 *   publish 后自动上架，无需改代码）
 * - 未配置或请求失败 → StaticCatalogProvider（FRAMES 静态兜底，行为与今天一致）
 *
 * 价格铁律：本文件只做只读映射，不发明、不改写任何价格。
 * Frame.price = CustomerProduct.price（= launchPrice ?? regularPrice），
 * regularPrice 另行保留给删除线；开业优惠 / launch-availability / 镜片规则一律不动。
 */
import type {
  CustomerCatalogProvider,
  CustomerProduct,
  CustomerProductImage,
  LocalizedText,
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
/* 后端行归一化：                                                      */
/*  - api_published_products 视图：snake_case 行（线上真实形状），        */
/*    numeric 经 PostgREST 可能以字符串返回，这里统一转 number；           */
/*    id 列 = legacy_id（顾客端唯一键，与静态数据 id 一致）                */
/*  - 若返回的是 ProductRow 形状（camelCase），走契约唯一的 toCustomerProduct */
/* 图片：api_published_product_images 视图按 product_id(=legacy_id) 关联， */
/*   已在 SQL 层过滤掉 original 原图与未发布商品；cost/supplier 等敏感字段   */
/*   从不出镜。                                                          */
/* ------------------------------------------------------------------ */

/** PostgREST numeric → 字符串，转回 number；转不了用 dflt */
function num(v: unknown, dflt = 0): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : dflt;
}

function asLocalizedText(v: unknown): LocalizedText {
  const t = (v ?? {}) as Record<string, unknown>;
  const pick = (k: string) => (typeof t[k] === 'string' ? (t[k] as string) : '');
  return { 'en-US': pick('en-US'), 'zh-CN': pick('zh-CN'), 'es-US': pick('es-US') };
}

const asStringArray = (v: unknown): string[] => (Array.isArray(v) ? v.filter(x => typeof x === 'string') : []);

/** 视图 snake_case 行 → CustomerProduct */
function normalizeViewRow(r: Record<string, any>, images: CustomerProductImage[]): CustomerProduct {
  const price = num(r.price);
  return {
    id: String(r.id ?? ''),
    sku: String(r.sku ?? ''),
    slug: String(r.slug ?? ''),
    name: asLocalizedText(r.name),
    collectionName: String(r.collection_name ?? ''),
    nameZH: String(r.name_zh ?? ''),
    series: r.series ?? 'essential',
    price,
    regularPrice: num(r.regular_price, price),
    category: r.category ?? 'optical',
    frameShape: typeof r.shape === 'string' ? r.shape : 'round',
    frameMaterial: asLocalizedText(r.material),
    colors: Array.isArray(r.colors) ? r.colors : [],
    sizes: asStringArray(r.sizes) as unknown as CustomerProduct['sizes'],
    defaultSize: String(r.default_size ?? ''),
    art: typeof r.art === 'string' ? r.art : null,
    description: asLocalizedText(r.description),
    fit: asLocalizedText(r.fit),
    tags: asStringArray(r.tags),
    prescriptionCompatible: r.prescription_compatible !== false,
    rxRange: String(r.rx_range ?? ''),
    availableLensMaterials: asStringArray(r.available_lens_materials),
    featured: r.featured === true,
    newArrival: r.new_arrival === true,
    bestSeller: r.best_seller === true,
    fsaEligible: r.fsa_eligible === true,
    rating: num(r.rating),
    reviewCount: num(r.review_count),
    images,
    inStock: r.in_stock !== false,
    lowStock: r.low_stock === true,
  };
}

function normalizeCustomerProduct(
  raw: unknown,
  imagesByProduct: Map<string, CustomerProductImage[]>,
): CustomerProduct {
  const r = raw as Record<string, any>;
  if (!r || typeof r !== 'object') throw new Error('catalog row is not an object');

  // 视图行：snake_case，有 collection_name 字段
  if (typeof r.id === 'string' && 'collection_name' in r) {
    return normalizeViewRow(r, imagesByProduct.get(r.id) ?? []);
  }

  // ProductRow 形状（camelCase）：numeric 同样做宽容转换
  if (typeof r.legacyId === 'string' && r.regularPrice != null) {
    const imgs = Array.isArray(r.images)
      ? r.images.filter((i: any) => i && typeof i.publicUrl === 'string')
      : [];
    const inv =
      r.onHand != null
        ? {
            onHand: num(r.onHand),
            reserved: num(r.reserved),
            lowStockThreshold: num(r.lowStockThreshold),
          }
        : null;
    return toCustomerProduct(
      { ...(r as object), regularPrice: num(r.regularPrice), rating: num((r as any).rating) } as ProductRow,
      imgs,
      inv,
    );
  }

  throw new Error('unrecognized catalog row shape');
}

async function restGet<T>(cfg: { url: string; anonKey: string }, path: string): Promise<T> {
  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}` },
  });
  if (!res.ok) throw new Error(`supabase catalog request failed: ${res.status} (${path})`);
  return (await res.json()) as T;
}

async function fetchPublished(): Promise<CustomerProduct[]> {
  const cfg = supabaseConfig();
  if (!cfg) throw new Error('supabase catalog not configured');
  const [rows, imgRows] = await Promise.all([
    restGet<unknown[]>(cfg, 'api_published_products?select=*'),
    restGet<Array<{ product_id: string; kind: string; role: string; public_url: string }>>(
      cfg,
      'api_published_product_images?select=product_id,kind,role,public_url&order=product_id',
    ).catch(() => [] as Array<{ product_id: string; kind: string; role: string; public_url: string }>),
  ]);
  if (!Array.isArray(rows)) throw new Error('supabase catalog payload is not an array');
  const imagesByProduct = new Map<string, CustomerProductImage[]>();
  for (const ir of Array.isArray(imgRows) ? imgRows : []) {
    const pid = String((ir as any).product_id ?? '');
    const url = String((ir as any).public_url ?? '');
    if (!pid || !url) continue;
    const list = imagesByProduct.get(pid) ?? [];
    list.push({ kind: (ir as any).kind, role: (ir as any).role, url });
    imagesByProduct.set(pid, list);
  }
  return rows.map(r => normalizeCustomerProduct(r, imagesByProduct));
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
