import { defineStore } from 'pinia';
import { load, save } from '@/utils/storage';
import { LENS_MATERIALS } from '@/config/lens-materials.config';
import { TREATMENTS, TYPE_PRICES } from '@/config/treatments.config';
import { LensRecommendationService } from '@/services/LensRecommendationService';
import { useProductStore } from './product';
import { uid } from '@/utils/storage';
import type { LensConfiguration } from '@/models';

const fresh = (): LensConfiguration & { frameId: string|null; colorKey: string|null; sizeKey: string|null; step: number } => ({
  configurationId: uid(), frameId: null, colorKey: null, sizeKey: null, step: 1,
  use: null, type: null, strengthBand: null, preference: null,
  materialId: null, treatmentIds: [], prescriptionMethod: null, prescriptionId: null,
});
export const useLensWizardStore = defineStore('lensWizard', {
  state: () => ({ w: load('kyoto.wizard', fresh()) }),
  getters: {
    frame(s) { return s.w.frameId ? useProductStore().byId(s.w.frameId) ?? null : null; },
    material(s) { return LENS_MATERIALS.find(m => m.id === s.w.materialId) ?? null; },
    recommendation(s): string | null {
      return LensRecommendationService.recommend({
        strengthBand: s.w.strengthBand, preference: s.w.preference, use: s.w.use,
        frame: this.frame, sizeKey: s.w.sizeKey });
    },
    lensPrice(s): number {
      let p = this.material?.price ?? 0;
      p += TYPE_PRICES[s.w.type ?? ''] ?? 0;
      for (const id of s.w.treatmentIds) p += TREATMENTS.find(t => t.id === id)?.price ?? 0;
      return p;
    },
    includedTreatmentIds: () => TREATMENTS.filter(t => t.group === 'included').map(t => t.id),
  },
  actions: {
    start(frameId: string, colorKey: string, sizeKey: string) {
      this.w = { ...fresh(), frameId, colorKey, sizeKey };
      this.persist();
    },
    set<K extends keyof typeof this.w>(k: K, v: (typeof this.w)[K]) { (this.w as any)[k] = v; this.persist(); },
    toggleTreatment(id: string) {
      const t = TREATMENTS.find(x => x.id === id);
      if (!t || t.group === 'included') return;      // included are locked; paid default OFF
      const i = this.w.treatmentIds.indexOf(id);
      i >= 0 ? this.w.treatmentIds.splice(i,1) : this.w.treatmentIds.push(id);
      this.persist();
    },
    reset() { this.w = fresh(); this.persist(); },
    persist() { save('kyoto.wizard', JSON.parse(JSON.stringify(this.w))); },
  },
});
