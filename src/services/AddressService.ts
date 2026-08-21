import type { Address } from '@/models';
import { load, save, uid } from '@/utils/storage';
const KEY = 'kyoto.addresses';
/** Mock local persistence. PRODUCTION-INTEGRATION-REQUIRED: account backend. */
export const AddressService = {
  list(): Address[] { return load<Address[]>(KEY, []); },
  upsert(a: Address): Address[] {
    const all = this.list();
    const i = all.findIndex(x => x.id === a.id);
    if (i >= 0) all[i] = a; else { a.id = a.id || uid(); all.push(a); }
    if (a.isDefault) all.forEach(x => { if (x.id !== a.id) x.isDefault = false; });
    if (!all.some(x => x.isDefault) && all.length) all[0].isDefault = true;
    save(KEY, all); return all;
  },
  remove(id: string): Address[] {
    const all = this.list().filter(x => x.id !== id);
    if (!all.some(x => x.isDefault) && all.length) all[0].isDefault = true;
    save(KEY, all); return all;
  },
};
