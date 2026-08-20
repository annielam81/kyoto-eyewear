export type Locale = 'en-US' | 'zh-CN' | 'es-US';
export type LocalizedText = Record<Locale, string>;

export interface FrameColor { key: string; hex: string; name: LocalizedText }
export interface FrameSize { key: string; lensWidth: number; bridge: number; temple: number }
export interface Frame {
  id: string; sku: string; slug: string;
  name: LocalizedText; collectionName: string; nameZH: string;
  price: number; category: 'optical' | 'sun';
  frameShape: 'round' | 'square' | 'cat-eye' | 'aviator';
  frameMaterial: LocalizedText;
  colors: FrameColor[]; sizes: FrameSize[]; defaultSize: string;
  art: string; tint: string;
  fit: LocalizedText; description: LocalizedText;
  prescriptionCompatible: boolean; rxRange: string;
  availableLensMaterials: string[];
  tags: string[]; inventoryStatus: 'in_stock' | 'low' | 'out';
  featured?: boolean; newArrival?: boolean; bestSeller?: boolean;
  fsaEligible: boolean; rating: number; reviewCount: number;
}
export type PrescriptionUse = 'rx' | 'readers' | 'nonrx' | 'sun';
export type PrescriptionType = 'single' | 'progressive' | 'readers';
export type LensPreference = 'balanced' | 'thin' | 'weight' | 'durable';

export interface LensMaterial {
  id: string; index: number | null; material: 'cr39' | 'polycarbonate' | 'high-index';
  name: LocalizedText; label: LocalizedText; description: LocalizedText;
  price: number; thicknessRating: 1 | 2 | 3 | 4; weightRating: 0 | 1 | 2 | 3;
  impactResistance: 'standard' | 'high';
  recommendedRange: string; compatibleStrengthBands: number[];
  badges: string[]; enabled: boolean;
}
export interface Treatment {
  id: string; name: LocalizedText; description: LocalizedText;
  price: number; group: 'included' | 'recommended' | 'optional'; enabled: boolean;
}
export interface RxEye { sph: string; cyl: string; axis: string; add: string }
export interface Prescription {
  prescriptionId: string; userId: string | null;
  source: 'manual' | 'upload' | 'photo' | 'saved' | 'later';
  od: RxEye | null; os: RxEye | null;
  pdMode: 'single' | 'dual'; pd: number | null; pdOd: number | null; pdOs: number | null;
  fileReference: string | null; uploadStatus: 'none' | 'uploading' | 'done' | 'failed';
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'n/a';
  uploadedAt: string | null; expirationDate: string | null; label: string;
}
export interface LensConfiguration {
  configurationId: string;
  use: PrescriptionUse | null; type: PrescriptionType | null;
  strengthBand: number | null; preference: LensPreference | null;
  materialId: string | null; treatmentIds: string[];
  prescriptionMethod: Prescription['source'] | null; prescriptionId: string | null;
}
export interface CartItem {
  cartItemId: string; frameId: string; sku: string;
  colorKey: string; sizeKey: string; framePrice: number;
  config: LensConfiguration | null;
  lensMaterialPrice: number; treatmentPrices: Record<string, number>; typePrice: number;
  quantity: number; subtotal: number;
}
export type OrderStatus = 'received' | 'rx_needed' | 'rx_verification' | 'lens_production' | 'quality_check' | 'shipped' | 'delivered';
export interface Order {
  orderId: string; number: string; createdAt: string; items: CartItem[];
  subtotal: number; shipping: number; tax: number; total: number;
  paymentMethod: string; status: OrderStatus; shippingAddress: Address;
}
export interface Address { name: string; street: string; city: string; state: string; zip: string }
