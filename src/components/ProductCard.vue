<template>
  <view class="pc" @click="$emit('open', frame.id)">
    <view class="pv">
      <FrameArt :art="frame.art" :tint="frame.tint" :hex="selHex" />
      <text v-if="mode==='new'" class="newtag">{{ $t('home.newBadge') }}</text>
      <view class="heart" :class="{ on: fav.has(frame.id) }" @click.stop="fav.toggle(frame.id)" v-html="icHeart"></view>
    </view>
    <view class="b">
      <text class="n">{{ frame.name[loc] }}</text>
      <view class="prow">
        <text class="p">{{ money(frame.price) }}</text>
        <view v-if="mode==='new'" class="add" @click.stop="quickAdd" v-html="icPlus"></view>
      </view>
      <view v-if="mode==='best'" class="meta">
        <view class="sws">
          <view v-for="c in frame.colors" :key="c.code" class="sw" :class="{ on: selKey===c.code }"
            :style="{ background: c.hex }" @click.stop="selKey = c.code"></view>
        </view>
        <view class="rate"><view class="star" v-html="icStar"></view><text>{{ rate }}</text></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import FrameArt from './FrameArt.vue';
import { useFavoritesStore } from '@/stores/favorites';
import { useCartStore } from '@/stores/cart';
import { money } from '@/utils/format';
import type { Frame, Locale } from '@/models';

const props = withDefaults(defineProps<{ frame: Frame; mode?: 'best' | 'new' }>(), { mode: 'best' });
defineEmits(['open']);

const { locale, t } = useI18n();
const loc = computed(() => locale.value as Locale);
const fav = useFavoritesStore();
const cart = useCartStore();

const selKey = ref(props.frame.colors[0]?.code ?? '');
const selHex = computed(() => props.frame.colors.find(c => c.code === selKey.value)?.hex ?? '#141B3D');
const rate = computed(() => `${props.frame.rating.toFixed(1)} (${props.frame.reviewCount})`);

const quickAdd = () => {
  const f = props.frame;
  cart.addFrameOnly(f.id, f.sku, selKey.value, f.defaultSize, f.price);
  uni.showToast({ title: t('toast.addedCart'), icon: 'none' });
};

/* 图标经 v-html 运行时注入：webview 不认识 rpx，一律用 %，尺寸由外层 CSS 定死。 */
const svgWrap = (inner: string, sw: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block">${inner}</svg>`;
const icHeart = svgWrap('<path d="M12 20.5C7 16.5 3.5 13.3 3.5 9.6A4.6 4.6 0 0 1 8.1 5c1.6 0 3 .9 3.9 2.2A4.6 4.6 0 0 1 15.9 5a4.6 4.6 0 0 1 4.6 4.6c0 3.7-3.5 6.9-8.5 10.9z"/>', '1.6');
const icPlus = svgWrap('<path d="M12 5v14M5 12h14"/>', '2.2');
const icStar = `<svg viewBox="0 0 24 24" fill="currentColor" style="width:100%;height:100%;display:block"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z"/></svg>`;
</script>

<style lang="scss" scoped>
/* 商品是主角：图区拿最大权重，文字区安静，卡片只有一根发丝线。
 * 底色由 FrameArt 的中性 stone 提供 —— 颜色只来自镜架本身。
 * 将来把 FrameArt 换成真实商品摄影时，卡片结构不需要重新设计。 */
.pc{background:$card;border:1rpx solid $line;border-radius:$r-md;overflow:hidden;box-shadow:$shadow-soft}
.pv{position:relative;height:236rpx;display:flex;align-items:center;justify-content:center}
/* NEW 角标：左上，和纸金底 */
.newtag{position:absolute;top:14rpx;left:14rpx;background:$gold-soft;color:$ink;font-size:15rpx;font-weight:$fw-semi;letter-spacing:.18em;padding:7rpx 14rpx 7rpx 18rpx;border-radius:$r-pill}
/* 收藏心形：静态时接近隐形，选中才用 Vermilion */
.heart{position:absolute;top:8rpx;right:8rpx;width:56rpx;height:56rpx;display:flex;align-items:center;justify-content:center;color:rgba(20,27,61,.28)}
.heart :deep(svg){width:32rpx;height:32rpx}
.heart.on{color:$accent-strong}
.heart.on :deep(svg){fill:$accent-strong}
.b{padding:18rpx 20rpx 20rpx}
.n{font-size:$fs-sm;font-weight:$fw-med;color:$ink;line-height:1.3}
.prow{display:flex;align-items:center;justify-content:space-between;margin-top:6rpx;min-height:52rpx}
/* 价格清楚但不像促销站：Ink 加粗，不用大红 */
.p{font-size:$fs-sm;font-weight:$fw-semi;color:$ink;font-variant-numeric:tabular-nums}
.add{width:54rpx;height:54rpx;display:flex;align-items:center;justify-content:center;border-radius:$r-sm;background:$ink;color:$paper}
.add :deep(svg){width:30rpx;height:30rpx}
.add:active{transform:scale(.92)}
.meta{display:flex;align-items:center;justify-content:space-between;margin-top:12rpx}
.sws{display:flex;gap:12rpx}
.sw{width:22rpx;height:22rpx;border-radius:50%;border:1px solid rgba(0,0,0,.14)}
.sw.on{outline:3rpx solid $ink;outline-offset:3rpx}
.rate{display:flex;align-items:center;gap:6rpx;font-size:18rpx;color:$muted}
.star{width:22rpx;height:22rpx;color:$gold}
.star :deep(svg){width:100%;height:100%}
</style>
