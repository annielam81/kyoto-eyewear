<template>
  <view class="page-pad">
    <KyotoHeader back />
    <text class="h1" v-if="order">{{$t('order.number')}} #{{order.number}}</text>
    <text class="sub" style="display:block;margin:8rpx 0 24rpx" v-if="order">{{$t('order.status.'+order.status)}}</text>
    <view v-if="order">
      <text class="grp">{{$t('cart.subtotal')}}</text>
      <view class="sum">
        <view class="srow"><text class="sk">{{$t('cart.subtotal')}}</text><text class="sv">${{order.subtotal}}</text></view>
        <view class="srow"><text class="sk">{{$t('cart.shipping')}}</text><text class="sv">{{order.shipping===0?$t('cart.freeShipping'):'$'+order.shipping}}</text></view>
        <view class="srow"><text class="sk">{{$t('checkout.taxEst')}}</text><text class="sv">${{order.tax}}</text></view>
        <view class="srow tot"><text>{{$t('checkout.total')}}</text><text class="tv">${{order.total}}</text></view>
      </view>
    </view>
    <KyotoBottomNav active="account"/>
  </view>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import KyotoHeader from '@/components/KyotoHeader.vue';
import KyotoBottomNav from '@/components/KyotoBottomNav.vue';
import { OrderService } from '@/services/OrderService';
import type { Order } from '@/models';
const order = ref<Order|null>(null);
onLoad(async(opts:any)=>{ if(opts?.id) order.value=await OrderService.byId(opts.id)??null; });
</script>
<style lang="scss" scoped>
.sum{background:#fff;border:2rpx solid $line;border-radius:$r-md;padding:16rpx 24rpx}
.srow{display:flex;justify-content:space-between;padding:12rpx 0;border-bottom:2rpx solid $line;font-size:$fs-sm}
.srow:last-child{border:none}.sk{color:$muted}.sv{font-weight:$fw-semi}
.tot{font-weight:$fw-bold}.tv{font-size:$fs-md;font-weight:$fw-bold;color:$sunrise}
</style>
