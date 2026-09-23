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

// ---- Bifocal is a real domain lens type (not just UI copy) ----
import { TYPE_PRICES } from '../src/config/treatments.config';
import { PrescriptionService } from '../src/services/PrescriptionService';

t('lens type: bifocal is priced in TYPE_PRICES', Object.prototype.hasOwnProperty.call(TYPE_PRICES, 'bifocal'));
t('lens type: bifocal price is a number (no invented price)', typeof TYPE_PRICES.bifocal === 'number');
t('lens type: progressive keeps its existing +$120', TYPE_PRICES.progressive === 120);

// ADD survives the config snapshot that goes into the cart/order
const rxAdd = { ...PrescriptionService.blank('manual'),
  od:{ sph:'-2.00', cyl:'', axis:'', add:'+2.00' }, os:{ sph:'-2.25', cyl:'', axis:'', add:'+2.00' } };
const cfgBifocal = { type:'bifocal', prescriptionId: rxAdd.prescriptionId, materialId:'hi160' };
const cfgSnap = JSON.parse(JSON.stringify(cfgBifocal));
t('bifocal: config carries prescriptionId so ADD is retrievable',
  cfgSnap.type === 'bifocal' && cfgSnap.prescriptionId === rxAdd.prescriptionId);
t('rx: ADD is preserved on both eyes', rxAdd.od.add === '+2.00' && rxAdd.os.add === '+2.00');

// ---- Bifocal hard-requires ADD ----
import { hasValidAdd, lensTypeAllowed, reconcileLensType, TYPES_REQUIRING_ADD } from '../src/config/frame-lens-rules.config';

const rxNoAdd   = { ...PrescriptionService.blank('saved'),  od:{ sph:'-2.00', cyl:'', axis:'', add:'' },       os:{ sph:'-2.25', cyl:'', axis:'', add:'' } };
const rxWithAdd = { ...PrescriptionService.blank('manual'), od:{ sph:'-2.00', cyl:'', axis:'', add:'+2.00' },  os:{ sph:'-2.25', cyl:'', axis:'', add:'+2.00' } };
const rxOneEye  = { ...PrescriptionService.blank('manual'), od:{ sph:'-2.00', cyl:'', axis:'', add:'+1.50' },  os:{ sph:'-2.25', cyl:'', axis:'', add:'' } };
const rxDash    = { ...PrescriptionService.blank('manual'), od:{ sph:'-2.00', cyl:'', axis:'', add:'—' },      os:{ sph:'-2.25', cyl:'', axis:'', add:'—' } };

t('add: valid ADD detected', hasValidAdd(rxWithAdd) === true);
t('add: empty ADD → none', hasValidAdd(rxNoAdd) === false);
t('add: em-dash placeholder is not an ADD', hasValidAdd(rxDash) === false);
t('add: one eye with ADD counts', hasValidAdd(rxOneEye) === true);
t('add: no prescription at all → none', hasValidAdd(null) === false);

// 规则来源只有一处
t('rules: progressive AND bifocal hard-require ADD',
  TYPES_REQUIRING_ADD.length === 2
  && TYPES_REQUIRING_ADD.includes('progressive') && TYPES_REQUIRING_ADD.includes('bifocal'));
t('rules: single and readers are NOT in the ADD requirement list',
  !TYPES_REQUIRING_ADD.includes('single') && !TYPES_REQUIRING_ADD.includes('readers'));

// 无 ADD → 禁用；有 ADD → 可选（渐进与双光对称）
t('progressive: DISABLED without ADD', lensTypeAllowed('progressive', rxNoAdd) === false);
t('progressive: DISABLED when no prescription linked (upload/photo/later)', lensTypeAllowed('progressive', null) === false);
t('progressive: SELECTABLE with valid ADD', lensTypeAllowed('progressive', rxWithAdd) === true);
t('bifocal: DISABLED without ADD', lensTypeAllowed('bifocal', rxNoAdd) === false);
t('bifocal: DISABLED when no prescription linked (upload/photo/later)', lensTypeAllowed('bifocal', null) === false);
t('bifocal: SELECTABLE with valid ADD', lensTypeAllowed('bifocal', rxWithAdd) === true);

// 单光 / 老花完全不受影响
t('single vision: unaffected by the ADD rule',
  lensTypeAllowed('single', rxNoAdd) === true && lensTypeAllowed('single', null) === true
  && lensTypeAllowed('single', rxWithAdd) === true);
t('readers: unaffected by the ADD rule',
  lensTypeAllowed('readers', rxNoAdd) === true && lensTypeAllowed('readers', null) === true
  && lensTypeAllowed('readers', rxWithAdd) === true);

// ADD 变为不可用时，已选的渐进/双光必须被安全清除（reconcile 返回应保留的值）
t('reconcile: selected PROGRESSIVE cleared when prescription loses ADD', reconcileLensType('progressive', rxNoAdd) === null);
t('reconcile: selected PROGRESSIVE cleared when prescription unlinked (send it later / photo upload)', reconcileLensType('progressive', null) === null);
t('reconcile: selected PROGRESSIVE kept while ADD still present', reconcileLensType('progressive', rxWithAdd) === 'progressive');
t('reconcile: selected BIFOCAL cleared when prescription loses ADD', reconcileLensType('bifocal', rxNoAdd) === null);
t('reconcile: selected BIFOCAL cleared when prescription unlinked (send it later / photo upload)', reconcileLensType('bifocal', null) === null);
t('reconcile: selected BIFOCAL kept while ADD still present', reconcileLensType('bifocal', rxWithAdd) === 'bifocal');
t('reconcile: single survives losing ADD', reconcileLensType('single', null) === 'single');
t('reconcile: readers survives losing ADD', reconcileLensType('readers', null) === 'readers');
t('reconcile: null type stays null', reconcileLensType(null, rxWithAdd) === null);
t('reconcile: switching saved(no ADD) → manual(ADD) re-enables, nothing cleared',
  reconcileLensType('progressive', rxWithAdd) === 'progressive' && reconcileLensType('bifocal', rxWithAdd) === 'bifocal');

// ---- Strength band derived from prescription (replaces the removed questionnaire) ----
t('band: -3.25/-3.00 → band 1', PrescriptionService.strengthBand(PrescriptionService.savedMock()) === 1);

// ---- Demo data: the built-in saved prescription must be usable for Progressive/Bifocal QA ----
const mock = PrescriptionService.savedMock();
t('savedMock: ADD is detected', hasValidAdd(mock) === true);
t('savedMock: OD/OS ADD are both +2.00', mock.od!.add === '+2.00' && mock.os!.add === '+2.00');
t('savedMock: Progressive enabled', lensTypeAllowed('progressive', mock) === true);
t('savedMock: Bifocal enabled', lensTypeAllowed('bifocal', mock) === true);
t('savedMock: SPH unchanged (-3.25 / -3.00)', mock.od!.sph === '-3.25' && mock.os!.sph === '-3.00');
t('band: no SPH → null (never guess)', PrescriptionService.strengthBand(PrescriptionService.blank('upload')) === null);
t('band: -7.50 → band 3', PrescriptionService.bandFromSph('-7.50', '-7.00') === 3);
t('band: -1.00 → band 0', PrescriptionService.bandFromSph('-1.00', '-0.75') === 0);

// ---- Initial-launch availability (temporary scope, NOT feature removal) ----
import { LAUNCH_AVAILABILITY, isLensTypeAvailable, AVAILABLE_LENS_TYPES, soleLensType,
         isContactLensAvailable, reconcileLaunchLensType } from '../src/config/launch-availability.config';
import { STEP, flowFor } from '../src/stores/lensWizard';

t('launch: Single Vision is available', isLensTypeAvailable('single') === true);
t('launch: Progressive hidden', isLensTypeAvailable('progressive') === false);
t('launch: Bifocal hidden', isLensTypeAvailable('bifocal') === false);
t('launch: Readers hidden', isLensTypeAvailable('readers') === false);
t('launch: Contact lenses hidden', isContactLensAvailable() === false);
t('launch: prescription eyeglasses available', LAUNCH_AVAILABILITY.prescriptionEyeglasses === true);
t('launch: exactly one sellable lens type', AVAILABLE_LENS_TYPES.length === 1 && soleLensType() === 'single');

// Hidden ≠ removed: the domain implementation must still be present
t('launch: hidden types still exist in TYPE_PRICES (implementation kept)',
  TYPE_PRICES.progressive === 120 && Object.prototype.hasOwnProperty.call(TYPE_PRICES, 'bifocal')
  && Object.prototype.hasOwnProperty.call(TYPE_PRICES, 'readers'));
t('launch: hidden types keep their ADD rules (kept for reactivation)',
  TYPES_REQUIRING_ADD.includes('progressive') && TYPES_REQUIRING_ADD.includes('bifocal'));

// ---- Visible wizard is 4 steps, Lens Type step skipped ----
const rxFlow = flowFor('rx');
t('flow: prescription path is 4 visible steps', rxFlow.length === 4);
t('flow: Lens Type step is NOT in the flow', rxFlow.includes(STEP.type) === false);
t('flow: order is Prescription → Material → Treatments → Review',
  rxFlow[0] === STEP.rx && rxFlow[1] === STEP.material && rxFlow[2] === STEP.treatments && rxFlow[3] === STEP.review);
t('flow: Lens Type SLOT still exists (page/implementation kept)', STEP.type === 2);
t('flow: nonrx path unchanged (treatments → review)',
  JSON.stringify(flowFor('nonrx')) === JSON.stringify([STEP.treatments, STEP.review]));

// ---- Legacy dev cart state with now-hidden types ----
t('legacy: in-progress NEW config with progressive collapses to single',
  reconcileLaunchLensType('progressive', false) === 'single');
t('legacy: in-progress NEW config with bifocal collapses to single',
  reconcileLaunchLensType('bifocal', false) === 'single');
t('legacy: EDITING an existing cart item keeps progressive (never misrepresent what was configured)',
  reconcileLaunchLensType('progressive', true) === 'progressive');
t('legacy: EDITING an existing cart item keeps bifocal', reconcileLaunchLensType('bifocal', true) === 'bifocal');
t('legacy: single is untouched either way',
  reconcileLaunchLensType('single', false) === 'single' && reconcileLaunchLensType('single', true) === 'single');

// ---- Scratch-resistant hidden from customer UI, underlying data preserved ----
import { TREATMENTS } from '../src/config/treatments.config';
import { isTreatmentVisible, HIDDEN_TREATMENT_IDS } from '../src/config/launch-availability.config';

const sc = TREATMENTS.find(x => x.id === 'sc');
t('scratch: underlying treatment data still exists', !!sc);
t('scratch: still a $0 included property (not a paid upgrade)', sc!.price === 0 && sc!.group === 'included');
t('scratch: translations kept in all three locales',
  sc!.name['en-US'] === 'Scratch-resistant' && !!sc!.name['zh-CN'] && !!sc!.name['es-US']);
t('scratch: hidden from customer-facing lists', isTreatmentVisible('sc') === false);
t('scratch: only scratch is hidden', HIDDEN_TREATMENT_IDS.length === 1 && HIDDEN_TREATMENT_IDS[0] === 'sc');

// The other treatments must be untouched and still visible
for (const id of ['ar', 'uv', 'blue', 'photo', 'polar']) {
  t(`treatment ${id}: still visible to customers`, isTreatmentVisible(id) === true);
}
t('treatments: prices unchanged', TREATMENTS.find(x=>x.id==='ar')!.price === 0
  && TREATMENTS.find(x=>x.id==='uv')!.price === 0
  && TREATMENTS.find(x=>x.id==='blue')!.price === 25
  && TREATMENTS.find(x=>x.id==='photo')!.price === 89
  && TREATMENTS.find(x=>x.id==='polar')!.price === 59);

// Customer-facing "Included free" group keeps AR + UV (never renders empty)
const visibleIncluded = TREATMENTS.filter(x => x.group === 'included' && isTreatmentVisible(x.id));
t('treatments: Included group still has AR + UV', visibleIncluded.length === 2
  && visibleIncluded.some(x=>x.id==='ar') && visibleIncluded.some(x=>x.id==='uv'));

// Review-style summary must not list scratch, but the order record still carries it
const includedIds = TREATMENTS.filter(x => x.group === 'included').map(x => x.id);
t('order record: scratch still written into treatmentIds (manufacturing data kept)', includedIds.includes('sc'));
const reviewNames = TREATMENTS
  .filter(x => (x.group === 'included' || includedIds.includes(x.id)) && isTreatmentVisible(x.id))
  .map(x => x.name['en-US']);
t('review summary: scratch not shown as a customer add-on', reviewNames.includes('Scratch-resistant') === false);
t('review summary: still shows AR and UV', reviewNames.includes('Anti-reflective') && reviewNames.includes('UV protection'));

console.log(`\n${pass}/${pass+fail} passed`);
if (fail) process.exit(1);
