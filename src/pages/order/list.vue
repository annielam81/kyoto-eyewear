<template>
  <view class="page-pad">
    <KyotoHeader back />
    <text class="h1">{{$t('order.myOrders')}}</text>
    <EmptyState v-if="!orders.length" :text="$t('common.empty')" emoji="📦">
      <KyotoButton variant="pink" @click="goShop">{{$t('home.hero.cta')}}</KyotoButton>
    </EmptyState>
    <view v-for="o in orders" :key="o.orderId" class="ord" @click="openOrder(o.orderId)">
      <view class="ord-top"><text class="ord-n">#{{o.number}}</text><text :class="['ord-st',o.status]">{{$t('order.status.'+o.status)}}</text></view>
      <text class="ord-date">{{new Date(o.createdAt).toLocaleDateString()}}</text>
      <text class="ord-total">${{o.total}}</text>
    </view>
    <KyotoBottomNav active="account"/>
  </view>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import KyotoHeader from '@/components/KyotoHeader.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import EmptyState from '@/components/EmptyState.vue';
import KyotoBottomNav from '@/components/KyotoBottomNav.vue';
import { OrderService } from '@/services/OrderService';
import type { Order } from '@/models';
const orders = ref<Order[]>([]);
const goShop=()=>uni.reLaunch({url:'/pages/frames/index'});
const openOrder=(id:string)=>uni.navigateTo({url:`/pages/order/detail?id=${id}`});
onShow(async()=>{ orders.value=await OrderService.list(); });
</script>
<style lang="scss" scoped>
.ord{background:#fff;border:2rpx solid $line;border-radius:$r-md;padding:24rpx;margin-bottom:16rpx}
.ord-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8rpx}
.ord-n{font-size:$fs-sm;font-weight:$fw-semi}
.ord-st{font-size:$fs-xs;padding:6rpx 16rpx;border-radius:$r-pill;font-weight:$fw-semi}
.ord-st.received,.ord-st.rx_verification,.ord-st.lens_production,.ord-st.quality_check{background:$tint-gold;color:$night}
.ord-st.shipped,.ord-st.delivered{background:$tint-teal2;color:$teal}
.ord-st.rx_needed{background:$tint-sunrise;color:$sunrise}
.ord-date{display:block;font-size:$fs-xs;color:$muted}
.ord-total{display:block;font-size:$fs-md;font-weight:$fw-bold;color:$sunrise;margin-top:8rpx}
</style>
