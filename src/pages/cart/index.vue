<template>
  <view class="page-pad">
    <view class="top-bar"><KyotoWordmark :height="19"/><LanguageSelector compact/></view>
    <view class="ch">
      <text class="ch-t">{{$t('cart.title')}}<text v-if="cart.count" class="ch-n"> ({{cart.count}})</text></text>
    </view>
    <view v-if="!cart.items.length">
      <EmptyState :text="$t('cart.empty')" emoji="🛍">
        <KyotoButton variant="pink" @click="goShop">{{$t('cart.shop')}}</KyotoButton>
      </EmptyState>
    </view>
    <view v-else>
      <view v-for="item in cart.items" :key="item.cartItemId" class="item">
        <view :class="['item-art',frameOf(item)?.tint]">
          <FrameArt v-if="frameOf(item)" :art="frameOf(item)!.art" :hex="colorOf(item)?.hex" style="height:160rpx"/>
        </view>
        <view class="item-info">
          <text class="item-name">{{frameOf(item)?.name[loc]??item.frameId}}</text>
          <text class="item-sub">{{colorOf(item)?.name[loc]}} · {{item.sizeKey}}</text>
          <text v-if="item.config?.materialId" class="item-sub">{{matName(item.config.materialId)}}</text>
          <text v-if="item.config?.prescriptionMethod==='later'" class="rx-warn">⚠ {{$t('order.rxNeededNote')}}</text>
          <view class="item-row">
            <text class="item-pr">${{item.subtotal}}</text>
            <view class="qty-row">
              <view class="qb" @click="cart.setQty(item.cartItemId,item.quantity-1)">−</view>
              <text class="qty">{{item.quantity}}</text>
              <view class="qb" @click="cart.setQty(item.cartItemId,item.quantity+1)">+</view>
            </view>
          </view>
          <text class="edit-lnk" @click="editItem(item)">{{$t('cart.editConfig')}}</text>
        </view>
      </view>
      <text class="grp">{{$t('c3.sum.title')}}</text>
      <view class="summary">
        <view class="srow"><text class="sk">{{$t('cart.subtotal')}}</text><text class="sv">${{cart.subtotal}}</text></view>
        <view class="srow"><text class="sk">{{$t('cart.shipping')}}</text><text class="sv">{{cart.shipping===0?$t('cart.freeShipping'):'$'+cart.shipping}}</text></view>
        <view class="srow tot"><text class="sk">{{$t('checkout.total')}}</text><text class="sv">${{cart.subtotal+cart.shipping}}</text></view>
      </view>
      <!-- 母版 08 底部的支付标识：只列出本项目**确实支持**的方式，不摆假的品牌 logo -->
      <view class="paybar">
        <text v-for="m in payMethods" :key="m" class="paychip">{{$t('checkout.'+m)}}</text>
      </view>
      <text class="note">{{$t('cart.note')}}</text>
    </view>
    <view class="sticky-cta cta-above-nav" v-if="cart.items.length">
      <KyotoButton variant="pink" @click="goCheckout">
        {{$t('cart.checkout')}} · ${{cart.subtotal+cart.shipping}}
      </KyotoButton>
    </view>
    <KyotoBottomNav active="cart"/>
  </view>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import KyotoWordmark from '@/components/KyotoWordmark.vue';
import LanguageSelector from '@/components/LanguageSelector.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import KyotoBottomNav from '@/components/KyotoBottomNav.vue';
import EmptyState from '@/components/EmptyState.vue';
import FrameArt from '@/components/FrameArt.vue';
import { useCartStore } from '@/stores/cart';
import { applePayUiAllowed } from '@/utils/platform';
import { useProductStore } from '@/stores/product';
import { LENS_MATERIALS } from '@/config/lens-materials.config';
import { useLensWizardStore } from '@/stores/lensWizard';
import { trackEvent } from '@/utils/analytics';
import type { CartItem, Locale } from '@/models';
import { onShow } from '@dcloudio/uni-app';
const { locale } = useI18n(); const loc = computed(()=>locale.value as Locale);
const cart = useCartStore();
/* 与结算页同一份支持列表：Apple Pay 只在平台允许时出现。
   母版底部画的是品牌 logo，这里只显示本项目真实支持的方式，不假装已接通支付。 */
const payMethods = ['applePay','card','fsa'].filter(k=>k!=='applePay'||applePayUiAllowed()); const products = useProductStore(); const wizard = useLensWizardStore();
onShow(()=>products.ensure());
const frameOf = (i:CartItem)=>products.byId(i.frameId);
const colorOf = (i:CartItem)=>frameOf(i)?.colors.find(c=>c.key===i.colorKey);
const matName = (id:string)=>LENS_MATERIALS.find(m=>m.id===id)?.name[loc.value]??id;
const goShop=()=>uni.reLaunch({url:'/pages/frames/index'});
const goCheckout=()=>{ trackEvent('begin_checkout', { items: cart.count, subtotal: cart.subtotal });
  uni.navigateTo({url:'/pages/checkout/index'}); };
const editItem = (i:CartItem)=>{
  if(!i.config){ uni.navigateTo({url:`/pages/product/detail?id=${i.frameId}`}); return; }
  wizard.startFromCartItem(i);
  uni.navigateTo({url:'/pages/wizard/index'});
};
</script>
<style lang="scss" scoped>
.item{display:flex;gap:20rpx;background:$card;border:1rpx solid $line;border-radius:$r-md;overflow:hidden;margin-bottom:14rpx}
.item-art{width:200rpx;flex-shrink:0}
.item-info{flex:1;padding:22rpx 20rpx 22rpx 0;display:flex;flex-direction:column;gap:6rpx;min-width:0}
.item-name{font-size:$fs-sm;font-weight:$fw-semi;color:$ink}
.item-sub{font-size:18rpx;color:$muted;line-height:1.5}
.rx-warn{font-size:$fs-xs;color:$sunrise;font-weight:$fw-med}
.item-row{display:flex;align-items:center;justify-content:space-between;margin-top:8rpx}
.item-pr{font-size:$fs-md;font-weight:$fw-bold;color:$accent-ink;font-variant-numeric:tabular-nums}
.qty-row{display:flex;align-items:center;gap:14rpx}
.qb{width:48rpx;height:48rpx;border:1rpx solid $line-strong;border-radius:$r-xs;display:flex;align-items:center;justify-content:center;font-size:$fs-md;background:$card;color:$ink}
.qty{font-size:$fs-sm;font-weight:$fw-semi;width:40rpx;text-align:center;font-variant-numeric:tabular-nums}
.edit-lnk{font-size:17rpx;letter-spacing:.06em;text-transform:uppercase;color:$accent-ink;font-weight:$fw-semi}
.summary{background:$card;border:1rpx solid $line-strong;border-radius:$r-md;padding:18rpx 24rpx;margin-bottom:14rpx}
.srow{display:flex;justify-content:space-between;padding:12rpx 0;border-bottom:1rpx solid $line;font-size:$fs-sm}
.srow:last-child{border:none}
.sk{color:$muted}
.sv{font-weight:$fw-semi;color:$ink;font-variant-numeric:tabular-nums}
.note{font-size:$fs-xs;color:$muted;text-align:center}
/* 母版 08 页头 */
.ch{display:flex;align-items:baseline;gap:8rpx;margin:8rpx 0 20rpx}
.ch-t{font-size:$fs-xl;font-weight:$fw-bold;letter-spacing:-.015em;color:$ink}
.ch-n{font-weight:$fw-med;color:$muted;font-variant-numeric:tabular-nums}
.srow.tot{border-top:1rpx solid $line-strong;margin-top:6rpx;padding-top:16rpx;border-bottom:none}
.srow.tot .sk{color:$ink;font-weight:$fw-semi}
.srow.tot .sv{font-size:$fs-lg;font-weight:$fw-bold;color:$accent-ink}
/* 支付方式：真实支持项的文字标签，不用假 logo */
.paybar{display:flex;flex-wrap:wrap;gap:10rpx;margin:$sp-3 0 12rpx;justify-content:center}
.paychip{font-size:17rpx;letter-spacing:.04em;color:$muted;font-weight:$fw-med;
  border:1rpx solid $line-strong;border-radius:$r-xs;padding:5rpx 12rpx}
/* lift CTA above the fixed bottom nav */
/* CTA 抬到底部导航之上（高度取自同一个 $nav-h token）*/
.cta-above-nav{bottom:calc(#{$nav-h} + #{$safe-b});padding-bottom:10rpx;z-index:51}
</style>
