<template>
  <view class="oc" :class="{ on: selected, dim: disabled, big }" @click="!disabled && $emit('select')">
    <text v-if="badge" class="rec" :class="badgeStyle">{{ badge }}</text>
    <view class="ic" v-if="icon"><text>{{ icon }}</text></view>
    <view class="tx">
      <view class="r1">
        <text class="ttl">{{ title }}<text v-if="labelText" class="lab"> · {{ labelText }}</text></text>
        <text class="pr" v-if="priceText">{{ priceText }}</text>
      </view>
      <text class="sub" v-if="subtitle">{{ subtitle }}</text>
      <slot />
    </view>
    <!-- 母版 05 的右侧单选点：未选是空心细圈，选中才填 Vermilion -->
    <view class="rd" :class="{ on: selected }"></view>
  </view>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ title:string; subtitle?:string; labelText?:string; icon?:string; priceText?:string;
  selected?:boolean; disabled?:boolean; badge?:string; badgeStyle?:string; big?:boolean }>(), {});
defineEmits(['select']);
</script>
<style lang="scss" scoped>
/* 母版 05：统一 white surface + 发丝线 + 轻阴影；选中态用 Vermilion 边框与单选点。
 * 不靠彩底区分选项 —— 任何加价项都必须客户主动点选才会计入订单。 */
.oc{display:flex;align-items:flex-start;gap:16rpx;padding:22rpx;border:1rpx solid $line;
  border-radius:$r-md;background:$card;margin-bottom:14rpx;position:relative;box-shadow:$shadow-soft}
.oc.on{border-color:$accent;border-width:2rpx;padding:21rpx}
.oc.dim{opacity:.45}
.oc.big{border-width:2rpx;border-color:$accent;padding:21rpx}
.ic{font-size:30rpx;width:48rpx;flex-shrink:0;text-align:center;color:$ink;padding-top:2rpx}
.tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:6rpx}
.r1{display:flex;align-items:baseline;justify-content:space-between;gap:14rpx}
.ttl{font-size:$fs-sm;font-weight:$fw-semi;line-height:1.35;color:$ink;min-width:0}
.lab{color:$muted;font-weight:$fw-med;font-size:18rpx;letter-spacing:.05em;text-transform:uppercase}
.sub{font-size:18rpx;color:$muted;line-height:1.5}
.pr{font-size:$fs-sm;font-weight:$fw-semi;color:$ink;white-space:nowrap;font-variant-numeric:tabular-nums}
.rd{width:34rpx;height:34rpx;border-radius:50%;border:2rpx solid $line-strong;flex-shrink:0;
  margin-top:4rpx;background:$card;transition:border-color $dur}
.rd.on{border-color:$accent-strong;
  background:radial-gradient($accent-strong 46%, $card 50%)}
/* Recommended 徽标：小、方、Vermilion —— 只是信息，不代表已选 */
.rec{position:absolute;top:-12rpx;left:20rpx;background:$accent-strong;color:#fff;font-size:15rpx;
  padding:3rpx 11rpx;border-radius:$r-xs;letter-spacing:.07em;text-transform:uppercase;font-weight:$fw-semi}
.rec.night{background:$ink;left:auto;right:20rpx}
</style>
