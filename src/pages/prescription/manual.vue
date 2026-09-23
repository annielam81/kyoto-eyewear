<template>
  <view class="page-pad">
    <KyotoHeader back />
    <text class="h1">{{$t('prescription.manual.title')}}</text>
    <text class="sub" style="display:block;margin:10rpx 0 8rpx">{{$t('prescription.manual.subtitle')}}</text>
    <text class="help-lnk" @click="showMean=!showMean">ⓘ {{$t('prescription.manual.whatMean')}}</text>
    <view v-if="showMean" class="tip">{{$t('prescription.manual.meanTip')}}</view>
    <view class="rxtbl">
      <view class="rh"><view></view>
        <view v-for="col in cols" :key="col" class="rc"><text>{{col}}</text></view>
      </view>
      <view v-for="eye in eyes" :key="eye.k" class="rrow">
        <view class="rlab"><text class="rlk">{{$t('prescription.manual.'+eye.k)}}</text><text class="rls">{{$t('prescription.manual.'+eye.k+'S')}}</text></view>
        <picker v-for="col in cols" :key="col" mode="selector" :range="ranges[col]" :value="getIdx(eye.k,col)" @change="(e:any)=>pick(eye.k,col,e)">
          <view class="rxcell"><text>{{vals[eye.k][col]||'—'}}</text></view>
        </picker>
      </view>
    </view>
    <view class="pdbox">
      <view class="pd-hd"><text class="pdlbl">{{$t('prescription.manual.pd')}}</text><text class="help-lnk" @click="showPd=!showPd">ⓘ {{$t('prescription.manual.pdHelp')}}</text></view>
      <view v-if="showPd" class="tip">{{$t('prescription.manual.pdTip')}}</view>
      <view class="pdtog">
        <text :class="['pdt',{on:pdMode==='single'}]" @click="pdMode='single'">{{$t('prescription.manual.pdSingle')}}</text>
        <text :class="['pdt',{on:pdMode==='dual'}]" @click="pdMode='dual'">{{$t('prescription.manual.pdDual')}}</text>
      </view>
      <picker v-if="pdMode==='single'" mode="selector" :range="pdRange" :value="pdIdx" @change="(e:any)=>pdIdx=Number(e.detail.value)">
        <view class="rxcell wide"><text>{{pdRange[pdIdx]}} mm</text></view>
      </picker>
      <view v-else style="display:flex;gap:14rpx">
        <view style="flex:1"><text class="rls">OD</text><view class="rxcell"><text>{{pdRange[pdIdx]/2}} mm</text></view></view>
        <view style="flex:1"><text class="rls">OS</text><view class="rxcell"><text>{{pdRange[pdIdx]/2}} mm</text></view></view>
      </view>
    </view>
    <label class="save-chk">
      <switch :checked="saveAcc" @change="(e:any)=>saveAcc=!!e.detail.value" :color="BRAND.teal" style="transform:scale(.8)"/>
      <text class="save-tx">{{$t('prescription.manual.saveToAccount')}}</text>
    </label>
    <view class="sticky-cta">
      <KyotoButton variant="pink" @click="use">{{$t('prescription.manual.use')}}</KyotoButton>
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import KyotoHeader from '@/components/KyotoHeader.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import { useLensWizardStore, STEP } from '@/stores/lensWizard';
import { PrescriptionService } from '@/services/PrescriptionService';
import { usePrescriptionStore } from '@/stores/prescription';
import { useI18n } from 'vue-i18n';
import type { Prescription } from '@/models';
import { BRAND } from '@/config/brand-colors';
const wizard = useLensWizardStore();
const rxStore = usePrescriptionStore();
const { t } = useI18n();
const showMean = ref(false); const showPd = ref(false); const pdMode = ref('single'); const saveAcc = ref(true);
const cols = ['SPH','CYL','AXIS','ADD'];
const eyes = [{k:'od'},{k:'os'}];
const sph: string[] = []; for(let v=-1000;v<=600;v+=25) sph.push((v>0?'+':'')+(v/100).toFixed(2));
const cyl: string[] = ['—']; for(let v=-25;v>=-400;v-=25) cyl.push((v/100).toFixed(2));
const axis: string[] = ['—']; for(let a=1;a<=180;a++) axis.push(String(a));
const add: string[] = ['—']; for(let v=75;v<=300;v+=25) add.push('+'+(v/100).toFixed(2));
const ranges: Record<string,string[]> = {SPH:sph,CYL:cyl,AXIS:axis,ADD:add};
const pdRange: number[] = []; for(let v=50;v<=76;v++) pdRange.push(v);
const pdIdx = ref(13);
const vals = ref<Record<string,Record<string,string>>>({od:{SPH:'-3.25',CYL:'-0.50',AXIS:'180',ADD:'—'},os:{SPH:'-3.00',CYL:'—',AXIS:'—',ADD:'—'}});
const getIdx = (eye:string,col:string)=>{ const v=vals.value[eye][col]||'—'; const i=ranges[col].indexOf(v); return i>=0?i:0; };
const pick = (eye:string,col:string,e:any)=>{ vals.value[eye][col]=ranges[col][e.detail.value]; };
import { goBack as navBack, FALLBACK } from '@/utils/nav';
// 只有走到这里（客户确认了填写的度数）才算处方完成。
// 此前这里只写一个方法字符串，客户填的 SPH/CYL/AXIS/**ADD**/PD 全被丢掉；
// 现在按既有 Prescription 模型落成一条真实记录，并用既有的 prescriptionId 关联到配镜配置，
// 因此渐进/双光所需的 ADD 加光度能一路保留到购物车与订单。
const clean = (v:string)=> (!v || v==='—') ? '' : v;
const use = ()=>{
  const rx: Prescription = {
    ...PrescriptionService.blank('manual'),
    od:{ sph:clean(vals.value.od.SPH), cyl:clean(vals.value.od.CYL), axis:clean(vals.value.od.AXIS), add:clean(vals.value.od.ADD) },
    os:{ sph:clean(vals.value.os.SPH), cyl:clean(vals.value.os.CYL), axis:clean(vals.value.os.AXIS), add:clean(vals.value.os.ADD) },
    pdMode: pdMode.value as Prescription['pdMode'],
    pd:   pdMode.value==='single' ? pdRange[pdIdx.value] : null,
    pdOd: pdMode.value==='dual'   ? pdRange[pdIdx.value]/2 : null,
    pdOs: pdMode.value==='dual'   ? pdRange[pdIdx.value]/2 : null,
    label: t('prescription.manual.title'),
  };
  // 复用既有校验（CYL 必须配 AXIS），不新增光学规则
  if (PrescriptionService.validate(rx).length) {
    uni.showToast({ title:t('prescription.manual.invalid'), icon:'none', duration:2600 });
    return;
  }
  rxStore.add(rx);
  wizard.set('prescriptionMethod','manual');
  wizard.set('prescriptionId', rx.prescriptionId);
  wizard.setStrengthBand(PrescriptionService.strengthBand(rx));
  wizard.set('step',STEP.type); navBack(FALLBACK.rx);
};
</script>
<style lang="scss" scoped>
.help-lnk{font-size:$fs-xs;color:$teal;font-weight:$fw-semi;display:inline-block;margin:6rpx 0 16rpx}
.tip{background:$tint-teal2;border-radius:$r-sm;padding:20rpx;font-size:$fs-xs;color:$teal-deep;line-height:1.6;margin-bottom:16rpx}
.rxtbl{background:#fff;border:2rpx solid $line;border-radius:$r-md;padding:18rpx;margin-top:14rpx}
.rh{display:grid;grid-template-columns:80rpx repeat(4,1fr);gap:8rpx;margin-bottom:10rpx}
.rc{text-align:center;font-size:18rpx;color:$muted;letter-spacing:.06em;font-weight:$fw-semi}
.rrow{display:grid;grid-template-columns:80rpx repeat(4,1fr);gap:8rpx;margin-bottom:10rpx;align-items:center}
.rlab{display:flex;flex-direction:column;gap:2rpx}
.rlk{font-size:$fs-sm;font-weight:$fw-bold}
.rls{font-size:18rpx;color:$muted}
.rxcell{border:3rpx solid $line;border-radius:16rpx;background:#fff;padding:18rpx 8rpx;text-align:center;font-size:$fs-xs;min-height:72rpx;display:flex;align-items:center;justify-content:center}
.rxcell.wide{width:100%;margin-top:10rpx}
.pdbox{background:#fff;border:2rpx solid $line;border-radius:$r-md;padding:22rpx;margin-top:20rpx}
.pd-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:12rpx}
.pdlbl{font-size:$fs-sm;font-weight:$fw-semi}
.pdtog{display:flex;background:$mist;border-radius:$r-sm;padding:6rpx;margin-bottom:14rpx}
.pdt{flex:1;text-align:center;padding:14rpx;border-radius:16rpx;font-size:$fs-xs;color:$muted}
.pdt.on{background:#fff;color:$ink;font-weight:$fw-semi;box-shadow:0 2rpx 8rpx rgba(0,0,0,.06)}
.save-chk{display:flex;align-items:center;gap:8rpx;margin:24rpx 0 14rpx}
.save-tx{font-size:$fs-xs;color:$muted;line-height:1.5;flex:1}
</style>
