/**
 * LocalMockProvider 的种子数据。
 * 产品数据照抄 src/services/ProductService.ts 的 6 款真实数据，
 * 仅转换为 supabase/kyoto.ts 的 ProductRow 契约类型。
 * 价格一律取自静态数据（regularPrice）；Essential 系列的 launchPrice 79.99
 * 来自店主 2026-09-25 确认的开业促销价，不是编造的。
 */
import type {
  AiJobRow, AuditLogRow, CustomerRow, FieldMeta, InventoryLedgerRow,
  InventoryRow, LocalizedText, OrderRow, PrescriptionRow,
  ProductRow, PromotionRow,
} from '../../../supabase/kyoto';

const L = (en: string, zh: string, es: string): LocalizedText =>
  ({ 'en-US': en, 'zh-CN': zh, 'es-US': es });

const V = (provenance: FieldMeta['provenance'], confidence: FieldMeta['confidence'] = 'high'): FieldMeta =>
  ({ provenance, confidence });

function baseProduct(p: Partial<ProductRow> & { id: string; legacyId: string; sku: string }): ProductRow {
  return {
    slug: p.legacyId,
    name: L(p.legacyId, p.legacyId, p.legacyId),
    collectionName: p.legacyId,
    nameZH: '',
    series: 'essential',
    category: 'optical',
    shape: '',
    colors: [],
    material: L('', '', ''),
    sizes: [],
    defaultSize: 'M',
    measurements: {},
    art: null,
    tint: null,
    description: L('', '', ''),
    fit: L('', '', ''),
    tags: [],
    status: 'draft',
    regularPrice: 0,
    launchPrice: null,
    prescriptionCompatible: true,
    rxRange: '',
    availableLensMaterials: [],
    featured: false,
    newArrival: false,
    bestSeller: false,
    fsaEligible: false,
    rating: 0,
    reviewCount: 0,
    provenance: {},
    cost: null,
    supplier: null,
    internalNotes: null,
    aiMeta: null,
    seo: null,
    publishedAt: null,
    createdBy: 'seed',
    updatedAt: '2026-09-20T10:00:00Z',
    version: 1,
    ...p,
  } as ProductRow;
}

/** 6 款真实产品（字段照抄 ProductService.FRAMES）。 */
export const SEED_PRODUCTS: ProductRow[] = [
  baseProduct({
    id: 'prod-arashiyama', legacyId: 'arashiyama', sku: 'KY-AR-001',
    collectionName: 'Arashiyama', nameZH: '岚山',
    name: L('Arashiyama', '岚山', 'Arashiyama'),
    series: 'signature', category: 'optical', shape: 'round',
    colors: [
      { key: 'night', hex: '#0D1B2A', name: L('Night', '夜空蓝', 'Noche') },
      { key: 'tortoise', hex: '#8B5A2B', name: L('Tortoise', '玳瑁', 'Carey') },
      { key: 'sakura', hex: '#FF4F8B', name: L('Sakura', '樱花粉', 'Sakura') },
      { key: 'teal', hex: '#0B7C6E', name: L('Teal', '山水青', 'Verde azulado') },
    ],
    material: L('Acetate', '板材', 'Acetato'),
    sizes: [
      { key: 'S', lensWidth: 46, bridge: 19, temple: 140 },
      { key: 'M', lensWidth: 49, bridge: 20, temple: 145 },
      { key: 'L', lensWidth: 52, bridge: 21, temple: 150 },
    ],
    defaultSize: 'M',
    measurements: { a: 49, dbl: 20, temple: 145 },
    art: 'round', tint: 'tint-sakura',
    description: L('Italian acetate, vintage round silhouette.', '意大利板材,复古圆框。', 'Acetato italiano, silueta redonda vintage.'),
    fit: L('Medium fit · suits oval, round and square faces. The keyhole bridge sits comfortably on low-to-medium nose bridges.', '中号版型 · 适合鹅蛋脸、圆脸与方脸。锁孔鼻梁对低中鼻梁也很友好。', 'Ajuste medio · va bien con rostros ovalados, redondos y cuadrados. El puente tipo keyhole es cómodo para puentes nasales bajos y medios.'),
    tags: ['bestseller'],
    status: 'published', regularPrice: 129.99, launchPrice: null,
    rxRange: 'SPH −10.00 to +6.00 · CYL to −4.00',
    availableLensMaterials: ['std150', 'poly', 'hi160', 'hi167', 'hi174'],
    featured: true, bestSeller: true, fsaEligible: true, rating: 4.8, reviewCount: 128,
    provenance: { shape: V('VERIFIED'), material: V('VERIFIED'), 'measurements.a': V('VERIFIED'), name: V('VERIFIED') },
    publishedAt: '2026-09-21T09:00:00Z',
  }),
  baseProduct({
    id: 'prod-gion', legacyId: 'gion', sku: 'KY-GI-002',
    collectionName: 'Gion', nameZH: '祇园',
    name: L('Gion', '祇园', 'Gion'),
    series: 'atelier', category: 'optical', shape: 'square',
    colors: [
      { key: 'gunmetal', hex: '#444444', name: L('Gunmetal', '枪灰', 'Gris metálico') },
      { key: 'silver', hex: '#B8B8B8', name: L('Silver', '银', 'Plata') },
      { key: 'gold', hex: '#FFC83D', name: L('Gold', '金', 'Dorado') },
    ],
    material: L('Titanium', '纯钛', 'Titanio'),
    sizes: [
      { key: 'M', lensWidth: 51, bridge: 18, temple: 145 },
      { key: 'L', lensWidth: 54, bridge: 19, temple: 150 },
    ],
    defaultSize: 'M',
    measurements: { a: 51, dbl: 18, temple: 145 },
    art: 'square', tint: 'tint-teal',
    description: L('Pure titanium, square silhouette.', '纯钛方框。', 'Titanio puro, silueta cuadrada.'),
    fit: L('Pure titanium at just 11g — all-day comfort.', '纯钛仅 11g,整天佩戴无压感。', 'Titanio puro de solo 11 g — comodidad todo el día.'),
    status: 'published', regularPrice: 189.99, launchPrice: null,
    rxRange: 'SPH −10.00 to +6.00 · CYL to −4.00',
    availableLensMaterials: ['std150', 'poly', 'hi160', 'hi167', 'hi174'],
    fsaEligible: true, rating: 4.7, reviewCount: 86,
    provenance: { shape: V('VERIFIED'), material: V('VERIFIED'), 'measurements.a': V('VERIFIED') },
    publishedAt: '2026-09-21T09:00:00Z',
  }),
  baseProduct({
    id: 'prod-tsukimi', legacyId: 'tsukimi', sku: 'KY-TS-003',
    collectionName: 'Tsukimi', nameZH: '月见',
    name: L('Tsukimi', '月见', 'Tsukimi'),
    series: 'signature', category: 'optical', shape: 'cat-eye',
    colors: [
      { key: 'amber', hex: '#8B5A2B', name: L('Amber', '琥珀', 'Ámbar') },
      { key: 'night', hex: '#0D1B2A', name: L('Night', '夜空蓝', 'Noche') },
      { key: 'sunset', hex: '#FF6A3D', name: L('Sunset', '日出橙', 'Atardecer') },
    ],
    material: L('Acetate', '板材', 'Acetato'),
    sizes: [
      { key: 'S', lensWidth: 47, bridge: 19, temple: 140 },
      { key: 'M', lensWidth: 50, bridge: 20, temple: 145 },
    ],
    defaultSize: 'M',
    measurements: { a: 50, dbl: 20, temple: 145 },
    art: 'cat', tint: 'tint-gold',
    description: L('Cat-eye with amber tortoise finish.', '琥珀玳瑁猫眼框。', 'Cat-eye con acabado carey ámbar.'),
    fit: L('Upswept lines with subtle lift for any face shape.', '上扬线条,修饰任何脸型。', 'Líneas elevadas que favorecen cualquier rostro.'),
    tags: ['new'],
    status: 'ready', regularPrice: 129.99, launchPrice: null,
    rxRange: 'SPH −10.00 to +6.00 · CYL to −4.00',
    availableLensMaterials: ['std150', 'poly', 'hi160', 'hi167', 'hi174'],
    newArrival: true, fsaEligible: true, rating: 4.9, reviewCount: 42,
    provenance: { shape: V('AI_SUGGESTED', 'medium'), material: V('VERIFIED'), description: V('AI_SUGGESTED', 'medium') },
  }),
  baseProduct({
    id: 'prod-tasogare', legacyId: 'tasogare', sku: 'KY-TA-004',
    collectionName: 'Tasogare', nameZH: '黄昏',
    name: L('Tasogare', '黄昏', 'Tasogare'),
    series: 'essential', category: 'sun', shape: 'square',
    colors: [
      { key: 'night', hex: '#0D1B2A', name: L('Night', '夜空蓝', 'Noche') },
      { key: 'havana', hex: '#5A3E2B', name: L('Havana', '哈瓦那棕', 'Habana') },
    ],
    material: L('Acetate', '板材', 'Acetato'),
    sizes: [{ key: 'M', lensWidth: 52, bridge: 20, temple: 145 }],
    defaultSize: 'M',
    measurements: { a: 52, dbl: 20, temple: 145 },
    art: 'sun', tint: 'tint-sunrise',
    description: L('Classic shades, UV400.', '经典墨镜,UV400。', 'Gafas clásicas, UV400.'),
    fit: L('UV400 polarized-ready. Built for road trips and beach days.', 'UV400,开车与海边通用。', 'Listas para polarizado UV400. Para viajes y días de playa.'),
    status: 'published', regularPrice: 89.99, launchPrice: 79.99,
    rxRange: 'SPH −8.00 to +4.00',
    availableLensMaterials: ['std150', 'poly', 'hi160', 'hi167'],
    fsaEligible: true, rating: 4.6, reviewCount: 64,
    provenance: { shape: V('VERIFIED'), material: V('VERIFIED'), regularPrice: V('VERIFIED'), launchPrice: V('MANUAL') },
    publishedAt: '2026-09-21T09:00:00Z',
  }),
  baseProduct({
    id: 'prod-kamo', legacyId: 'kamo', sku: 'KY-KA-005',
    collectionName: 'Kamo', nameZH: '鸭川',
    name: L('Kamo', '鸭川', 'Kamo'),
    series: 'atelier', category: 'optical', shape: 'round',
    colors: [
      { key: 'teal', hex: '#0B7C6E', name: L('Teal', '山水青', 'Verde azulado') },
      { key: 'gunmetal', hex: '#444444', name: L('Gunmetal', '枪灰', 'Gris metálico') },
    ],
    material: L('Titanium', '纯钛', 'Titanio'),
    sizes: [
      { key: 'S', lensWidth: 46, bridge: 20, temple: 140 },
      { key: 'M', lensWidth: 49, bridge: 21, temple: 145 },
    ],
    defaultSize: 'M',
    measurements: { a: 49, dbl: 21, temple: 145 },
    art: 'round', tint: 'tint-teal',
    description: L('Slim round titanium.', '细圆钛框。', 'Titanio redondo delgado.'),
    fit: L('Slim round titanium with adjustable nose pads.', '细圆钛框,可调鼻托。', 'Titanio redondo delgado con plaquetas ajustables.'),
    tags: ['new'],
    status: 'needs_review', regularPrice: 189.99, launchPrice: null,
    rxRange: 'SPH −10.00 to +6.00 · CYL to −4.00',
    availableLensMaterials: ['std150', 'poly', 'hi160', 'hi167', 'hi174'],
    newArrival: true, fsaEligible: true, rating: 4.7, reviewCount: 31,
    provenance: {
      shape: V('AI_SUGGESTED', 'medium'),
      material: V('OCR_DETECTED', 'low'),
      'measurements.dbl': { provenance: 'NEEDS_REVIEW', confidence: 'low' },
    },
  }),
  baseProduct({
    id: 'prod-fushimi', legacyId: 'fushimi', sku: 'KY-FU-006',
    collectionName: 'Fushimi', nameZH: '伏见',
    name: L('Fushimi', '伏见', 'Fushimi'),
    series: 'essential', category: 'sun', shape: 'aviator',
    colors: [
      { key: 'gold', hex: '#FFC83D', name: L('Gold', '金', 'Dorado') },
      { key: 'silver', hex: '#B8B8B8', name: L('Silver', '银', 'Plata') },
    ],
    material: L('Metal', '金属', 'Metal'),
    sizes: [{ key: 'M', lensWidth: 52, bridge: 19, temple: 145 }],
    defaultSize: 'M',
    measurements: { a: 52, dbl: 19, temple: 145 },
    art: 'aviator', tint: 'tint-gold',
    description: L('Gold aviator sunglasses.', '金色飞行员太阳镜。', 'Gafas de sol aviador doradas.'),
    fit: L('Gold metal aviator with gradient amber lenses.', '金色飞行员框,渐变茶色镜片。', 'Aviador dorado con lentes ámbar degradados.'),
    tags: ['new'],
    status: 'draft', regularPrice: 89.99, launchPrice: 79.99,
    rxRange: 'SPH −8.00 to +4.00',
    availableLensMaterials: ['std150', 'poly', 'hi160', 'hi167'],
    newArrival: true, fsaEligible: true, rating: 4.5, reviewCount: 23,
    provenance: { shape: V('IMPORTED', 'medium'), material: V('IMPORTED', 'medium'), colors: V('IMPORTED', 'medium') },
  }),
];

export const SEED_INVENTORY: InventoryRow[] = [
  { productId: 'prod-arashiyama', onHand: 42, reserved: 6, lowStockThreshold: 10, updatedAt: '2026-09-24T15:00:00Z' },
  { productId: 'prod-gion', onHand: 25, reserved: 3, lowStockThreshold: 8, updatedAt: '2026-09-24T15:00:00Z' },
  { productId: 'prod-tsukimi', onHand: 30, reserved: 0, lowStockThreshold: 10, updatedAt: '2026-09-24T15:00:00Z' },
  { productId: 'prod-tasogare', onHand: 8, reserved: 2, lowStockThreshold: 10, updatedAt: '2026-09-25T09:30:00Z' },
  { productId: 'prod-kamo', onHand: 18, reserved: 1, lowStockThreshold: 8, updatedAt: '2026-09-24T15:00:00Z' },
  { productId: 'prod-fushimi', onHand: 0, reserved: 0, lowStockThreshold: 10, updatedAt: '2026-09-24T15:00:00Z' },
];

export const SEED_LEDGER: InventoryLedgerRow[] = [
  { id: 'led-001', productId: 'prod-arashiyama', beforeQty: 0, change: 50, afterQty: 50, reason: 'initial_stock', actor: 'owner@kyoto.local', createdAt: '2026-09-20T10:05:00Z' },
  { id: 'led-002', productId: 'prod-arashiyama', beforeQty: 50, change: -8, afterQty: 42, reason: 'order_fulfillment', actor: 'system', createdAt: '2026-09-24T15:00:00Z' },
  { id: 'led-003', productId: 'prod-tasogare', beforeQty: 20, change: -12, afterQty: 8, reason: 'order_fulfillment', actor: 'system', createdAt: '2026-09-25T09:30:00Z' },
];

export const SEED_AUDIT: AuditLogRow[] = [
  { id: 'aud-001', actor: 'owner@kyoto.local', action: 'product.create', entity: 'product', entityId: 'prod-fushimi', before: null, after: { sku: 'KY-FU-006', status: 'draft' }, createdAt: '2026-09-20T10:02:00Z' },
  { id: 'aud-002', actor: 'owner@kyoto.local', action: 'product.status', entity: 'product', entityId: 'prod-arashiyama', before: { status: 'ready' }, after: { status: 'published' }, createdAt: '2026-09-21T09:00:00Z' },
  { id: 'aud-003', actor: 'system', action: 'inventory.adjust', entity: 'inventory', entityId: 'prod-tasogare', before: { onHand: 20 }, after: { onHand: 8, reason: 'order_fulfillment' }, createdAt: '2026-09-25T09:30:00Z' },
  { id: 'aud-004', actor: 'admin@kyoto.local', action: 'product.update', entity: 'product', entityId: 'prod-kamo', before: { status: 'draft' }, after: { status: 'needs_review' }, createdAt: '2026-09-25T14:10:00Z' },
];

export const SEED_AI_JOBS: AiJobRow[] = [
  {
    id: 'aij-001', kind: 'frame_analysis', status: 'ready', productIds: ['prod-tsukimi'],
    input: { imageRef: 'upload/tsukimi-front.jpg' },
    result: { shape: 'cat-eye', shapeConfidence: 'medium' },
    provider: 'mock', usage: null, error: null,
    createdBy: 'admin@kyoto.local', createdAt: '2026-09-24T11:20:00Z',
  },
  {
    id: 'aij-002', kind: 'temple_ocr', status: 'needs_review', productIds: ['prod-kamo'],
    input: { imageRef: 'upload/kamo-temple.jpg' },
    result: { lensWidth: 49, bridge: 21, temple: 145, confidence: 'low' },
    provider: 'mock', usage: null, error: null,
    createdBy: 'admin@kyoto.local', createdAt: '2026-09-25T14:05:00Z',
  },
];

export const SEED_ORDERS: OrderRow[] = [
  {
    id: 'ord-001', orderNumber: 'KY-20260925-001', customerId: 'cus-001', status: 'processing',
    items: [{ productId: 'prod-tasogare', qty: 1, price: 79.99 }],
    prescription: null, lens: { material: 'std150' },
    amounts: { subtotal: 79.99, shipping: 0, tax: 7.09, total: 87.08 },
    paymentStatus: 'paid', createdAt: '2026-09-25T09:32:00Z',
  },
  {
    id: 'ord-002', orderNumber: 'KY-20260924-002', customerId: 'cus-002', status: 'prescription_review',
    items: [{ productId: 'prod-arashiyama', qty: 1, price: 129.99 }],
    prescription: { method: 'upload' }, lens: { material: 'hi167' },
    amounts: { subtotal: 129.99, shipping: 0, tax: 11.53, total: 141.52 },
    paymentStatus: 'paid', createdAt: '2026-09-24T16:44:00Z',
  },
  {
    id: 'ord-003', orderNumber: 'KY-20260923-001', customerId: 'cus-003', status: 'shipped',
    items: [{ productId: 'prod-arashiyama', qty: 2, price: 129.99 }],
    prescription: null, lens: { material: 'poly' },
    amounts: { subtotal: 259.98, shipping: 0, tax: 23.06, total: 283.04 },
    paymentStatus: 'paid', createdAt: '2026-09-23T10:12:00Z',
  },
];

export const SEED_CUSTOMERS: CustomerRow[] = [
  { id: 'cus-001', name: 'Demo Customer A', email: 'demo-a@example.com', phone: '', addresses: [], createdAt: '2026-09-23T10:00:00Z' },
  { id: 'cus-002', name: 'Demo Customer B', email: 'demo-b@example.com', phone: '', addresses: [], createdAt: '2026-09-24T16:00:00Z' },
  { id: 'cus-003', name: 'Demo Customer C', email: 'demo-c@example.com', phone: '', addresses: [], createdAt: '2026-09-23T09:00:00Z' },
];

export const SEED_PRESCRIPTIONS: PrescriptionRow[] = [
  {
    id: 'rx-001', customerId: 'cus-002', orderId: 'ord-002',
    od: { sph: '-3.50', cyl: '-0.75', axis: '180' },
    os: { sph: '-3.25', cyl: '-0.50', axis: '175' },
    pd: '63', method: 'upload', imagePath: null,
    verificationStatus: 'pending', notes: null, createdAt: '2026-09-24T16:45:00Z',
  },
];

export const SEED_PROMOTIONS: PromotionRow[] = [
  {
    id: 'pro-001', name: '开业促销 · Essential 79.99', startsAt: '2026-09-21T00:00:00Z',
    endsAt: '2026-12-21T00:00:00Z', status: 'draft',
    eligible: { collections: ['essential'] },
    displayLabel: L('Grand Opening — Essential at $79.99', '开业促销 · Essential 系列 79.99', 'Gran apertura — Essential a $79.99'),
  },
];
