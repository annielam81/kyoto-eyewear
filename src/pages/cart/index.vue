<template>
  <view class="page-pad">
    <view class="top"><KyotoWordmark :height="19"/><LanguageSelector compact/></view>
    <text class="h1">{{$t('cart.title')}}</text>
    <view v-if="!cart.items.length">
      <EmptyState :text="$t('cart.empty')" emoji="🛍">
        <KyotoButton variant="pink" @click="uni.reLaunch({url:'/pages/frames/index'})">{{$t('cart.shop')}}</KyotoButton>
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
      <view class="summary">
        <view class="srow"><text class="sk">{{$t('cart.subtotal')}}</text><text class="sv">${{cart.subtotal}}</text></view>
        <view class="srow"><text class="sk">{{$t('cart.shipping')}}</text><text class="sv">{{cart.shipping===0?$t('cart.freeShipping'):'$'+cart.shipping}}</text></view>
      </view>
      <text class="note">{{$t('cart.note')}}</text>
    </view>
    <view class="sticky-cta" v-if="cart.items.length">
      <KyotoButton variant="pink" @click="uni.navigateTo({url:'/pages/checkout/index'})">
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
import { useProductStore } from '@/stores/product';
import { LENS_MATERIALS } from '@/config/lens-materials.config';
import type { CartItem, Locale } from '@/models';
import { onShow } from '@dcloudio/uni-app';
const { locale } = useI18n(); const loc = computed(()=>locale.value as Locale);
const cart = useCartStore(); const products = useProductStore();
onShow(()=>products.ensure());
const frameOf = (i:CartItem)=>products.byId(i.frameId);
const colorOf = (i:CartItem)=>frameOf(i)?.colors.find(c=>c.key===i.colorKey);
const matName = (id:string)=>LENS_MATERIALS.find(m=>m.id===id)?.name[loc.value]??id;
const editItem = (_i:CartItem)=>uni.navigateTo({url:'/pages/wizard/index'});
</script>
<style lang="scss" scoped>
.top{display:flex;align-items:center;justify-content:space-between;padding:16rpx 0 22rpx}
.item{display:flex;gap:20rpx;background:#fff;border:2rpx solid $line;border-radius:$r-md;overflow:hidden;margin-bottom:18rpx}
.item-art{width:200rpx;flex-shrink:0}
.item-info{flex:1;padding:22rpx 20rpx 22rpx 0;display:flex;flex-direction:column;gap:6rpx;min-width:0}
.item-name{font-size:$fs-sm;font-weight:$fw-semi}
.item-sub{font-size:$fs-xs;color:$muted}
.rx-warn{font-size:$fs-xs;color:$sunrise;font-weight:$fw-med}
.item-row{display:flex;align-items:center;justify-content:space-between;margin-top:8rpx}
.item-pr{font-size:$fs-md;font-weight:$fw-bold;color:$sunrise}
.qty-row{display:flex;align-items:center;gap:14rpx}
.qb{width:52rpx;height:52rpx;border:2rpx solid $line;border-radius:$r-sm;display:flex;align-items:center;justify-content:center;font-size:$fs-md;background:#fff}
.qty{font-size:$fs-sm;font-weight:$fw-semi;width:40rpx;text-align:center}
.edit-lnk{font-size:$fs-xs;color:$teal;font-weight:$fw-semi}
.summary{background:#fff;border:2rpx solid $line;border-radius:$r-md;padding:20rpx 26rpx;margin-bottom:14rpx}
.srow{display:flex;justify-content:space-between;padding:12rpx 0;border-bottom:2rpx solid $line;font-size:$fs-sm}
.srow:last-child{border:none}
.sk{color:$muted}.sv{font-weight:$fw-semi}
.note{font-size:$fs-xs;color:$muted;text-align:center}
</style>
