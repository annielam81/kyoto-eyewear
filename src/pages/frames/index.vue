<template>
  <view class="page-pad">
    <view class="top safe-top"><KyotoWordmark :height="19" /><LanguageSelector compact /></view>
    <text class="h1">{{ $t('frames.title') }}</text>
    <text class="sub" style="display:block;margin:6rpx 0 18rpx">{{ products.filtered.length }} {{ $t('frames.styles') }}</text>
    <scroll-view scroll-x class="chips"><view class="chips-in">
      <text v-for="f in filters" :key="f.k" class="chip" :class="{ on: products.filter===f.k }"
        @click="products.filter=f.k">{{ $t(f.l) }}</text>
    </view></scroll-view>
    <view class="grid">
      <ProductCard v-for="f in products.filtered" :key="f.id" :frame="f" @open="openDetail" />
    </view>
    <KyotoBottomNav active="frames" />
  </view>
</template>
<script setup lang="ts">
import KyotoWordmark from '@/components/KyotoWordmark.vue';
import LanguageSelector from '@/components/LanguageSelector.vue';
import KyotoBottomNav from '@/components/KyotoBottomNav.vue';
import ProductCard from '@/components/ProductCard.vue';
import { useProductStore } from '@/stores/product';
import { onShow } from '@dcloudio/uni-app';
const products = useProductStore();
onShow(() => products.ensure());
const filters = [
  { k:'all', l:'frames.all' }, { k:'optical', l:'frames.optical' }, { k:'sun', l:'frames.sun' },
  { k:'round', l:'frames.round' }, { k:'square', l:'frames.square' }, { k:'cat-eye', l:'frames.catEye' },
];
const openDetail = (id: string) => uni.navigateTo({ url: `/pages/product/detail?id=${id}` });
</script>
<style lang="scss" scoped>
.top{display:flex;align-items:center;justify-content:space-between;padding:16rpx 0 22rpx}
.chips{white-space:nowrap;margin-bottom:22rpx}
.chips-in{display:flex;padding:6rpx 0}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:20rpx}
</style>
