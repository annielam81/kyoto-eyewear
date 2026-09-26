<template>
  <view class="page-pad">
    <!-- 母版 02：返回 / 居中标题 / 搜索。顶栏 own iOS 状态栏 inset（sticky + 实底） -->
    <view class="top-bar fh">
      <view class="fh-l"><KyotoWordmark :height="17" /></view>
      <text class="fh-t">{{ $t('frames.title') }}</text>
      <view class="fh-r"><LanguageSelector compact /></view>
    </view>

    <!-- 分类：母版的下划线 tabs。取值仍是项目既有的 filter 状态 -->
    <scroll-view scroll-x class="tabs"><view class="tabs-in">
      <text v-for="t in cats" :key="t.k" class="tb" :class="{ on: products.filter===t.k }"
        @click="products.filter = t.k">{{ $t(t.l) }}</text>
    </view></scroll-view>

    <!-- 款式细分 + 数量：母版第二行的 Filter / Sort 位置，功能仍来自既有 filter -->
    <scroll-view scroll-x class="shapes"><view class="shapes-in">
      <text v-for="f in shapes" :key="f.k" class="fchip" :class="{ on: products.filter===f.k }"
        @click="products.filter = f.k">{{ $t(f.l) }}</text>
    </view></scroll-view>
    <!-- 系列：三档价格体系 -->
    <scroll-view scroll-x class="shapes"><view class="shapes-in">
      <text v-for="c in seriesChips" :key="c.k" class="fchip" :class="{ on: products.filter===c.k }"
        @click="products.filter = c.k">{{ c.label }}</text>
    </view></scroll-view>
    <text class="count">{{ products.filtered.length }} {{ $t('frames.styles') }}</text>

    <view v-if="!products.loaded" class="state"><text class="state-tx">{{ $t('common.loading') }}</text></view>
    <view v-else-if="!products.filtered.length" class="state">
      <EmptyState :text="$t('common.empty')" emoji="◯">
        <KyotoButton variant="night" size="sm" @click="products.filter='all'">{{ $t('frames.all') }}</KyotoButton>
      </EmptyState>
    </view>
    <view v-else class="grid">
      <ProductCard v-for="f in products.filtered" :key="f.id" :frame="f" @open="openDetail" />
    </view>
    <KyotoBottomNav active="shop" />
  </view>
</template>
<script setup lang="ts">
import KyotoWordmark from '@/components/KyotoWordmark.vue';
import LanguageSelector from '@/components/LanguageSelector.vue';
import KyotoBottomNav from '@/components/KyotoBottomNav.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import EmptyState from '@/components/EmptyState.vue';
import ProductCard from '@/components/ProductCard.vue';
import { useProductStore } from '@/stores/product';
import { onShow } from '@dcloudio/uni-app';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { SERIES_INFO, SERIES_PRICE, OPENING_PROMO } from '@/config/pricing.config';
import { isSunglassesAvailable } from '@/config/launch-availability.config';
import type { FrameSeries, Locale } from '@/models';
const products = useProductStore();
const { locale } = useI18n();
const loc = computed(() => locale.value as Locale);
const seriesPrice = (k: FrameSeries) =>
  (OPENING_PROMO.active && k === OPENING_PROMO.series) ? OPENING_PROMO.promoPrice : SERIES_PRICE[k];
const seriesChips = computed(() => (['essential', 'signature', 'atelier'] as FrameSeries[]).map(k => ({
  k, label: `${SERIES_INFO[k].name[loc.value]} · $${seriesPrice(k)}`,
})));
onShow(() => products.ensure());
/* 分类与款式都写回同一个既有 filter 字段（store 的 filtered 同时匹配 category 与 frameShape），
   因此这里只是把现有能力按母版的两行结构呈现，没有新增任何筛选逻辑。
   太阳镜在发售期隐藏：tab 不渲染，store 的 sellable/filtered 也已过滤。 */
const cats = computed(() => [
  { k:'all', l:'frames.all' }, { k:'optical', l:'frames.optical' },
  ...(isSunglassesAvailable() ? [{ k:'sun', l:'frames.sun' }] : []),
]);
const shapes = [
  { k:'round', l:'frames.round' }, { k:'square', l:'frames.square' }, { k:'cat-eye', l:'frames.catEye' },
];
const openDetail = (id: string) => uni.navigateTo({ url: `/pages/product/detail?id=${id}` });
</script>
<style lang="scss" scoped>
/* 页头：左右槽位等宽，标题才是真正的视觉居中；
   标题放大 + 衬线（Cinzel 管拉丁，Songti SC 等管中文，不新增字体文件） */
.fh{align-items:center}
.fh-l,.fh-r{flex:0 0 150rpx;display:flex;align-items:center}
.fh-l{justify-content:flex-start}
.fh-r{justify-content:flex-end}
.fh-t{flex:1;text-align:center;font-family:$font-serif;font-size:42rpx;font-weight:600;color:$ink;letter-spacing:.06em}
.state{padding:80rpx 0;text-align:center}
.state-tx{font-size:$fs-sm;color:$muted}

/* 下划线 tabs */
.tabs{white-space:nowrap;border-bottom:1rpx solid $line;margin-bottom:$sp-3}
.tabs-in{display:flex;gap:$sp-5}
.tb{position:relative;padding:14rpx 0 16rpx;font-size:$fs-sm;color:$muted;font-weight:$fw-med;white-space:nowrap}
.tb.on{color:$ink;font-weight:$fw-semi}
.tb.on::after{content:"";position:absolute;left:0;right:0;bottom:-1rpx;height:3rpx;background:$accent}

/* 款式胶囊：安静，不抢产品 */
.shapes{white-space:nowrap}
.shapes-in{display:flex;gap:10rpx;padding:2rpx 0}
.fchip{display:inline-flex;align-items:center;border:1rpx solid $line-strong;border-radius:$r-pill;
  padding:9rpx 20rpx;font-size:$fs-xs;font-weight:$fw-med;color:$muted;background:transparent;white-space:nowrap}
.fchip.on{background:$ink;border-color:$ink;color:$paper;font-weight:$fw-semi}

.count{display:block;margin:$sp-3 0 14rpx;font-size:17rpx;letter-spacing:.08em;text-transform:uppercase;
  color:$muted;font-weight:$fw-semi;font-variant-numeric:tabular-nums}
/* 母版密度：2 列，间距紧凑，卡片不做 oversized */
.grid{display:grid;grid-template-columns:1fr 1fr;gap:18rpx}
</style>
