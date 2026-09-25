<template>
  <view class="page-pad">
    <KyotoHeader back />
    <text class="h1">{{$t('order.myOrders')}}</text>
    <EmptyState v-if="!orders.length" :text="$t('common.empty')" emoji="📦">
      <KyotoButton variant="pink" @click="goShop">{{$t('home.hero.cta')}}</KyotoButton>
    </EmptyState>
    <view v-for="o in orders" :key="o.orderId" class="ord" @click="openOrder(o.orderId)">
      <view class="ord-top"><text class="ord-n">#{{o.number}}</text>
        <text :class="['ord-st',o.status]">{{$t('order.status.'+o.status)}}</text></view>
      <text class="ord-date">{{new Date(o.createdAt).toLocaleDateString()}} · {{primary(o)}}</text>
      <view v-if="o.status==='rx_needed'" class="ord-warn">⚠ {{$t('c3.orders.attention')}}</view>
      <view class="ord-bot">
        <text class="ord-total">{{money(o.total)}}</text>
        <view class="ord-ctas">
          <text v-if="['shipped','lens_production','quality_check'].includes(o.status)" class="oc" @click.stop="openOrder(o.orderId)">{{$t('c3.orders.track')}}</text>
          <text class="oc pink" @click.stop="reorder(o)">{{$t('c3.orders.reorder')}}</text>
        </view>
      </view>
    </view>
    <KyotoBottomNav active="account"/>
  </view>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { onShow } from '@dcloudio/uni-app';
import KyotoHeader from '@/components/KyotoHeader.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import EmptyState from '@/components/EmptyState.vue';
import KyotoBottomNav from '@/components/KyotoBottomNav.vue';
import { OrderService } from '@/services/OrderService';
import { useProductStore } from '@/stores/product';
import { reorderToCart } from '@/services/ReorderService';
import { money } from '@/utils/format';
import type { Order, Locale } from '@/models';
const { locale, t } = useI18n();
const loc = computed(()=>locale.value as Locale);
const products = useProductStore();
const orders = ref<Order[]>([]);
onShow(async()=>{ await products.ensure(); orders.value=await OrderService.list(); });
const primary=(o:Order)=>{ const f=products.byId(o.items[0]?.frameId); const extra=o.items.length>1?` +${o.items.length-1}`:''; return (f?.name[loc.value]??'')+extra; };
const goShop=()=>uni.reLaunch({url:'/pages/frames/index'});
const openOrder=(id:string)=>uni.navigateTo({url:`/pages/order/detail?id=${id}`});
async function reorder(o:Order){
  const res=reorderToCart(o);
  uni.showToast({title:res.rxExpired?t('c3.reorder.rxExpired'):t('c3.reorder.done'),icon:'none',duration:res.rxExpired?3200:1600});
  setTimeout(()=>uni.navigateTo({url:'/pages/cart/index'}), res.rxExpired?1200:600);
}
</script>
<style lang="scss" scoped>
.ord{background:$card;border:1rpx solid $line;border-radius:$r-md;padding:22rpx;margin-bottom:14rpx}
.ord-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8rpx;gap:12rpx}
.ord-n{font-size:$fs-sm;font-weight:$fw-semi;color:$ink}
/* 状态改成细边标签：一眼可读但不用大色块 */
.ord-st{font-size:16rpx;letter-spacing:.08em;text-transform:uppercase;padding:5rpx 12rpx;border-radius:$r-xs;font-weight:$fw-semi;text-align:center;line-height:1.3;border:1rpx solid}
.ord-st.received,.ord-st.rx_verification,.ord-st.lens_production,.ord-st.quality_check{background:transparent;border-color:$line-strong;color:$muted}
.ord-st.shipped,.ord-st.delivered{background:transparent;border-color:$teal;color:$teal}
.ord-st.rx_needed{background:transparent;border-color:$sunrise;color:$sunrise}
.ord-date{display:block;font-size:18rpx;color:$muted;font-variant-numeric:tabular-nums}
.ord-warn{font-size:$fs-xs;color:$sunrise;font-weight:$fw-med;margin-top:8rpx}
.ord-bot{display:flex;justify-content:space-between;align-items:center;margin-top:12rpx;gap:12rpx;flex-wrap:wrap}
.ord-total{font-size:$fs-md;font-weight:$fw-bold;color:$accent-ink;font-variant-numeric:tabular-nums}
.ord-ctas{display:flex;gap:10rpx;flex-wrap:wrap}
.oc{border:1rpx solid $line-strong;border-radius:$r-xs;padding:9rpx 18rpx;font-size:$fs-xs;font-weight:$fw-semi;background:transparent;color:$ink}
.oc.pink{background:$accent-strong;border-color:$accent-strong;color:$paper}
</style>
