<template>
  <view class="page-pad conf">
    <view class="top"><KyotoWordmark :height="19"/></view>
    <view class="art" v-html="art"></view>
    <text class="h1" style="text-align:center;margin-top:32rpx">{{$t('order.confirmTitle')}}</text>
    <text class="num">{{$t('order.number')}} {{order?.number}}</text>
    <text class="sub" style="text-align:center;margin:12rpx 0 36rpx">{{$t('order.confirmBody')}}</text>
    <view class="status-track">
      <view v-for="(s,i) in statuses" :key="s.k" class="st">
        <view :class="['st-dot',{done:s.done,cur:s.cur}]"></view>
        <text :class="['st-lbl',{active:s.done||s.cur}]">{{$t('order.status.'+s.k)}}</text>
        <view v-if="i<statuses.length-1" class="st-line"></view>
      </view>
    </view>
    <view v-if="order?.status==='rx_needed'" class="rx-warn-box">
      <text>⚠ {{$t('order.rxNeededNote')}}</text>
    </view>
    <KyotoButton variant="pink" @click="goHome">{{$t('order.backHome')}}</KyotoButton>
    <KyotoButton variant="ghost" style="margin-top:14rpx" @click="goOrders">{{$t('order.myOrders')}}</KyotoButton>
  </view>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import KyotoWordmark from '@/components/KyotoWordmark.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import { OrderService } from '@/services/OrderService';
import type { Order } from '@/models';
const order = ref<Order|null>(null);
const goHome=()=>uni.reLaunch({url:'/pages/home/index'});
const goOrders=()=>uni.navigateTo({url:'/pages/order/list'});
const base = ['received','rx_verification','lens_production','quality_check','shipped','delivered'];
const statuses = computed(()=>{
  const cur = order.value?.status ?? 'received';
  // insert rx_needed into the track when the order is waiting for a prescription
  const all = cur === 'rx_needed' ? ['received','rx_needed','rx_verification','lens_production','quality_check','shipped','delivered'] : base;
  const idx = all.indexOf(cur);
  return all.map((k,i)=>({k,done:i<idx,cur:i===idx}));
});
onLoad(async(opts:any)=>{ if(opts?.id) order.value=await OrderService.byId(opts.id)??null; });
const art = `<svg viewBox="0 0 300 200" style="width:100%;height:auto"><circle cx="150" cy="100" r="80" fill="#FDE2EB"/><g fill="none" stroke="#0D1B2A" stroke-width="7"><circle cx="110" cy="100" r="36"/><circle cx="190" cy="100" r="36"/><path d="M146 96q9-14 18 0M74 98l-34-20M226 98l34-20"/></g><circle cx="150" cy="100" r="6" fill="#FF4F8B"/><path d="M130 130q20 14 40 0" stroke="#0D1B2A" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`;
</script>
<style lang="scss" scoped>
.conf{text-align:center;padding-bottom:200rpx}
.top{display:flex;justify-content:center;padding:20rpx 0 10rpx}
.art{max-width:560rpx;margin:0 auto}
.num{display:block;text-align:center;font-size:$fs-xs;color:$muted;letter-spacing:.14em;margin-top:10rpx}
.status-track{display:flex;align-items:flex-start;justify-content:center;gap:0;margin:30rpx 0 24rpx;overflow-x:auto;padding-bottom:10rpx}
.st{display:flex;flex-direction:column;align-items:center;gap:8rpx;min-width:120rpx;position:relative}
.st-dot{width:24rpx;height:24rpx;border-radius:50%;background:$line;border:4rpx solid #fff;box-shadow:0 0 0 3rpx $line}
.st-dot.done{background:$teal;box-shadow:0 0 0 3rpx $teal}
.st-dot.cur{background:$sakura;box-shadow:0 0 0 3rpx $sakura}
.st-lbl{font-size:18rpx;color:$muted;text-align:center;line-height:1.3;padding:0 6rpx}
.st-lbl.active{color:$night;font-weight:$fw-semi}
.st-line{position:absolute;top:12rpx;left:50%;width:100%;height:4rpx;background:$line;z-index:-1}
.rx-warn-box{background:#FFF1EB;border:2rpx solid $sunrise;border-radius:$r-sm;padding:20rpx;font-size:$fs-xs;color:$sunrise;margin-bottom:24rpx;text-align:left;line-height:1.6}
</style>
