<template>
  <view class="page-pad">
    <KyotoHeader back />
    <text class="h1">{{$t('prescription.upload.title')}}</text>
    <text class="sub" style="display:block;margin:10rpx 0 24rpx">{{$t('prescription.upload.subtitle')}}</text>
    <view v-if="!uploaded" class="drop" @click="doUpload">
      <text class="drop-ic">📄</text>
      <text class="drop-tx">{{$t('prescription.upload.drop')}}</text>
      <text class="drop-s">PDF · JPG · PNG · HEIC</text>
      <view class="drop-acts">
        <KyotoButton variant="night" size="sm" @click.stop="doUpload">{{$t('prescription.upload.camera')}}</KyotoButton>
        <KyotoButton variant="ghost" size="sm" @click.stop="doUpload">{{$t('prescription.upload.library')}}</KyotoButton>
      </view>
    </view>
    <view v-if="uploading" class="prog-box">
      <view class="prog-bar"><view class="prog-fill" :style="{width:progress+'%'}"></view></view>
      <text class="sub">{{$t('prescription.upload.progress')}}</text>
    </view>
    <view v-if="uploaded" class="preview-box">
      <view class="prev-img">
        <view v-for="i in 5" :key="i" class="prev-line" :style="{top:(i*14)+'rpx',width:i%2?'100%':'60%'}"></view>
      </view>
      <view class="prev-info">
        <text class="prev-name">prescription_dr_chen.jpg</text>
        <text class="prev-sub">{{$t('prescription.upload.uploaded')}} · 2.1 MB</text>
        <text class="prev-sub">{{$t('prescription.upload.expires')}}: Mar 2028</text>
        <text class="verify">✓ {{$t('prescription.upload.verify')}}</text>
      </view>
      <view class="ib2" @click="uploaded=false">✕</view>
    </view>
    <view class="tip">💡 {{$t('prescription.upload.tip')}}</view>
    <view class="sticky-cta">
      <KyotoButton variant="pink" :disabled="!uploaded" @click="use">{{$t('prescription.manual.use')}}</KyotoButton>
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import KyotoHeader from '@/components/KyotoHeader.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import { useLensWizardStore } from '@/stores/lensWizard';
import { UploadService } from '@/services/UploadService';
const wizard = useLensWizardStore();
const uploaded = ref(false); const uploading = ref(false); const progress = ref(0);
async function doUpload(){
  uploading.value=true; progress.value=0;
  const t=setInterval(()=>{ progress.value=Math.min(95,progress.value+15); if(progress.value>=95) clearInterval(t); },150);
  await UploadService.upload('file');
  clearInterval(t); progress.value=100; uploading.value=false; uploaded.value=true;
}
const use = ()=>{ wizard.set('prescriptionMethod','upload'); wizard.set('step',6); uni.navigateBack(); };
</script>
<style lang="scss" scoped>
.drop{border:3rpx dashed $teal;background:$tint-teal2;border-radius:$r-lg;padding:60rpx 30rpx;text-align:center;margin-top:14rpx}
.drop-ic{font-size:64rpx}.drop-tx{display:block;font-size:$fs-md;font-weight:$fw-semi;margin:16rpx 0 6rpx}
.drop-s{display:block;font-size:$fs-xs;color:$muted;margin-bottom:24rpx}
.drop-acts{display:flex;gap:16rpx;justify-content:center}
.prog-box{margin-top:28rpx;text-align:center}
.prog-bar{background:$line;border-radius:$r-pill;height:8rpx;margin-bottom:14rpx;overflow:hidden}
.prog-fill{height:100%;background:$teal;border-radius:$r-pill;transition:width .2s}
.preview-box{display:flex;gap:20rpx;align-items:center;background:#fff;border:2rpx solid $line;border-radius:$r-md;padding:24rpx;margin-top:24rpx}
.prev-img{width:130rpx;height:170rpx;border-radius:16rpx;background:linear-gradient(#fff,#eee);border:2rpx solid $line;position:relative;overflow:hidden;flex-shrink:0}
.prev-line{position:absolute;left:14rpx;height:6rpx;background:rgba(13,27,42,.15);border-radius:3rpx}
.prev-name{display:block;font-size:$fs-xs;font-weight:$fw-semi}
.prev-sub{display:block;font-size:$fs-xs;color:$muted;line-height:1.5}
.verify{display:block;font-size:$fs-xs;color:$teal;font-weight:$fw-semi;margin-top:8rpx}
.ib2{width:56rpx;height:56rpx;border-radius:50%;background:$mist;display:flex;align-items:center;justify-content:center;font-size:28rpx;flex-shrink:0}
.tip{background:$mist;border-radius:$r-sm;padding:20rpx;font-size:$fs-xs;color:$muted;line-height:1.6;margin-top:20rpx}
</style>
