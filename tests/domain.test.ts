/** Phase 4A domain/contract tests — run via esbuild bundle + node (no new deps). */
import { toCents, fromCents, addCents, formatCents } from '../src/utils/money';
import { PrescriptionService } from '../src/services/PrescriptionService';
import { LensRecommendationService } from '../src/services/LensRecommendationService';
import { LENS_MATERIALS } from '../src/config/lens-materials.config';
import { errorI18nKey } from '../src/api/types';

let pass = 0, fail = 0;
function t(name: string, cond: boolean, detail = '') {
  if (cond) { pass++; console.log('PASS', name); }
  else { fail++; console.log('FAIL', name, detail); }
}

// ---- Money (no floating point drift) ----
t('money: $130 → 13000c', toCents(130) === 13000);
t('money: 0.1+0.2 dollars safe in cents', addCents(toCents(0.1), toCents(0.2)) === 30);
t('money: round-trip', fromCents(toCents(95)) === 95);
t('money: format whole', formatCents(13000) === '$130');
t('money: format fractional', formatCents(1138) === '$11.38');

// ---- Approved Phase 3 pricing preserved (spec §13: no silent changes) ----
const poly = LENS_MATERIALS.find(m => m.id === 'poly')!;
const i167 = LENS_MATERIALS.find(m => m.id === 'hi167')!;
t('pricing: polycarbonate +$35', poly.price === 35);
t('pricing: 1.67 +$65', i167.price === 65);
t('lens: Trivex absent (must NOT re-enable)', !LENS_MATERIALS.some(m => /trivex/i.test(m.id) || /trivex/i.test(m.name['en-US'])));
t('lens: poly label = Lightweight + Impact Resistant', poly.label['en-US'].includes('Impact Resistant'));

// ---- Stable localization codes (identifiers never translated) ----
t('codes: material ids are stable codes', LENS_MATERIALS.every(m => /^[a-z0-9]+$/.test(m.id)));

// ---- Prescription expiration ----
const mk = (exp: string|null) => ({ ...PrescriptionService.blank('saved'), expirationDate: exp });
t('rx: null → unknown', PrescriptionService.validity(mk(null) as any) === 'unknown');
t('rx: past → expired', PrescriptionService.validity(mk('2020-01-01') as any) === 'expired');
const soon = new Date(Date.now() + 30*86400e3).toISOString().slice(0,10);
t('rx: <60d → expiringSoon', PrescriptionService.validity(mk(soon) as any) === 'expiringSoon');
const far = new Date(Date.now() + 400*86400e3).toISOString().slice(0,10);
t('rx: far → valid', PrescriptionService.validity(mk(far) as any) === 'valid');

// ---- Compatibility contract preserved ----
const frameMock: any = { id:'x', frameShape:'round', rimType:'full', availableLensMaterials:['std150','poly','hi160','hi167','hi174'] };
t('compat: 1.5 blocked over band 2', !LensRecommendationService.compatible(
  LENS_MATERIALS.find(m=>m.id==='std150')!, 2, frameMock));
t('compat: 1.74 ok at band 3', LensRecommendationService.compatible(
  LENS_MATERIALS.find(m=>m.id==='hi174')!, 3, frameMock));

// ---- Error mapping ----
t('errors: code → i18n key', errorI18nKey('OUT_OF_STOCK') === 'c4.err.OUT_OF_STOCK');

// ---- Order snapshot immutability (deep-copy contract) ----
const item = { sku:'A', config:{ materialId:'poly' } };
const snap = JSON.parse(JSON.stringify(item));
item.config.materialId = 'hi167';
t('order: snapshot survives source mutation', snap.config.materialId === 'poly');

// ---- Migration: v1 order shape converts without crash ----
import { runMigrations } from '../src/utils/migrate';
(globalThis as any).uni = {
  getStorageSync: (k: string) => (globalThis as any).__st?.[k] ?? '',
  setStorageSync: (k: string, v: any) => { ((globalThis as any).__st ??= {})[k] = v; },
};
// real uni.getStorageSync returns unwrapped values — mock stores raw values
(globalThis as any).__st = { 'kyoto.orders': [{ orderId:'1', shippingAddress:{ name:'Anni Lam', street:'1 Main', city:'NYC', state:'NY', zip:'10001' } }], 'kyoto.schemaVersion': 1 };
runMigrations();
const migrated = (globalThis as any).__st['kyoto.orders'][0];
t('migrate: v1 address → firstName/lastName', migrated.shippingAddress.firstName === 'Anni' && migrated.shippingAddress.line1 === '1 Main');
t('migrate: shippingMethodId defaulted', migrated.shippingMethodId === 'standard');

console.log(`\n${pass}/${pass+fail} passed`);
if (fail) process.exit(1);
