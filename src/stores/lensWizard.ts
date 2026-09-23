import { defineStore } from 'pinia';
import { load, save } from '@/utils/storage';
import { LENS_MATERIALS } from '@/config/lens-materials.config';
import { TREATMENTS, TYPE_PRICES } from '@/config/treatments.config';
import { LensRecommendationService } from '@/services/LensRecommendationService';
import { reconcileLensType, hasValidAdd } from '@/config/frame-lens-rules.config';
import { soleLensType, reconcileLaunchLensType } from '@/config/launch-availability.config';
import { usePrescriptionStore } from './prescription';
import { useProductStore } from './product';
import { uid } from '@/utils/storage';
import type { LensConfiguration } from '@/models';

export type WizardState = LensConfiguration & { frameId: string|null; colorKey: string|null; sizeKey: string|null; step: number; editCartItemId: string|null };

/** 向导**步位槽**的唯一来源。槽号是稳定标识，不等于给客户看的序号 ——
 *  客户看到的 1/4、2/4… 由 flowFor() 的序列位置算出（见 wizard 页的 displayStep）。
 *  类型槽(type)刻意保留：它的页面与实现都在，只是当前发售配置下不进入流程。 */
export const STEP = { rx: 1, type: 2, material: 3, treatments: 4, review: 5 } as const;

/**
 * 当前发售配置下，向导实际会经过的步位序列 —— **流程的唯一来源**。
 * 前进/后退/进度编号/步位合法性全部读它，因此不存在「跳过的步骤从某条路径漏出来」。
 *
 * 只剩一种可售镜片类型时跳过类型步（soleLensType()）；日后在
 * launch-availability.config.ts 里放开 progressive/bifocal/readers，类型步会自动回到流程里。
 */
export const flowFor = (use: LensConfiguration['use']): number[] => {
  if (use === 'nonrx') return [STEP.treatments, STEP.review];
  const seq: number[] = [STEP.rx];
  if (!soleLensType()) seq.push(STEP.type);
  seq.push(STEP.material, STEP.treatments, STEP.review);
  return seq;
};
export const firstStep = (use: LensConfiguration['use']) => flowFor(use)[0];
const fresh = (): WizardState => ({
  configurationId: uid(), frameId: null, colorKey: null, sizeKey: null, step: STEP.rx, editCartItemId: null,
  use: null, type: null, strengthBand: null, preference: null,
  materialId: null, treatmentIds: [], prescriptionMethod: null, prescriptionId: null,
});
/** 旧版本持久化下来的向导状态可能带着已不存在的步位（改版前是 1..6，用途曾是第 1 步）。
 *  升级后那些步位不再渲染任何内容，会出现空白页，因此载入时把越界步位收敛到该路径的首步。
 *  镜框/颜色/尺码/处方等其余选择都原样保留，客户只需重走镜片部分。 */
const validSteps = (use: WizardState['use']): number[] => flowFor(use);
const normalizeStep = (w: WizardState): WizardState => {
  if (!validSteps(w.use).includes(Number(w.step))) w.step = firstStep(w.use);
  // 发售期隐藏了部分镜片类型：进行中的新配置收敛到当前唯一可售类型；
  // 正在编辑既有购物车条目时保持原值（见 reconcileLaunchLensType 的说明）。
  if (w.use !== 'nonrx') w.type = reconcileLaunchLensType(w.type, !!w.editCartItemId);
  return w;
};

export const useLensWizardStore = defineStore('lensWizard', {
  state: (): { w: WizardState } => ({ w: normalizeStep(load<WizardState>('kyoto.wizard', fresh())) }),
  getters: {
    frame(state): import('@/models').Frame | null {
      return state.w.frameId ? useProductStore().byId(state.w.frameId) ?? null : null;
    },
    material(state): import('@/models').LensMaterial | null {
      return LENS_MATERIALS.find(m => m.id === state.w.materialId) ?? null;
    },
    /** 「推荐」仅供参考，且只在能读懂客户处方时才给：
     *  度数档位由处方派生（见 setStrengthBand）；拿不到就返回 null，不假装知道。
     *  偏好问卷已移除，这里用中性默认值 'balanced'，推荐引擎本身保持不动。 */
    recommendation(state): string | null {
      if (state.w.strengthBand == null) return null;
      return LensRecommendationService.recommend({
        strengthBand: state.w.strengthBand, preference: state.w.preference ?? 'balanced', use: state.w.use,
        frame: this.frame, sizeKey: state.w.sizeKey });
    },
    lensPrice(state): number {
      let p = this.material?.price ?? 0;
      p += TYPE_PRICES[state.w.type ?? ''] ?? 0;
      for (const id of state.w.treatmentIds) p += TREATMENTS.find(t => t.id === id)?.price ?? 0;
      return p;
    },
    includedTreatmentIds: (): string[] => TREATMENTS.filter(t => t.group === 'included').map(t => t.id),
    /** 当前配镜关联的处方（手输已落库、已保存处方均可取到；上传/拍照/稍后提供为 null）。 */
    linkedPrescription(state): import('@/models').Prescription | null {
      return state.w.prescriptionId ? usePrescriptionStore().byId(state.w.prescriptionId) ?? null : null;
    },
    /** 处方里是否有可用的 ADD —— 双光能否选择由它决定。 */
    addAvailable(): boolean { return hasValidAdd(this.linkedPrescription); },
  },
  actions: {
    /** `use` 由入口派生，不再询问客户：太阳镜镜框 → 'sun'，光学镜框 → 'rx'。
     *  当前发售配置下只有一种镜片类型时，直接写入（不是伪造：lensType 字段如实记录本单是单光）。 */
    start(frameId: string, colorKey: string, sizeKey: string, use: LensConfiguration['use'] = 'rx') {
      this.w = { ...fresh(), frameId, colorKey, sizeKey, use, step: firstStep(use),
        type: use === 'nonrx' ? null : soleLensType() };
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
        step: STEP.review };
      this.persist();
    },
    set<K extends keyof WizardState>(k: K, v: WizardState[K]) { (this.w as any)[k] = v; this.persist(); },
    /** 处方决定度数档位（兼容性校验与推荐都依赖它）。若已选材质与新档位不兼容就清空，
     *  避免客户改了处方之后还带着一个无效的镜片选择继续走。 */
    /** 处方变化后收敛已选镜片类型：若渐进/双光已选但处方里没有（或不再有）ADD，就清空它，
     *  避免带着无法生产的配置继续走。返回被清掉的类型（没清则为 null）。 */
    reconcileLensType(): import('@/models').PrescriptionType | null {
      const prev = this.w.type;
      const kept = reconcileLensType(prev, this.linkedPrescription);
      if (kept === prev) return null;
      this.w.type = kept;
      this.persist();
      return prev;                 // 返回被清掉的类型，界面据此给出对应的原因文案
    },
    setStrengthBand(band: number | null) {
      this.w.strengthBand = band;
      const m = this.material;
      if (m && !LensRecommendationService.compatible(m, band, this.frame)) this.w.materialId = null;
      this.persist();
    },
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
