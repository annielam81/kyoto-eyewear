<template>
  <view class="kb" :class="[variant, size, { disabled, loading }]" @click="!disabled && !loading && $emit('click')">
    <view v-if="loading" class="spin"></view>
    <slot v-else />
  </view>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'night'|'pink'|'ghost'|'gold'; size?: 'md'|'sm'; disabled?: boolean; loading?: boolean }>(),
  { variant:'night', size:'md' });
defineEmits(['click']);
</script>
<style lang="scss" scoped>
.kb{display:flex;align-items:center;justify-content:center;text-align:center;border-radius:28rpx;font-weight:$fw-semi;transition:opacity $dur;min-height:88rpx;height:auto;padding:22rpx 24rpx;font-size:$fs-md;line-height:1.3;word-break:break-word}
/* extra-long localized CTAs (e.g. es-US) get slightly smaller text instead of clipping */
.kb.long{font-size:$fs-sm;padding:20rpx 18rpx}
.kb.sm{min-height:64rpx;padding:14rpx 24rpx;font-size:$fs-sm;border-radius:20rpx}
.night{background:$night;color:#fff}
.pink{background:$sakura;color:#fff}
.gold{background:$gold;color:$night}
.ghost{background:#fff;border:3rpx solid $night;color:$night}
.disabled{opacity:.4;pointer-events:none}
.kb:active{opacity:.85}
.spin{width:32rpx;height:32rpx;border:4rpx solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:sp 1s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
</style>
