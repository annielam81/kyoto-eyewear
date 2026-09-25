<template>
  <view class="page-pad login">
    <KyotoHeader back />
    <KyotoWordmark :height="24" style="margin:34rpx 0 30rpx" />
    <text class="h1">{{ $t('auth.title') }}</text>
    <text class="sub" style="margin:10rpx 0 34rpx;display:block">{{ $t('auth.subtitle') }}</text>
    <view class="field"><text class="lb">{{ $t('auth.email') }}</text>
      <input class="in" type="text" v-model="email" placeholder="you@example.com" /></view>
    <view class="field"><text class="lb">{{ $t('auth.password') }}</text>
      <input class="in" password v-model="pw" placeholder="••••••••" /></view>
    <text class="forgot">{{ $t('auth.forgot') }}</text>
    <KyotoButton variant="pink" :loading="busy" @click="doSignIn('email')">{{ $t('auth.signIn') }}</KyotoButton>
    <text class="or">{{ $t('auth.orWith') }}</text>
    <view class="social">
      <view class="sb" @click="doSignIn('apple')"> {{ $t('auth.apple') }}</view>
      <view class="sb" @click="doSignIn('google')">G {{ $t('auth.google') }}</view>
      <view class="sb" @click="doSignIn('xhs')">📕 {{ $t('auth.xhs') }}</view>
    </view>
    <text class="create">{{ $t('auth.create') }}</text>
    <text class="mock">{{ $t('auth.mockNote') }}</text>
  </view>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import KyotoHeader from '@/components/KyotoHeader.vue';
import KyotoWordmark from '@/components/KyotoWordmark.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import { useUserStore } from '@/stores/user';
const email = ref(''); const pw = ref(''); const busy = ref(false);
const user = useUserStore();
async function doSignIn(p: any) {
  busy.value = true;
  await user.signIn(p, { email: email.value, password: pw.value });
  busy.value = false;
  uni.reLaunch({ url: '/pages/home/index' });
}
</script>
<style lang="scss" scoped>
.field{display:flex;flex-direction:column;gap:10rpx;margin-bottom:24rpx}
.lb{font-size:$fs-xs;color:$muted;font-weight:$fw-med}
.in{padding:24rpx;border:1rpx solid $line-strong;border-radius:$r-sm;background:$card;font-size:30rpx;min-height:88rpx;box-sizing:border-box;color:$ink}
.forgot{display:block;text-align:right;font-size:$fs-xs;color:$teal;margin:-6rpx 0 30rpx;font-weight:$fw-semi}
.or{display:block;text-align:center;font-size:$fs-xs;color:$muted;margin:30rpx 0 16rpx}
.social{display:flex;gap:16rpx}
.sb{flex:1;border:1rpx solid $line-strong;border-radius:$r-sm;padding:20rpx 10rpx;font-size:$fs-xs;font-weight:$fw-med;background:$card;color:$ink;display:flex;align-items:center;justify-content:center;gap:8rpx;min-height:78rpx;text-align:center;line-height:1.3}
.create{display:block;text-align:center;font-size:$fs-sm;color:$muted;margin-top:36rpx}
.mock{display:block;text-align:center;font-size:$fs-xs;color:$muted;opacity:.6;margin-top:14rpx}
</style>
