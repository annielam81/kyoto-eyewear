/**
 * DbProvider 工厂：getProvider()
 *  - 若 VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY 均存在 → SupabaseProvider
 *  - 否则 → LocalMockProvider（localStorage 持久化，仅本地开发/演示）
 *
 * 两个实现都实现 supabase/kyoto.ts 的 DbProvider 接口。
 * staff 无 publish 权限：UI 隐藏 Publish 入口 + provider 层在
 * setProductStatus / bulkSetStatus / 含 status 的 bulkUpdate 中强制拒绝。
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  AdminProfile, AdminRole, AiJobRow, AuditLogRow, CustomerRow, DbProvider,
  ImageKind, ImageRole, InventoryLedgerRow, InventoryRow, LocalizedText, OrderRow,
  PrescriptionRow, ProductImageRow, ProductListParams, ProductRow, ProductStatus,
  PromotionRow, Provenance, Session, SupplierTemplateRow,
} from '../../../supabase/kyoto';
import {
  SEED_AI_JOBS, SEED_AUDIT, SEED_CUSTOMERS, SEED_INVENTORY, SEED_LEDGER,
  SEED_ORDERS, SEED_PRESCRIPTIONS, SEED_PRODUCTS, SEED_PROMOTIONS,
} from './seed';

const STORAGE_KEY = 'kyoto-admin-mock-v1';
const now = () => new Date().toISOString();
const uid = (p: string) =>
  `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export class PublishForbiddenError extends Error {
  constructor() { super('Forbidden: 当前账号没有 publish 权限'); this.name = 'PublishForbiddenError'; }
}

/* ------------------------------------------------------------------ */
/* SKU 规则（设计裁决）：                                                 */
/*  - Draft 创建允许空 SKU（拍照/批量上传建的 Draft 初始无 SKU）；          */
/*  - 系统永远不编造 SKU；                                                */
/*  - 流向 ready / published 时 SKU 必须非空，否则抛错拒绝（中文提示）。     */
/* ------------------------------------------------------------------ */
/** DB 要求 sku/legacy_id/slug 非空且唯一；无 SKU 的 Draft 用 TEMP- 占位，
 *  流转到 ready/published 时 requireSkuForStatus 会拒绝占位 SKU（系统不编造 SKU）。 */
export const TEMP_SKU_PREFIX = 'TEMP-';
export const isTempSku = (sku: string | null | undefined): boolean =>
  !!sku && sku.startsWith(TEMP_SKU_PREFIX);
const randomSuffix = () => Math.random().toString(36).slice(2, 10);

function requireSkuForStatus(sku: string | undefined | null, status: ProductStatus) {
  const real = (sku ?? '').trim();
  if ((status === 'ready' || status === 'published') && (!real || isTempSku(real))) {
    throw new Error(
      `无法设为「${status === 'published' ? '已发布' : '已就绪'}」：SKU 为空，请先填写 SKU（系统不会自动编造 SKU）`);
  }
}
const skuToLegacyId = (sku: string) => sku.toLowerCase().replace(/[^a-z0-9]+/g, '');

/* ------------------------------------------------------------------ */
/* Mock 内置账号（仅 LocalMockProvider；密码统一 kyoto123，仅本地演示）      */
/* ------------------------------------------------------------------ */
interface MockAccount { email: string; password: string; displayName: string; role: AdminRole; canPublish: boolean; canAccessPrescriptions: boolean }
const MOCK_ACCOUNTS: MockAccount[] = [
  { email: 'owner@kyoto.local', password: 'kyoto123', displayName: 'Owner', role: 'owner', canPublish: true, canAccessPrescriptions: true },
  { email: 'admin@kyoto.local', password: 'kyoto123', displayName: 'Admin', role: 'admin', canPublish: true, canAccessPrescriptions: true },
  { email: 'staff@kyoto.local', password: 'kyoto123', displayName: 'Staff', role: 'staff', canPublish: false, canAccessPrescriptions: false },
];

interface MockState {
  products: ProductRow[];
  images: import('../../../supabase/kyoto').ProductImageRow[];
  inventory: InventoryRow[];
  ledger: InventoryLedgerRow[];
  aiJobs: AiJobRow[];
  audit: AuditLogRow[];
  templates: SupplierTemplateRow[];
  orders: OrderRow[];
  customers: CustomerRow[];
  prescriptions: PrescriptionRow[];
  promotions: PromotionRow[];
  session: Session | null;
}

function defaultState(): MockState {
  return {
    products: structuredClone(SEED_PRODUCTS),
    images: [],
    inventory: structuredClone(SEED_INVENTORY),
    ledger: structuredClone(SEED_LEDGER),
    aiJobs: structuredClone(SEED_AI_JOBS),
    audit: structuredClone(SEED_AUDIT),
    templates: [],
    orders: structuredClone(SEED_ORDERS),
    customers: structuredClone(SEED_CUSTOMERS),
    prescriptions: structuredClone(SEED_PRESCRIPTIONS),
    promotions: structuredClone(SEED_PROMOTIONS),
    session: null,
  };
}

export class LocalMockProvider implements DbProvider {
  readonly name = 'mock' as const;
  private state: MockState;

  constructor() {
    this.state = this.load();
  }

  /* ---------- 持久化 ---------- */
  private load(): MockState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MockState;
        const d = defaultState();
        return { ...d, ...parsed };
      }
    } catch { /* 损坏则重建 */ }
    const s = defaultState();
    this.save(s);
    return s;
  }
  private save(s: MockState = this.state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* quota 忽略 */ }
  }
  /** 设置页可调用：清空本地数据回到种子 */
  resetToSeed() {
    this.state = defaultState();
    this.save();
  }

  private get profile(): AdminProfile | null {
    return this.state.session?.profile ?? null;
  }
  private requireCanPublish() {
    if (!this.profile?.canPublish) throw new PublishForbiddenError();
  }

  private pushAudit(entry: Omit<AuditLogRow, 'id' | 'createdAt'>) {
    this.state.audit.unshift({ ...entry, id: uid('aud'), createdAt: now() });
  }

  /* ---------- auth ---------- */
  async signIn(email: string, password: string): Promise<Session> {
    const acc = MOCK_ACCOUNTS.find(a => a.email.toLowerCase() === email.trim().toLowerCase());
    if (!acc || acc.password !== password) throw new Error('邮箱或密码不正确');
    const profile: AdminProfile = {
      id: `mock-${acc.role}`, email: acc.email, displayName: acc.displayName,
      role: acc.role, canPublish: acc.canPublish,
      canAccessPrescriptions: acc.canAccessPrescriptions, createdAt: now(),
    };
    const session: Session = { userId: profile.id, email: acc.email, profile };
    this.state.session = session;
    this.save();
    return session;
  }
  async signOut(): Promise<void> {
    this.state.session = null;
    this.save();
  }
  async getSession(): Promise<Session | null> {
    return this.state.session;
  }

  /* ---------- products ---------- */
  async listProducts(params: ProductListParams = {}): Promise<{ items: ProductRow[]; total: number }> {
    let items = [...this.state.products];
    const q = (params.search ?? '').trim().toLowerCase();
    if (q) {
      items = items.filter(p =>
        p.sku.toLowerCase().includes(q) ||
        p.collectionName.toLowerCase().includes(q) ||
        p.name['en-US'].toLowerCase().includes(q) ||
        p.nameZH.includes(q) ||
        p.legacyId.toLowerCase().includes(q));
    }
    if (params.series) items = items.filter(p => p.series === params.series);
    if (params.status) items = items.filter(p => p.status === params.status);
    if (params.shape) items = items.filter(p => p.shape === params.shape);
    switch (params.sort ?? 'updated_desc') {
      case 'price_asc': items.sort((a, b) => (a.launchPrice ?? a.regularPrice) - (b.launchPrice ?? b.regularPrice)); break;
      case 'price_desc': items.sort((a, b) => (b.launchPrice ?? b.regularPrice) - (a.launchPrice ?? a.regularPrice)); break;
      case 'name_asc': items.sort((a, b) => a.collectionName.localeCompare(b.collectionName)); break;
      case 'created_desc': items.sort((a, b) => a.id.localeCompare(b.id)); break;
      case 'updated_desc':
      default: items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    const total = items.length;
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 50;
    items = items.slice((page - 1) * pageSize, page * pageSize);
    return { items, total };
  }

  async getProduct(id: string): Promise<ProductRow | null> {
    return this.state.products.find(p => p.id === id) ?? null;
  }

  async createProduct(draft: Partial<ProductRow>, actor: string): Promise<ProductRow> {
    // Draft 允许空 SKU：拍照/批量上传建的 Draft 初始无 SKU，SKU 在 Review 环节由用户填写
    const sku = (draft.sku ?? '').trim();
    const legacyId = draft.legacyId ?? (sku ? skuToLegacyId(sku) : '');
    const product: ProductRow = {
      id: uid('prod'), sku, legacyId, slug: legacyId || draft.slug || '',
      name: draft.name ?? { 'en-US': '', 'zh-CN': '', 'es-US': '' },
      collectionName: draft.collectionName ?? sku, nameZH: draft.nameZH ?? '',
      series: draft.series ?? 'essential', category: draft.category ?? 'optical',
      shape: draft.shape ?? '', colors: draft.colors ?? [],
      material: draft.material ?? { 'en-US': '', 'zh-CN': '', 'es-US': '' },
      sizes: draft.sizes ?? [], defaultSize: draft.defaultSize ?? 'M',
      measurements: draft.measurements ?? {}, art: draft.art ?? null, tint: draft.tint ?? null,
      description: draft.description ?? { 'en-US': '', 'zh-CN': '', 'es-US': '' },
      fit: draft.fit ?? { 'en-US': '', 'zh-CN': '', 'es-US': '' },
      tags: draft.tags ?? [], status: draft.status ?? 'draft',
      regularPrice: draft.regularPrice ?? 0, launchPrice: draft.launchPrice ?? null,
      prescriptionCompatible: draft.prescriptionCompatible ?? true,
      rxRange: draft.rxRange ?? '',
      availableLensMaterials: draft.availableLensMaterials ?? [],
      featured: draft.featured ?? false, newArrival: draft.newArrival ?? false,
      bestSeller: draft.bestSeller ?? false, fsaEligible: draft.fsaEligible ?? false,
      rating: 0, reviewCount: 0,
      provenance: draft.provenance ?? {},
      cost: draft.cost ?? null, supplier: draft.supplier ?? null,
      internalNotes: draft.internalNotes ?? null, aiMeta: draft.aiMeta ?? null,
      seo: draft.seo ?? null, publishedAt: null,
      createdBy: actor, updatedAt: now(), version: 1,
    };
    this.state.products.push(product);
    this.state.inventory.push({
      productId: product.id, onHand: 0, reserved: 0,
      lowStockThreshold: 10, updatedAt: now(),
    });
    this.pushAudit({ actor, action: 'product.create', entity: 'product', entityId: product.id, before: null, after: { sku, status: product.status } });
    this.save();
    return product;
  }

  async updateProduct(id: string, patch: Partial<ProductRow>, actor: string): Promise<ProductRow> {
    const i = this.state.products.findIndex(p => p.id === id);
    if (i < 0) throw new Error('产品不存在');
    const before = this.state.products[i];
    // 状态流转校验：ready/published 要求 SKU 非空；published 要求 canPublish
    if (patch.status === 'ready' || patch.status === 'published') {
      requireSkuForStatus(patch.sku ?? before.sku, patch.status);
    }
    if (patch.status === 'published') this.requireCanPublish();
    const changed: Record<string, { from: unknown; to: unknown }> = {};
    for (const k of Object.keys(patch) as (keyof ProductRow)[]) {
      if (k === 'id' || k === 'legacyId') continue;
      const bv = before[k] as unknown;
      const av = patch[k] as unknown;
      if (JSON.stringify(bv) !== JSON.stringify(av)) changed[k as string] = { from: bv, to: av };
    }
    const updated: ProductRow = {
      ...before, ...patch, id: before.id, legacyId: before.legacyId,
      updatedAt: now(), version: before.version + 1,
    };
    if (patch.status === 'published' && !before.publishedAt) updated.publishedAt = now();
    // SKU 后填时回填 legacyId/slug（Draft 建时可能为空）
    if (patch.sku && patch.sku.trim() && !before.legacyId) {
      updated.legacyId = skuToLegacyId(patch.sku.trim());
      updated.slug = updated.legacyId;
    }
    this.state.products[i] = updated;
    if (Object.keys(changed).length > 0) {
      this.pushAudit({ actor, action: 'product.update', entity: 'product', entityId: id, before: changed, after: null });
    }
    this.save();
    return updated;
  }

  async setProductStatus(id: string, status: ProductStatus, actor: string): Promise<ProductRow> {
    const p = await this.getProduct(id);
    if (!p) throw new Error('产品不存在');
    requireSkuForStatus(p.sku, status);
    if (status === 'published') this.requireCanPublish();
    return this.updateProduct(id, { status }, actor);
  }

  async bulkSetStatus(ids: string[], status: ProductStatus, actor: string): Promise<void> {
    // 预检全部：任一 SKU 缺失则整体拒绝，避免批量半成功
    const prods = await Promise.all(ids.map(id => this.getProduct(id)));
    prods.forEach((p, idx) => {
      if (!p) throw new Error(`产品不存在：${ids[idx]}`);
      requireSkuForStatus(p.sku, status);
    });
    if (status === 'published') this.requireCanPublish();
    for (const id of ids) await this.updateProduct(id, { status }, actor);
  }

  async bulkUpdate(ids: string[], patch: Partial<ProductRow>, actor: string): Promise<void> {
    if (patch.status === 'ready' || patch.status === 'published') {
      const prods = await Promise.all(ids.map(id => this.getProduct(id)));
      prods.forEach((p, idx) => {
        if (!p) throw new Error(`产品不存在：${ids[idx]}`);
        requireSkuForStatus(patch.sku ?? p.sku, patch.status as ProductStatus);
      });
    }
    if (patch.status === 'published') this.requireCanPublish();
    for (const id of ids) await this.updateProduct(id, patch, actor);
  }

  async archiveProduct(id: string, actor: string): Promise<void> {
    await this.setProductStatus(id, 'archived', actor);
  }

  /* ---------- images ---------- */
  async listImages(productId: string) {
    return this.state.images.filter(i => i.productId === productId);
  }

  async addImage(
    productId: string,
    file: { name: string; dataUrl: string; bytes: number; width?: number; height?: number },
    meta: { kind: ImageKind; role: ImageRole; provenance: Provenance; aiGenerated?: boolean },
    actor: string,
  ) {
    const row = {
      id: uid('img'), productId,
      kind: meta.kind, role: meta.role,
      storagePath: `mock/${productId}/${file.name}`,
      publicUrl: file.dataUrl,
      width: file.width ?? null, height: file.height ?? null, bytes: file.bytes,
      aiGenerated: meta.aiGenerated ?? false,
      provenance: meta.provenance, createdAt: now(),
    };
    this.state.images.push(row);
    this.pushAudit({ actor, action: 'image.add', entity: 'product_image', entityId: row.id, before: null, after: { productId, kind: meta.kind, role: meta.role } });
    this.save();
    return row;
  }

  async removeImage(id: string, actor: string): Promise<void> {
    const i = this.state.images.findIndex(x => x.id === id);
    if (i < 0) return;
    const [removed] = this.state.images.splice(i, 1);
    this.pushAudit({ actor, action: 'image.remove', entity: 'product_image', entityId: id, before: { productId: removed.productId, kind: removed.kind }, after: null });
    this.save();
  }

  /* ---------- inventory ---------- */
  async getInventory(productId: string): Promise<InventoryRow | null> {
    return this.state.inventory.find(i => i.productId === productId) ?? null;
  }

  async adjustInventory(productId: string, change: number, reason: string, actor: string): Promise<InventoryLedgerRow> {
    let inv = await this.getInventory(productId);
    if (!inv) {
      inv = { productId, onHand: 0, reserved: 0, lowStockThreshold: 10, updatedAt: now() };
      this.state.inventory.push(inv);
    }
    const beforeQty = inv.onHand;
    const afterQty = beforeQty + change;
    if (afterQty < 0) throw new Error('库存不能为负');
    inv.onHand = afterQty;
    inv.updatedAt = now();
    const entry: InventoryLedgerRow = {
      id: uid('led'), productId, beforeQty, change, afterQty, reason,
      actor, createdAt: now(),
    };
    this.state.ledger.unshift(entry);
    this.pushAudit({ actor, action: 'inventory.adjust', entity: 'inventory', entityId: productId, before: { onHand: beforeQty }, after: { onHand: afterQty, change, reason } });
    this.save();
    return entry;
  }

  async inventoryLedger(productId: string): Promise<InventoryLedgerRow[]> {
    return this.state.ledger.filter(l => l.productId === productId);
  }

  async lowStock(threshold?: number) {
    const out: { product: ProductRow; inventory: InventoryRow }[] = [];
    for (const inv of this.state.inventory) {
      const t = threshold ?? inv.lowStockThreshold;
      const avail = inv.onHand - inv.reserved;
      if (avail <= t) {
        const product = this.state.products.find(p => p.id === inv.productId);
        if (product && product.status !== 'archived') out.push({ product, inventory: inv });
      }
    }
    out.sort((a, b) => (a.inventory.onHand - a.inventory.reserved) - (b.inventory.onHand - b.inventory.reserved));
    return out;
  }

  /* ---------- ai jobs ---------- */
  async createAiJob(kind: AiJobRow['kind'], input: Record<string, unknown>, productIds: string[], actor: string): Promise<AiJobRow> {
    const job: AiJobRow = {
      id: uid('aij'), kind, status: 'queued', productIds, input,
      result: null, provider: 'mock', usage: null, error: null,
      createdBy: actor, createdAt: now(),
    };
    this.state.aiJobs.unshift(job);
    this.save();
    return job;
  }

  async updateAiJob(id: string, patch: Partial<AiJobRow>): Promise<AiJobRow> {
    const i = this.state.aiJobs.findIndex(j => j.id === id);
    if (i < 0) throw new Error('AI job 不存在');
    this.state.aiJobs[i] = { ...this.state.aiJobs[i], ...patch, id };
    this.save();
    return this.state.aiJobs[i];
  }

  async listAiJobs(): Promise<AiJobRow[]> {
    return this.state.aiJobs;
  }

  /* ---------- audit ---------- */
  async auditList(filter: { entity?: string; entityId?: string; limit?: number } = {}): Promise<AuditLogRow[]> {
    let items = this.state.audit;
    if (filter.entity) items = items.filter(a => a.entity === filter.entity);
    if (filter.entityId) items = items.filter(a => a.entityId === filter.entityId);
    return items.slice(0, filter.limit ?? 200);
  }

  /* ---------- supplier templates ---------- */
  async listSupplierTemplates(): Promise<SupplierTemplateRow[]> {
    return this.state.templates;
  }

  async saveSupplierTemplate(name: string, mapping: Record<string, string>, actor: string): Promise<SupplierTemplateRow> {
    const row: SupplierTemplateRow = { id: uid('tpl'), name, mapping, createdBy: actor, createdAt: now() };
    this.state.templates.push(row);
    this.save();
    return row;
  }

  /* ---------- orders / customers / prescriptions / promotions ---------- */
  async listOrders(): Promise<OrderRow[]> { return this.state.orders; }
  async listCustomers(): Promise<CustomerRow[]> { return this.state.customers; }
  async listPrescriptions(): Promise<PrescriptionRow[]> { return this.state.prescriptions; }
  async listPromotions(): Promise<PromotionRow[]> { return this.state.promotions; }

  async savePromotion(p: Partial<PromotionRow>, actor: string): Promise<PromotionRow> {
    if (p.id) {
      const i = this.state.promotions.findIndex(x => x.id === p.id);
      if (i < 0) throw new Error('促销不存在');
      this.state.promotions[i] = { ...this.state.promotions[i], ...p } as PromotionRow;
      this.pushAudit({ actor, action: 'promotion.update', entity: 'promotion', entityId: p.id, before: null, after: { name: p.name } });
      this.save();
      return this.state.promotions[i];
    }
    const row: PromotionRow = {
      id: uid('pro'), name: p.name ?? '未命名促销',
      startsAt: p.startsAt ?? null, endsAt: p.endsAt ?? null,
      status: p.status ?? 'draft', eligible: p.eligible ?? {},
      displayLabel: p.displayLabel ?? { 'en-US': '', 'zh-CN': '', 'es-US': '' },
    };
    this.state.promotions.push(row);
    this.pushAudit({ actor, action: 'promotion.create', entity: 'promotion', entityId: row.id, before: null, after: { name: row.name } });
    this.save();
    return row;
  }
}

/* ------------------------------------------------------------------ */
/* SupabaseProvider：supabase-js 实现 DbProvider 全接口                      */
/* 以 supabase/migrations/0001~0005 的 snake_case schema 为准：            */
/*   profiles / products / product_images / inventory / inventory_ledger /  */
/*   ai_jobs / audit_log / supplier_templates / orders / customers /        */
/*   prescriptions / promotions。                                           */
/* 契约（kyoto.ts）保持 camelCase；本节负责 DB(snake_case) ↔ 契约 双向映射。   */
/* Storage buckets：kyoto-original（private，原图）/ kyoto-cleaned /         */
/*   kyoto-marketing / kyoto-thumbs（public）。                             */
/* ------------------------------------------------------------------ */

/** DB 列名：camelCase → snake_case（nameZH 特例 → name_zh） */
const toDbKey = (k: string): string =>
  k === 'nameZH' ? 'name_zh' : k.replace(/[A-Z]/g, c => '_' + c.toLowerCase());

/** 契约对象 → DB payload：顶层 key 转 snake_case；undefined 跳过，null 保留 */
function toDbRow(obj: Record<string, any>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    out[toDbKey(k)] = v;
  }
  return out;
}

/** PostgREST 把 numeric/bigint 序列化成字符串，这里统一转回 number */
function toNum(v: unknown, dflt = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : dflt;
}
function toNumOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
const toLocalizedText = (v: unknown): LocalizedText =>
  (v as LocalizedText) ?? { 'en-US': '', 'zh-CN': '', 'es-US': '' };

/* ---------------- DB 行 → 契约 ---------------- */

function mapProfile(r: any): AdminProfile {
  return {
    id: r.id,
    email: r.email,
    displayName: r.display_name,
    role: r.role as AdminRole,
    canPublish: !!r.can_publish,
    canAccessPrescriptions: !!r.can_access_prescriptions,
    createdAt: r.created_at,
  };
}

function mapProduct(r: any): ProductRow {
  return {
    id: r.id,
    legacyId: r.legacy_id,
    sku: r.sku,
    slug: r.slug,
    name: toLocalizedText(r.name),
    collectionName: r.collection_name,
    nameZH: r.name_zh ?? '',
    series: r.series,
    category: r.category,
    shape: r.shape ?? '',
    colors: r.colors ?? [],
    material: toLocalizedText(r.material),
    sizes: r.sizes ?? [],
    defaultSize: r.default_size ?? '',
    measurements: r.measurements ?? {},
    art: r.art ?? null,
    tint: r.tint ?? null,
    description: toLocalizedText(r.description),
    fit: toLocalizedText(r.fit),
    tags: r.tags ?? [],
    status: r.status,
    regularPrice: toNum(r.regular_price),
    launchPrice: toNumOrNull(r.launch_price),
    prescriptionCompatible: !!r.prescription_compatible,
    rxRange: r.rx_range ?? '',
    availableLensMaterials: r.available_lens_materials ?? [],
    featured: !!r.featured,
    newArrival: !!r.new_arrival,
    bestSeller: !!r.best_seller,
    fsaEligible: !!r.fsa_eligible,
    rating: toNum(r.rating),
    reviewCount: toNum(r.review_count),
    provenance: r.provenance ?? {},
    cost: toNumOrNull(r.cost),
    supplier: r.supplier ?? null,
    internalNotes: r.internal_notes ?? null,
    aiMeta: r.ai_meta ?? null,
    seo: r.seo ?? null,
    publishedAt: r.published_at ?? null,
    createdBy: r.created_by ?? null,
    updatedAt: r.updated_at,
    version: toNum(r.version, 1),
  };
}

function mapImage(r: any): ProductImageRow {
  return {
    id: r.id,
    productId: r.product_id,
    kind: r.kind,
    role: r.role,
    storagePath: r.storage_path,
    publicUrl: r.public_url ?? null,
    width: r.width ?? null,
    height: r.height ?? null,
    bytes: r.bytes == null ? null : toNum(r.bytes),
    aiGenerated: !!r.ai_generated,
    provenance: r.provenance,
    createdAt: r.created_at,
  };
}

function mapInventory(r: any): InventoryRow {
  return {
    productId: r.product_id,
    onHand: toNum(r.on_hand),
    reserved: toNum(r.reserved),
    lowStockThreshold: toNum(r.low_stock_threshold, 5),
    updatedAt: r.updated_at,
  };
}

function mapLedger(r: any): InventoryLedgerRow {
  return {
    id: r.id,
    productId: r.product_id,
    beforeQty: toNum(r.before_qty),
    change: toNum(r.change),
    afterQty: toNum(r.after_qty),
    reason: r.reason ?? '',
    actor: r.actor ?? null,
    createdAt: r.created_at,
  };
}

function mapAiJob(r: any): AiJobRow {
  return {
    id: r.id,
    kind: r.kind,
    status: r.status,
    productIds: r.product_ids ?? [],
    input: r.input ?? {},
    result: r.result ?? null,
    provider: r.provider ?? '',
    usage: r.usage ?? null,
    error: r.error ?? null,
    createdBy: r.created_by ?? null,
    createdAt: r.created_at,
  };
}

function mapAudit(r: any): AuditLogRow {
  return {
    id: r.id,
    actor: r.actor ?? null,
    action: r.action,
    entity: r.entity,
    entityId: r.entity_id,
    before: r.before ?? null,
    after: r.after ?? null,
    createdAt: r.created_at,
  };
}

function mapTemplate(r: any): SupplierTemplateRow {
  return {
    id: r.id,
    name: r.name,
    mapping: r.mapping ?? {},
    createdBy: r.created_by ?? null,
    createdAt: r.created_at,
  };
}

function mapCustomer(r: any): CustomerRow {
  return {
    id: r.id,
    name: r.name ?? '',
    email: r.email ?? '',
    phone: r.phone ?? '',
    addresses: r.addresses ?? [],
    createdAt: r.created_at,
  };
}

function mapOrder(r: any): OrderRow {
  return {
    id: r.id,
    orderNumber: r.order_number,
    customerId: r.customer_id ?? null,
    status: r.status,
    items: r.items ?? [],
    prescription: r.prescription ?? null,
    lens: r.lens ?? null,
    amounts: r.amounts ?? null,
    paymentStatus: r.payment_status ?? 'pending',
    createdAt: r.created_at,
  };
}

function mapPrescription(r: any): PrescriptionRow {
  return {
    id: r.id,
    customerId: r.customer_id ?? null,
    orderId: r.order_id ?? null,
    od: r.od ?? null,
    os: r.os ?? null,
    pd: r.pd ?? null,
    method: r.method ?? '',
    imagePath: r.image_path ?? null,
    verificationStatus: r.verification_status ?? 'pending',
    notes: r.notes ?? null,
    createdAt: r.created_at,
  };
}

function mapPromotion(r: any): PromotionRow {
  return {
    id: r.id,
    name: r.name,
    startsAt: r.starts_at ?? null,
    endsAt: r.ends_at ?? null,
    status: r.status ?? 'draft',
    eligible: r.eligible ?? {},
    displayLabel: toLocalizedText(r.display_label),
  };
}

/* ---------------- 错误语义 ---------------- */

/** 登录错误 → 中文友好提示：区分网络失败 / 密码错误 / 其他 */
function friendlyAuthError(error: any): Error {
  const status = (error as { status?: number })?.status;
  const msg = String((error as { message?: string })?.message ?? '');
  if (status === 400 || /invalid login credentials/i.test(msg)) {
    return new Error('邮箱或密码不正确');
  }
  if (/failed to fetch|networkerror|load failed|timeout|network request failed/i.test(msg)
    || error instanceof TypeError) {
    return new Error('网络连接失败，请检查网络后重试');
  }
  return new Error(msg ? `登录失败：${msg}` : '登录失败，请稍后重试');
}

/** DB 操作错误 → 中文友好提示：区分网络失败与其他 */
function friendlyDbError(error: any, prefix: string): Error {
  const msg = String((error as { message?: string })?.message ?? '');
  if (/failed to fetch|networkerror|load failed|timeout|network request failed/i.test(msg)) {
    return new Error(`${prefix}：网络连接失败，请检查网络后重试`);
  }
  return new Error(msg ? `${prefix}：${msg}` : `${prefix}：未知错误`);
}

/* ---------------- Storage buckets（见 0003） ---------------- */

const BUCKET_FOR_KIND: Record<ImageKind, string> = {
  original: 'kyoto-original', // private：原图，顾客端永远不可见
  cleaned: 'kyoto-cleaned',
  marketing: 'kyoto-marketing',
  thumb: 'kyoto-thumbs',
};

export class SupabaseProvider implements DbProvider {
  readonly name = 'supabase' as const;
  private client: SupabaseClient;
  private profile: AdminProfile | null = null;

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey);
  }

  private get c() { return this.client; }
  private requireCanPublish() {
    if (!this.profile?.canPublish) throw new PublishForbiddenError();
  }

  /** 读 public.profiles（RLS：本人读自己 + admin 读全表，见 0002） */
  private async refreshProfile(userId: string, email: string) {
    const { data, error } = await this.c.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw friendlyDbError(error, '读取账号档案失败');
    this.profile = data ? mapProfile(data) : null;
  }

  private async pushAudit(entry: Omit<AuditLogRow, 'id' | 'createdAt'>) {
    await this.c.from('audit_log').insert({
      actor: entry.actor, action: entry.action, entity: entry.entity,
      entity_id: entry.entityId, before: entry.before, after: entry.after,
    });
  }

  async signIn(email: string, password: string): Promise<Session> {
    const { data, error } = await this.c.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) throw friendlyAuthError(error);
    try {
      await this.refreshProfile(data.user.id, data.user.email ?? email);
    } catch (e) {
      await this.c.auth.signOut().catch(() => { /* 忽略 */ });
      throw e;
    }
    if (!this.profile) {
      await this.c.auth.signOut().catch(() => { /* 忽略 */ });
      throw new Error('该账号没有后台权限，请联系管理员开通');
    }
    return { userId: data.user.id, email: data.user.email ?? email, profile: this.profile };
  }
  async signOut(): Promise<void> {
    await this.c.auth.signOut();
    this.profile = null;
  }
  async getSession(): Promise<Session | null> {
    const { data } = await this.c.auth.getSession();
    const user = data.session?.user;
    if (!user) return null;
    if (!this.profile) {
      try {
        await this.refreshProfile(user.id, user.email ?? '');
      } catch {
        return null;
      }
    }
    if (!this.profile) return null;
    return { userId: user.id, email: user.email ?? '', profile: this.profile };
  }

  async listProducts(params: ProductListParams = {}): Promise<{ items: ProductRow[]; total: number }> {
    let q = this.c.from('products').select('*', { count: 'exact' });
    const s = (params.search ?? '').trim().replace(/[%(),"]/g, '');
    if (s) q = q.or(`sku.ilike.%${s}%,collection_name.ilike.%${s}%,legacy_id.ilike.%${s}%`);
    if (params.series) q = q.eq('series', params.series);
    if (params.status) q = q.eq('status', params.status);
    if (params.shape) q = q.eq('shape', params.shape);
    switch (params.sort ?? 'updated_desc') {
      case 'price_asc': q = q.order('regular_price', { ascending: true }); break;
      case 'price_desc': q = q.order('regular_price', { ascending: false }); break;
      case 'name_asc': q = q.order('collection_name', { ascending: true }); break;
      case 'created_desc': q = q.order('updated_at', { ascending: false }); break; // products 无 created_at 列
      default: q = q.order('updated_at', { ascending: false });
    }
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 50;
    q = q.range((page - 1) * pageSize, page * pageSize - 1);
    const { data, error, count } = await q;
    if (error) throw friendlyDbError(error, '读取产品列表失败');
    return { items: (data ?? []).map(mapProduct), total: count ?? 0 };
  }

  async getProduct(id: string): Promise<ProductRow | null> {
    const { data, error } = await this.c.from('products').select('*').eq('id', id).maybeSingle();
    if (error) throw friendlyDbError(error, '读取产品失败');
    return data ? mapProduct(data) : null;
  }

  async createProduct(draft: Partial<ProductRow>, actor: string): Promise<ProductRow> {
    // Draft 允许空 SKU：拍照/批量上传建的 Draft 初始无 SKU，SKU 在 Review 环节由用户填写。
    // DB 要求 sku/legacy_id/slug 非空唯一 → 空 SKU 时用 TEMP- 占位（流转时拒绝占位 SKU）。
    const skuInput = (draft.sku ?? '').trim();
    const sku = skuInput || `${TEMP_SKU_PREFIX}${randomSuffix().toUpperCase()}`;
    const legacyId = (draft.legacyId ?? '').trim()
      || (skuInput ? skuToLegacyId(skuInput) : `tmp-${randomSuffix()}`);
    const payload = toDbRow({
      ...draft,
      sku,
      legacyId,
      slug: (draft.slug ?? '').trim() || legacyId,
      name: draft.name ?? { 'en-US': '', 'zh-CN': '', 'es-US': '' },
      collectionName: draft.collectionName ?? skuInput,
      nameZH: draft.nameZH ?? '',
      series: draft.series ?? 'essential',
      category: draft.category ?? 'optical',
      shape: draft.shape ?? '',
      colors: draft.colors ?? [],
      material: draft.material ?? { 'en-US': '', 'zh-CN': '', 'es-US': '' },
      sizes: draft.sizes ?? [],
      defaultSize: draft.defaultSize ?? 'M',
      measurements: draft.measurements ?? {},
      art: draft.art ?? null,
      tint: draft.tint ?? null,
      description: draft.description ?? { 'en-US': '', 'zh-CN': '', 'es-US': '' },
      fit: draft.fit ?? { 'en-US': '', 'zh-CN': '', 'es-US': '' },
      tags: draft.tags ?? [],
      status: draft.status ?? 'draft',
      regularPrice: draft.regularPrice ?? 0,
      launchPrice: draft.launchPrice ?? null,
      prescriptionCompatible: draft.prescriptionCompatible ?? true,
      rxRange: draft.rxRange ?? '',
      availableLensMaterials: draft.availableLensMaterials ?? [],
      featured: draft.featured ?? false,
      newArrival: draft.newArrival ?? false,
      bestSeller: draft.bestSeller ?? false,
      fsaEligible: draft.fsaEligible ?? false,
      provenance: draft.provenance ?? {},
      cost: draft.cost ?? null,
      supplier: draft.supplier ?? null,
      internalNotes: draft.internalNotes ?? null,
      aiMeta: draft.aiMeta ?? null,
      seo: draft.seo ?? null,
      createdBy: actor,
      version: 1,
    });
    delete payload['id']; // id 由 DB 生成
    const { data, error } = await this.c.from('products').insert(payload).select().single();
    if (error) throw friendlyDbError(error, '创建产品失败');
    const row = mapProduct(data);
    const { error: invErr } = await this.c.from('inventory')
      .insert(toDbRow({ productId: row.id, onHand: 0, reserved: 0, lowStockThreshold: 10 }));
    if (invErr) throw friendlyDbError(invErr, '创建库存记录失败');
    await this.pushAudit({ actor, action: 'product.create', entity: 'product', entityId: row.id, before: null, after: { sku: row.sku, status: row.status } });
    return row;
  }

  async updateProduct(id: string, patch: Partial<ProductRow>, actor: string): Promise<ProductRow> {
    const before = await this.getProduct(id);
    if (!before) throw new Error('产品不存在');
    // 状态流转校验：ready/published 要求真实 SKU（占位 TEMP- 不算）；published 要求 canPublish
    if (patch.status === 'ready' || patch.status === 'published') {
      requireSkuForStatus(patch.sku ?? before.sku, patch.status);
    }
    if (patch.status === 'published') this.requireCanPublish();
    const payload = toDbRow({ ...patch, updatedAt: now(), version: before.version + 1 });
    delete payload['id'];
    delete payload['legacy_id']; // legacyId 稳定不变，下方仅在占位时回填
    if (patch.status === 'published' && !before.publishedAt) payload['published_at'] = now();
    // SKU 后填时回填 legacyId/slug（Draft 建时可能是 tmp- 占位）
    const skuInput = typeof patch.sku === 'string' ? patch.sku.trim() : '';
    if (skuInput && !isTempSku(skuInput) && (!before.legacyId || before.legacyId.startsWith('tmp-'))) {
      const lid = skuToLegacyId(skuInput);
      payload['legacy_id'] = lid;
      payload['slug'] = lid;
    }
    const { data, error } = await this.c.from('products').update(payload).eq('id', id).select().single();
    if (error) throw friendlyDbError(error, '更新产品失败');
    await this.pushAudit({ actor, action: 'product.update', entity: 'product', entityId: id, before: { version: before.version }, after: { version: before.version + 1, fields: Object.keys(patch) } });
    return mapProduct(data);
  }

  async setProductStatus(id: string, status: ProductStatus, actor: string): Promise<ProductRow> {
    const p = await this.getProduct(id);
    if (!p) throw new Error('产品不存在');
    requireSkuForStatus(p.sku, status);
    if (status === 'published') this.requireCanPublish();
    return this.updateProduct(id, { status }, actor);
  }

  async bulkSetStatus(ids: string[], status: ProductStatus, actor: string): Promise<void> {
    // 预检全部：任一 SKU 缺失则整体拒绝，避免批量半成功
    const prods = await Promise.all(ids.map(pid => this.getProduct(pid)));
    prods.forEach((p, idx) => {
      if (!p) throw new Error(`产品不存在：${ids[idx]}`);
      requireSkuForStatus(p.sku, status);
    });
    if (status === 'published') this.requireCanPublish();
    for (const id of ids) await this.updateProduct(id, { status }, actor);
  }

  async bulkUpdate(ids: string[], patch: Partial<ProductRow>, actor: string): Promise<void> {
    if (patch.status === 'ready' || patch.status === 'published') {
      const prods = await Promise.all(ids.map(pid => this.getProduct(pid)));
      prods.forEach((p, idx) => {
        if (!p) throw new Error(`产品不存在：${ids[idx]}`);
        requireSkuForStatus(patch.sku ?? p.sku, patch.status as ProductStatus);
      });
    }
    if (patch.status === 'published') this.requireCanPublish();
    for (const id of ids) await this.updateProduct(id, patch, actor);
  }

  async archiveProduct(id: string, actor: string): Promise<void> {
    await this.setProductStatus(id, 'archived', actor);
  }

  async listImages(productId: string): Promise<ProductImageRow[]> {
    const { data, error } = await this.c.from('product_images')
      .select('*').eq('product_id', productId).order('created_at', { ascending: true });
    if (error) throw friendlyDbError(error, '读取产品图片失败');
    return (data ?? []).map(mapImage);
  }

  async addImage(
    productId: string,
    file: { name: string; dataUrl: string; bytes: number; width?: number; height?: number },
    meta: { kind: ImageKind; role: ImageRole; provenance: Provenance; aiGenerated?: boolean },
    actor: string,
  ): Promise<ProductImageRow> {
    // dataUrl → 对应 bucket 上传（kyoto-original 为 private，用签名 URL 给后台查看）
    const bucket = BUCKET_FOR_KIND[meta.kind];
    const bytes = Uint8Array.from(atob(file.dataUrl.split(',')[1] ?? ''), c => c.charCodeAt(0));
    const contentType = file.dataUrl.split(';')[0].split(':')[1] ?? 'image/jpeg';
    const path = `${meta.kind}/${productId}/${Date.now()}-${file.name}`;
    const { error: upErr } = await this.c.storage.from(bucket)
      .upload(path, bytes, { contentType, upsert: true });
    if (upErr) throw friendlyDbError(upErr, '图片上传失败');
    let publicUrl: string | null = null;
    if (bucket === 'kyoto-original') {
      const { data: signed, error: sErr } = await this.c.storage.from(bucket)
        .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 天有效期的后台查看链接
      if (sErr) throw friendlyDbError(sErr, '生成原图访问链接失败');
      publicUrl = signed.signedUrl;
    } else {
      publicUrl = this.c.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    }
    const { data, error } = await this.c.from('product_images').insert(toDbRow({
      productId,
      kind: meta.kind,
      role: meta.role,
      storagePath: `${bucket}/${path}`,
      publicUrl,
      width: file.width ?? null,
      height: file.height ?? null,
      bytes: file.bytes,
      aiGenerated: meta.aiGenerated ?? false,
      provenance: meta.provenance,
    })).select().single();
    if (error) throw friendlyDbError(error, '保存图片记录失败');
    await this.pushAudit({ actor, action: 'image.add', entity: 'product_image', entityId: (data as { id: string }).id, before: null, after: { productId, kind: meta.kind } });
    return mapImage(data);
  }

  async removeImage(id: string, actor: string): Promise<void> {
    // 先删 storage 文件（best-effort），再删 DB 记录
    const { data: row } = await this.c.from('product_images')
      .select('storage_path,kind').eq('id', id).maybeSingle();
    if (row) {
      const sp = String((row as { storage_path: string }).storage_path ?? '');
      const slash = sp.indexOf('/');
      if (slash > 0) {
        const bucket = sp.slice(0, slash);
        const path = sp.slice(slash + 1);
        await this.c.storage.from(bucket).remove([path]);
      }
    }
    const { error } = await this.c.from('product_images').delete().eq('id', id);
    if (error) throw friendlyDbError(error, '删除图片失败');
    await this.pushAudit({ actor, action: 'image.remove', entity: 'product_image', entityId: id, before: null, after: null });
  }

  async getInventory(productId: string): Promise<InventoryRow | null> {
    const { data, error } = await this.c.from('inventory')
      .select('*').eq('product_id', productId).maybeSingle();
    if (error) throw friendlyDbError(error, '读取库存失败');
    return data ? mapInventory(data) : null;
  }

  async adjustInventory(productId: string, change: number, reason: string, actor: string): Promise<InventoryLedgerRow> {
    const inv = await this.getInventory(productId);
    const beforeQty = inv?.onHand ?? 0;
    const afterQty = beforeQty + change;
    if (afterQty < 0) throw new Error('库存不能为负');
    const { error: upErr } = await this.c.from('inventory')
      .upsert(toDbRow({
        productId,
        onHand: afterQty,
        reserved: inv?.reserved ?? 0,
        lowStockThreshold: inv?.lowStockThreshold ?? 10,
        updatedAt: now(),
      }), { onConflict: 'product_id' });
    if (upErr) throw friendlyDbError(upErr, '更新库存失败');
    const { data, error } = await this.c.from('inventory_ledger')
      .insert(toDbRow({ productId, beforeQty, change, afterQty, reason, actor }))
      .select().single();
    if (error) throw friendlyDbError(error, '写入库存台账失败');
    await this.pushAudit({ actor, action: 'inventory.adjust', entity: 'inventory', entityId: productId, before: { onHand: beforeQty }, after: { onHand: afterQty, change, reason } });
    return mapLedger(data);
  }

  async inventoryLedger(productId: string): Promise<InventoryLedgerRow[]> {
    const { data, error } = await this.c.from('inventory_ledger')
      .select('*').eq('product_id', productId).order('created_at', { ascending: false });
    if (error) throw friendlyDbError(error, '读取库存台账失败');
    return (data ?? []).map(mapLedger);
  }

  async lowStock(threshold?: number): Promise<{ product: ProductRow; inventory: InventoryRow }[]> {
    const { data: invs, error } = await this.c.from('inventory').select('*');
    if (error) throw friendlyDbError(error, '读取库存失败');
    const out: { product: ProductRow; inventory: InventoryRow }[] = [];
    for (const raw of (invs ?? [])) {
      const inv = mapInventory(raw);
      const t = threshold ?? inv.lowStockThreshold;
      if (inv.onHand - inv.reserved <= t) {
        const product = await this.getProduct(inv.productId);
        if (product && product.status !== 'archived') out.push({ product, inventory: inv });
      }
    }
    out.sort((a, b) => (a.inventory.onHand - a.inventory.reserved) - (b.inventory.onHand - b.inventory.reserved));
    return out;
  }

  async createAiJob(kind: AiJobRow['kind'], input: Record<string, unknown>, productIds: string[], actor: string): Promise<AiJobRow> {
    const { data, error } = await this.c.from('ai_jobs').insert(toDbRow({
      kind, status: 'queued', productIds, input, result: null,
      provider: 'supabase', usage: null, error: null, createdBy: actor,
    })).select().single();
    if (error) throw friendlyDbError(error, '创建 AI 任务失败');
    return mapAiJob(data);
  }

  async updateAiJob(id: string, patch: Partial<AiJobRow>): Promise<AiJobRow> {
    const payload = toDbRow({ ...patch });
    delete payload['id'];
    const { data, error } = await this.c.from('ai_jobs').update(payload).eq('id', id).select().single();
    if (error) throw friendlyDbError(error, '更新 AI 任务失败');
    return mapAiJob(data);
  }

  async listAiJobs(): Promise<AiJobRow[]> {
    const { data, error } = await this.c.from('ai_jobs')
      .select('*').order('created_at', { ascending: false }).limit(200);
    if (error) throw friendlyDbError(error, '读取 AI 任务失败');
    return (data ?? []).map(mapAiJob);
  }

  async auditList(filter: { entity?: string; entityId?: string; limit?: number } = {}): Promise<AuditLogRow[]> {
    let q = this.c.from('audit_log').select('*').order('created_at', { ascending: false }).limit(filter.limit ?? 200);
    if (filter.entity) q = q.eq('entity', filter.entity);
    if (filter.entityId) q = q.eq('entity_id', filter.entityId);
    const { data, error } = await q;
    if (error) throw friendlyDbError(error, '读取审计日志失败');
    return (data ?? []).map(mapAudit);
  }

  async listSupplierTemplates(): Promise<SupplierTemplateRow[]> {
    const { data, error } = await this.c.from('supplier_templates')
      .select('*').order('created_at', { ascending: false });
    if (error) throw friendlyDbError(error, '读取供应商模板失败');
    return (data ?? []).map(mapTemplate);
  }

  async saveSupplierTemplate(name: string, mapping: Record<string, string>, actor: string): Promise<SupplierTemplateRow> {
    const { data, error } = await this.c.from('supplier_templates')
      .insert(toDbRow({ name, mapping, createdBy: actor })).select().single();
    if (error) throw friendlyDbError(error, '保存供应商模板失败');
    return mapTemplate(data);
  }

  async listOrders(): Promise<OrderRow[]> {
    const { data, error } = await this.c.from('orders')
      .select('*').order('created_at', { ascending: false }).limit(200);
    if (error) throw friendlyDbError(error, '读取订单失败');
    return (data ?? []).map(mapOrder);
  }
  async listCustomers(): Promise<CustomerRow[]> {
    const { data, error } = await this.c.from('customers')
      .select('*').order('created_at', { ascending: false }).limit(200);
    if (error) throw friendlyDbError(error, '读取客户失败');
    return (data ?? []).map(mapCustomer);
  }
  async listPrescriptions(): Promise<PrescriptionRow[]> {
    const { data, error } = await this.c.from('prescriptions')
      .select('*').order('created_at', { ascending: false }).limit(200);
    if (error) throw friendlyDbError(error, '读取处方失败');
    return (data ?? []).map(mapPrescription);
  }
  async listPromotions(): Promise<PromotionRow[]> {
    const { data, error } = await this.c.from('promotions')
      .select('*').order('created_at', { ascending: false });
    if (error) throw friendlyDbError(error, '读取促销失败');
    return (data ?? []).map(mapPromotion);
  }
  async savePromotion(p: Partial<PromotionRow>, actor: string): Promise<PromotionRow> {
    if (p.id) {
      const payload = toDbRow({ ...p });
      delete payload['id'];
      const { data, error } = await this.c.from('promotions').update(payload).eq('id', p.id).select().single();
      if (error) throw friendlyDbError(error, '更新促销失败');
      await this.pushAudit({ actor, action: 'promotion.update', entity: 'promotion', entityId: p.id, before: null, after: { name: p.name } });
      return mapPromotion(data);
    }
    const { data, error } = await this.c.from('promotions').insert(toDbRow({
      name: p.name ?? '未命名促销',
      startsAt: p.startsAt ?? null,
      endsAt: p.endsAt ?? null,
      status: p.status ?? 'draft',
      eligible: p.eligible ?? {},
      displayLabel: p.displayLabel ?? { 'en-US': '', 'zh-CN': '', 'es-US': '' },
    })).select().single();
    if (error) throw friendlyDbError(error, '创建促销失败');
    await this.pushAudit({ actor, action: 'promotion.create', entity: 'promotion', entityId: (data as { id: string }).id, before: null, after: { name: (data as { name: string }).name } });
    return mapPromotion(data);
  }
}

/* ------------------------------------------------------------------ */
/* 工厂（单例）                                                          */
/* ------------------------------------------------------------------ */
let cached: DbProvider | null = null;

/** 环境变量齐了 → SupabaseProvider；否则 → LocalMockProvider */
export function getProvider(): DbProvider {
  if (cached) return cached;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  cached = (url && key) ? new SupabaseProvider(url, key) : new LocalMockProvider();
  return cached;
}

/** 仅测试/设置页用：强制重新选择 provider */
export function resetProvider() { cached = null; }
