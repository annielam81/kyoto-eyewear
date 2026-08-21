import { request } from './client';
import type { Prescription } from '@/models';
import { load, save } from '@/utils/storage';
const KEY = 'kyoto.prescriptions';
/** Sensitive data: no console logging, no URL params, no analytics payloads. */
export const PrescriptionsApi = {
  list: () => request('/prescriptions', () => load<Prescription[]>(KEY, [])),
  save: (all: Prescription[]) => request('/prescriptions', () => { save(KEY, all); return all; }),
};
