/** Phase 4A production-oriented domain contracts.
 *  Canonical identifiers are stable codes (e.g. 'polycarbonate'), never translated labels.
 *  Money: integer minor units (cents). Timestamps: ISO 8601 strings. */
import type { Locale } from './index';

export type EntityId = string;
export interface Timestamps { createdAt: string; updatedAt: string }

// ---- User / Profile (auth provider = Phase 4B; no password fields in frontend models) ----
export interface User extends Timestamps {
  id: EntityId; email: string; phone: string;
  firstName: string; lastName: string;
  preferredLanguage: Locale; status: 'active' | 'disabled';
}
export interface CustomerProfile {
  userId: EntityId; firstName: string; lastName: string; phone: string;
  preferredLanguage: Locale; defaultShippingAddressId: EntityId | null;
  marketingOptIn: boolean;
}

// ---- Address (US-first; countryCode keeps international expansion possible) ----
export interface AddressEntity extends Timestamps {
  id: EntityId; userId: EntityId | null;
  firstName: string; lastName: string;
  address1: string; address2: string;
  city: string; stateCode: string; postalCode: string; countryCode: string; // 'US'
  phone: string; isDefault: boolean;
}

// ---- Product / Variant / Image ----
export interface ProductImageRef {
  id: EntityId; kind: 'front' | 'deg45' | 'side' | 'detail' | 'lifestyle' | 'tryon' | 'thumbnail';
  colorCode: string | null; url: string; alt: string; sortOrder: number;
}
export interface ProductVariant {
  id: EntityId; productId: EntityId; sku: string;
  colorCode: string; sizeCode: string;
  priceCentsOverride: number | null;
  images: ProductImageRef[];
}
export interface ProductEntity extends Timestamps {
  id: EntityId; sku: string; slug: string;
  name: Record<Locale, string>; description: Record<Locale, string>;
  shape: string; frameMaterialCode: string; audience: 'unisex' | 'women' | 'men';
  sizes: { code: string; lensWidth: number; bridge: number; temple: number }[];
  defaultSizeCode: string;
  colors: { code: string; hex: string; name: Record<Locale, string> }[];
  priceCents: number; compareAtPriceCents: number | null;
  fsaEligible: boolean; active: boolean;
  inventoryStatus: 'in_stock' | 'low' | 'out_of_stock';
  tryOnAssetRef: string | null;
  variants: ProductVariant[];
}

// ---- Lens catalog (stable codes; Trivex intentionally absent/not active) ----
export interface LensCatalogItem {
  id: EntityId; code: string;                       // e.g. 'polycarbonate', 'idx167', 'blue'
  kind: 'type' | 'material' | 'treatment';
  name: Record<Locale, string>; description: Record<Locale, string>;
  priceAdjustmentCents: number; active: boolean;
  compatibility: { minBand?: number; maxBand?: number; frameShapes?: string[] };
}

// ---- Compatibility contract ----
export interface CompatibilityRequest {
  productId: EntityId; lensTypeCode: string | null; lensMaterialCode: string | null;
  treatmentCodes: string[]; strengthBand: number | null; sunglasses: boolean;
}
export interface CompatibilityResult {
  compatible: boolean; warnings: string[]; blockingReasons: string[]; recommendations: string[];
}

// ---- Prescription (sensitive: minimize logging/duplication; never in URLs/analytics) ----
export interface PrescriptionEntity extends Timestamps {
  id: EntityId; userId: EntityId | null;
  type: 'single' | 'progressive' | 'readers';
  od: { sph: string; cyl: string; axis: string; add: string };
  os: { sph: string; cyl: string; axis: string; add: string };
  pdMode: 'single' | 'dual'; pd: number | null; pdOd: number | null; pdOs: number | null;
  prescriberName: string | null;
  issueDate: string | null; expirationDate: string | null;
  status: 'needed' | 'received' | 'verifying' | 'verified' | 'issue' | 'expired';
  source: 'manual' | 'upload' | 'photo' | 'saved' | 'later';
  documentId: EntityId | null;
}
export interface PrescriptionDocument {
  id: EntityId; ownerUserId: EntityId | null;
  fileType: 'pdf' | 'jpg' | 'jpeg' | 'png' | 'heic';
  originalFilename: string; storageRef: string;      // mock:// ref — production cloud storage is Phase 4B+
  uploadStatus: 'pending' | 'done' | 'failed'; createdAt: string;
}

// ---- Cart (guest + authenticated; future merge) ----
export interface CartEntity extends Timestamps {
  id: EntityId; ownerType: 'guest' | 'user'; ownerId: EntityId | null;
  items: CartLine[];
}
export interface CartLine {
  id: EntityId; variantId: EntityId; sku: string;
  lensConfig: {
    typeCode: string | null; materialCode: string | null; treatmentCodes: string[];
    prescriptionId: EntityId | null; prescriptionStatus: PrescriptionEntity['status'] | null;
  } | null;
  quantity: number;
  unitPriceCents: number;                       // snapshot at add-time
  priceSnapshot: { frameCents: number; lensTypeCents: number; materialCents: number; treatmentsCents: number };
}

// ---- Order: separated status axes + immutable item snapshots ----
export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded';
export type RxStatus = 'not_required' | 'needed' | 'received' | 'verifying' | 'verified' | 'issue' | 'expired';
export type FulfillmentStatus = 'pending' | 'lens_production' | 'quality_check' | 'ready' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItemSnapshot {
  id: EntityId; sku: string; variantId: EntityId | null;
  frameName: Record<Locale, string>;             // frozen at purchase — catalog changes never alter history
  colorCode: string; sizeCode: string;
  framePriceCents: number;
  lensTypeCode: string | null; lensMaterialCode: string | null; treatmentCodes: string[];
  lensPricingCents: { type: number; material: number; treatments: number };
  prescriptionId: EntityId | null; prescriptionStatus: RxStatus;
  quantity: number; lineTotalCents: number;
}
export interface OrderEntity extends Timestamps {
  id: EntityId;                                   // internal — never shown to customers
  orderNumber: string;                            // customer-facing (policy TBD; mock format only)
  ownerType: 'guest' | 'user'; ownerId: EntityId | null;
  items: OrderItemSnapshot[];
  shippingAddress: AddressEntity;                 // snapshot
  billingAddress: AddressEntity | null;           // snapshot
  shippingMethodCode: string;
  paymentStatus: PaymentStatus; prescriptionStatus: RxStatus; fulfillmentStatus: FulfillmentStatus;
  subtotalCents: number; discountCents: number; shippingCents: number; taxCents: number; totalCents: number;
  currency: 'USD';
  events: OrderEvent[];
}
export interface OrderEvent { at: string; code: 'order_created'|'prescription_received'|'prescription_verified'|'production_started'|'shipped'|'delivered'|'cancelled' }

// ---- Inventory (contract only; warehouse sync & transactional locking = future backend) ----
export interface InventoryRecord {
  sku: string; variantId: EntityId;
  availableQty: number; reservedQty: number;
  status: 'in_stock' | 'low' | 'out_of_stock';
}
// Reservation lifecycle (documented, not implemented): cart check -> checkout check ->
// order reservation (reservedQty++) -> expiration release. Requires backend transactions.

// ---- Shipping / Tax / Discount / Payment contracts (all mocked) ----
export interface ShippingQuoteRequest { methodCode: string; destination: { stateCode: string; countryCode: string }; subtotalCents: number }
export interface ShippingQuote { methodCode: string; rateCents: number; etaDays: [number, number]; carrier: string | null; trackingNumber: string | null; trackingUrl: string | null }
export interface TaxRequest { destination: { stateCode: string; countryCode: string }; taxableCents: number; discountCents: number; shippingCents: number }
export interface TaxResult { taxCents: number; rateApplied: number; jurisdiction: string }
export interface Promotion {
  id: EntityId; code: string; kind: 'percent' | 'fixed';
  value: number; minSpendCents: number | null;
  startsAt: string | null; endsAt: string | null;
  restrictedSkus: string[] | null; active: boolean;
}
/** Payment contract only — provider selection & connection is Phase 4B.
 *  Never contains raw card number / CVC / credentials. */
export interface PaymentSession {
  id: EntityId; methodType: 'apple_pay' | 'card' | 'fsa_hsa';
  amountCents: number; currency: 'USD';
  status: PaymentStatus; providerRef: string | null;
}
export interface FsaEligibility { productEligible: boolean; lensEligible: boolean; itemEligible: boolean }
