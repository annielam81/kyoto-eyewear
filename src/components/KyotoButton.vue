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
/* 中等圆角，不用超大 pill；主 CTA = Vermilion，次级 = Indigo 描边 */
.kb{display:flex;align-items:center;justify-content:center;text-align:center;border-radius:$r-sm;font-weight:$fw-semi;transition:opacity $dur;min-height:84rpx;height:auto;padding:20rpx 24rpx;font-size:$fs-md;line-height:1.3;word-break:break-word;letter-spacing:.01em}
/* extra-long localized CTAs (e.g. es-US) get slightly smaller text instead of clipping */
.kb.long{font-size:$fs-sm;padding:20rpx 18rpx}
.kb.sm{min-height:64rpx;padding:14rpx 22rpx;font-size:$fs-sm;border-radius:$r-xs}
.night{background:$ink;color:$paper}
.pink{background:$accent-strong;color:$paper}
.gold{background:$gold;color:$ink}
.ghost{background:transparent;border:2rpx solid $ink;color:$ink}
.disabled{opacity:.4;pointer-events:none}
.kb:active{opacity:.85}
.spin{width:32rpx;height:32rpx;border:4rpx solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:sp 1s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
</style>
