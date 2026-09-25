<template>
  <view class="ps">
    <view v-for="(r,i) in rows" :key="i" class="ln" :class="{ tot: r.total }">
      <text class="k">{{ r.label }}</text>
      <view class="vwrap">
        <text class="v">{{ r.value }}</text>
        <text v-if="r.sub" class="s">{{ r.sub }}</text>
      </view>
      <text v-if="r.editable" class="e" @click="$emit('edit', r.key)">{{ $t('common.edit') }}</text>
    </view>
  </view>
</template>
<script setup lang="ts">
export interface PriceRow { key?:string; label:string; value:string; sub?:string; editable?:boolean; total?:boolean }
defineProps<{ rows: PriceRow[] }>();
defineEmits(['edit']);
</script>
<style lang="scss" scoped>
/* 订单信息本身就是内容：白底 + 发丝线，装饰为零 */
.ps{background:$card;border:1rpx solid $line-strong;border-radius:$r-md;overflow:hidden}
.ln{display:flex;align-items:flex-start;gap:16rpx;padding:20rpx 24rpx;border-bottom:1rpx solid $line;font-size:$fs-sm}
.ln:last-child{border:none}
.k{color:$muted;min-width:150rpx;font-size:18rpx;letter-spacing:.06em;text-transform:uppercase;font-weight:$fw-semi;padding-top:3rpx}
.vwrap{flex:1;display:flex;flex-direction:column;align-items:flex-end;gap:2rpx;min-width:0}
.v{font-weight:$fw-med;text-align:right;line-height:1.5;word-break:break-word;color:$ink}
.s{font-size:18rpx;color:$muted;font-variant-numeric:tabular-nums}
.e{color:$accent-ink;font-weight:$fw-semi;font-size:17rpx;letter-spacing:.06em;text-transform:uppercase;padding-top:6rpx}
.tot{background:$mist;font-weight:$fw-semi}
.tot .k{color:$ink}
.tot .v{font-size:$fs-xl;font-weight:$fw-bold;color:$accent-ink;font-variant-numeric:tabular-nums}
</style>
