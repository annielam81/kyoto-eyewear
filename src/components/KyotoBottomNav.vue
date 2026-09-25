<template>
  <view class="bn">
    <view v-for="t in tabs" :key="t.key" class="tab" :class="{ on: active===t.key }" @click="go(t)">
      <view class="ico" v-html="t.icon"></view>
      <text class="lbl">{{ $t('nav.'+t.i18n) }}</text>
      <view v-if="t.key==='cart' && cart.count" class="badge">{{ cart.count }}</view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { useCartStore } from '@/stores/cart';
defineProps<{ active: string }>();
const cart = useCartStore();
/* 尺寸一律不写在这个字符串里：v-html 是运行时注入的，webview 不认识 rpx，
   写了会解析失败、图标变 0 尺寸。宽高由下面 .ico :deep(svg) 的编译期 CSS 决定。 */
const S = (d:string)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
/** 五项与视觉母版一致；每一项都对应项目中已存在的真实路由。 */
const tabs = [
  { key:'home',   i18n:'home',    url:'/pages/home/index',    icon:S('<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>') },
  { key:'frames', i18n:'shop',    url:'/pages/frames/index',  icon:S('<path d="M6 7h12l1.4 12.2a1 1 0 0 1-1 1.1H5.6a1 1 0 0 1-1-1.1z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/>') },
  { key:'tryon',  i18n:'tryOn',   url:'/pages/tryon/index',   icon:S('<circle cx="6.5" cy="13" r="3.8"/><circle cx="17.5" cy="13" r="3.8"/><path d="M10.3 12.4q1.7-1.2 3.4 0"/><path d="M2.7 11.2 1 10.3M21.3 11.2 23 10.3"/>') },
  { key:'cart',   i18n:'cart',    url:'/pages/cart/index',    icon:S('<path d="M6 6h14.2l-1.4 8.6a1 1 0 0 1-1 .9H8.2a1 1 0 0 1-1-.8L5.4 3.6A1 1 0 0 0 4.4 3H2.5"/><circle cx="9.5" cy="19.5" r="1.3"/><circle cx="17.5" cy="19.5" r="1.3"/>') },
  { key:'account',i18n:'account', url:'/pages/account/index', icon:S('<circle cx="12" cy="8.5" r="3.9"/><path d="M4.6 20.4a7.6 7.6 0 0 1 14.8 0"/>') },
];
const go = (t: any) => uni.reLaunch({ url: t.url });
</script>
<style lang="scss" scoped>
/* 母版底栏：Ivory 实底 + 一根发丝线 + Vermilion active。
   高度由 $nav-h 统一（页面下留白按同一 token 计算，最后一排内容不会被遮）。 */
.bn{position:fixed;left:0;right:0;bottom:0;display:flex;background:$paper;
  border-top:1rpx solid $line;padding:0 $sp-1 $safe-b;z-index:$z-nav}
.tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:4rpx;color:$muted;
  position:relative;height:$nav-h;justify-content:center}
.tab.on{color:$accent-strong}
.ico{width:42rpx;height:42rpx;display:flex;align-items:center;justify-content:center}
.ico :deep(svg){width:42rpx;height:42rpx;display:block}
.lbl{font-size:17rpx;letter-spacing:.02em;font-weight:$fw-med;line-height:1.2}
.tab.on .lbl{font-weight:$fw-semi}
.badge{position:absolute;top:12rpx;right:calc(50% - 40rpx);background:$accent-strong;color:#fff;
  font-size:17rpx;font-weight:$fw-semi;border-radius:$r-pill;min-width:28rpx;height:28rpx;
  display:flex;align-items:center;justify-content:center;padding:0 7rpx;font-variant-numeric:tabular-nums}
</style>
