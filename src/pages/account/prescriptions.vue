<template>
  <view class="page-pad">
    <KyotoHeader back />
    <text class="h1">{{$t('myrx.title')}}</text>
    <KyotoButton variant="night" size="sm" style="margin:16rpx 0 28rpx" @click="uni.navigateTo({url:'/pages/prescription/upload'})">+ {{$t('myrx.addNew')}}</KyotoButton>
    <view v-for="p in rxStore.saved" :key="p.prescriptionId" class="rxcard">
      <view class="rxh">
        <text class="rxn">{{p.label||'Prescription'}}</text>
        <text :class="['rxst',p.verificationStatus]">{{p.verificationStatus==='verified'?$t('myrx.verified'):$t('myrx.pending')}}</text>
      </view>
      <text v-if="p.od" class="rxd">OD {{p.od.sph}} · OS {{p.os?.sph}}</text>
      <text v-if="p.expirationDate" class="rxexp">{{$t('myrx.expires')}} {{p.expirationDate}}</text>
      <text class="use-lnk" @click="uni.navigateTo({url:'/pages/wizard/index'})">{{$t('myrx.useForOrder')}} ›</text>
    </view>
    <KyotoBottomNav active="account"/>
  </view>
</template>
<script setup lang="ts">
import KyotoHeader from '@/components/KyotoHeader.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import KyotoBottomNav from '@/components/KyotoBottomNav.vue';
import { usePrescriptionStore } from '@/stores/prescription';
const rxStore = usePrescriptionStore();
</script>
<style lang="scss" scoped>
.rxcard{background:#fff;border:2rpx solid $line;border-radius:$r-md;padding:24rpx;margin-bottom:16rpx}
.rxh{display:flex;justify-content:space-between;align-items:center;margin-bottom:8rpx}
.rxn{font-size:$fs-sm;font-weight:$fw-semi}
.rxst{font-size:$fs-xs;padding:6rpx 16rpx;border-radius:$r-pill;font-weight:$fw-semi}
.rxst.verified{background:$tint-teal2;color:$teal}.rxst.pending{background:$tint-gold;color:$night}
.rxd{display:block;font-size:$fs-xs;color:$muted;margin-bottom:4rpx}
.rxexp{display:block;font-size:$fs-xs;color:$muted;margin-bottom:10rpx}
.use-lnk{font-size:$fs-xs;color:$teal;font-weight:$fw-semi}
</style>
