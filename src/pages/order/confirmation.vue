<template>
  <view class="page-pad conf">
    <view class="top"><KyotoWordmark :height="19"/></view>
    <view class="art" v-html="art"></view>
    <text class="h1" style="text-align:center;margin-top:24rpx">{{$t('order.confirmTitle')}}</text>
    <text class="num">{{$t('order.number')}} {{order?.number}} · {{orderDate}}</text>
    <text class="sub next" v-if="order">{{ order.status==='rx_needed' ? $t('c3.confirm.nextRx') : $t('c3.confirm.nextVerify') }}</text>

    <OrderTimeline v-if="order" :status="order.status" :note="order.status==='rx_needed'?$t('order.rxNeededNote'):''" style="text-align:left;margin:26rpx 0"/>

    <view v-if="order" class="blocks">
      <view class="blk">
        <text class="bt">{{$t('c3.confirm.items')}}</text>
        <view v-for="it in order.items" :key="it.cartItemId" class="itline">
          <text class="it-n">{{frameName(it.frameId)}} · {{it.colorKey}} · {{it.sizeKey}} ×{{it.quantity}}</text>
          <text v-if="it.config" class="it-c">{{cfgSummary(it)}}</text>
          <text class="it-p">{{money(it.subtotal*it.quantity)}}</text>
        </view>
      </view>
      <view class="blk">
        <text class="bt">{{$t('c3.addr.title')}}</text>
        <text class="bl">{{order.shippingAddress.firstName}} {{order.shippingAddress.lastName}}</text>
        <text class="bl">{{order.shippingAddress.line1}}<template v-if="order.shippingAddress.line2">, {{order.shippingAddress.line2}}</template></text>
        <text class="bl">{{order.shippingAddress.city}}, {{order.shippingAddress.stateCode}} {{order.shippingAddress.zip}}</text>
      </view>
      <view class="blk row2">
        <view><text class="bt">{{$t('c3.confirm.paidWith')}}</text><text class="bl">{{$t('checkout.'+order.paymentMethod)}}</text></view>
        <view><text class="bt">{{$t('c3.sum.total')}}</text><text class="bl tot">{{money(order.total)}}</text></view>
      </view>
    </view>

    <KyotoButton v-if="order?.status==='rx_needed'" variant="gold" style="margin-bottom:14rpx" @click="goUpload">{{$t('c3.confirm.uploadRx')}}</KyotoButton>
    <KyotoButton variant="pink" @click="goOrder">{{$t('c3.confirm.viewOrder')}}</KyotoButton>
    <KyotoButton variant="ghost" style="margin-top:14rpx" @click="goHome">{{$t('c3.confirm.continueShopping')}}</KyotoButton>
  </view>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { onLoad } from '@dcloudio/uni-app';
import KyotoWordmark from '@/components/KyotoWordmark.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import OrderTimeline from '@/components/OrderTimeline.vue';
import { OrderService } from '@/services/OrderService';
import { useProductStore } from '@/stores/product';
import { LENS_MATERIALS } from '@/config/lens-materials.config';
import { money } from '@/utils/format';
import type { Order, CartItem, Locale } from '@/models';
const { locale, t } = useI18n();
const loc = computed(()=>locale.value as Locale);
const products = useProductStore();
const order = ref<Order|null>(null);
const orderDate = computed(()=>order.value?new Date(order.value.createdAt).toLocaleDateString():'');
onLoad(async(opts:any)=>{ await products.ensure(); if(opts?.id) order.value=await OrderService.byId(opts.id)??null; });
const frameName=(id:string)=>products.byId(id)?.name[loc.value]??id;
const cfgSummary=(it:CartItem)=>{
  const parts:string[]=[];
  if(it.config?.type) parts.push(t('wizard.s2.'+it.config.type));
  const m=LENS_MATERIALS.find(x=>x.id===it.config?.materialId); if(m) parts.push(m.name[loc.value]);
  const rxKey=it.config?.prescriptionMethod==='later'?'needed':'received';
  parts.push(t('c3.rxs.'+rxKey));
  return parts.join(' · ');
};
const goUpload=()=>uni.navigateTo({url:'/pages/prescription/upload'});
const goOrder=()=>uni.navigateTo({url:`/pages/order/detail?id=${order.value?.orderId}`});
const goHome=()=>uni.reLaunch({url:'/pages/home/index'});
const art = `<svg viewBox="0 0 300 150" style="width:100%;height:auto;max-width:460rpx;margin:0 auto;display:block"><circle cx="150" cy="75" r="62" fill="#FDE2EB"/><g fill="none" stroke="#0D1B2A" stroke-width="6"><circle cx="118" cy="75" r="28"/><circle cx="182" cy="75" r="28"/><path d="M146 72q4-9 8 0M90 74l-26-15M210 74l26-15"/></g><path d="M134 98q16 11 32 0" stroke="#0D1B2A" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`;
</script>
<style lang="scss" scoped>
.conf{text-align:center;padding-bottom:220rpx}
.top{display:flex;justify-content:center;padding:20rpx 0 8rpx}
.num{display:block;text-align:center;font-size:$fs-xs;color:$muted;letter-spacing:.1em;margin-top:8rpx}
.next{display:block;text-align:center;margin:14rpx auto 0;max-width:560rpx}
.blocks{text-align:left;display:flex;flex-direction:column;gap:16rpx;margin-bottom:28rpx}
.blk{background:#fff;border:2rpx solid $line;border-radius:$r-md;padding:24rpx}
.blk.row2{display:grid;grid-template-columns:1fr 1fr;gap:14rpx}
.bt{display:block;font-size:$fs-xs;color:$muted;letter-spacing:.1em;text-transform:uppercase;font-weight:$fw-semi;margin-bottom:8rpx}
.bl{display:block;font-size:$fs-sm;line-height:1.6}
.bl.tot{font-weight:$fw-bold;color:$sunrise;font-size:$fs-lg}
.itline{border-bottom:2rpx solid $line;padding:12rpx 0}
.itline:last-child{border:none}
.it-n{display:block;font-size:$fs-sm;font-weight:$fw-semi}
.it-c{display:block;font-size:$fs-xs;color:$muted;margin-top:4rpx;line-height:1.5}
.it-p{display:block;font-size:$fs-sm;font-weight:$fw-bold;color:$sunrise;margin-top:4rpx}
</style>
