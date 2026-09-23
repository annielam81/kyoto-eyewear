<template>
  <view class="tl">
    <view v-for="(s,i) in steps" :key="s.k" class="tl-row">
      <view class="tl-rail">
        <view :class="['tl-dot',{done:s.done,cur:s.cur}]">
          <text v-if="s.done" class="tl-chk">✓</text>
        </view>
        <view v-if="i<steps.length-1" :class="['tl-line',{done:s.done}]"></view>
      </view>
      <view class="tl-body" :class="{active:s.done||s.cur}">
        <text class="tl-lbl">{{ $t('order.status.'+s.k) }}</text>
        <text v-if="s.cur&&note" class="tl-note">{{ note }}</text>
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import type { OrderStatus } from '@/models';
const props = defineProps<{ status: OrderStatus; note?: string }>();
const BASE: OrderStatus[] = ['received','rx_verification','lens_production','quality_check','shipped','delivered'];
const steps = computed(()=>{
  const all: OrderStatus[] = props.status==='rx_needed'
    ? ['received','rx_needed','rx_verification','lens_production','quality_check','shipped','delivered']
    : BASE;
  const idx = all.indexOf(props.status);
  return all.map((k,i)=>({ k, done:i<idx, cur:i===idx }));
});
</script>
<style lang="scss" scoped>
.tl{display:flex;flex-direction:column;background:#fff;border:2rpx solid $line;border-radius:$r-md;padding:26rpx 28rpx}
.tl-row{display:flex;gap:22rpx}
.tl-rail{display:flex;flex-direction:column;align-items:center;width:36rpx;flex-shrink:0}
.tl-dot{width:32rpx;height:32rpx;border-radius:50%;background:#fff;border:4rpx solid $line;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.tl-dot.done{background:$teal;border-color:$teal}
.tl-dot.cur{background:$accent;border-color:$accent;box-shadow:0 0 0 6rpx rgba(228,61,48,.18)}
.tl-chk{color:#fff;font-size:16rpx;font-weight:$fw-bold}
.tl-line{width:4rpx;flex:1;min-height:28rpx;background:$line;margin:4rpx 0}
.tl-line.done{background:$teal}
.tl-body{padding:2rpx 0 26rpx;flex:1;min-width:0}
.tl-row:last-child .tl-body{padding-bottom:2rpx}
.tl-lbl{font-size:$fs-sm;color:$muted}
.tl-body.active .tl-lbl{color:$night;font-weight:$fw-semi}
.tl-note{display:block;font-size:$fs-xs;color:$sunrise;margin-top:6rpx;line-height:1.5}
</style>
