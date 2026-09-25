<template>
  <view class="page-pad">
    <view class="top-bar"><KyotoWordmark :height="19"/><LanguageSelector compact/></view>
    <view class="profile">
      <view class="avatar">{{user.name?user.name[0]:'?'}}</view>
      <view class="p-tx">
        <text class="name">{{user.signedIn?$t('account.title').replace('{name}',user.name):$t('account.guest')}}</text>
        <text class="since">{{$t('account.member')}}</text>
      </view>
    </view>
    <view class="menu">
      <view v-for="m in items" :key="m.k" class="mi" @click="go(m)">
        <view class="mi-ic" v-html="m.ic"></view>
        <text class="mi-n">{{$t('account.'+m.k)}}</text>
        <text class="mi-arr">›</text>
      </view>
    </view>
    <view class="lang-sec">
      <text class="grp">{{$t('account.language')}}</text>
      <LanguageSelector />
    </view>
    <!-- 母版 09：退出登录是一行 Vermilion 文字操作，不是一颗大按钮 -->
    <view v-if="user.signedIn" class="signout" @click="signOut">
      <view class="so-ic" v-html="icons.signout"></view>
      <text class="so-t">{{$t('account.logout')}}</text>
    </view>
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
/* 线条图标取代 emoji（母版 09）。不要在 v-html 里写 rpx —— webview 不认，
   尺寸由 .mi-ic :deep(svg) 的编译期 CSS 决定。 */
const A=(d:string)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const icons={ signout:A('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>') };
const items=[
  {k:'profile',ic:A('<circle cx="12" cy="8.2" r="3.8"/><path d="M5 20.2a7.2 7.2 0 0 1 14 0"/>'),url:'/pages/account/profile'},
  {k:'orders',ic:A('<path d="M4 7.5 12 3.5l8 4v9L12 20.5l-8-4z"/><path d="M4 7.5 12 11.5l8-4M12 11.5v9"/>'),url:'/pages/order/list'},
  {k:'prescriptions',ic:A('<rect x="5" y="3" width="14" height="18" rx="2.2"/><path d="M9 8h6M9 12h6M9 16h4"/>'),url:'/pages/account/prescriptions'},
  {k:'favorites',ic:A('<path d="M12 20.4s-6.3-4.1-8.4-7.8C1.8 9.4 3.2 5.6 6.7 5.1c1.9-.3 3.7.7 5.3 2.4 1.6-1.7 3.4-2.7 5.3-2.4 3.5.5 4.9 4.3 3.1 7.5-2.1 3.7-8.4 7.8-8.4 7.8z"/>'),url:'/pages/account/favorites'},
  {k:'addresses',ic:A('<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>'),url:'/pages/account/addresses'},
  {k:'payment',ic:A('<rect x="3" y="5.5" width="18" height="13" rx="2.2"/><path d="M3 10h18M7 14.5h4"/>'),url:null},
  {k:'help',ic:A('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.4"/><path d="M12 17h.01"/>'),url:null},
];
const go=(m:any)=>{ if(m.url) uni.navigateTo({url:m.url}); else uni.showToast({title:'Coming soon',icon:'none'}); };
// 浏览/购物不需要登录，退出后回首页而不是 Welcome 落地页
const signOut=async()=>{ await user.signOut(); uni.reLaunch({url:'/pages/home/index'}); };
</script>
<style lang="scss" scoped>
/* 账户页收成左对齐的信息头，不做居中大头像的社交 App 感 */
.profile{display:flex;align-items:center;gap:22rpx;padding:20rpx 0 36rpx}
.avatar{width:96rpx;height:96rpx;border-radius:50%;background:$ink;color:$paper;font-size:38rpx;display:flex;align-items:center;justify-content:center;font-weight:$fw-bold;flex-shrink:0}
.p-tx{flex:1;min-width:0}
.name{font-size:$fs-lg;font-weight:$fw-bold;color:$ink;display:block;line-height:1.25}
.since{font-size:18rpx;color:$muted;display:block;margin-top:4rpx}
.menu{background:$card;border:1rpx solid $line;border-radius:$r-md;overflow:hidden;margin-bottom:$sp-3;box-shadow:$shadow-soft}
.mi{display:flex;align-items:center;gap:20rpx;padding:24rpx;border-bottom:1rpx solid $line}
.mi:last-child{border:none}
.mi-ic{width:40rpx;height:40rpx;display:flex;align-items:center;justify-content:center;color:$teal;flex-shrink:0}
.mi-ic :deep(svg){width:36rpx;height:36rpx;display:block}
.mi-n{flex:1;font-size:$fs-sm;font-weight:$fw-med;color:$ink}
.mi-arr{color:$line-strong;font-size:$fs-md}
.lang-sec{background:$card;border:1rpx solid $line;border-radius:$r-md;padding:24rpx;box-shadow:$shadow-soft}
.signout{display:flex;align-items:center;gap:18rpx;margin-top:$sp-3;padding:24rpx;
  background:$card;border:1rpx solid $line;border-radius:$r-md;color:$accent-strong;box-shadow:$shadow-soft}
.so-ic{width:40rpx;height:40rpx;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.so-ic :deep(svg){width:36rpx;height:36rpx;display:block}
.so-t{font-size:$fs-sm;font-weight:$fw-semi}
</style>
