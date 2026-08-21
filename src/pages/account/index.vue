<template>
  <view class="page-pad">
    <view class="top"><KyotoWordmark :height="19"/><LanguageSelector compact/></view>
    <view class="profile">
      <view class="avatar">{{user.name?user.name[0]:'?'}}</view>
      <text class="name">{{user.signedIn?$t('account.title').replace('{name}',user.name):$t('account.guest')}}</text>
      <text class="since">{{$t('account.member')}}</text>
    </view>
    <view class="menu">
      <view v-for="m in items" :key="m.k" class="mi" @click="go(m)">
        <text class="mi-ic">{{m.ic}}</text>
        <text class="mi-n">{{$t('account.'+m.k)}}</text>
        <text class="mi-arr">›</text>
      </view>
    </view>
    <view class="lang-sec">
      <text class="grp">{{$t('account.language')}}</text>
      <LanguageSelector />
    </view>
    <KyotoButton variant="ghost" style="margin-top:24rpx" @click="signOut">{{$t('account.logout')}}</KyotoButton>
    <KyotoBottomNav active="account"/>
  </view>
</template>
<script setup lang="ts">
import KyotoWordmark from '@/components/KyotoWordmark.vue';
import LanguageSelector from '@/components/LanguageSelector.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import KyotoBottomNav from '@/components/KyotoBottomNav.vue';
import { useUserStore } from '@/stores/user';
const user = useUserStore();
const items=[{k:'profile',ic:'👤',url:'/pages/account/profile'},{k:'orders',ic:'📦',url:'/pages/order/list'},{k:'prescriptions',ic:'📋',url:'/pages/account/prescriptions'},{k:'favorites',ic:'♡',url:'/pages/account/favorites'},{k:'addresses',ic:'📍',url:'/pages/account/addresses'},{k:'payment',ic:'💳',url:null},{k:'help',ic:'💬',url:null}];
const go=(m:any)=>{ if(m.url) uni.navigateTo({url:m.url}); else uni.showToast({title:'Coming soon',icon:'none'}); };
const signOut=async()=>{ await user.signOut(); uni.reLaunch({url:'/pages/welcome/index'}); };
</script>
<style lang="scss" scoped>
.top{display:flex;align-items:center;justify-content:space-between;padding:16rpx 0 22rpx}
.profile{display:flex;flex-direction:column;align-items:center;gap:10rpx;padding:36rpx 0 44rpx}
.avatar{width:140rpx;height:140rpx;border-radius:50%;background:$sakura;color:#fff;font-size:60rpx;display:flex;align-items:center;justify-content:center;font-weight:$fw-bold}
.name{font-size:$fs-lg;font-weight:$fw-bold}
.since{font-size:$fs-xs;color:$muted}
.menu{background:#fff;border:2rpx solid $line;border-radius:$r-md;overflow:hidden;margin-bottom:24rpx}
.mi{display:flex;align-items:center;gap:20rpx;padding:28rpx 26rpx;border-bottom:2rpx solid $line}
.mi:last-child{border:none}
.mi-ic{font-size:34rpx;width:52rpx;text-align:center}
.mi-n{flex:1;font-size:$fs-sm;font-weight:$fw-med}
.mi-arr{color:$muted;font-size:$fs-md}
.lang-sec{background:#fff;border:2rpx solid $line;border-radius:$r-md;padding:26rpx}
</style>
