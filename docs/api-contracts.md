# KYOTO API Contracts (Phase 4A — mock adapter)

Envelope: `{ success, data, error, errorCode-as-error, message, requestId, validationErrors[] }`
Errors: VALIDATION_ERROR · UNAUTHORIZED · NOT_FOUND · OUT_OF_STOCK · INCOMPATIBLE_LENS ·
PRESCRIPTION_REQUIRED · PRESCRIPTION_EXPIRED · PAYMENT_REQUIRED · NETWORK_ERROR · TIMEOUT · SERVER_ERROR
→ mapped to localized copy via `c4.err.*`; raw backend errors never reach customers.

| Area | Mock module | Future endpoint | Notes |
|---|---|---|---|
| Products | products.api.ts | GET /products, /products/:id | pagination {cursor,limit,hasMore}; filters shape/color/size/price/material/availability/FSA; sort featured/newest/price_low_high/price_high_low |
| Cart | cart.api.ts | GET/PUT /cart | guest cart local; guest→user merge = future |
| Orders | orders.api.ts | POST /orders (+Idempotency-Key), GET /orders | item snapshots immutable; internal id ≠ customer number |
| Addresses | addresses.api.ts | CRUD /addresses | validation provider = future |
| Prescriptions | prescriptions.api.ts | CRUD /prescriptions | sensitive-data rules apply |
| Uploads | uploads.api.ts | POST /uploads | returns PrescriptionDocument metadata; cloud storage = future |
| Inventory | inventory.api.ts | GET /inventory/:sku | reservation contract documented only |
| Users | users.api.ts | GET/PUT /me | auth = Phase 4B |
| Config | config.api.ts | GET /config/* | shipping methods, lens catalog (stable codes) |

Payment contract (`PaymentSession`): methodType/amountCents/currency/status/providerRef —
**no provider connected; no card data ever stored**. Shipping/Tax contracts include
destination-based quote/tax requests; carriers and tax providers are NOT connected.
Environment: `VITE_API_BASE_URL` from `.env.example` (dev/staging/production); no
localhost URLs inside business logic; no secrets committed.
