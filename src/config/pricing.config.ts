import type { Frame, FrameSeries, LocalizedText } from '@/models';

/** 三档价格体系：镜架系列等级定价；镜片升级独立加价（见 lens-materials.config / treatments.config）。 */
export const SERIES_PRICE: Record<FrameSeries, number> = {
  essential: 89.99,
  signature: 129.99,
  atelier: 189.99,
};

/** 开业优惠：Essential 系列前 3 个月 Complete Pair $79.99（含镜架 + CR-39 1.50 单光 + AR + 包邮）。 */
export const OPENING_PROMO = {
  active: true,
  series: 'essential' as FrameSeries,
  promoPrice: 79.99,
  /** 促销截止日期（用户确认后填写），为空则仅显示"开业前3个月"文案 */
  endsOn: '',
};

/** 系列展示文案（三语）。 */
export const SERIES_INFO: Record<FrameSeries, { name: LocalizedText; tagline: LocalizedText }> = {
  essential: {
    name: { 'en-US': 'Essential', 'zh-CN': '基础系列', 'es-US': 'Esencial' },
    tagline: { 'en-US': 'Everyday favorites that sell on value', 'zh-CN': '日常主力款，负责走量', 'es-US': 'Favoritos diarios con gran valor' },
  },
  signature: {
    name: { 'en-US': 'Signature', 'zh-CN': '精选系列', 'es-US': 'Signature' },
    tagline: { 'en-US': 'Better materials, design and details', 'zh-CN': '材质、设计和细节更好的中高端镜架', 'es-US': 'Mejores materiales, diseño y detalles' },
  },
  atelier: {
    name: { 'en-US': 'Atelier', 'zh-CN': '设计师系列', 'es-US': 'Atelier' },
    tagline: { 'en-US': 'Designer craftsmanship with brand character', 'zh-CN': '更有设计感、工艺和品牌感的高端系列', 'es-US': 'Artesanía de diseñador con carácter' },
  },
};

/** Complete Pair 包含（三档一致）。 */
export const COMPLETE_PAIR_INCLUDES: LocalizedText = {
  'en-US': 'Frame + CR-39 1.50 single-vision lenses + AR coating + free shipping',
  'zh-CN': '镜架 + CR-39 1.50 单光镜片 + AR 防反光 + 免费配送',
  'es-US': 'Montura + lentes monofocales CR-39 1.50 + antirreflejo + envío gratis',
};

/** 当前实际售价（含开业优惠）。 */
export function frameSellPrice(f: Pick<Frame, 'series' | 'price'>): number {
  if (OPENING_PROMO.active && f.series === OPENING_PROMO.series) return OPENING_PROMO.promoPrice;
  return f.price;
}

/** 是否处于优惠价（用于显示划线原价）。 */
export function frameOnPromo(f: Pick<Frame, 'series' | 'price'>): boolean {
  return OPENING_PROMO.active && f.series === OPENING_PROMO.series && OPENING_PROMO.promoPrice < f.price;
}
