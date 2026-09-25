<template>
  <view class="bn">
    <view v-for="t in tabs" :key="t.key" class="tab" :class="{ on: active===t.key }" @click="go(t)">
      <view class="ico" v-html="t.icon"></view>
      <text class="lbl">{{ $t('nav.'+t.key) }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{ active: string }>();
const ic = (inner: string) =>
  `<svg viewBox="0 0 24 24" style="width:44rpx;height:44rpx;display:block" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const tabs = [
  { key:'home', url:'/pages/home/index',
    icon: ic('<path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>') },
  { key:'shop', url:'/pages/frames/index',
    icon: ic('<circle cx="7" cy="15" r="3.4"/><circle cx="17" cy="15" r="3.4"/><path d="M10.4 15h3.2M3.6 14.2 2 12.5M20.4 14.2 22 12.5"/>') },
  { key:'tryon', url:'/pages/tryon/index',
    icon: ic('<rect x="3" y="7.5" width="18" height="12.5" rx="3"/><circle cx="12" cy="13.5" r="3.2"/><path d="M8.8 7.5 10 5h4l1.2 2.5"/>') },
  { key:'orders', url:'/pages/order/list',
    icon: ic('<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 5a3 3 0 0 1 6 0"/><path d="M9 12h6M9 16h4"/>') },
  { key:'account', url:'/pages/account/index',
    icon: ic('<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>') },
];
const go = (t: { url: string }) => uni.reLaunch({ url: t.url });
</script>

<style lang="scss" scoped>
.bn{position:fixed;left:0;right:0;bottom:0;display:flex;background:rgba($paper,.96);border-top:1rpx solid $line;padding:14rpx 8rpx calc(18rpx + #{$safe-b});z-index:$z-nav}
.tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6rpx;color:#A79E90;min-height:94rpx}
.tab.on{color:$vermillion}
.lbl{font-size:19rpx;font-weight:$fw-med}
</style>
