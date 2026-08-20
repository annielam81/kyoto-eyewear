import { defineStore } from 'pinia';
import { load, save } from '@/utils/storage';
import { LENS_MATERIALS } from '@/config/lens-materials.config';
import { TREATMENTS, TYPE_PRICES } from '@/config/treatments.config';
import { LensRecommendationService } from '@/services/LensRecommendationService';
import { useProductStore } from './product';
import { uid } from '@/utils/storage';
import type { LensConfiguration } from '@/models';

export type WizardState = LensConfiguration & { frameId: string|null; colorKey: string|null; sizeKey: string|null; step: number; editCartItemId: string|null };
const fresh = (): WizardState => ({
  configurationId: uid(), frameId: null, colorKey: null, sizeKey: null, step: 1, editCartItemId: null,
  use: null, type: null, strengthBand: null, preference: null,
  materialId: null, treatmentIds: [], prescriptionMethod: null, prescriptionId: null,
});
export const useLensWizardStore = defineStore('lensWizard', {
  state: (): { w: WizardState } => ({ w: load<WizardState>('kyoto.wizard', fresh()) }),
  getters: {
    frame(state): import('@/models').Frame | null {
      return state.w.frameId ? useProductStore().byId(state.w.frameId) ?? null : null;
    },
    material(state): import('@/models').LensMaterial | null {
      return LENS_MATERIALS.find(m => m.id === state.w.materialId) ?? null;
    },
    recommendation(state): string | null {
      return LensRecommendationService.recommend({
        strengthBand: state.w.strengthBand, preference: state.w.preference, use: state.w.use,
        frame: this.frame, sizeKey: state.w.sizeKey });
    },
    lensPrice(state): number {
      let p = this.material?.price ?? 0;
      p += TYPE_PRICES[state.w.type ?? ''] ?? 0;
      for (const id of state.w.treatmentIds) p += TREATMENTS.find(t => t.id === id)?.price ?? 0;
      return p;
    },
    includedTreatmentIds: (): string[] => TREATMENTS.filter(t => t.group === 'included').map(t => t.id),
  },
  actions: {
    start(frameId: string, colorKey: string, sizeKey: string) {
      this.w = { ...fresh(), frameId, colorKey, sizeKey };
      this.persist();
    },
    /** Restore a cart item's configuration for editing (preserves compatible selections). */
    startFromCartItem(item: import('@/models').CartItem) {
      const c = item.config;
      this.w = { ...fresh(), frameId: item.frameId, colorKey: item.colorKey, sizeKey: item.sizeKey,
        editCartItemId: item.cartItemId,
        use: c?.use ?? null, type: c?.type ?? null, strengthBand: c?.strengthBand ?? null,
        preference: c?.preference ?? null, materialId: c?.materialId ?? null,
        treatmentIds: (c?.treatmentIds ?? []).filter(id => !this.includedTreatmentIds.includes(id)),
        prescriptionMethod: c?.prescriptionMethod ?? null, prescriptionId: c?.prescriptionId ?? null,
        step: 6 };
      this.persist();
    },
    set<K extends keyof WizardState>(k: K, v: WizardState[K]) { (this.w as any)[k] = v; this.persist(); },
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
