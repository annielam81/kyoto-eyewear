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
.ps{background:#fff;border:2rpx solid $line;border-radius:$r-md;overflow:hidden}
.ln{display:flex;align-items:flex-start;gap:16rpx;padding:22rpx 26rpx;border-bottom:2rpx solid $line;font-size:$fs-sm}
.ln:last-child{border:none}
.k{color:$muted;min-width:150rpx}
.vwrap{flex:1;display:flex;flex-direction:column;align-items:flex-end;gap:2rpx;min-width:0}
.v{font-weight:$fw-med;text-align:right;line-height:1.5;word-break:break-word}
.s{font-size:$fs-xs;color:$muted}
.e{color:$teal;font-weight:$fw-semi;font-size:$fs-xs;padding-top:4rpx}
.tot{background:$mist;font-weight:$fw-semi}
.tot .v{font-size:$fs-xl;font-weight:$fw-bold;color:$sunrise}
</style>
