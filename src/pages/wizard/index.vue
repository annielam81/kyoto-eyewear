<template>
  <view class="page-pad wz">
    <WizardProgress :step="w.step" :total="6" @back="goBack"/>
    <!-- context bar -->
    <view v-if="frame" class="ctx">
      <view :class="['ctx-art',frame.tint]"><FrameArt :art="frame.art" :hex="selColor?.hex" style="height:80rpx"/></view>
      <view class="ctx-tx">
        <text class="ctx-n">{{frame.name[loc]}} · {{selColor?.name[loc]}} · {{w.sizeKey}}</text>
        <text class="ctx-p">${{frame.price + wizard.lensPrice}}</text>
      </view>
    </view>
    <!-- STEP 1 -->
    <view v-if="w.step===1">
      <text class="h1">{{$t('wizard.s1.title')}}</text>
      <text class="sub" style="display:block;margin:10rpx 0 24rpx">{{$t('wizard.s1.subtitle')}}</text>
      <OptionCard v-for="o in s1opts" :key="o.k" :icon="o.ic" :title="$t('wizard.s1.'+o.k)" :subtitle="$t('wizard.s1.'+o.k+'S')" :selected="w.use===o.k" @select="setUse(o.k)"/>
    </view>
    <!-- STEP 2 -->
    <view v-else-if="w.step===2">
      <text class="h1">{{$t('wizard.s2.title')}}</text>
      <text class="sub" style="display:block;margin:10rpx 0 24rpx">{{$t('wizard.s2.subtitle')}}</text>
      <OptionCard v-for="o in s2opts" :key="o.k" :icon="o.ic" :title="$t('wizard.s2.'+o.k)" :subtitle="$t('wizard.s2.'+o.k+'S')" :price-text="o.pr" :selected="w.type===o.k" @select="setType(o.k)"/>
    </view>
    <!-- STEP 3 -->
    <view v-else-if="w.step===3">
      <text class="h1">{{$t('wizard.s3.title')}}</text>
      <text class="sub" style="display:block;margin:10rpx 0 22rpx">{{$t('wizard.s3.subtitle')}}</text>
      <text class="grp">{{$t('wizard.s3.strengthQ')}}</text>
      <view class="chips-row">
        <text v-for="(b,i) in $tm('wizard.s3.bands')" :key="i" class="chip" :class="{on:w.strengthBand===i}" @click="setBand(i)">{{b}}</text>
      </view>
      <text class="grp">{{$t('wizard.s3.prefQ')}}</text>
      <view class="chips-row" style="flex-wrap:wrap">
        <text v-for="p in prefs" :key="p.k" class="chip" :class="{on:w.preference===p.k}" @click="setPref(p.k)">{{p.ic}} {{$t('wizard.s3.'+p.k)}}</text>
      </view>
      <view v-if="w.strengthBand==null||w.preference==null" class="pick-hint">
        <text>{{$t('wizard.s3.pickBoth')}}</text>
      </view>
      <view v-else>
        <text class="grp">{{$t('wizard.s3.recForYou')}}</text>
        <view v-if="recMat" class="rec-card">
          <text class="rec-badge">✓ {{$t('wizard.s3.recForYou')}}</text>
          <view class="rec-body">
            <view class="rec-ic">{{recMat.material==='polycarbonate'?'PC':recMat.index}}</view>
            <view class="rec-tx">
              <text class="rec-name">{{recMat.name[loc]}} <text class="rec-lbl">· {{recMat.label[loc]}}</text></text>
              <text class="rec-desc">{{recMat.description[loc]}}</text>
              <view v-if="recMat.badges.length" class="rec-badges">
                <text v-for="b in recMat.badges" :key="b" class="badge-pill">{{b==='impact'?$t('wizard.s3.badgeImpact'):$t('wizard.s3.badgeLight')}}</text>
              </view>
              <view class="why-row">
                <text class="why-btn" @click="whyOpen=!whyOpen">ⓘ {{$t('wizard.s3.why')}}</text>
                <text v-if="recMat.price" class="rec-pr">+${{recMat.price}}</text>
                <text v-else class="rec-pr incl">{{$t('common.included')}}</text>
              </view>
              <text v-if="whyOpen" class="why-txt">{{whyText}}</text>
            </view>
          </view>
        </view>
        <text class="more-lnk" @click="showOther=!showOther">{{showOther?'▴':'▾'}} {{$t('wizard.s3.seeOther')}} ({{otherMats.length}})</text>
        <view v-if="showOther">
          <OptionCard v-for="m in otherMats" :key="m.id" :title="m.name[loc]" :label-text="m.label[loc]" :subtitle="m.description[loc]" :price-text="m.price?'+$'+m.price:$t('common.included')" :selected="w.materialId===m.id" :disabled="!compat(m)" @select="wizard.set('materialId',m.id)"/>
        </view>
        <view v-if="w.materialId&&w.materialId!==wizard.recommendation" class="chosen-note">
          <text>{{$t('wizard.s3.chosenOk')}}</text>
        </view>
      </view>
    </view>
    <!-- STEP 4 -->
    <view v-else-if="w.step===4">
      <text class="h1">{{$t('wizard.s4.title')}}</text>
      <text class="sub" style="display:block;margin:10rpx 0 24rpx">{{$t('wizard.s4.subtitle')}}</text>
      <view v-for="g in treatGroups" :key="g.k">
        <text class="grp">{{$t('wizard.s4.'+g.k)}}</text>
        <view v-for="tr in g.items" :key="tr.id" class="treat-row">
          <view class="treat-tx">
            <text class="treat-name">{{tr.name[loc]}}</text>
            <text class="treat-desc">{{tr.description[loc]}}</text>
          </view>
          <text v-if="g.k==='groupIncluded'" class="incl-tag">{{$t('common.included')}}</text>
          <view v-else class="treat-right">
            <text class="treat-pr" v-if="tr.price">+${{tr.price}}</text>
            <view :class="['sw',{on:w.treatmentIds.includes(tr.id)}]" @click="wizard.toggleTreatment(tr.id)"></view>
          </view>
        </view>
      </view>
    </view>
    <!-- STEP 5 -->
    <view v-else-if="w.step===5&&w.use!=='nonrx'">
      <text class="h1">{{$t('wizard.s5.title')}}</text>
      <text class="sub" style="display:block;margin:10rpx 0 24rpx">{{$t('wizard.s5.subtitle')}}</text>
      <view class="rx-saved" :class="{expired:savedRxValidity==='expired'}" @click="useSaved">
        <text class="rx-s-ic">{{savedRxValidity==='expired'?'⚠':'✓'}}</text>
        <view>
          <text class="rx-s-name">{{$t('wizard.s5.saved')}}</text>
          <text class="rx-s-sub">{{savedRx?.label}} · OD {{savedRx?.od?.sph}}</text>
          <text v-if="savedRxValidity==='expired'" class="rx-s-exp">{{$t('c3.rxs.expired')}} — {{$t('c3.myrx.expWarn')}}</text>
          <text v-else-if="savedRxValidity==='expiringSoon'" class="rx-s-exp soon">{{$t('c3.myrx.soonWarn')}}</text>
        </view>
      </view>
      <view class="rx-methods">
        <view class="rxm" @click="goRx('upload')"><text class="rmic">📄</text><text class="rmn">{{$t('wizard.s5.upload')}}</text><text class="rms">{{$t('wizard.s5.uploadS')}}</text></view>
        <view class="rxm" @click="goRx('photo')"><text class="rmic">📷</text><text class="rmn">{{$t('wizard.s5.photo')}}</text><text class="rms">{{$t('wizard.s5.photoS')}}</text></view>
        <view class="rxm" @click="goManual"><text class="rmic">⌨️</text><text class="rmn">{{$t('wizard.s5.manual')}}</text><text class="rms">{{$t('wizard.s5.manualS')}}</text></view>
        <view class="rxm wide" @click="setLater"><text class="rmic">⏱</text><view><text class="rmn">{{$t('wizard.s5.later')}}</text><text class="rms">{{$t('wizard.s5.laterS')}}</text></view></view>
      </view>
    </view>
    <!-- STEP 6 -->
    <view v-else-if="w.step===6">
      <text class="h1">{{$t('wizard.s6.title')}}</text>
      <text class="sub" style="display:block;margin:10rpx 0 24rpx">{{$t('wizard.s6.subtitle')}}</text>
      <view v-if="frame" :class="['rev-art',frame.tint]" style="height:240rpx;border-radius:32rpx;overflow:hidden;margin-bottom:24rpx">
        <FrameArt :art="frame.art" :hex="selColor?.hex" style="height:100%"/>
      </view>
      <PriceSummary :rows="reviewRows" @edit="editStep"/>
    </view>
    <!-- footer -->
    <view class="sticky-cta">
      <KyotoButton variant="pink" :disabled="!canContinue" @click="advance">
        {{w.step===6?$t('wizard.s6.addToCart')+' · $'+((frame?.price??0)+wizard.lensPrice):$t('common.continue')}}
      </KyotoButton>
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { onShow } from '@dcloudio/uni-app';
import WizardProgress from '@/components/WizardProgress.vue';
import OptionCard from '@/components/OptionCard.vue';
import PriceSummary from '@/components/PriceSummary.vue';
import FrameArt from '@/components/FrameArt.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import { useLensWizardStore } from '@/stores/lensWizard';
import { useCartStore } from '@/stores/cart';
import { useProductStore } from '@/stores/product';
import { LENS_MATERIALS } from '@/config/lens-materials.config';
import { TREATMENTS, TYPE_PRICES } from '@/config/treatments.config';
import { LensRecommendationService, LENS_WHY } from '@/services/LensRecommendationService';
import { usePrescriptionStore } from '@/stores/prescription';
import { PrescriptionService } from '@/services/PrescriptionService';
import type { Locale, LensPreference, PrescriptionUse, PrescriptionType } from '@/models';
import { money } from '@/utils/format';
import { goBack as navBack, FALLBACK } from '@/utils/nav';
const { locale,t } = useI18n(); const loc = computed(()=>locale.value as Locale);
const wizard = useLensWizardStore(); const cart = useCartStore(); const products = useProductStore();
const rxStore = usePrescriptionStore();
const savedRx = computed(()=>rxStore.saved[0] ?? null);
const savedRxValidity = computed(()=>savedRx.value?PrescriptionService.validity(savedRx.value):'unknown');
const w = computed(()=>wizard.w);
const frame = computed(()=>wizard.frame);
const selColor = computed(()=>frame.value?.colors.find(c=>c.key===w.value.colorKey)??frame.value?.colors[0]);
const whyOpen = ref(false); const showOther = ref(false);
onShow(async ()=>{ await products.ensure();
  if (!wizard.w.frameId) uni.reLaunch({ url: FALLBACK.wizard });   // refresh/direct-entry guard
});
const s1opts=[{k:'rx',ic:'👓'},{k:'readers',ic:'📖'},{k:'nonrx',ic:'💻'},{k:'sun',ic:'🕶️'}];
const s2optsAll=[{k:'single',ic:'◐',pr:''},{k:'progressive',ic:'◑',pr:'+$120'},{k:'readers',ic:'＋',pr:''}];
const s2opts=computed(()=>w.value.use==='readers'?s2optsAll.filter(o=>o.k==='readers'):s2optsAll);
const prefs=[{k:'balanced',ic:'⚖️'},{k:'thin',ic:'▭'},{k:'weight',ic:'🪶'},{k:'durable',ic:'🛡️'}];
const recMat = computed(()=>LENS_MATERIALS.find(m=>m.id===wizard.recommendation));
const otherMats = computed(()=>LENS_MATERIALS.filter(m=>m.id!==wizard.recommendation));
const compat = (m:any)=>LensRecommendationService.compatible(m,w.value.strengthBand,frame.value??null);
const whyText = computed(()=>wizard.recommendation ? (LENS_WHY[locale.value]?.[wizard.recommendation]??'') : '');
const treatGroups = computed(()=>[
  {k:'groupIncluded',items:TREATMENTS.filter(t=>t.group==='included')},
  {k:'groupRecommended',items:TREATMENTS.filter(t=>t.group==='recommended')},
  {k:'groupOptional',items:TREATMENTS.filter(t=>t.group==='optional')},
]);
const reviewRows = computed(()=>{
  const f=frame.value; if(!f) return [];
  const mat=wizard.material; const rows:any[]=[];
  rows.push({label:t('wizard.s6.frame'),value:`${f.name[loc.value]} · ${f.nameZH}`,sub:money(f.price)});
  rows.push({label:t('wizard.s6.color'),value:selColor.value?.name[loc.value]??''});
  rows.push({label:t('wizard.s6.size'),value:w.value.sizeKey??'',editable:true,key:'size'});
  if(w.value.use) rows.push({label:t('wizard.s6.use'),value:t('wizard.s1.'+w.value.use),editable:true,key:'use'});
  if(w.value.type) rows.push({label:t('wizard.s6.type'),value:t('wizard.s2.'+w.value.type),sub:TYPE_PRICES[w.value.type]?'+$'+TYPE_PRICES[w.value.type]:t('common.included'),editable:true,key:'type'});
  if(mat) rows.push({label:t('wizard.s6.materialLbl'),value:mat.name[loc.value],sub:mat.price?'+$'+mat.price:t('common.included'),editable:true,key:'mat'});
  const trNames=TREATMENTS.filter(x=>x.group==='included'||w.value.treatmentIds.includes(x.id)).map(x=>x.name[loc.value]).join(', ');
  rows.push({label:t('wizard.s6.treatments'),value:trNames,editable:true,key:'tr'});
  const rxLbl=w.value.prescriptionMethod==='saved'?t('wizard.s6.rxSaved'):w.value.prescriptionMethod==='upload'?t('wizard.s6.rxUpload'):w.value.prescriptionMethod==='later'?t('wizard.s6.rxLater'):t('wizard.s6.rxManual');
  if(w.value.use!=='nonrx') rows.push({label:t('wizard.s6.prescription'),value:rxLbl,editable:true,key:'rx'});
  rows.push({label:t('wizard.s6.total'),value:money(f.price+wizard.lensPrice),total:true});
  return rows;
});
const canContinue = computed(()=>{
  const s=w.value.step;
  if(s===1) return !!w.value.use;
  if(s===2) return !!w.value.type;
  if(s===3) return !!w.value.materialId;
  if(s===4) return true;
  if(s===5) return !!w.value.prescriptionMethod;
  return true;
});
function setUse(k:string){ wizard.set('use',k as PrescriptionUse); }
function setType(k:string){ wizard.set('type',k as PrescriptionType); }
function setBand(i:number){ wizard.set('strengthBand',i); wizard.set('materialId',null as any); whyOpen.value=false; showOther.value=false; autoPick(); }
function setPref(k:string){ wizard.set('preference',k as LensPreference); wizard.set('materialId',null as any); whyOpen.value=false; showOther.value=false; autoPick(); }
function autoPick(){ const r=wizard.recommendation; if(r) wizard.set('materialId',r); }
function setLater(){ wizard.set('prescriptionMethod','later'); wizard.set('step',6); }
function useSaved(){
  if(savedRxValidity.value==='expired'){ uni.showToast({title:t('c3.myrx.expWarn'),icon:'none',duration:3200}); return; }
  wizard.set('prescriptionMethod','saved'); wizard.set('prescriptionId', savedRx.value?.prescriptionId ?? null); wizard.set('step',6);
}
const goManual=()=>{ wizard.set('prescriptionMethod','manual'); uni.navigateTo({url:'/pages/prescription/manual'}); };
function goRx(src:string){
  wizard.set('prescriptionMethod',src as any);
  if(src==='upload'||src==='photo') uni.navigateTo({url:'/pages/prescription/upload'});
}
function editStep(key:string){
  const map:Record<string,number>={size:1,use:1,type:2,mat:3,tr:4,rx:5};
  wizard.set('step',map[key]??1);
}
function goBack(){
  if(w.value.step>1){ wizard.set('step',w.value.step-1); }
  else { const f = wizard.w.frameId ? `/pages/product/detail?id=${wizard.w.frameId}` : FALLBACK.wizard; navBack(f); }
}
function advance(){
  const s=w.value.step;
  if(s===5&&w.value.use==='nonrx'){ wizard.set('step',6); return; }
  if(s===6){
    if(!frame.value) return;
    const f=frame.value; const c=w.value;
    const cfg={configurationId:c.configurationId,use:c.use,type:c.type,strengthBand:c.strengthBand,
      preference:c.preference,materialId:c.materialId,treatmentIds:[...wizard.includedTreatmentIds,...c.treatmentIds],
      prescriptionMethod:c.prescriptionMethod,prescriptionId:c.prescriptionId};
    if(c.editCartItemId) cart.replaceConfigured(c.editCartItemId,f.id,f.sku,c.colorKey??'night',c.sizeKey??'M',f.price,cfg);
    else cart.addConfigured(f.id,f.sku,c.colorKey??'night',c.sizeKey??'M',f.price,cfg);
    wizard.reset();
    uni.navigateTo({url:'/pages/cart/index'});
    return;
  }
  const nextMap:Record<number,number>={1:w.value.use==='nonrx'?4:2,2:3,3:4,4:w.value.use==='nonrx'?6:5,5:6};
  wizard.set('step',nextMap[s]??s+1);
}
</script>
<style lang="scss" scoped>
.wz{padding-bottom:200rpx}
.ctx{display:flex;align-items:center;gap:18rpx;background:#fff;border:2rpx solid $line;border-radius:$r-sm;padding:14rpx 18rpx;margin-bottom:26rpx}
.ctx-art{width:110rpx;height:70rpx;border-radius:14rpx;flex-shrink:0;overflow:hidden}
.ctx-n{font-size:$fs-xs;font-weight:$fw-semi;display:block}
.ctx-p{font-size:$fs-sm;font-weight:$fw-bold;color:$sunrise;display:block;margin-top:4rpx}
.chips-row{display:flex;gap:12rpx;flex-wrap:wrap;margin-bottom:16rpx}
.pick-hint{background:$mist;border-radius:$r-sm;padding:24rpx;text-align:center;color:$muted;font-size:$fs-sm;margin-top:14rpx}
.rec-card{border:4rpx solid $sakura;background:#FFF0F5;border-radius:$r-md;padding:28rpx;margin-bottom:18rpx;position:relative}
.rec-badge{position:absolute;top:-18rpx;left:26rpx;background:$teal;color:#fff;font-size:18rpx;padding:4rpx 18rpx;border-radius:$r-pill;font-weight:$fw-semi}
.rec-body{display:flex;gap:18rpx;align-items:flex-start;margin-top:8rpx}
.rec-ic{width:72rpx;height:72rpx;border-radius:16rpx;background:$night;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22rpx;font-weight:$fw-bold;flex-shrink:0}
.rec-tx{flex:1}
.rec-name{font-size:$fs-md;font-weight:$fw-semi;display:block}
.rec-lbl{color:$sakura;font-weight:$fw-semi;font-size:$fs-xs}
.rec-desc{font-size:$fs-xs;color:$muted;line-height:1.6;display:block;margin:6rpx 0}
.rec-badges{display:flex;gap:10rpx;flex-wrap:wrap;margin:8rpx 0}
.badge-pill{font-size:18rpx;padding:4rpx 14rpx;border-radius:$r-pill;background:$night;color:#fff;font-weight:$fw-semi;letter-spacing:.04em}
.why-row{display:flex;align-items:center;gap:16rpx;margin-top:8rpx}
.why-btn{font-size:$fs-xs;color:$teal;font-weight:$fw-semi}
.rec-pr{font-size:$fs-sm;font-weight:$fw-semi;color:$sunrise;margin-left:auto}
.rec-pr.incl{color:$teal}
.why-txt{font-size:$fs-xs;color:$ink;line-height:1.6;margin-top:10rpx;display:block;background:$tint-teal2;padding:18rpx;border-radius:$r-sm}
.more-lnk{display:block;text-align:center;font-size:$fs-sm;color:$teal;font-weight:$fw-semi;padding:16rpx 0;margin-bottom:10rpx}
.chosen-note{background:$tint-teal2;border-radius:$r-sm;padding:18rpx;font-size:$fs-xs;color:$teal-deep;line-height:1.5}
.treat-row{display:flex;align-items:center;gap:16rpx;padding:22rpx;background:#fff;border:2rpx solid $line;border-radius:$r-md;margin-bottom:14rpx}
.treat-tx{flex:1}
.treat-name{display:block;font-size:$fs-sm;font-weight:$fw-semi}
.treat-desc{display:block;font-size:$fs-xs;color:$muted;margin-top:4rpx}
.incl-tag{background:$tint-teal2;color:$teal;font-size:18rpx;padding:6rpx 16rpx;border-radius:$r-pill;font-weight:$fw-semi;white-space:nowrap}
.treat-right{display:flex;align-items:center;gap:14rpx}
.treat-pr{font-size:$fs-xs;font-weight:$fw-semi;color:$sunrise;white-space:nowrap}
.sw{width:80rpx;height:48rpx;border-radius:$r-pill;background:$line;position:relative;transition:.2s;flex-shrink:0}
.sw::after{content:"";position:absolute;top:6rpx;left:6rpx;width:36rpx;height:36rpx;border-radius:50%;background:#fff;transition:.2s;box-shadow:0 2rpx 6rpx rgba(0,0,0,.2)}
.sw.on{background:$teal}.sw.on::after{left:38rpx}
.rx-saved{display:flex;align-items:center;gap:18rpx;border:3rpx solid $teal;background:$tint-teal2;border-radius:$r-md;padding:24rpx;margin-bottom:16rpx}
.rx-saved.expired{border-color:$sunrise;background:#FFF1EB;opacity:.85}
.rx-s-exp{display:block;font-size:$fs-xs;color:$sunrise;margin-top:6rpx;line-height:1.5}
.rx-s-exp.soon{color:$night}
.rx-s-ic{font-size:36rpx;width:60rpx;text-align:center;flex-shrink:0;color:$teal}
.rx-s-name{display:block;font-size:$fs-sm;font-weight:$fw-semi}
.rx-s-sub{display:block;font-size:$fs-xs;color:$muted}
.rx-methods{display:grid;grid-template-columns:1fr 1fr;gap:14rpx}
.rxm{background:#fff;border:2rpx solid $line;border-radius:$r-md;padding:28rpx 20rpx;display:flex;flex-direction:column;gap:8rpx}
.rxm.wide{grid-column:1/-1;flex-direction:row;align-items:center}
.rmic{font-size:40rpx}
.rmn{font-size:$fs-sm;font-weight:$fw-semi}
.rms{font-size:$fs-xs;color:$muted;line-height:1.4}
</style>
