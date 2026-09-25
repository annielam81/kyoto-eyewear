<template>
  <view class="home">
    <!-- header -->
    <view class="hdr">
      <LanguageSelector compact />
      <view class="brand">
        <KyotoWordmark :height="20" color="#1A2936" />
        <text class="des">EYEWEAR</text>
      </view>
      <view class="hacts">
        <view class="hbtn" @click="nav('/pages/frames/index', true)" v-html="icSearch"></view>
        <view class="hbtn" @click="nav('/pages/cart/index')">
          <view v-html="icBag"></view>
          <text v-if="cart.count" class="cbadge">{{ cart.count }}</text>
        </view>
      </view>
    </view>

    <view class="page-pad hbody">
      <!-- hero -->
      <view class="hero">
        <image class="himg" src="@/static/img/hero-kyoto.jpg" mode="aspectFill" />
        <view class="hwash" />
        <view class="hin">
          <view class="hcopy">
            <text class="ta">{{ $t('home.hero.titleA') }}</text>
            <text class="tb">{{ $t('home.hero.titleB') }}</text>
            <text class="hsub">{{ $t('home.hero.subtitle') }}</text>
            <view class="cta" @click="nav('/pages/frames/index', true)">
              <text>{{ $t('home.hero.cta') }}</text>
              <view class="arr" v-html="icArrow"></view>
            </view>
          </view>
          <view class="hside">
            <text class="stamp">京都</text>
            <text class="motto">{{ $t('home.hero.motto') }}</text>
          </view>
        </view>
        <view class="dots"><view class="dot on" /><view class="dot" /><view class="dot" /></view>
      </view>

      <!-- quick services -->
      <view class="sec">
        <view class="sechd">
          <text class="h2">{{ $t('home.servicesTitle') }}</text>
          <text class="all" @click="nav('/pages/frames/index', true)">{{ $t('common.seeAll') }} ›</text>
        </view>
        <view class="qgrid">
          <view v-for="q in quick" :key="q.k" class="qcard" @click="q.go()">
            <view class="qic" v-html="q.icon"></view>
            <text class="ql">{{ $t('home.services.'+q.k) }}</text>
          </view>
        </view>
      </view>

      <!-- bestsellers -->
      <view class="sec">
        <view class="sechd">
          <text class="h2">{{ $t('home.bestsellers') }}</text>
          <text class="all" @click="nav('/pages/frames/index', true)">{{ $t('common.seeAll') }} ›</text>
        </view>
        <scroll-view scroll-x class="hs"><view class="hsin">
          <view v-for="f in best" :key="f.id" class="hcard"><ProductCard :frame="f" mode="best" @open="openDetail" /></view>
        </view></scroll-view>
      </view>

      <!-- new arrivals -->
      <view class="sec">
        <view class="sechd">
          <text class="h2">{{ $t('home.newArrivals') }}</text>
          <text class="all" @click="nav('/pages/frames/index', true)">{{ $t('common.seeAll') }} ›</text>
        </view>
        <view class="ngrid">
          <view v-for="f in news" :key="f.id" class="ncard"><ProductCard :frame="f" mode="new" @open="openDetail" /></view>
        </view>
      </view>
    </view>

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
import { useCartStore } from '@/stores/cart';
import { onShow } from '@dcloudio/uni-app';

const products = useProductStore();
const cart = useCartStore();
onShow(() => products.ensure());

const best = computed(() => products.frames.filter(f => f.bestSeller).slice(0, 6));
const news = computed(() => products.frames.filter(f => f.newArrival).slice(0, 4));
const nav = (url: string, relaunch = false) => relaunch ? uni.reLaunch({ url }) : uni.navigateTo({ url });
const openDetail = (id: string) => uni.navigateTo({ url: `/pages/product/detail?id=${id}` });

const svg = (inner: string, size = 40) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:${size}rpx;height:${size}rpx;display:block">${inner}</svg>`;
const icSearch = svg('<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5 16 16"/>', 44);
const icBag = svg('<path d="M5.5 8h13l-1 12.5a1 1 0 0 1-1 .5h-9a1 1 0 0 1-1-.5z"/><path d="M9 10.5V6.8a3 3 0 0 1 6 0v3.7"/>', 44);
const icArrow = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:28rpx;height:28rpx;display:block"><path d="M4 12h15M13.5 6l6 6-6 6"/></svg>`;

const quick = [
  { k:'shopEyeglasses', icon: svg('<circle cx="7" cy="15" r="3.4"/><circle cx="17" cy="15" r="3.4"/><path d="M10.4 15h3.2M3.6 14.2 2 12.5M20.4 14.2 22 12.5"/>'),
    go: () => uni.reLaunch({ url:'/pages/frames/index' }) },
  { k:'uploadRx', icon: svg('<path d="M12 15.5V4M7.5 8.5 12 4l4.5 4.5M4.5 20h15"/>'),
    go: () => uni.navigateTo({ url:'/pages/prescription/upload' }) },
  { k:'virtualTryOn', icon: svg('<rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="12" cy="13" r="3.4"/><path d="M8.6 7l1.3-2.2h4.2L15.4 7"/>'),
    go: () => uni.navigateTo({ url:'/pages/tryon/index?frame=arashiyama' }) },
  { k:'fsa', icon: svg('<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 14.5h4"/>'),
    go: () => uni.showToast({ title:'FSA / HSA', icon:'none' }) },
];
</script>

<style lang="scss" scoped>
.home{background:$paper;min-height:100vh}
/* header */
.hdr{display:flex;align-items:center;justify-content:space-between;padding:16rpx $sp-3 14rpx;position:sticky;top:0;z-index:$z-nav;background:rgba($paper,.94);border-bottom:1rpx solid $line}
.brand{display:flex;flex-direction:column;align-items:center;gap:2rpx}
.des{font-size:15rpx;letter-spacing:.42em;color:$muted;font-weight:$fw-med;padding-left:.42em}
.hacts{display:flex;align-items:center;gap:18rpx}
.hbtn{position:relative;color:$night;padding:6rpx}
.cbadge{position:absolute;top:-4rpx;right:-6rpx;background:$vermillion;color:#fff;font-size:17rpx;font-weight:$fw-semi;min-width:30rpx;height:30rpx;border-radius:999rpx;display:flex;align-items:center;justify-content:center;padding:0 7rpx}
/* hero */
.hbody{padding-top:18rpx}
.hero{position:relative;border-radius:$r-lg;overflow:hidden;min-height:440rpx}
.himg{position:absolute;left:0;top:0;width:100%;height:100%}
.hwash{position:absolute;left:0;top:0;right:0;bottom:0;background:linear-gradient(180deg, rgba(250,247,242,.60) 0%, rgba(250,247,242,.86) 60%, $paper 100%)}
.hin{position:relative;display:flex;justify-content:space-between;padding:46rpx 36rpx 64rpx}
.hcopy{display:flex;flex-direction:column;max-width:66%}
.ta{font-family:$font-serif;font-size:54rpx;font-weight:600;color:$night;line-height:1.18}
.tb{font-family:$font-serif;font-size:54rpx;font-weight:400;color:$night;line-height:1.28}
.hsub{font-size:$fs-xs;color:$muted;margin-top:16rpx;line-height:1.7;white-space:pre-line}
.cta{margin-top:24rpx;align-self:flex-start;display:flex;align-items:center;gap:12rpx;background:$vermillion;color:#fff;border-radius:$r-pill;padding:18rpx 36rpx;font-size:$fs-sm;font-weight:$fw-semi;box-shadow:0 14rpx 30rpx -14rpx rgba(184,50,39,.6)}
.cta:active{transform:scale(.96)}
.arr{display:flex;align-items:center}
.hside{display:flex;flex-direction:column;align-items:center;gap:18rpx;padding-top:4rpx}
.stamp{font-family:$font-jp;font-size:22rpx;font-weight:600;color:$vermillion;border:2rpx solid $vermillion;border-radius:8rpx;padding:12rpx 7rpx;writing-mode:vertical-rl;letter-spacing:6rpx;line-height:1}
.motto{font-family:$font-serif;font-size:15rpx;letter-spacing:5rpx;color:$muted;writing-mode:vertical-rl}
.dots{position:absolute;left:0;right:0;bottom:24rpx;display:flex;justify-content:center;gap:10rpx}
.dot{width:10rpx;height:10rpx;border-radius:50%;background:rgba($night,.16)}
.dot.on{width:38rpx;border-radius:6rpx;background:$night}
/* sections */
.sec{margin-top:42rpx}
.sechd{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:18rpx}
.h2{font-family:$font-serif;font-size:36rpx;font-weight:600;color:$night}
.all{font-size:$fs-xs;color:$muted;font-weight:$fw-med}
/* quick services */
.qgrid{display:flex;gap:16rpx}
.qcard{flex:1;min-width:0;background:$card-warm;border:1rpx solid $line;border-radius:$r-md;padding:24rpx 8rpx;display:flex;flex-direction:column;align-items:center;gap:14rpx}
.qcard:active{transform:scale(.97)}
.qic{width:88rpx;height:88rpx;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;color:$night;box-shadow:$shadow-card}
.ql{font-size:20rpx;color:$night;font-weight:$fw-med;text-align:center;line-height:1.4}
/* product rows */
.hs{margin-right:-$sp-3}
.hsin{display:flex;gap:18rpx;padding:4rpx $sp-3 14rpx 2rpx}
.hcard{flex:0 0 310rpx;width:310rpx}
.ngrid{display:flex;flex-wrap:wrap;gap:18rpx}
.ncard{flex:1 1 40%;min-width:0}
</style>
