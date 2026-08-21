<template>
  <view class="page-pad">
    <KyotoHeader back />
    <template v-if="order">
      <text class="h1">{{$t('order.number')}} #{{order.number}}</text>
      <text class="sub" style="display:block;margin:6rpx 0 20rpx">{{new Date(order.createdAt).toLocaleDateString()}}</text>
      <OrderTimeline :status="order.status" :note="order.status==='rx_needed'?$t('order.rxNeededNote'):''" style="margin-bottom:20rpx"/>

      <text class="grp">{{$t('c3.confirm.items')}}</text>
      <view v-for="it in order.items" :key="it.cartItemId" class="cfg">
        <view :class="['cfg-art',frameOf(it)?.tint]">
          <FrameArt v-if="frameOf(it)" :art="frameOf(it)!.art" :hex="colorHex(it)" style="height:120rpx"/>
        </view>
        <view class="cfg-tx">
          <text class="cfg-n">{{frameOf(it)?.name[loc]}} ×{{it.quantity}}</text>
          <text class="cfg-l">{{$t('wizard.s6.color')}}: {{it.colorKey}} · {{$t('wizard.s6.size')}}: {{it.sizeKey}}</text>
          <template v-if="it.config">
            <text v-if="it.config.type" class="cfg-l">{{$t('c3.sum.lensType')}}: {{$t('wizard.s2.'+it.config.type)}}</text>
            <text v-if="matOf(it)" class="cfg-l">{{$t('c3.sum.lensMaterial')}}: {{matOf(it)!.name[loc]}}</text>
            <text v-if="treatNames(it)" class="cfg-l">{{$t('c3.sum.treatments')}}: {{treatNames(it)}}</text>
            <text class="cfg-l rx">{{$t('c3.sum.rxStatus')}}: {{$t('c3.rxs.'+rxKey(it))}}</text>
          </template>
        </view>
      </view>

      <text class="grp">{{$t('c3.addr.title')}} · {{$t('c3.ship.title')}}</text>
      <view class="blk">
        <text class="bl">{{order.shippingAddress.firstName}} {{order.shippingAddress.lastName}} · {{order.shippingAddress.phone}}</text>
        <text class="bl">{{order.shippingAddress.line1}}<template v-if="order.shippingAddress.line2">, {{order.shippingAddress.line2}}</template></text>
        <text class="bl">{{order.shippingAddress.city}}, {{order.shippingAddress.stateCode}} {{order.shippingAddress.zip}}</text>
        <text class="bl ship">{{shipName}} · {{$t('c3.ship.eta',{a:eta[0],b:eta[1]})}}</text>
      </view>

      <text class="grp">{{$t('c3.sum.title')}}</text>
      <view class="sum">
        <view class="srow"><text class="sk">{{$t('cart.subtotal')}}</text><text class="sv">{{money(order.subtotal)}}</text></view>
        <view class="srow"><text class="sk">{{$t('c3.sum.shipping')}}</text><text class="sv">{{order.shipping===0?$t('cart.freeShipping'):money(order.shipping)}}</text></view>
        <view class="srow"><text class="sk">{{$t('c3.sum.tax')}}</text><text class="sv">{{money(order.tax)}}</text></view>
        <view class="srow"><text class="sk">{{$t('c3.confirm.paidWith')}}</text><text class="sv">{{$t('checkout.'+order.paymentMethod)}}</text></view>
        <view class="srow tot"><text>{{$t('c3.sum.total')}}</text><text class="tv">{{money(order.total)}}</text></view>
      </view>

      <KyotoButton variant="pink" style="margin-top:24rpx" @click="doReorder">{{$t('c3.orders.reorder')}}</KyotoButton>
      <text class="grp">{{$t('c3.orders.supportTitle')}}</text>
      <view class="support">
        <text class="sp" @click="toast">{{$t('c3.orders.contact')}}</text>
        <text class="sp" @click="toast">{{$t('c3.orders.return')}}</text>
      </view>
    </template>
    <KyotoBottomNav active="account"/>
  </view>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { onLoad } from '@dcloudio/uni-app';
import KyotoHeader from '@/components/KyotoHeader.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import KyotoBottomNav from '@/components/KyotoBottomNav.vue';
import OrderTimeline from '@/components/OrderTimeline.vue';
import FrameArt from '@/components/FrameArt.vue';
import { OrderService } from '@/services/OrderService';
import { useProductStore } from '@/stores/product';
import { reorderToCart } from '@/services/ReorderService';
import { LENS_MATERIALS } from '@/config/lens-materials.config';
import { TREATMENTS } from '@/config/treatments.config';
import { SHIPPING_METHODS } from '@/config/shipping-methods.config';
import { money } from '@/utils/format';
import type { Order, CartItem, Locale } from '@/models';
const { locale, t } = useI18n();
const loc = computed(()=>locale.value as Locale);
const products = useProductStore();
const order = ref<Order|null>(null);
onLoad(async(opts:any)=>{ await products.ensure(); if(opts?.id) order.value=await OrderService.byId(opts.id)??null; });
const frameOf=(it:CartItem)=>products.byId(it.frameId);
const colorHex=(it:CartItem)=>frameOf(it)?.colors.find(c=>c.key===it.colorKey)?.hex??'#0D1B2A';
const matOf=(it:CartItem)=>LENS_MATERIALS.find(m=>m.id===it.config?.materialId);
const treatNames=(it:CartItem)=>TREATMENTS.filter(x=>it.config?.treatmentIds.includes(x.id)).map(x=>x.name[loc.value]).join(', ');
const rxKey=(it:CartItem)=>it.config?.prescriptionMethod==='later'?'needed':it.config?.prescriptionMethod==='saved'?'verified':'received';
const shipName=computed(()=>SHIPPING_METHODS.find(m=>m.id===order.value?.shippingMethodId)?.name[loc.value]??'');
const eta=computed<[number,number]>(()=>SHIPPING_METHODS.find(m=>m.id===order.value?.shippingMethodId)?.etaDays??[5,8]);
function doReorder(){ if(!order.value) return; const r=reorderToCart(order.value);
  uni.showToast({title:r.rxExpired?t('c3.reorder.rxExpired'):t('c3.reorder.done'),icon:'none',duration:r.rxExpired?3200:1600});
  setTimeout(()=>uni.navigateTo({url:'/pages/cart/index'}), r.rxExpired?1200:600); }
const toast=()=>uni.showToast({title:'Mock',icon:'none'});
</script>
<style lang="scss" scoped>
.cfg{display:flex;gap:18rpx;background:#fff;border:2rpx solid $line;border-radius:$r-md;overflow:hidden;margin-bottom:14rpx}
.cfg-art{width:180rpx;flex-shrink:0;display:flex;align-items:center}
.cfg-tx{flex:1;padding:20rpx 20rpx 20rpx 0;min-width:0}
.cfg-n{display:block;font-size:$fs-sm;font-weight:$fw-semi;margin-bottom:6rpx}
.cfg-l{display:block;font-size:$fs-xs;color:$muted;line-height:1.6}
.cfg-l.rx{color:$teal;font-weight:$fw-med}
.blk{background:#fff;border:2rpx solid $line;border-radius:$r-md;padding:22rpx}
.bl{display:block;font-size:$fs-sm;line-height:1.7}
.bl.ship{color:$teal;font-weight:$fw-med;margin-top:6rpx}
.sum{background:#fff;border:2rpx solid $line;border-radius:$r-md;padding:14rpx 24rpx}
.srow{display:flex;justify-content:space-between;padding:12rpx 0;border-bottom:2rpx solid $line;font-size:$fs-sm}
.srow:last-child{border:none}.sk{color:$muted}.sv{font-weight:$fw-semi}
.tot{font-weight:$fw-bold}.tv{font-size:$fs-md;font-weight:$fw-bold;color:$sunrise}
.support{display:flex;gap:14rpx}
.sp{flex:1;text-align:center;border:2rpx solid $line;border-radius:$r-sm;padding:22rpx;font-size:$fs-xs;font-weight:$fw-semi;background:#fff}
</style>
