<template>
  <view class="page-pad">
    <KyotoHeader back />
    <text class="h1">{{$t('c3.addr.savedTitle')}}</text>
    <KyotoButton variant="night" size="sm" style="margin:16rpx 0 24rpx" @click="startAdd">+ {{$t('c3.addr.addNew')}}</KyotoButton>
    <EmptyState v-if="!addrStore.list.length && !editing" :text="$t('c3.addr.empty')" emoji="📍"/>
    <view v-for="a in addrStore.list" :key="a.id" class="acard">
      <view class="ac-tx">
        <text class="ac-n">{{a.firstName}} {{a.lastName}} <text v-if="a.isDefault" class="def-tag">{{$t('c3.addr.isDefault')}}</text></text>
        <text class="ac-l">{{a.line1}}<template v-if="a.line2">, {{a.line2}}</template></text>
        <text class="ac-l">{{a.city}}, {{a.stateCode}} {{a.zip}} · {{a.phone}}</text>
      </view>
      <view class="ac-acts">
        <text class="al" @click="edit(a)">{{$t('common.edit')}}</text>
        <text v-if="!a.isDefault" class="al" @click="addrStore.setDefault(a.id)">{{$t('c3.addr.setDefault')}}</text>
        <text class="al warn" @click="del(a.id)">{{$t('c3.myrx.del')}}</text>
      </view>
    </view>
    <!-- inline editor -->
    <view v-if="editing" class="editor">
      <view class="frow">
        <FormInput v-model="form.firstName" :label="$t('c3.addr.first')" :error="errText('firstName')" @blur="touch('firstName')"/>
        <FormInput v-model="form.lastName" :label="$t('c3.addr.last')" :error="errText('lastName')" @blur="touch('lastName')"/>
      </view>
      <FormInput v-model="form.line1" :label="$t('c3.addr.line1')" :error="errText('line1')" @blur="touch('line1')"/>
      <FormInput v-model="form.line2" :label="$t('c3.addr.line2')"/>
      <view class="frow">
        <FormInput v-model="form.city" :label="$t('c3.addr.city')" :error="errText('city')" @blur="touch('city')"/>
        <view class="fcol"><text class="flb">{{$t('c3.addr.state')}}</text>
          <StateSelector v-model="form.stateCode" :error="errText('stateCode')"/></view>
      </view>
      <view class="frow">
        <FormInput v-model="form.zip" :label="$t('c3.addr.zip')" type="number" :error="errText('zip')" @blur="touch('zip')"/>
        <FormInput v-model="form.phone" :label="$t('c3.addr.phone')" type="tel" :error="errText('phone')" @blur="touch('phone')"/>
      </view>
      <label class="def-row" @click="form.isDefault=!form.isDefault">
        <view :class="['chk',{on:form.isDefault}]">✓</view><text class="def-tx">{{$t('c3.addr.setDefault')}}</text>
      </label>
      <view class="ed-acts">
        <KyotoButton variant="ghost" size="sm" @click="editing=false">{{$t('common.cancel')}}</KyotoButton>
        <KyotoButton variant="pink" size="sm" @click="saveForm">{{$t('common.save')}}</KyotoButton>
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
import EmptyState from '@/components/EmptyState.vue';
import FormInput from '@/components/FormInput.vue';
import StateSelector from '@/components/StateSelector.vue';
import { useAddressStore, blankAddress } from '@/stores/address';
import { AddressValidationService } from '@/services/AddressValidationService';
import type { Address } from '@/models';
const { t } = useI18n();
const addrStore = useAddressStore();
const editing = ref(false);
const form = ref<Address>(blankAddress());
const touched = ref<Record<string,boolean>>({});
const errText = (f:string)=>{
  const e = AddressValidationService.validate(form.value) as any;
  return (touched.value[f]||touched.value.__all)&&e[f]?t('c3.val.'+e[f]):'';
};
const touch = (f:string)=>touched.value[f]=true;
const startAdd = ()=>{ form.value=blankAddress(); touched.value={}; editing.value=true; };
const edit = (a:Address)=>{ form.value=JSON.parse(JSON.stringify(a)); touched.value={}; editing.value=true; };
function saveForm(){
  touched.value={__all:true};
  if(!AddressValidationService.isValid(form.value)) return;
  addrStore.upsert(form.value); editing.value=false;
}
function del(id:string){
  uni.showModal({ title:'', content:t('c3.addr.deleteConfirm'), success:(r)=>{ if(r.confirm) addrStore.remove(id); } });
}
</script>
<style lang="scss" scoped>
.acard{background:#fff;border:2rpx solid $line;border-radius:$r-md;padding:24rpx;margin-bottom:14rpx}
.ac-n{display:block;font-size:$fs-sm;font-weight:$fw-semi;margin-bottom:4rpx}
.def-tag{background:$tint-teal2;color:$teal;font-size:18rpx;padding:2rpx 12rpx;border-radius:$r-pill;font-weight:$fw-semi;margin-left:8rpx}
.ac-l{display:block;font-size:$fs-xs;color:$muted;line-height:1.6}
.ac-acts{display:flex;gap:22rpx;margin-top:14rpx;flex-wrap:wrap}
.al{font-size:$fs-xs;color:$teal;font-weight:$fw-semi}
.al.warn{color:$sunrise}
.editor{background:#fff;border:3rpx solid $sakura;border-radius:$r-md;padding:24rpx;display:flex;flex-direction:column;gap:16rpx;margin-top:8rpx}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:14rpx}
.fcol{display:flex;flex-direction:column;gap:10rpx}
.flb{font-size:$fs-xs;color:$muted;font-weight:$fw-med}
.def-row{display:flex;align-items:center;gap:14rpx}
.chk{width:40rpx;height:40rpx;border-radius:12rpx;border:3rpx solid $line;display:flex;align-items:center;justify-content:center;color:transparent;font-size:22rpx;flex-shrink:0}
.chk.on{background:$teal;border-color:$teal;color:#fff}
.def-tx{font-size:$fs-xs;color:$muted}
.ed-acts{display:grid;grid-template-columns:1fr 1fr;gap:14rpx}
</style>
