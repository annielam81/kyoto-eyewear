import { defineStore } from 'pinia';
import { AddressService } from '@/services/AddressService';
import type { Address } from '@/models';
import { uid } from '@/utils/storage';
export const blankAddress = (): Address => ({ id: uid(), firstName:'', lastName:'', line1:'', line2:'',
  city:'', stateCode:'', zip:'', phone:'', email:'', isDefault:false });
export const useAddressStore = defineStore('address', {
  state: () => ({ list: AddressService.list() }),
  getters: { def: s => s.list.find(a => a.isDefault) ?? s.list[0] ?? null },
  actions: {
    upsert(a: Address) { this.list = AddressService.upsert(JSON.parse(JSON.stringify(a))); },
    remove(id: string) { this.list = AddressService.remove(id); },
    setDefault(id: string) { const a = this.list.find(x=>x.id===id); if (a) this.upsert({ ...a, isDefault: true }); },
  },
});
