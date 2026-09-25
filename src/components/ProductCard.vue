<template>
  <view class="pc" @click="$emit('open', frame.id)">
    <view class="img">
      <FrameArt :art="frame.art" :tint="frame.tint" :hex="frame.colors[0].hex" />
      <view class="fav" :class="{ on: fav.has(frame.id) }" @click.stop="fav.toggle(frame.id)" v-html="heart"></view>
    </view>
    <view class="b">
      <text class="n">{{ frame.name[loc] }}</text>
      <text class="p">{{ money(frame.price) }}</text>
      <text v-if="frame.bestSeller" class="tag">{{ $t('product.badgeBest') }}</text>
      <text v-else-if="frame.newArrival" class="tag alt">{{ $t('product.badgeNew') }}</text>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import FrameArt from './FrameArt.vue';
import { useFavoritesStore } from '@/stores/favorites';
import { money } from '@/utils/format';
import type { Frame, Locale } from '@/models';
const props = defineProps<{ frame: Frame }>();
defineEmits(['open']);
const { locale } = useI18n();
const loc = computed(() => locale.value as Locale);
const fav = useFavoritesStore();
/* 收藏复用既有 favorites store（账户页的「我的收藏」读的是同一份数据）。 */
/* 描边更细（1.3）以求精致；不要在 v-html 里写 rpx，尺寸由 .fav :deep(svg) 决定。 */
const heart = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.5s-6.4-4.2-8.5-7.9C1.7 9.3 3.1 5.4 6.7 4.9c1.9-.3 3.7.7 5.3 2.4 1.6-1.7 3.4-2.7 5.3-2.4 3.6.5 5 4.4 3.2 7.7-2.1 3.7-8.5 7.9-8.5 7.9z"/></svg>`;
void props;
</script>
<style lang="scss" scoped>
/* 商品是主角：图片区拿最大权重，文字区安静，卡片本身只有一根发丝线。
 * 底色由 FrameArt 的中性 stone 提供 —— 颜色只来自镜架本身。
 * 将来把 FrameArt 换成真实商品摄影时，这个卡片结构不需要重新设计。 */
/* 母版商品卡：白底 + 发丝线 + 轻阴影，图区最大权重，文字安静。
 * 真实商品摄影进来时直接替换 FrameArt，卡片结构不用重做。 */
.pc{background:$card;border:1rpx solid $line;border-radius:$r-md;overflow:hidden;box-shadow:$shadow-soft}
.img{height:236rpx;position:relative;display:flex;align-items:center;justify-content:center}
/* 角标放在图片下方的文字区起始处（母版 02：Bestseller / New 在名称下方） */
.tag{align-self:flex-start;background:$accent-strong;color:#fff;font-size:15rpx;
  letter-spacing:.06em;padding:3rpx 10rpx;border-radius:$r-xs;font-weight:$fw-semi;line-height:1.5}
.tag.alt{background:transparent;color:$teal;border:1rpx solid $teal}
/* 收藏心形：更精致 —— 更小、更细，静态时接近隐形，选中才用 Vermilion */
.fav{position:absolute;top:8rpx;right:8rpx;width:48rpx;height:48rpx;
  display:flex;align-items:center;justify-content:center;color:rgba(20,27,61,.28)}
.fav :deep(svg){width:30rpx;height:30rpx;display:block}
.fav.on{color:$accent-strong}
.b{padding:18rpx 20rpx 20rpx;display:flex;flex-direction:column;gap:6rpx}
.n{font-size:$fs-sm;font-weight:$fw-med;color:$ink;line-height:1.3;letter-spacing:.005em}
/* 价格清楚但不像促销站：Indigo 加粗，不用大红 */
.p{font-size:$fs-sm;font-weight:$fw-semi;color:$ink;font-variant-numeric:tabular-nums}
</style>
