<template>
  <view class="wp">
    <view class="top">
      <view class="back" @click="$emit('back')"><text class="chev">‹</text><text>{{ $t('common.back') }}</text></view>
      <KyotoWordmark :height="13" color="rgba(13,27,42,.55)" />
      <text class="step">{{ $t('wizard.step') }} {{ step }} / {{ total }}</text>
    </view>
    <view class="bar"><view v-for="i in total" :key="i" class="seg" :class="{ on: i===step, done: i<step }"></view></view>
  </view>
</template>
<script setup lang="ts">
import KyotoWordmark from './KyotoWordmark.vue';
withDefaults(defineProps<{ step: number; total?: number }>(), { total: 6 });
defineEmits(['back']);
</script>
<style lang="scss" scoped>
.top{display:flex;align-items:center;justify-content:space-between;padding:10rpx 0}
.back{display:flex;align-items:center;gap:6rpx;color:$teal;font-size:$fs-sm;font-weight:$fw-semi}
.chev{font-size:$fs-lg;line-height:1}
.step{font-size:$fs-xs;color:$muted;font-weight:$fw-semi;letter-spacing:.08em}
.bar{display:flex;gap:10rpx;margin:16rpx 0 30rpx}
.seg{flex:1;height:8rpx;border-radius:$r-pill;background:$line}
.seg.on{background:$sakura}.seg.done{background:$sakura;opacity:.4}
</style>
