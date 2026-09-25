import { LENS_MATERIALS } from '@/config/lens-materials.config';
import { LARGE_LENS_WIDTH, SUN_PREFERS_IMPACT } from '@/config/frame-lens-rules.config';
import type { Frame, LensMaterial, LensPreference, PrescriptionUse } from '@/models';

export interface RecommendationInput {
  strengthBand: number | null;        // 0 ≤±2 · 1 ±2–±4.5 · 2 ±4.5–±6 · 3 >±6 · 4 unsure
  preference: LensPreference | null;
  use: PrescriptionUse | null;
  frame: Frame | null; sizeKey: string | null;
}
/** Recommendation lives here, never in Vue screens. Suitability > price. */
export const LensRecommendationService = {
  compatible(m: LensMaterial, band: number | null, frame: Frame | null): boolean {
    if (!m.enabled) return false;
    if (frame && !frame.availableLensMaterials.includes(m.id)) return false;
    if (band == null || band === 4) return true;
    return m.compatibleStrengthBands.includes(band);
  },
  recommend(input: RecommendationInput): string | null {
    const { strengthBand: b, preference: pf, use, frame, sizeKey } = input;
    if (b == null || pf == null) return null;
    const size = frame?.sizes.find(s => s.key === sizeKey) ?? frame?.sizes[0];
    const big = (size?.lensWidth ?? 49) >= LARGE_LENS_WIDTH;
    const sunny = use === 'sun' && SUN_PREFERS_IMPACT;
    let r: string;
    if (pf === 'durable' || sunny) r = b <= 2 ? 'poly' : 'hi167';
    else if (pf === 'weight') r = b <= 2 ? 'poly' : 'hi174';
    else if (pf === 'thin') r = ['hi160','hi167','hi167','hi174','hi160'][b];
    else { r = ['std150','hi160','hi167','hi174','hi160'][b]; if (big && b === 1) r = 'hi167'; if (b === 4) r = 'poly'; }
    const mat = LENS_MATERIALS.find(m => m.id === r)!;
    if (!this.compatible(mat, b, frame)) {
      const fallback = LENS_MATERIALS.find(m => this.compatible(m, b, frame));
      return fallback?.id ?? null;
    }
    return r;
  },
  whyKey(id: string): string { return `lensWhy.${id}`; },
};
/** Localized "why" copy kept beside the engine so screens only render. */
export const LENS_WHY: Record<string, Record<string, string>> = {
  'en-US': {
    std150:'Your prescription is light, so a standard lens stays slim and clear — no need to pay for extra thinness.',
    poly:"Polycarbonate is the lightest lens we make and is highly impact-resistant — ideal for everyday wear, sport and durability. It's compatible with your prescription strength.",
    hi160:'For your prescription, 1.60 trims about 25% of the thickness versus standard while staying light — the best balance of comfort and price.',
    hi167:"Your prescription is strong enough that 1.67 noticeably reduces edge thickness and the 'magnified eye' look, especially in this frame size.",
    hi174:'At your prescription strength, 1.74 keeps the lens as thin and flat as possible so the frame looks the way it was designed to.' },
  'zh-CN': {
    std150:'你的度数较低,标准镜片已经足够薄且清晰,无需为更薄的镜片多花钱。',
    poly:'PC 聚碳酸酯是我们最轻的镜片,且抗冲击性极强——适合日常、运动和追求耐用的人。与你的度数兼容。',
    hi160:'对你的度数而言,1.60 比标准薄约 25%,同时更轻——舒适与价格的最佳平衡。',
    hi167:'你的度数已经较高,1.67 能明显减少边缘厚度与「眼睛放大」感,尤其在这个镜框尺寸上。',
    hi174:'在你的度数下,1.74 能让镜片尽可能薄而平,镜框看起来就像设计时的样子。' },
  'es-US': {
    std150:'Tu graduación es ligera, así que un lente estándar se mantiene delgado y claro — no necesitas pagar por más delgadez.',
    poly:'El policarbonato es el lente más ligero que fabricamos y es muy resistente a impactos — ideal para uso diario, deporte y durabilidad. Es compatible con tu graduación.',
    hi160:'Para tu graduación, el 1.60 reduce el grosor cerca de 25% frente al estándar y sigue siendo ligero — el mejor balance entre comodidad y precio.',
    hi167:'Tu graduación es lo bastante fuerte para que el 1.67 reduzca notablemente el grosor del borde y el efecto de «ojos agrandados», sobre todo en esta montura.',
    hi174:'Con tu graduación, el 1.74 mantiene el lente lo más delgado y plano posible para que la montura luzca como fue diseñada.' },
};
