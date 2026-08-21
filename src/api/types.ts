/** Phase 4A API contract layer. Mock adapter only — no live endpoints. */
export type ApiErrorCode =
  | 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'OUT_OF_STOCK'
  | 'INCOMPATIBLE_LENS' | 'PRESCRIPTION_REQUIRED' | 'PRESCRIPTION_EXPIRED'
  | 'PAYMENT_REQUIRED' | 'NETWORK_ERROR' | 'TIMEOUT' | 'SERVER_ERROR';

export interface ApiValidationIssue { field: string; code: string }
export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: ApiErrorCode | null;
  message: string | null;          // technical, never shown raw to customers
  requestId: string;
  validationErrors?: ApiValidationIssue[];
}
export class ApiError extends Error {
  constructor(public code: ApiErrorCode, message = '', public validationErrors: ApiValidationIssue[] = []) {
    super(message || code);
  }
}
/** Map API error codes to localized customer copy (i18n key). Raw backend text is never surfaced. */
export const errorI18nKey = (code: ApiErrorCode) => `c4.err.${code}`;

export interface PageRequest { cursor?: string | null; limit?: number }
export interface PageResult<T> { items: T[]; cursor: string | null; hasMore: boolean }

export type ProductSort = 'featured' | 'newest' | 'price_low_high' | 'price_high_low';
export interface ProductFilter {
  shape?: string; color?: string; size?: string; material?: string;
  priceMinCents?: number; priceMaxCents?: number;
  fsaEligible?: boolean; available?: boolean;
}
