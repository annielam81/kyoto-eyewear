<template>
  <view class="page-pad">
    <KyotoHeader back />
    <text class="h1">{{$t('prescription.upload.title')}}</text>
    <text class="sub" style="display:block;margin:10rpx 0 24rpx">{{$t('prescription.upload.subtitle')}}</text>
    <view v-if="!uploaded" class="drop" @click="doUpload('library')">
      <text class="drop-ic">📄</text>
      <text class="drop-tx">{{$t('prescription.upload.drop')}}</text>
      <text class="drop-s">PDF · JPG · PNG · HEIC</text>
      <view class="drop-acts">
        <KyotoButton variant="night" size="sm" @click.stop="doUpload('camera')">{{$t('prescription.upload.camera')}}</KyotoButton>
        <KyotoButton variant="ghost" size="sm" @click.stop="doUpload('library')">{{$t('prescription.upload.library')}}</KyotoButton>
      </view>
    </view>
    <view v-if="uploading" class="prog-box">
      <view class="prog-bar"><view class="prog-fill" :style="{width:progress+'%'}"></view></view>
      <text class="sub">{{$t('prescription.upload.progress')}}</text>
    </view>
    <view v-if="uploaded" class="preview-box">
      <view class="prev-img" :class="{ph:!fileMeta?.previewable}">
        <template v-if="fileMeta?.previewable">
          <view v-for="i in 5" :key="i" class="prev-line" :style="{top:(i*14)+'rpx',width:i%2?'100%':'60%'}"></view>
        </template>
        <template v-else>
          <text class="ph-ext">{{fileMeta?.ext?.toUpperCase()}}</text>
          <text class="ph-note">{{$t('prescription.upload.noPreview')}}</text>
        </template>
      </view>
      <view class="prev-info">
        <text class="prev-name">{{fileMeta?.name}}</text>
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
import { useLensWizardStore, STEP, stepAfterRx } from '@/stores/lensWizard';
import { UploadService } from '@/services/UploadService';
import { trackEvent } from '@/utils/analytics';
const wizard = useLensWizardStore();
const uploaded = ref(false); const uploading = ref(false); const progress = ref(0);
const fileMeta = ref<{name:string;ext:string;size:string;previewable:boolean}|null>(null);
let mockExt = 'jpg';
import { onLoad } from '@dcloudio/uni-app';
const src = ref<'upload'|'photo'>('upload');
onLoad((opts:any)=>{
  if(opts?.mock) mockExt = opts.mock;                       // QA hook: ?mock=heic
  if(opts?.src==='photo'||opts?.src==='upload') src.value = opts.src;
  trackEvent('start_prescription', { method: 'upload' });
});
async function doUpload(source: 'camera' | 'library' = 'library'){
  uploading.value=true; progress.value=0;
  const t=setInterval(()=>{ progress.value=Math.min(95,progress.value+15); if(progress.value>=95) clearInterval(t); },150);
  try {
    const r = await UploadService.upload(source, mockExt);
    fileMeta.value = { name:r.name, ext:r.ext, size:r.size, previewable:r.previewable };
    clearInterval(t); progress.value=100; uploading.value=false; uploaded.value=true;
  } catch { clearInterval(t); uploading.value=false; }   // cancelled: keep prior state
}
import { goBack as navBack, FALLBACK } from '@/utils/nav';
// 只有上传成功（uploaded=true，按钮在此之前是 disabled）才写入处方方法。
// 客户进来又退出时不写入，处方步仍会被视为未完成。
const use = ()=>{
  if(!uploaded.value) return;
  trackEvent('complete_prescription', { method: 'upload' });
  wizard.set('prescriptionMethod',src.value);
  // 上传的是文件，此处没有解析出结构化处方：断开旧关联，不设档位。
  // 因此镜片页不会假装知道推荐，双光也会因为读不到 ADD 而保持禁用。
  wizard.set('prescriptionId', null);
  wizard.setStrengthBand(null);
  wizard.reconcileLensType();
  wizard.set('step', stepAfterRx(wizard.w.use)); navBack(FALLBACK.rx);
};
</script>
<style lang="scss" scoped>
.drop{border:3rpx dashed $teal;background:$tint-teal2;border-radius:$r-lg;padding:60rpx 30rpx;text-align:center;margin-top:14rpx}
.drop-ic{font-size:64rpx}.drop-tx{display:block;font-size:$fs-md;font-weight:$fw-semi;margin:16rpx 0 6rpx}
.drop-s{display:block;font-size:$fs-xs;color:$muted;margin-bottom:24rpx}
.drop-acts{display:flex;gap:16rpx;justify-content:center}
.prog-box{margin-top:28rpx;text-align:center}
.prog-bar{background:$line;border-radius:$r-pill;height:8rpx;margin-bottom:14rpx;overflow:hidden}
.prog-fill{height:100%;background:$teal;border-radius:$r-pill;transition:width .2s}
.preview-box{display:flex;gap:20rpx;align-items:center;background:$card;border:1rpx solid $line;border-radius:$r-md;padding:24rpx;margin-top:24rpx}
.prev-img{width:130rpx;height:170rpx;border-radius:16rpx;background:linear-gradient(#fff,#eee);border:2rpx solid $line;position:relative;overflow:hidden;flex-shrink:0}
.prev-line{position:absolute;left:14rpx;height:6rpx;background:rgba(13,27,42,.15);border-radius:3rpx}
.prev-img.ph{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8rpx;background:$mist}
.ph-ext{font-size:$fs-sm;font-weight:$fw-bold;color:$muted}
.ph-note{font-size:16rpx;color:$muted;text-align:center;line-height:1.3;padding:0 8rpx}
.prev-name{display:block;font-size:$fs-xs;font-weight:$fw-semi}
.prev-sub{display:block;font-size:$fs-xs;color:$muted;line-height:1.5}
.verify{display:block;font-size:$fs-xs;color:$teal;font-weight:$fw-semi;margin-top:8rpx}
.ib2{width:56rpx;height:56rpx;border-radius:50%;background:$mist;display:flex;align-items:center;justify-content:center;font-size:28rpx;flex-shrink:0}
.tip{background:$mist;border-radius:$r-sm;padding:20rpx;font-size:$fs-xs;color:$muted;line-height:1.6;margin-top:20rpx}
</style>
