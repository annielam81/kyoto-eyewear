import { request } from './client';
import type { Address } from '@/models';
import { AddressService } from '@/services/AddressService';
export const AddressesApi = {
  list: () => request('/addresses', () => AddressService.list()),
  upsert: (a: Address) => request('/addresses', () => AddressService.upsert(a)),
  remove: (id: string) => request(`/addresses/${id}`, () => AddressService.remove(id)),
};
