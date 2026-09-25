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
defineProps<{ back?: boolean }>();
const goBack = () => uni.navigateBack({ fail: () => uni.switchTab?.({ url: '/pages/home/index' }) });
</script>
<style lang="scss" scoped>
.hdr{display:flex;align-items:center;justify-content:space-between;padding:$sp-2 $sp-3;position:sticky;top:0;z-index:$z-nav;background:rgba($paper,.94);backdrop-filter:blur(10px);border-bottom:1rpx solid $line}
.side{min-width:150rpx;display:flex;align-items:center}
.side.r{justify-content:flex-end}
.back{display:flex;align-items:center;gap:6rpx;color:$teal;font-size:$fs-sm;font-weight:$fw-semi}
.chev{font-size:$fs-lg;line-height:1}
</style>
