import { defineStore } from 'pinia';
import { load, save } from '@/utils/storage';
import { PrescriptionService } from '@/services/PrescriptionService';
import type { Prescription } from '@/models';
export const usePrescriptionStore = defineStore('prescription', {
  state: () => ({ saved: load<Prescription[]>('kyoto.prescriptions', [PrescriptionService.savedMock()]) }),
  actions: {
    add(p: Prescription) { this.saved.unshift(p); save('kyoto.prescriptions', [...this.saved]); },
    byId(id: string) { return this.saved.find(p => p.prescriptionId === id); },
  },
});
