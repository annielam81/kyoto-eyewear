<template>
  <view class="hdr">
    <view class="side l"><slot name="left">
      <view v-if="back" class="back" @click="goBack"><text class="chev">‹</text><text>{{ $t('common.back') }}</text></view>
    </slot></view>
    <KyotoWordmark :height="16" />
    <view class="side r"><slot name="right"><LanguageSelector compact /></slot></view>
  </view>
</template>
<script setup lang="ts">
import KyotoWordmark from './KyotoWordmark.vue';
import LanguageSelector from './LanguageSelector.vue';
import { goBack as navBack } from '@/utils/nav';
const props = withDefaults(defineProps<{ back?: boolean; fallback?: string }>(), { fallback: '/pages/home/index' });
const goBack = () => navBack(props.fallback);
</script>
<style lang="scss" scoped>
.hdr{display:flex;align-items:center;justify-content:space-between;padding:calc(#{$sp-2} + env(safe-area-inset-top)) $sp-3 $sp-2;position:sticky;top:0;z-index:$z-nav;background:rgba(255,245,230,.95);backdrop-filter:blur(10px)}
.side{min-width:150rpx;display:flex;align-items:center}
.side.r{justify-content:flex-end}
.back{display:flex;align-items:center;gap:6rpx;color:$teal;font-size:$fs-sm;font-weight:$fw-semi}
.chev{font-size:$fs-lg;line-height:1}
</style>
