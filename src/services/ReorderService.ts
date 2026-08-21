import type { Order } from '@/models';
import { useCartStore } from '@/stores/cart';
import { usePrescriptionStore } from '@/stores/prescription';
import { useProductStore } from '@/stores/product';
import { PrescriptionService } from '@/services/PrescriptionService';
import { LensRecommendationService } from '@/services/LensRecommendationService';
import { LENS_MATERIALS } from '@/config/lens-materials.config';

export interface ReorderResult { added: number; rxExpired: boolean; adjusted: boolean }
/** Copies a past order's configuration into the cart.
 *  - revalidates frame ↔ lens compatibility (falls back to first compatible material)
 *  - never silently reuses an expired prescription (switches to 'later') */
export function reorderToCart(o: Order): ReorderResult {
  const cart = useCartStore(); const rxStore = usePrescriptionStore(); const products = useProductStore();
  let rxExpired = false, adjusted = false, added = 0;
  for (const it of o.items) {
    const frame = products.byId(it.frameId); if (!frame) continue;
    const cfg = it.config ? JSON.parse(JSON.stringify(it.config)) : null;
    if (cfg) {
      const mat = LENS_MATERIALS.find(m => m.id === cfg.materialId);
      if (mat && !LensRecommendationService.compatible(mat, cfg.strengthBand, frame)) {
        const fb = LENS_MATERIALS.find(m => LensRecommendationService.compatible(m, cfg.strengthBand, frame));
        cfg.materialId = fb?.id ?? cfg.materialId; adjusted = true;
      }
      if (cfg.prescriptionMethod === 'saved' && cfg.prescriptionId) {
        const rx = rxStore.byId(cfg.prescriptionId);
        if (!rx || PrescriptionService.validity(rx) === 'expired') { cfg.prescriptionMethod = 'later'; rxExpired = true; }
      } else if (cfg.prescriptionMethod === 'saved') {
        const rx = rxStore.saved[0];
        if (rx && PrescriptionService.validity(rx) === 'expired') { cfg.prescriptionMethod = 'later'; rxExpired = true; }
      }
      cart.addConfigured(it.frameId, it.sku, it.colorKey, it.sizeKey, it.framePrice, cfg);
    } else {
      cart.addFrameOnly(it.frameId, it.sku, it.colorKey, it.sizeKey, it.framePrice);
    }
    added++;
  }
  return { added, rxExpired, adjusted };
}
