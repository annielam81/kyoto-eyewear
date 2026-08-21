<template>
  <view class="page-pad">
    <KyotoHeader back />
    <text class="h1">{{$t('c3.profile.title')}}</text>
    <view class="pf">
      <view class="frow">
        <FormInput v-model="p.firstName" :label="$t('c3.addr.first')"/>
        <FormInput v-model="p.lastName" :label="$t('c3.addr.last')"/>
      </view>
      <FormInput v-model="p.email" :label="$t('auth.email')" type="email"/>
      <FormInput v-model="p.phone" :label="$t('c3.addr.phone')" type="tel"/>
      <view class="fcol"><text class="flb">{{$t('c3.profile.langPref')}}</text><LanguageSelector/></view>
      <text class="mock-note">{{$t('auth.mockNote')}}</text>
      <KyotoButton variant="pink" @click="save">{{$t('common.save')}}</KyotoButton>
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
import LanguageSelector from '@/components/LanguageSelector.vue';
import FormInput from '@/components/FormInput.vue';
import { useUserStore } from '@/stores/user';
const { t } = useI18n();
const user = useUserStore();
const p = ref({ ...user.profile });
function save(){ user.updateProfile({ ...p.value }); uni.showToast({title:t('c3.profile.saved'),icon:'none'}); }
</script>
<style lang="scss" scoped>
.pf{display:flex;flex-direction:column;gap:18rpx;margin-top:22rpx}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:14rpx}
.fcol{display:flex;flex-direction:column;gap:12rpx}
.flb{font-size:$fs-xs;color:$muted;font-weight:$fw-med}
.mock-note{font-size:$fs-xs;color:$muted;opacity:.65}
</style>
