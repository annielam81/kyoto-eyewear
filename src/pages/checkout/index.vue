<template>
  <view class="page-pad">
    <KyotoHeader back />
    <text class="h1">{{$t('checkout.title')}}</text>
    <text class="grp">{{$t('checkout.shippingAddress')}}</text>
    <view class="fields">
      <input class="inp" :placeholder="$t('checkout.name')" v-model="addr.name"/>
      <input class="inp" :placeholder="$t('checkout.street')" v-model="addr.street"/>
      <view style="display:grid;grid-template-columns:1fr 1fr;gap:14rpx">
        <input class="inp" :placeholder="$t('checkout.city')" v-model="addr.city"/>
        <input class="inp" :placeholder="$t('checkout.state')" v-model="addr.state"/>
      </view>
      <input class="inp" :placeholder="$t('checkout.zip')" v-model="addr.zip"/>
    </view>
    <text class="grp">{{$t('checkout.payment')}}</text>
    <view class="pay-methods">
      <view v-for="m in methods" :key="m.k" :class="['pm',{on:payMethod===m.k}]" @click="payMethod=m.k">
        <text class="pmic">{{m.ic}}</text>
        <text class="pmn">{{$t('checkout.'+m.k)}}</text>
        <text v-if="m.fsa" class="fsa-tag">{{$t('checkout.fsaEligible')}}</text>
      </view>
    </view>
    <text class="grp">{{$t('common.seeAll')}}</text>
    <view class="order-sum">
      <view class="srow"><text class="sk">{{$t('cart.subtotal')}}</text><text class="sv">${{cart.subtotal}}</text></view>
      <view class="srow"><text class="sk">{{$t('cart.shipping')}}</text><text class="sv">{{cart.shipping===0?$t('cart.freeShipping'):'$'+cart.shipping}}</text></view>
      <view class="srow"><text class="sk">{{$t('checkout.taxEst')}}</text><text class="sv">${{tax}}</text></view>
      <view class="srow tot"><text>{{$t('checkout.total')}}</text><text class="tot-v">${{cart.subtotal+cart.shipping+tax}}</text></view>
    </view>
    <view class="sticky-cta">
      <KyotoButton variant="pink" :loading="busy" :disabled="!canPlace" @click="place">{{$t('checkout.placeOrder')}}</KyotoButton>
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import KyotoHeader from '@/components/KyotoHeader.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import { useCartStore } from '@/stores/cart';
import { useOrderStore } from '@/stores/order';
import { TaxService } from '@/services/TaxService';
import { OrderService } from '@/services/OrderService';
import { PaymentService } from '@/services/PaymentService';
import type { Address } from '@/models';
const cart = useCartStore(); const orderStore = useOrderStore();
const addr = ref<Address>({name:'',street:'',city:'',state:'CA',zip:''});
const payMethod = ref('apple'); const busy = ref(false); const tax = ref(0);
const methods = [{k:'applePay',ic:'',fsa:false},{k:'card',ic:'💳',fsa:false},{k:'fsa',ic:'🏥',fsa:true}];
const canPlace = computed(()=>!!addr.value.name&&!!addr.value.street&&!!addr.value.city&&!!addr.value.zip);
async function refreshTax(){ tax.value=await TaxService.estimate(cart.subtotal,addr.value); }
onMounted(refreshTax);
watch(()=>addr.value.state, refreshTax);   // tax follows shipping state (mock)
async function place(){
  if(!canPlace.value) return;
  busy.value=true;
  await PaymentService.pay(payMethod.value as any, cart.subtotal+cart.shipping+tax.value);
  const order = await OrderService.place([...cart.items],{subtotal:cart.subtotal,shipping:cart.shipping,tax:tax.value},payMethod.value,addr.value,cart.rxNeeded);
  orderStore.lastOrderId=order.orderId;
  cart.clear();
  busy.value=false;
  uni.reLaunch({url:`/pages/order/confirmation?id=${order.orderId}`});
}
</script>
<style lang="scss" scoped>
.fields{display:flex;flex-direction:column;gap:14rpx;margin-bottom:10rpx}
.inp{background:#fff;border:3rpx solid $line;border-radius:$r-sm;padding:26rpx;font-size:$fs-md;min-height:88rpx;box-sizing:border-box;width:100%}
.pay-methods{display:flex;flex-direction:column;gap:14rpx;margin-bottom:10rpx}
.pm{display:flex;align-items:center;gap:18rpx;padding:24rpx;border:3rpx solid $line;border-radius:$r-md;background:#fff}
.pm.on{border-color:$sakura;background:#FFF0F5}
.pmic{font-size:36rpx;width:52rpx;text-align:center}
.pmn{flex:1;font-size:$fs-sm;font-weight:$fw-semi}
.fsa-tag{background:$tint-teal2;color:$teal;font-size:18rpx;padding:4rpx 14rpx;border-radius:$r-pill;font-weight:$fw-semi}
.order-sum{background:#fff;border:2rpx solid $line;border-radius:$r-md;padding:20rpx 26rpx}
.srow{display:flex;justify-content:space-between;padding:14rpx 0;border-bottom:2rpx solid $line;font-size:$fs-sm}
.srow:last-child{border:none}
.sk{color:$muted}.sv{font-weight:$fw-semi}
.tot{font-weight:$fw-bold}
.tot-v{font-size:$fs-lg;font-weight:$fw-bold;color:$sunrise}
</style>
