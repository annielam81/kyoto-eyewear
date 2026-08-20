<template>
  <view class="page-pad">
    <KyotoHeader back />
    <text class="h1">{{$t('favorites.title')}}</text>
    <EmptyState v-if="!favFrames.length" :text="$t('favorites.empty')" emoji="♡">
      <KyotoButton variant="pink" @click="uni.reLaunch({url:'/pages/frames/index'})">{{$t('home.hero.cta')}}</KyotoButton>
    </EmptyState>
    <view class="grid">
      <ProductCard v-for="f in favFrames" :key="f.id" :frame="f" @open="id=>uni.navigateTo({url:`/pages/product/detail?id=${id}`})"/>
    </view>
    <KyotoBottomNav active="account"/>
  </view>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import KyotoHeader from '@/components/KyotoHeader.vue';
import KyotoButton from '@/components/KyotoButton.vue';
import EmptyState from '@/components/EmptyState.vue';
import ProductCard from '@/components/ProductCard.vue';
import KyotoBottomNav from '@/components/KyotoBottomNav.vue';
import { useFavoritesStore } from '@/stores/favorites';
import { useProductStore } from '@/stores/product';
import { onShow } from '@dcloudio/uni-app';
const fav = useFavoritesStore(); const products = useProductStore();
onShow(()=>products.ensure());
const favFrames = computed(()=>products.frames.filter(f=>fav.has(f.id)));
</script>
<style lang="scss" scoped>
.grid{display:grid;grid-template-columns:1fr 1fr;gap:20rpx;margin-top:24rpx}
</style>
