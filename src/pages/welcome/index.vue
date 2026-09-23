<template>
  <view class="welcome">
    <view class="art" v-html="bg"></view>
    <view class="lang"><LanguageSelector /></view>
    <view class="txt">
      <KyotoWordmark :height="22" />
      <text class="h1 title">{{ $t('welcome.title') }}</text>
      <text class="slogan">{{ $t('welcome.slogan') }}</text>
      <view class="acts">
        <KyotoButton variant="pink" @click="go('/pages/login/index')">{{ $t('welcome.start') }}</KyotoButton>
        <KyotoButton variant="ghost" @click="go('/pages/login/index')">{{ $t('welcome.login') }}</KyotoButton>
        <text class="skip" @click="skip">{{ $t('welcome.skip') }} →</text>
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
import KyotoWordmark from '@/components/KyotoWordmark.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import LanguageSelector from '@/components/LanguageSelector.vue';
import { BRAND } from '@/config/brand-colors';
const go = (url: string) => uni.navigateTo({ url });
const skip = () => uni.reLaunch({ url: '/pages/home/index' });
const bg = `<svg viewBox="0 0 390 420" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%"><rect width="390" height="420" fill="${BRAND.indigo}"/><path d="M240 420Q280 300 390 280V420Z" fill="${BRAND.gold}"/><circle cx="300" cy="140" r="76" fill="${BRAND.vermilion}"/><g fill="none" stroke="${BRAND.paper}" stroke-width="9"><circle cx="150" cy="256" r="56"/><circle cx="286" cy="256" r="56"/><path d="M206 248q11-16 24 0M94 248l-40-30M342 248l40-30"/></g><g fill="${BRAND.aqua}"><circle cx="60" cy="60" r="16"/><circle cx="100" cy="90" r="13"/><circle cx="50" cy="120" r="10"/></g><g fill="${BRAND.paper}"><circle cx="60" cy="60" r="5"/><circle cx="100" cy="90" r="4"/><circle cx="50" cy="120" r="3.5"/></g></svg>`;
</script>
<style lang="scss" scoped>
.welcome{min-height:100vh;min-height:100dvh;background:$paper;display:flex;flex-direction:column}
.art{height:46vh;min-height:480rpx}
.lang{position:fixed;top:calc(24rpx + env(safe-area-inset-top));right:$sp-3;z-index:5}
.txt{flex:1;display:flex;flex-direction:column;padding:44rpx $sp-4 calc(60rpx + #{$safe-b});gap:18rpx}
.title{margin-top:8rpx}
.slogan{font-size:$fs-xs;letter-spacing:.2em;color:$sunrise;font-weight:$fw-semi;margin-bottom:auto;line-height:1.7}
.acts{display:flex;flex-direction:column;gap:18rpx;margin-top:44rpx}
.skip{text-align:center;font-size:$fs-sm;color:$muted;padding:14rpx}
</style>
