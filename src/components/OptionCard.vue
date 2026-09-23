<template>
  <view class="oc" :class="{ on: selected, dim: disabled, big }" @click="!disabled && $emit('select')">
    <text v-if="badge" class="rec" :class="badgeStyle">{{ badge }}</text>
    <view class="ic" v-if="icon"><text>{{ icon }}</text></view>
    <view class="tx">
      <text class="ttl">{{ title }}<text v-if="labelText" class="lab"> · {{ labelText }}</text></text>
      <text class="sub" v-if="subtitle">{{ subtitle }}</text>
      <slot />
    </view>
    <text class="pr" v-if="priceText">{{ priceText }}</text>
  </view>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ title:string; subtitle?:string; labelText?:string; icon?:string; priceText?:string;
  selected?:boolean; disabled?:boolean; badge?:string; badgeStyle?:string; big?:boolean }>(), {});
defineEmits(['select']);
</script>
<style lang="scss" scoped>
.oc{display:flex;align-items:flex-start;gap:22rpx;padding:26rpx;border:3rpx solid $line;border-radius:$r-md;background:#fff;margin-bottom:18rpx;position:relative}
.oc.on{border-color:$accent;background:$tint-accent}
.oc.dim{opacity:.45}
.oc.big{border-width:4rpx;border-color:$accent;background:$tint-accent;box-shadow:0 20rpx 44rpx -28rpx rgba(228,61,48,.35)}
.ic{font-size:38rpx;width:64rpx;flex-shrink:0;text-align:center}
.tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:6rpx}
.ttl{font-size:$fs-md;font-weight:$fw-semi;line-height:1.35}
.lab{color:$accent-ink;font-weight:$fw-semi;font-size:$fs-xs}
.sub{font-size:$fs-sm;color:$muted;line-height:1.5}
.pr{font-size:$fs-sm;font-weight:$fw-semi;color:$sunrise;white-space:nowrap}
.rec{position:absolute;top:-16rpx;left:26rpx;background:$teal;color:#fff;font-size:18rpx;padding:4rpx 16rpx;border-radius:$r-pill;letter-spacing:.05em;font-weight:$fw-semi}
.rec.night{background:$night;left:auto;right:26rpx}
</style>
