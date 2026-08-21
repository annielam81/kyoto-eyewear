# KYOTO Backend Architecture (Phase 4A)

Status: **contracts + mock adapter only. No production infrastructure exists.**

## Layering
UI (Vue pages) → Pinia stores → Application services (ProductService, OrderService, …)
→ API/Repository layer (`src/api/*`) → Backend contract (`src/models/domain.ts`)
→ Database / integrations (future; vendor NOT selected — requires explicit approval).

Rules: pages never call endpoints directly; services keep Phase 3 signatures; the
frontend depends on contracts, never on a database vendor.

## Entity relationships
- User → Addresses (1:N), User → Prescriptions (1:N)
- User/Guest → Cart (1:1 active) → CartLines (1:N)
- Product → Variants (1:N, color×size, real purchasable SKUs) → Inventory (1:1)
- Product → Images (1:N; kind: front/45°/side/detail/lifestyle/tryon/thumbnail, color-specific, ordered, alt text)
- Order → OrderItemSnapshots (1:N, immutable), → Address snapshots, → Prescription references
- Order status axes are separate: paymentStatus / prescriptionStatus / fulfillmentStatus.
  The customer timeline derives from these; internal ids are never customer order numbers.

## Money / time / localization
Money: integer cents in contracts (`utils/money.ts`); UI still displays dollars.
Time: ISO 8601 transport; UI localizes. Canonical identifiers are stable codes
(`polycarbonate`, `idx167`) — translated labels are presentation only.
Trivex remains absent/not active by design.

## Inventory reservation (documented, not implemented)
cart availability check → checkout availability check → order reservation
(reservedQty++) → expiration release. Requires backend transactions/locking; the
mock always reports in_stock.

## Sensitive data
Prescriptions: never logged, never in URLs, never in analytics; document blobs are
metadata references (PrescriptionDocument), not embedded in orders. No card number /
CVC / password / tokens are ever persisted. **No HIPAA compliance is claimed.**

## Idempotency
Order creation takes `idempotencyKey`; the mock dedupes and returns the original
order. Production backend must enforce the same at the API boundary.

## Failure UX
Mock client simulates offline / timeout / 500 via `kyoto.mockNet`. Checkout failure
keeps the cart and shows localized copy (`c4.err.*`); raw errors are never surfaced.

## Future admin boundary (not built)
products / inventory / orders / prescription review / refunds / tracking — separate
surface, never mixed into the customer frontend.
