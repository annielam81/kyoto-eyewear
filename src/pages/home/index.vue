<template>
  <view class="page-pad">
    <view class="top safe-top">
      <KyotoWordmark :height="19" />
      <LanguageSelector compact />
    </view>
    <!-- hero -->
    <view class="hero">
      <view class="bg" v-html="heroBg"></view>
      <view class="in">
        <text class="eb">{{ $t('home.hero.eyebrow') }}</text>
        <text class="ttl">{{ $t('home.hero.title') }}</text>
        <text class="sb">{{ $t('home.hero.subtitle') }}</text>
        <view class="cta" @click="nav('/pages/frames/index', true)">{{ $t('home.hero.cta') }} →</view>
      </view>
    </view>
    <!-- quick services (custom icons, no emoji) -->
    <view class="quick">
      <view v-for="q in quick" :key="q.k" class="q" @click="q.go()">
        <view class="ic" :class="q.tint" v-html="q.icon"></view>
        <text class="ql">{{ $t('home.services.'+q.k) }}</text>
      </view>
    </view>
    <!-- bestsellers -->
    <view class="sec"><text class="h2">{{ $t('home.bestsellers') }}</text>
      <text class="all" @click="nav('/pages/frames/index', true)">{{ $t('common.seeAll') }} ›</text></view>
    <scroll-view scroll-x class="hs"><view class="hs-in">
      <view v-for="f in best" :key="f.id" class="hcard"><ProductCard :frame="f" @open="openDetail" /></view>
    </view></scroll-view>
    <!-- subscription banner -->
    <view class="promo">
      <view class="pbg" v-html="promoBg"></view>
      <view class="pin">
        <text class="pt">{{ $t('home.subscription.title') }}</text>
        <text class="psb">{{ $t('home.subscription.subtitle') }}</text>
        <view class="pcta">{{ $t('home.subscription.cta') }}</view>
      </view>
    </view>
    <!-- new arrivals -->
    <view class="sec"><text class="h2">{{ $t('home.newArrivals') }}</text>
      <text class="all" @click="nav('/pages/frames/index', true)">{{ $t('common.seeAll') }} ›</text></view>
    <scroll-view scroll-x class="hs"><view class="hs-in">
      <view v-for="f in news" :key="f.id" class="hcard"><ProductCard :frame="f" @open="openDetail" /></view>
    </view></scroll-view>
    <KyotoBottomNav active="home" />
  </view>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import KyotoWordmark from '@/components/KyotoWordmark.vue';
import LanguageSelector from '@/components/LanguageSelector.vue';
import KyotoBottomNav from '@/components/KyotoBottomNav.vue';
import ProductCard from '@/components/ProductCard.vue';
import { useProductStore } from '@/stores/product';
import { onShow } from '@dcloudio/uni-app';
const products = useProductStore();
onShow(() => products.ensure());
const best = computed(() => products.frames.filter(f => f.bestSeller || ['gion','tasogare'].includes(f.id)));
const news = computed(() => products.frames.filter(f => f.newArrival));
const nav = (url: string, relaunch = false) => relaunch ? uni.reLaunch({ url }) : uni.navigateTo({ url });
const openDetail = (id: string) => uni.navigateTo({ url: `/pages/product/detail?id=${id}` });
const I = (d:string)=>`<svg viewBox="0 0 24 24" style="width:44rpx;height:44rpx" fill="none" stroke="#0D1B2A" stroke-width="1.8" stroke-linecap="round">${d}</svg>`;
const quick = [
  { k:'virtualTryOn', tint:'tint-sakura', icon:I('<rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="4"/><path d="M9 6l1.5-2h3L15 6"/>'), go:()=>uni.navigateTo({url:'/pages/tryon/index?frame=arashiyama'}) },
  { k:'uploadRx', tint:'tint-gold', icon:I('<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>'), go:()=>uni.navigateTo({url:'/pages/prescription/upload'}) },
  { k:'reorder', tint:'tint-teal', icon:I('<path d="M3 12a9 9 0 1 1 3 6.7M3 20v-5h5"/>'), go:()=>uni.navigateTo({url:'/pages/order/list'}) },
  { k:'fsa', tint:'tint-sunrise', icon:I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>'), go:()=>uni.showToast({title:'FSA / HSA ✓',icon:'none'}) },
];
const heroBg = `<svg viewBox="0 0 350 200" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%"><rect width="350" height="200" fill="#FF4F8B"/><circle cx="290" cy="70" r="70" fill="#FF6A3D"/><path d="M0 155Q80 112 170 142T350 132V200H0Z" fill="#0B7C6E"/><path d="M200 200Q260 152 350 162V200Z" fill="#FFC83D"/><g fill="#0D1B2A"><rect x="300" y="86" width="3" height="6"/><path d="M290 92h23l-4-4h-15z"/><rect x="294" y="92" width="15" height="6"/><path d="M285 106h33l-5-6h-23z"/><rect x="292" y="106" width="19" height="8"/><path d="M279 124h45l-7-8h-31z"/><rect x="290" y="124" width="23" height="12"/></g><g fill="#FFF5E6" opacity=".9"><circle cx="228" cy="28" r="6"/><circle cx="244" cy="42" r="5"/><circle cx="236" cy="58" r="4"/></g></svg>`;
const promoBg = `<svg viewBox="0 0 350 130" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%"><rect width="350" height="130" fill="#0D1B2A"/><g fill="none" stroke="rgba(255,245,230,.14)" stroke-width="1.4"><circle cx="260" cy="130" r="46"/><circle cx="260" cy="130" r="32"/><circle cx="316" cy="108" r="46"/><circle cx="316" cy="108" r="32"/></g><circle cx="300" cy="32" r="26" fill="#FF6A3D"/><path d="M280 38Q300 24 320 38" fill="none" stroke="#0D1B2A" stroke-width="3"/></svg>`;
</script>
<style lang="scss" scoped>
.top{display:flex;align-items:center;justify-content:space-between;padding:16rpx 0 22rpx}
.hero{position:relative;border-radius:$r-lg;overflow:hidden;min-height:380rpx;color:$paper}
.bg{position:absolute;top:0;left:0;right:0;bottom:0}
.in{position:relative;padding:40rpx 36rpx;display:flex;flex-direction:column;gap:12rpx;max-width:62%}
.eb{font-size:$fs-xs;letter-spacing:.28em;color:$gold;font-weight:$fw-semi}
.ttl{font-size:44rpx;font-weight:$fw-bold;line-height:1.2;color:#fff}
.sb{font-size:$fs-xs;color:rgba(255,245,230,.85);line-height:1.55}
.cta{align-self:flex-start;margin-top:14rpx;background:$gold;color:$night;border-radius:$r-pill;padding:16rpx 32rpx;font-size:$fs-sm;font-weight:$fw-semi}
.quick{display:flex;gap:14rpx;margin:30rpx 0 6rpx}
.q{flex:1;display:flex;flex-direction:column;align-items:center;gap:10rpx;min-width:0}
.ic{width:100rpx;height:100rpx;border-radius:30rpx;display:flex;align-items:center;justify-content:center}
.tint-sakura{background:$tint-sakura}.tint-gold{background:$tint-gold}.tint-teal{background:$tint-teal}.tint-sunrise{background:$tint-sunrise}
.ql{font-size:20rpx;font-weight:$fw-med;text-align:center;line-height:1.3}
.sec{display:flex;align-items:baseline;justify-content:space-between;margin:34rpx 0 18rpx}
.all{font-size:$fs-xs;color:$sunrise;font-weight:$fw-semi}
.hs{white-space:nowrap}
.hs-in{display:flex;gap:18rpx;padding-bottom:10rpx}
.hcard{flex:0 0 300rpx;width:300rpx}
.promo{position:relative;border-radius:$r-md;overflow:hidden;margin-top:30rpx;color:$paper;min-height:240rpx}
.pbg{position:absolute;top:0;left:0;right:0;bottom:0}
.pin{position:relative;padding:32rpx;display:flex;flex-direction:column;gap:8rpx;max-width:72%}
.pt{font-size:$fs-md;font-weight:$fw-bold;color:#fff}
.psb{font-size:$fs-xs;opacity:.8;line-height:1.5}
.pcta{align-self:flex-start;margin-top:14rpx;background:$sakura;color:#fff;border-radius:$r-pill;padding:12rpx 26rpx;font-size:$fs-xs;font-weight:$fw-semi}
</style>
