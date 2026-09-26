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
  ImageKind, ImageRole, InventoryLedgerRow, InventoryRow, OrderRow,
  PrescriptionRow, ProductListParams, ProductRow, ProductStatus,
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
function requireSkuForStatus(sku: string | undefined | null, status: ProductStatus) {
  if ((status === 'ready' || status === 'published') && !(sku ?? '').trim()) {
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
/* 表名与 supabase/kyoto.ts 契约实体对应（products / product_images /        */
/* inventory / inventory_ledger / ai_jobs / audit_log /                     */
/* supplier_templates / orders / customers / prescriptions /                */
/* promotions / admin_profiles）。列名沿用契约字段名（camelCase）。          */
/* ------------------------------------------------------------------ */
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
  private async refreshProfile(userId: string, email: string) {
    const { data } = await this.c.from('admin_profiles').select('*').eq('id', userId).maybeSingle();
    if (data) {
      this.profile = {
        id: data.id, email: data.email ?? email, displayName: data.display_name ?? data.displayName ?? email,
        role: data.role as AdminRole, canPublish: !!data.can_publish,
        canAccessPrescriptions: !!data.can_access_prescriptions,
        createdAt: data.created_at ?? data.createdAt ?? now(),
      };
    } else {
      this.profile = null;
    }
  }
  private async pushAudit(entry: Omit<AuditLogRow, 'id' | 'createdAt'>) {
    await this.c.from('audit_log').insert({
      actor: entry.actor, action: entry.action, entity: entry.entity,
      entity_id: entry.entityId, before: entry.before, after: entry.after,
    });
  }

  async signIn(email: string, password: string): Promise<Session> {
    const { data, error } = await this.c.auth.signInWithPassword({ email, password });
    if (error || !data.user) throw new Error(error?.message ?? '登录失败');
    await this.refreshProfile(data.user.id, data.user.email ?? email);
    if (!this.profile) throw new Error('该账号没有后台权限');
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
    if (!this.profile) await this.refreshProfile(user.id, user.email ?? '');
    if (!this.profile) return null;
    return { userId: user.id, email: user.email ?? '', profile: this.profile };
  }

  async listProducts(params: ProductListParams = {}): Promise<{ items: ProductRow[]; total: number }> {
    let q = this.c.from('products').select('*', { count: 'exact' });
    const s = (params.search ?? '').trim();
    if (s) q = q.or(`sku.ilike.%${s}%,collectionName.ilike.%${s}%,legacyId.ilike.%${s}%`);
    if (params.series) q = q.eq('series', params.series);
    if (params.status) q = q.eq('status', params.status);
    if (params.shape) q = q.eq('shape', params.shape);
    switch (params.sort ?? 'updated_desc') {
      case 'price_asc': q = q.order('regularPrice', { ascending: true }); break;
      case 'price_desc': q = q.order('regularPrice', { ascending: false }); break;
      case 'name_asc': q = q.order('collectionName', { ascending: true }); break;
      default: q = q.order('updatedAt', { ascending: false });
    }
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 50;
    q = q.range((page - 1) * pageSize, page * pageSize - 1);
    const { data, error, count } = await q;
    if (error) throw new Error(error.message);
    return { items: (data ?? []) as ProductRow[], total: count ?? 0 };
  }

  async getProduct(id: string): Promise<ProductRow | null> {
    const { data, error } = await this.c.from('products').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as ProductRow | null) ?? null;
  }

  async createProduct(draft: Partial<ProductRow>, actor: string): Promise<ProductRow> {
    // Draft 允许空 SKU：拍照/批量上传建的 Draft 初始无 SKU，SKU 在 Review 环节由用户填写
    const sku = (draft.sku ?? '').trim();
    const legacyId = draft.legacyId ?? (sku ? skuToLegacyId(sku) : '');
    const payload = {
      ...draft, sku,
      legacyId,
      slug: draft.slug ?? (sku ? skuToLegacyId(sku) : ''),
      createdBy: actor, updatedAt: now(), version: 1, status: draft.status ?? 'draft',
    };
    const { data, error } = await this.c.from('products').insert(payload).select().single();
    if (error) throw new Error(error.message);
    const row = data as ProductRow;
    await this.c.from('inventory').insert({ productId: row.id, onHand: 0, reserved: 0, lowStockThreshold: 10, updatedAt: now() });
    await this.pushAudit({ actor, action: 'product.create', entity: 'product', entityId: row.id, before: null, after: { sku, status: row.status } });
    return row;
  }

  async updateProduct(id: string, patch: Partial<ProductRow>, actor: string): Promise<ProductRow> {
    const before = await this.getProduct(id);
    if (!before) throw new Error('产品不存在');
    // 状态流转校验：ready/published 要求 SKU 非空；published 要求 canPublish
    if (patch.status === 'ready' || patch.status === 'published') {
      requireSkuForStatus(patch.sku ?? before.sku, patch.status);
    }
    if (patch.status === 'published') this.requireCanPublish();
    const payload = { ...patch, updatedAt: now(), version: before.version + 1 } as Record<string, unknown>;
    delete payload.id; delete payload.legacyId;
    if (patch.status === 'published' && !before.publishedAt) payload.publishedAt = now();
    // SKU 后填时回填 legacyId/slug（Draft 建时可能为空）
    if (patch.sku && (patch.sku as string).trim() && !before.legacyId) {
      const lid = skuToLegacyId((patch.sku as string).trim());
      payload.legacyId = lid;
      payload.slug = lid;
    }
    const { data, error } = await this.c.from('products').update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    await this.pushAudit({ actor, action: 'product.update', entity: 'product', entityId: id, before: { version: before.version }, after: { version: before.version + 1, fields: Object.keys(patch) } });
    return data as ProductRow;
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

  async listImages(productId: string) {
    const { data, error } = await this.c.from('product_images').select('*').eq('productId', productId);
    if (error) throw new Error(error.message);
    return (data ?? []) as import('../../../supabase/kyoto').ProductImageRow[];
  }

  async addImage(
    productId: string,
    file: { name: string; dataUrl: string; bytes: number; width?: number; height?: number },
    meta: { kind: ImageKind; role: ImageRole; provenance: Provenance; aiGenerated?: boolean },
    actor: string,
  ) {
    // dataUrl → storage 上传（storage bucket: product-images）
    const bytes = Uint8Array.from(atob(file.dataUrl.split(',')[1] ?? ''), c => c.charCodeAt(0));
    const path = `${productId}/${Date.now()}-${file.name}`;
    const { error: upErr } = await this.c.storage.from('product-images').upload(path, bytes, { contentType: file.dataUrl.split(';')[0].split(':')[1] ?? 'image/jpeg', upsert: true });
    if (upErr) throw new Error(upErr.message);
    const { data: pub } = this.c.storage.from('product-images').getPublicUrl(path);
    const row = {
      productId, kind: meta.kind, role: meta.role, storagePath: path, publicUrl: pub.publicUrl,
      width: file.width ?? null, height: file.height ?? null, bytes: file.bytes,
      aiGenerated: meta.aiGenerated ?? false, provenance: meta.provenance, createdAt: now(),
    };
    const { data, error } = await this.c.from('product_images').insert(row).select().single();
    if (error) throw new Error(error.message);
    await this.pushAudit({ actor, action: 'image.add', entity: 'product_image', entityId: (data as { id: string }).id, before: null, after: { productId, kind: meta.kind } });
    return data as import('../../../supabase/kyoto').ProductImageRow;
  }

  async removeImage(id: string, actor: string): Promise<void> {
    const { error } = await this.c.from('product_images').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await this.pushAudit({ actor, action: 'image.remove', entity: 'product_image', entityId: id, before: null, after: null });
  }

  async getInventory(productId: string): Promise<InventoryRow | null> {
    const { data, error } = await this.c.from('inventory').select('*').eq('productId', productId).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as InventoryRow | null) ?? null;
  }

  async adjustInventory(productId: string, change: number, reason: string, actor: string): Promise<InventoryLedgerRow> {
    const inv = await this.getInventory(productId);
    const beforeQty = inv?.onHand ?? 0;
    const afterQty = beforeQty + change;
    if (afterQty < 0) throw new Error('库存不能为负');
    const { error: upErr } = await this.c.from('inventory')
      .upsert({ productId, onHand: afterQty, reserved: inv?.reserved ?? 0, lowStockThreshold: inv?.lowStockThreshold ?? 10, updatedAt: now() }, { onConflict: 'productId' });
    if (upErr) throw new Error(upErr.message);
    const entry = { productId, beforeQty, change, afterQty, reason, actor, createdAt: now() };
    const { data, error } = await this.c.from('inventory_ledger').insert(entry).select().single();
    if (error) throw new Error(error.message);
    await this.pushAudit({ actor, action: 'inventory.adjust', entity: 'inventory', entityId: productId, before: { onHand: beforeQty }, after: { onHand: afterQty, change, reason } });
    return data as InventoryLedgerRow;
  }

  async inventoryLedger(productId: string): Promise<InventoryLedgerRow[]> {
    const { data, error } = await this.c.from('inventory_ledger').select('*').eq('productId', productId).order('createdAt', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as InventoryLedgerRow[];
  }

  async lowStock(threshold?: number) {
    const { data: invs, error } = await this.c.from('inventory').select('*');
    if (error) throw new Error(error.message);
    const out: { product: ProductRow; inventory: InventoryRow }[] = [];
    for (const inv of (invs ?? []) as InventoryRow[]) {
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
    const { data, error } = await this.c.from('ai_jobs').insert({ kind, status: 'queued', productIds, input, result: null, provider: 'supabase', usage: null, error: null, createdBy: actor, createdAt: now() }).select().single();
    if (error) throw new Error(error.message);
    return data as AiJobRow;
  }

  async updateAiJob(id: string, patch: Partial<AiJobRow>): Promise<AiJobRow> {
    const payload = { ...patch } as Record<string, unknown>;
    delete payload.id;
    const { data, error } = await this.c.from('ai_jobs').update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as AiJobRow;
  }

  async listAiJobs(): Promise<AiJobRow[]> {
    const { data, error } = await this.c.from('ai_jobs').select('*').order('createdAt', { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as AiJobRow[];
  }

  async auditList(filter: { entity?: string; entityId?: string; limit?: number } = {}): Promise<AuditLogRow[]> {
    let q = this.c.from('audit_log').select('*').order('createdAt', { ascending: false }).limit(filter.limit ?? 200);
    if (filter.entity) q = q.eq('entity', filter.entity);
    if (filter.entityId) q = q.eq('entityId', filter.entityId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as AuditLogRow[];
  }

  async listSupplierTemplates(): Promise<SupplierTemplateRow[]> {
    const { data, error } = await this.c.from('supplier_templates').select('*');
    if (error) throw new Error(error.message);
    return (data ?? []) as SupplierTemplateRow[];
  }

  async saveSupplierTemplate(name: string, mapping: Record<string, string>, actor: string): Promise<SupplierTemplateRow> {
    const { data, error } = await this.c.from('supplier_templates').insert({ name, mapping, createdBy: actor, createdAt: now() }).select().single();
    if (error) throw new Error(error.message);
    return data as SupplierTemplateRow;
  }

  async listOrders(): Promise<OrderRow[]> {
    const { data, error } = await this.c.from('orders').select('*').order('createdAt', { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as OrderRow[];
  }
  async listCustomers(): Promise<CustomerRow[]> {
    const { data, error } = await this.c.from('customers').select('*').order('createdAt', { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as CustomerRow[];
  }
  async listPrescriptions(): Promise<PrescriptionRow[]> {
    const { data, error } = await this.c.from('prescriptions').select('*').order('createdAt', { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as PrescriptionRow[];
  }
  async listPromotions(): Promise<PromotionRow[]> {
    const { data, error } = await this.c.from('promotions').select('*').order('createdAt', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as PromotionRow[];
  }
  async savePromotion(p: Partial<PromotionRow>, actor: string): Promise<PromotionRow> {
    if (p.id) {
      const payload = { ...p } as Record<string, unknown>;
      delete payload.id;
      const { data, error } = await this.c.from('promotions').update(payload).eq('id', p.id).select().single();
      if (error) throw new Error(error.message);
      await this.pushAudit({ actor, action: 'promotion.update', entity: 'promotion', entityId: p.id, before: null, after: { name: p.name } });
      return data as PromotionRow;
    }
    const { data, error } = await this.c.from('promotions').insert({
      name: p.name ?? '未命名促销', startsAt: p.startsAt ?? null, endsAt: p.endsAt ?? null,
      status: p.status ?? 'draft', eligible: p.eligible ?? {},
      displayLabel: p.displayLabel ?? { 'en-US': '', 'zh-CN': '', 'es-US': '' },
    }).select().single();
    if (error) throw new Error(error.message);
    await this.pushAudit({ actor, action: 'promotion.create', entity: 'promotion', entityId: (data as { id: string }).id, before: null, after: { name: (data as { name: string }).name } });
    return data as PromotionRow;
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
