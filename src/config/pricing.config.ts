import type { Frame, FrameSeries, LocalizedText } from '@/models';
import { isBrandDealTags } from '../../supabase/kyoto';

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

/** 名牌特价商品（tags 含 brand-deal）：价格完全以商品自身为准，
 *  不参与开业优惠改价——特价就是后台填的 launchPrice。 */
export const isBrandDeal = (f: Pick<Frame, 'tags'>): boolean => isBrandDealTags(f.tags);

/** 当前实际售价（含开业优惠）。 */
export function frameSellPrice(f: Pick<Frame, 'series' | 'price' | 'tags'>): number {
  if (isBrandDeal(f)) return f.price;
  if (OPENING_PROMO.active && f.series === OPENING_PROMO.series) return OPENING_PROMO.promoPrice;
  return f.price;
}

/** 是否处于优惠价（用于显示划线原价）。 */
export function frameOnPromo(f: Pick<Frame, 'series' | 'price' | 'tags'> & { regularPrice?: number }): boolean {
  if (isBrandDeal(f)) return (f.regularPrice ?? f.price) > f.price;
  return OPENING_PROMO.active && f.series === OPENING_PROMO.series && OPENING_PROMO.promoPrice < f.price;
}

/** 名牌特价折扣百分比（如 38 表示 -38%）；非品牌特价或无折扣时为 0。 */
export function brandDiscountPct(f: Pick<Frame, 'price' | 'tags'> & { regularPrice?: number }): number {
  if (!isBrandDeal(f)) return 0;
  const was = f.regularPrice ?? f.price;
  return was > f.price ? Math.round((1 - f.price / was) * 100) : 0;
}
