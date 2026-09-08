<template>
  <view class="bn">
    <view v-for="t in tabs" :key="t.key" class="tab" :class="{ on: active===t.key }" @click="go(t)">
      <view class="ico" v-html="t.icon"></view>
      <text class="lbl">{{ $t('nav.'+t.key) }}</text>
      <view v-if="t.key==='cart' && cart.count" class="badge">{{ cart.count }}</view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { useCartStore } from '@/stores/cart';
defineProps<{ active: string }>();
const cart = useCartStore();
const S = (d:string)=>`<svg viewBox="0 0 24 24" style="width:44rpx;height:44rpx" fill="none" stroke="currentColor" stroke-width="1.8"><path d="${d}"/></svg>`;
const tabs = [
  { key:'home',   url:'/pages/home/index',    icon:S('M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z') },
  { key:'frames', url:'/pages/frames/index',  icon:S('M2 12a5 5 0 1 0 10 0 5 5 0 1 0-10 0M12 12a5 5 0 1 0 10 0 5 5 0 1 0-10 0M9.5 10.5q2.5-2 5 0') },
  { key:'cart',   url:'/pages/cart/index',    icon:S('M6 6h15l-1.5 9h-12zM6 6L5 3H2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z') },
  { key:'account',url:'/pages/account/index', icon:S('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0') },
];
const go = (t: any) => uni.reLaunch({ url: t.url });
</script>
<style lang="scss" scoped>
.bn{position:fixed;left:0;right:0;bottom:0;display:flex;background:$paper;border-top:2rpx solid $line;padding:12rpx 8rpx calc(16rpx + #{$safe-b});z-index:$z-nav}
.tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:4rpx;color:$muted;position:relative;min-height:88rpx;justify-content:center}
.tab.on{color:$sakura}
.lbl{font-size:$fs-xs}
.badge{position:absolute;top:0;right:calc(50% - 52rpx);background:$sunrise;color:#fff;font-size:20rpx;font-weight:$fw-semi;border-radius:$r-pill;min-width:32rpx;height:32rpx;display:flex;align-items:center;justify-content:center;padding:0 8rpx}
</style>
