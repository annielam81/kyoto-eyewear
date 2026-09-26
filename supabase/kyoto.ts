/**
 * KYOTO 共享契约（Single Source of Truth）。
 *
 * 本文件同时被以下三处引用（仅相对路径 import，不许复制粘贴出第二份）：
 *  - supabase/migrations/*.sql 的表结构必须与这里的 Row 类型一致
 *  - admin/ （Vite + Vue3 后台）: import ... from '../../supabase/kyoto'
 *  - src/   （uni-app 顾客端）: import ... from '../../supabase/kyoto'
 *
 * 规则：
 *  - 顾客端能看到的字段只能来自 CustomerProduct（cost / supplier / internalNotes /
 *    aiMeta / audit 永远不许进顾客 DTO）。
 *  - 顾客端商品 id 必须使用 legacyId（= 现有静态数据的 id，如 'arashiyama'），
 *    Favorites / Cart / Try-On 的映射靠它保持稳定。
 *  - 价格：DB 存 regularPrice + launchPrice（可空）；顾客看到 effectivePrice =
 *    launchPrice ?? regularPrice。价格数值本身是业务数据，任何人不许在本文件外另发明价格。
 */

export type Locale = 'en-US' | 'zh-CN' | 'es-US';
export type LocalizedText = Record<Locale, string>;

export type AdminRole = 'owner' | 'admin' | 'staff';
export type ProductStatus = 'draft' | 'needs_review' | 'ready' | 'published' | 'archived';
export type FrameSeries = 'essential' | 'signature' | 'atelier';
export type FrameCategory = 'optical' | 'sun';
export type ImageKind = 'original' | 'cleaned' | 'marketing' | 'thumb';
export type ImageRole = 'front' | 'angle45' | 'side' | 'temple' | 'other';
export type Provenance =
  | 'VERIFIED' | 'IMPORTED' | 'MANUAL' | 'AI_SUGGESTED' | 'OCR_DETECTED' | 'NEEDS_REVIEW';
export type Confidence = 'high' | 'medium' | 'low';
export type AiJobStatus = 'queued' | 'processing' | 'ready' | 'needs_review' | 'error';
export type OrderStatus =
  | 'new' | 'prescription_review' | 'processing' | 'lab'
  | 'ready' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

/** 字段级来源：值 + 从哪来 + 置信度。Low 置信度不许自动 confirm。 */
export interface FieldMeta {
  provenance: Provenance;
  confidence?: Confidence;
  /** OCR / AI 建议需要人工确认时，confirmedBy 置空；确认后填 user id + 时间 */
  confirmedBy?: string | null;
  confirmedAt?: string | null;
}

export interface AdminProfile {
  id: string; // auth.users.id
  email: string;
  displayName: string;
  role: AdminRole;
  /** Publish 独立权限；处方访问独立权限 */
  canPublish: boolean;
  canAccessPrescriptions: boolean;
  createdAt: string;
}

export interface ProductColor { key: string; hex: string; name: LocalizedText }
export interface ProductSize { key: string; lensWidth: number; bridge: number; temple: number }
export interface ProductMeasurements { a?: number; b?: number; dbl?: number; temple?: number; ed?: number }

export interface ProductRow {
  id: string; // uuid，内部主键，稳定不变
  legacyId: string; // 顾客端 id（现有 6 款 = 静态数据的 id；新品 = sku 小写去符号）
  sku: string;
  slug: string;
  name: LocalizedText;
  collectionName: string;
  nameZH: string;
  series: FrameSeries;
  category: FrameCategory;
  shape: string;
  colors: ProductColor[];
  material: LocalizedText;
  sizes: ProductSize[];
  defaultSize: string;
  measurements: ProductMeasurements;
  /** try-on 线稿映射 key（如 'round'/'square'/'cat'/'sun'/'aviator'）；新品可空 → 通用线稿 */
  art: string | null;
  tint: string | null;
  description: LocalizedText;
  fit: LocalizedText;
  tags: string[];
  status: ProductStatus;
  regularPrice: number;
  launchPrice: number | null;
  prescriptionCompatible: boolean;
  rxRange: string;
  availableLensMaterials: string[];
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  fsaEligible: boolean;
  rating: number;
  reviewCount: number;
  /** 字段级来源：key 为字段名（如 'shape','material','measurements.a'） */
  provenance: Record<string, FieldMeta>;
  /** 内部字段：永远不进顾客 DTO */
  cost: number | null;
  supplier: string | null;
  internalNotes: string | null;
  aiMeta: Record<string, unknown> | null;
  seo: { title: LocalizedText; description: LocalizedText; slug: string } | null;
  publishedAt: string | null;
  createdBy: string | null;
  updatedAt: string;
  version: number;
}

export interface ProductImageRow {
  id: string;
  productId: string;
  kind: ImageKind;
  role: ImageRole;
  storagePath: string;
  publicUrl: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  /** marketing 图必须为 true 并在 UI 打标 AI GENERATED MARKETING IMAGE */
  aiGenerated: boolean;
  provenance: Provenance;
  createdAt: string;
}

export interface InventoryRow {
  productId: string;
  onHand: number;
  reserved: number;
  lowStockThreshold: number;
  updatedAt: string;
}
/** available = onHand - reserved（派生，不许单独存） */
export const availableQty = (inv: Pick<InventoryRow, 'onHand' | 'reserved'>): number =>
  inv.onHand - inv.reserved;

export interface InventoryLedgerRow {
  id: string;
  productId: string;
  beforeQty: number;
  change: number;
  afterQty: number;
  reason: string;
  actor: string | null;
  createdAt: string;
}

export interface AiJobRow {
  id: string;
  kind: 'frame_analysis' | 'image_process' | 'temple_ocr' | 'content_generate' | 'translate' | 'batch_import';
  status: AiJobStatus;
  productIds: string[];
  input: Record<string, unknown>;
  result: Record<string, unknown> | null;
  provider: string;
  usage: Record<string, unknown> | null;
  error: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface AuditLogRow {
  id: string;
  actor: string | null;
  action: string;
  entity: string;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
}

export interface SupplierTemplateRow {
  id: string;
  name: string;
  /** { supplierColumnName: 'sku' | 'color' | 'material' | 'a' | 'b' | 'dbl' | 'temple' | 'ed' | 'cost' | 'quantity' | 'model' | 'ignore' } */
  mapping: Record<string, string>;
  createdBy: string | null;
  createdAt: string;
}

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  addresses: Record<string, unknown>[];
  createdAt: string;
}

export interface OrderRow {
  id: string;
  orderNumber: string;
  customerId: string | null;
  status: OrderStatus;
  items: Record<string, unknown>[];
  prescription: Record<string, unknown> | null;
  lens: Record<string, unknown> | null;
  amounts: { subtotal: number; shipping: number; tax: number; total: number } | null;
  paymentStatus: string;
  createdAt: string;
}

export interface PrescriptionRow {
  id: string;
  customerId: string | null;
  orderId: string | null;
  od: Record<string, string> | null;
  os: Record<string, string> | null;
  pd: string | null;
  method: string;
  imagePath: string | null;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  notes: string | null;
  createdAt: string;
}

export interface PromotionRow {
  id: string;
  name: string;
  startsAt: string | null;
  endsAt: string | null;
  status: 'draft' | 'active' | 'ended';
  eligible: { collections?: FrameSeries[]; productIds?: string[] };
  displayLabel: LocalizedText;
}

/* ------------------------------------------------------------------ */
/* 顾客端 DTO：Customer Product API 只返回这些字段                        */
/* ------------------------------------------------------------------ */

export interface CustomerProductImage { kind: ImageKind; role: ImageRole; url: string }

export interface CustomerProduct {
  id: string; // = legacyId，顾客端唯一键
  sku: string;
  slug: string;
  name: LocalizedText;
  collectionName: string;
  nameZH: string;
  series: FrameSeries;
  /** 顾客实际看到的价格 = launchPrice ?? regularPrice */
  price: number;
  regularPrice: number;
  category: FrameCategory;
  frameShape: string;
  frameMaterial: LocalizedText;
  colors: ProductColor[];
  sizes: ProductSize[];
  defaultSize: string;
  art: string | null;
  description: LocalizedText;
  fit: LocalizedText;
  tags: string[];
  prescriptionCompatible: boolean;
  rxRange: string;
  availableLensMaterials: string[];
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  fsaEligible: boolean;
  rating: number;
  reviewCount: number;
  images: CustomerProductImage[];
  /** 库存只暴露可用性，不暴露精确 onHand/reserved */
  inStock: boolean;
  lowStock: boolean;
}

/** 后端行 → 顾客 DTO（唯一允许的映射函数，顾客端和 admin 预览共用） */
export function toCustomerProduct(
  p: ProductRow,
  images: ProductImageRow[],
  inv: Pick<InventoryRow, 'onHand' | 'reserved' | 'lowStockThreshold'> | null,
): CustomerProduct {
  const avail = inv ? availableQty(inv) : 0;
  return {
    id: p.legacyId,
    sku: p.sku,
    slug: p.slug,
    name: p.name,
    collectionName: p.collectionName,
    nameZH: p.nameZH,
    series: p.series,
    price: p.launchPrice ?? p.regularPrice,
    regularPrice: p.regularPrice,
    category: p.category,
    frameShape: p.shape,
    frameMaterial: p.material,
    colors: p.colors,
    sizes: p.sizes,
    defaultSize: p.defaultSize,
    art: p.art,
    description: p.description,
    fit: p.fit,
    tags: p.tags,
    prescriptionCompatible: p.prescriptionCompatible,
    rxRange: p.rxRange,
    availableLensMaterials: p.availableLensMaterials,
    featured: p.featured,
    newArrival: p.newArrival,
    bestSeller: p.bestSeller,
    fsaEligible: p.fsaEligible,
    rating: p.rating,
    reviewCount: p.reviewCount,
    images: images
      .filter(i => i.kind !== 'original' && i.publicUrl)
      .map(i => ({ kind: i.kind, role: i.role, url: i.publicUrl as string })),
    inStock: avail > 0,
    lowStock: inv ? avail > 0 && avail <= inv.lowStockThreshold : false,
  };
}

/* ------------------------------------------------------------------ */
/* Admin 数据访问接口：SupabaseProvider 与 LocalMockProvider 都实现它       */
/* ------------------------------------------------------------------ */

export interface ProductListParams {
  search?: string;
  series?: FrameSeries | '';
  status?: ProductStatus | '';
  shape?: string;
  sort?: 'updated_desc' | 'created_desc' | 'price_asc' | 'price_desc' | 'name_asc';
  page?: number;
  pageSize?: number;
}

export interface Session {
  userId: string;
  email: string;
  profile: AdminProfile;
}

export interface DbProvider {
  readonly name: 'supabase' | 'mock';
  // auth
  signIn(email: string, password: string): Promise<Session>;
  signOut(): Promise<void>;
  getSession(): Promise<Session | null>;
  // products
  listProducts(params?: ProductListParams): Promise<{ items: ProductRow[]; total: number }>;
  getProduct(id: string): Promise<ProductRow | null>;
  createProduct(draft: Partial<ProductRow>, actor: string): Promise<ProductRow>;
  updateProduct(id: string, patch: Partial<ProductRow>, actor: string): Promise<ProductRow>;
  setProductStatus(id: string, status: ProductStatus, actor: string): Promise<ProductRow>;
  bulkSetStatus(ids: string[], status: ProductStatus, actor: string): Promise<void>;
  bulkUpdate(ids: string[], patch: Partial<ProductRow>, actor: string): Promise<void>;
  archiveProduct(id: string, actor: string): Promise<void>;
  // images
  listImages(productId: string): Promise<ProductImageRow[]>;
  addImage(productId: string, file: { name: string; dataUrl: string; bytes: number; width?: number; height?: number }, meta: { kind: ImageKind; role: ImageRole; provenance: Provenance; aiGenerated?: boolean }, actor: string): Promise<ProductImageRow>;
  removeImage(id: string, actor: string): Promise<void>;
  // inventory
  getInventory(productId: string): Promise<InventoryRow | null>;
  adjustInventory(productId: string, change: number, reason: string, actor: string): Promise<InventoryLedgerRow>;
  inventoryLedger(productId: string): Promise<InventoryLedgerRow[]>;
  lowStock(threshold?: number): Promise<{ product: ProductRow; inventory: InventoryRow }[]>;
  // ai jobs
  createAiJob(kind: AiJobRow['kind'], input: Record<string, unknown>, productIds: string[], actor: string): Promise<AiJobRow>;
  updateAiJob(id: string, patch: Partial<AiJobRow>): Promise<AiJobRow>;
  listAiJobs(): Promise<AiJobRow[]>;
  // audit
  auditList(filter?: { entity?: string; entityId?: string; limit?: number }): Promise<AuditLogRow[]>;
  // supplier templates
  listSupplierTemplates(): Promise<SupplierTemplateRow[]>;
  saveSupplierTemplate(name: string, mapping: Record<string, string>, actor: string): Promise<SupplierTemplateRow>;
  // orders / customers / prescriptions / promotions（基础 CRUD，后续扩展）
  listOrders(): Promise<OrderRow[]>;
  listCustomers(): Promise<CustomerRow[]>;
  listPrescriptions(): Promise<PrescriptionRow[]>;
  listPromotions(): Promise<PromotionRow[]>;
  savePromotion(p: Partial<PromotionRow>, actor: string): Promise<PromotionRow>;
}

/* ------------------------------------------------------------------ */
/* 顾客端商品数据层接口：backend-first，失败时 fallback 静态数据           */
/* ------------------------------------------------------------------ */

export interface CustomerCatalogProvider {
  readonly name: string;
  listPublished(): Promise<CustomerProduct[]>;
  getPublished(id: string): Promise<CustomerProduct | null>;
}

/* ------------------------------------------------------------------ */
/* AI Service Layer：Provider 可替换；密钥永远在服务端                     */
/* ------------------------------------------------------------------ */

export interface FrameAnalysisResult {
  shape: string;
  shapeConfidence: Confidence;
  colors: { key: string; hex: string; name: LocalizedText; confidence: Confidence }[];
  styles: string[];
  materialSuggestion: string | null;
  materialConfidence: Confidence | null;
  warnings: string[];
  provenance: Provenance; // 恒为 'AI_SUGGESTED'
  mock: boolean;
}

export interface TempleOcrResult {
  rawText: string;
  lensWidth: number | null;
  bridge: number | null;
  temple: number | null;
  modelNumber: string | null;
  colorCode: string | null;
  confidence: Confidence;
  provenance: Provenance; // 恒为 'OCR_DETECTED'
  mock: boolean;
}

export interface GeneratedContent {
  name: LocalizedText;
  shortDescription: LocalizedText;
  fullDescription: LocalizedText;
  seoTitle: LocalizedText;
  seoDescription: LocalizedText;
  tags: string[];
  mock: boolean;
}

export interface VerifiedProductData {
  shape?: string;
  colors?: { key: string; hex: string; name: LocalizedText }[];
  material?: LocalizedText;
  measurements?: ProductMeasurements;
  styles?: string[];
  collectionHint?: FrameSeries;
}

/** 所有 AI 调用必须用户主动触发（Analyze / Generate / Regenerate / Translate / Process），
 *  不许在页面打开时自动调用。结果必须落库（ai_jobs），不许每次重新算。 */
export interface AiService {
  readonly providerName: string;
  readonly isMock: boolean;
  analyzeFrameImage(imageRef: string): Promise<FrameAnalysisResult>;
  processProductImage(imageRef: string): Promise<{ cleanedRef: string; width: number; height: number; mock: boolean }>;
  extractTempleText(imageRef: string): Promise<TempleOcrResult>;
  generateProductContent(data: VerifiedProductData): Promise<GeneratedContent>;
  translateProductContent(content: GeneratedContent, target: Locale): Promise<Partial<GeneratedContent>>;
  suggestCollection(data: VerifiedProductData): Promise<{ series: FrameSeries; confidence: Confidence; reasons: string[]; mock: boolean }>;
}
