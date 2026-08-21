<template>
  <view class="page-pad">
    <KyotoHeader back fallback="/pages/account/index" />
    <text class="h1">{{$t('myrx.title')}}</text>
    <KyotoButton variant="night" size="sm" style="margin:16rpx 0 24rpx" @click="goUpload">+ {{$t('myrx.addNew')}}</KyotoButton>
    <view v-for="p in rxStore.saved" :key="p.prescriptionId" class="rxcard">
      <view class="rxh">
        <text class="rxn">{{p.label||'Prescription'}}</text>
        <text :class="['rxst',validity(p)]">{{$t('c3.rxs.'+(validity(p)==='unknown'?'received':validity(p)))}}</text>
      </view>
      <view class="rx-meta">
        <text v-if="p.issueDate" class="rm">{{$t('c3.myrx.issued')}}: {{p.issueDate}}</text>
        <text v-if="p.expirationDate" class="rm">{{$t('myrx.expires')}}: {{p.expirationDate}}</text>
        <text class="rm">{{$t('c3.myrx.source')}}: {{$t('c3.myrx.src_'+p.source)}}</text>
        <text v-if="p.lastUsedOrder" class="rm">{{$t('c3.myrx.lastUsed')}}: #{{p.lastUsedOrder}}</text>
      </view>
      <view v-if="validity(p)==='expired'" class="rx-warn">⚠ {{$t('c3.myrx.expWarn')}}</view>
      <view v-else-if="validity(p)==='expiringSoon'" class="rx-warn soon">⚠ {{$t('c3.myrx.soonWarn')}}</view>
      <view class="rx-acts">
        <text class="ra" @click="useFor(p)">{{$t('myrx.useForOrder')}}</text>
        <text class="ra" @click="viewDetail(p)">{{$t('c3.myrx.view')}}</text>
        <text class="ra" @click="goUpload">{{$t('c3.myrx.replace')}}</text>
        <text class="ra warn" @click="del(p.prescriptionId)">{{$t('c3.myrx.del')}}</text>
      </view>
    </view>
    <!-- detail modal -->
    <view v-if="sel" class="modal-mask" @click="sel=null">
      <view class="modal" @click.stop>
        <view class="mh"><text class="mt2">{{sel.label}}</text><text class="mx" @click="sel=null">✕</text></view>
        <view class="rxtbl2">
          <view class="r2 hd"><text></text><text>SPH</text><text>CYL</text><text>AXIS</text><text>ADD</text></view>
          <view class="r2"><text class="eye">OD</text><text>{{sel.od?.sph||'—'}}</text><text>{{sel.od?.cyl||'—'}}</text><text>{{sel.od?.axis||'—'}}</text><text>{{sel.od?.add||'—'}}</text></view>
          <view class="r2"><text class="eye">OS</text><text>{{sel.os?.sph||'—'}}</text><text>{{sel.os?.cyl||'—'}}</text><text>{{sel.os?.axis||'—'}}</text><text>{{sel.os?.add||'—'}}</text></view>
        </view>
        <text class="ml">PD: {{sel.pdMode==='dual'?`${sel.pdOd} / ${sel.pdOs}`:sel.pd}} mm ({{sel.pdMode}})</text>
        <text v-if="sel.prescriberName" class="ml">{{sel.prescriberName}}</text>
        <text v-if="sel.issueDate" class="ml">{{$t('c3.myrx.issued')}}: {{sel.issueDate}} · {{$t('myrx.expires')}}: {{sel.expirationDate}}</text>
      </view>
    </view>
    <KyotoBottomNav active="account"/>
  </view>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import KyotoHeader from '@/components/KyotoHeader.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import KyotoBottomNav from '@/components/KyotoBottomNav.vue';
import { usePrescriptionStore } from '@/stores/prescription';
import { PrescriptionService } from '@/services/PrescriptionService';
import type { Prescription } from '@/models';
const { t } = useI18n();
const rxStore = usePrescriptionStore();
const sel = ref<Prescription|null>(null);
const validity = (p:Prescription)=>PrescriptionService.validity(p);
const goUpload=()=>uni.navigateTo({url:'/pages/prescription/upload'});
const viewDetail=(p:Prescription)=>sel.value=p;
function useFor(p:Prescription){
  if(validity(p)==='expired'){ uni.showToast({title:t('c3.myrx.expWarn'),icon:'none',duration:3000}); return; }
  uni.navigateTo({url:'/pages/frames/index'});
}
function del(id:string){
  uni.showModal({ title:'', content:t('c3.myrx.deleteConfirm'), success:(r)=>{ if(r.confirm) rxStore.remove(id); } });
}
</script>
<style lang="scss" scoped>
.rxcard{background:#fff;border:2rpx solid $line;border-radius:$r-md;padding:24rpx;margin-bottom:16rpx}
.rxh{display:flex;justify-content:space-between;align-items:center;margin-bottom:10rpx;gap:12rpx}
.rxn{font-size:$fs-sm;font-weight:$fw-semi}
.rxst{font-size:$fs-xs;padding:6rpx 16rpx;border-radius:$r-pill;font-weight:$fw-semi;line-height:1.3;text-align:center}
.rxst.valid{background:$tint-teal2;color:$teal}
.rxst.expiringSoon{background:$tint-gold;color:$night}
.rxst.expired{background:$tint-sunrise;color:$sunrise}
.rxst.unknown{background:$mist;color:$muted}
.rx-meta{display:flex;flex-wrap:wrap;gap:6rpx 20rpx;margin-bottom:8rpx}
.rm{font-size:$fs-xs;color:$muted}
.rx-warn{font-size:$fs-xs;color:$sunrise;line-height:1.5;background:#FFF1EB;border-radius:$r-sm;padding:14rpx;margin:8rpx 0}
.rx-warn.soon{color:$night;background:$tint-gold}
.rx-acts{display:flex;gap:20rpx;flex-wrap:wrap;margin-top:10rpx}
.ra{font-size:$fs-xs;color:$teal;font-weight:$fw-semi}
.ra.warn{color:$sunrise}
.modal-mask{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(13,27,42,.45);z-index:$z-sheet;display:flex;align-items:center;justify-content:center;padding:40rpx}
.modal{background:$paper;border-radius:$r-lg;padding:30rpx;width:100%;max-width:600rpx}
.mh{display:flex;justify-content:space-between;align-items:center;margin-bottom:18rpx}
.mt2{font-size:$fs-md;font-weight:$fw-bold}
.mx{width:56rpx;height:56rpx;border-radius:50%;background:$mist;display:flex;align-items:center;justify-content:center;font-size:24rpx}
.rxtbl2{background:#fff;border:2rpx solid $line;border-radius:$r-sm;padding:14rpx;margin-bottom:14rpx}
.r2{display:grid;grid-template-columns:70rpx repeat(4,1fr);gap:6rpx;padding:8rpx 0;font-size:$fs-xs;text-align:center}
.r2.hd{color:$muted;font-weight:$fw-semi;font-size:18rpx}
.eye{font-weight:$fw-bold}
.ml{display:block;font-size:$fs-xs;color:$muted;line-height:1.7}
</style>
