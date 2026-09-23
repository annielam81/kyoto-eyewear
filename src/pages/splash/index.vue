<template>
  <view class="splash">
    <view class="art" v-html="bg"></view>
    <view class="mark">
      <KyotoWordmark :height="40" color="${BRAND.paper}" />
      <text class="eb">{{ $t('splash.descriptor') }}</text>
    </view>
    <view class="prog"><view class="fill"></view></view>
  </view>
</template>
<script setup lang="ts">
import KyotoWordmark from '@/components/KyotoWordmark.vue';
import { BRAND } from '@/config/brand-colors';
const bg = `<svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%"><rect width="390" height="844" fill="${BRAND.indigo}"/><circle cx="270" cy="250" r="150" fill="${BRAND.vermilion}"/><path d="M0 560Q90 490 200 540T390 520V844H0Z" fill="${BRAND.aqua}"/><path d="M0 720Q200 640 390 700V844H0Z" fill="${BRAND.gold}"/><path d="M0 844L0 620Q60 560 140 600Q200 560 260 620L260 844Z" fill="${BRAND.ink}" opacity=".95"/><g fill="${BRAND.ink}"><rect x="116" y="300" width="6" height="24"/><path d="M90 324h58l-11-16H101z"/><rect x="104" y="324" width="30" height="22"/><path d="M80 368h78l-14-22H94z"/><rect x="100" y="368" width="38" height="26"/><path d="M68 420h102l-16-26H84z"/><rect x="96" y="420" width="46" height="30"/><path d="M56 478h126l-18-28H74z"/><rect x="90" y="478" width="58" height="44"/></g><path d="M140 600Q230 520 320 600" fill="none" stroke="${BRAND.ink}" stroke-width="14"/><g fill="${BRAND.paper}"><circle cx="40" cy="120" r="12"/><circle cx="80" cy="150" r="14"/><circle cx="60" cy="200" r="10"/></g><g fill="${BRAND.vermilion}"><circle cx="40" cy="120" r="4"/><circle cx="80" cy="150" r="4.5"/><circle cx="60" cy="200" r="3.5"/></g></svg>`;
// 本页已从正常启动流程中移除：Home 现在是 pages.json 的首页，App 启动直接渲染 Home。
// 这里原本有一个 setTimeout(..., 1800) 的人工停留，是真机上那一段可感知延迟的来源，已删除。
// 页面本体（品牌插画）保留下来供日后复用，但它不再属于任何流程，也不再自行跳转。
</script>
<style lang="scss" scoped>
.splash{position:fixed;top:0;left:0;right:0;bottom:0;background:$indigo}
.art{position:absolute;top:0;left:0;right:0;bottom:0}
.mark{position:absolute;left:0;right:0;top:42%;display:flex;flex-direction:column;align-items:center;gap:22rpx}
.eb{color:$paper;font-size:22rpx;letter-spacing:.52em;padding-left:.52em;font-weight:300}
.prog{position:absolute;bottom:160rpx;left:50%;transform:translateX(-50%);width:240rpx;height:8rpx;border-radius:$r-pill;background:rgba(255,255,255,.25);overflow:hidden}
.fill{height:100%;background:$gold;border-radius:$r-pill;animation:load 1.6s ease-in-out infinite alternate}
@keyframes load{from{width:20%}to{width:92%}}
</style>
