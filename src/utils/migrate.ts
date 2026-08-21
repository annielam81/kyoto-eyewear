import { load, save } from './storage';
/** Lightweight persisted-state migration. Old Phase 3 structures must never crash the app. */
export const SCHEMA_VERSION = 2;
export function runMigrations() {
  const v = load<number>('kyoto.schemaVersion', 1);
  if (v >= SCHEMA_VERSION) return;
  try {
    // v1 -> v2: Phase 3B-era address shape {name,street,state} -> Phase 3C shape
    const orders = load<any[]>('kyoto.orders', []);
    let dirty = false;
    for (const o of orders) {
      const a = o.shippingAddress;
      if (a && a.name != null && a.firstName == null) {
        const [firstName = '', ...rest] = String(a.name).split(' ');
        o.shippingAddress = { id: 'migrated', firstName, lastName: rest.join(' '),
          line1: a.street ?? '', line2: '', city: a.city ?? '', stateCode: a.state ?? '',
          zip: a.zip ?? '', phone: a.phone ?? '' };
        dirty = true;
      }
      if (o.shippingMethodId == null) { o.shippingMethodId = 'standard'; dirty = true; }
    }
    if (dirty) save('kyoto.orders', orders);
    const wiz = load<any>('kyoto.wizard', null);
    if (wiz && wiz.editCartItemId === undefined) { wiz.editCartItemId = null; save('kyoto.wizard', wiz); }
  } catch { /* migration must never take the app down */ }
  save('kyoto.schemaVersion', SCHEMA_VERSION);
}
