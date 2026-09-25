<template>
  <view class="pc" @click="$emit('open', frame.id)">
    <view class="pv">
      <FrameArt :art="frame.art" :tint="frame.tint" :hex="selHex" />
      <text v-if="mode==='new'" class="newtag">{{ $t('home.newBadge') }}</text>
      <view class="heart" :class="{ on: fav.has(frame.id) }" @click.stop="fav.toggle(frame.id)" v-html="icHeart"></view>
    </view>
    <view class="b">
      <text class="n">{{ frame.name[loc] }}</text>
      <view class="prow">
        <text class="p">{{ money(frame.price) }}</text>
        <view v-if="mode==='new'" class="add" @click.stop="quickAdd" v-html="icPlus"></view>
      </view>
      <view v-if="mode==='best'" class="meta">
        <view class="sws">
          <view v-for="c in frame.colors" :key="c.key" class="sw" :class="{ on: selKey===c.key }"
            :style="{ background: c.hex }" @click.stop="selKey = c.key"></view>
        </view>
        <view class="rate"><view class="star" v-html="icStar"></view><text>{{ rate }}</text></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import FrameArt from './FrameArt.vue';
import { money } from '@/utils/format';
import { useFavoritesStore } from '@/stores/favorites';
import { useCartStore } from '@/stores/cart';
import type { Frame, Locale } from '@/models';

const props = withDefaults(defineProps<{ frame: Frame; mode?: 'best' | 'new' }>(), { mode: 'best' });
defineEmits(['open']);

const { locale, t } = useI18n();
const loc = computed(() => locale.value as Locale);
const fav = useFavoritesStore();
const cart = useCartStore();

const selKey = ref(props.frame.colors[0]?.key ?? '');
const selHex = computed(() => props.frame.colors.find(c => c.key === selKey.value)?.hex ?? '#1A2936');
const rate = computed(() => `${props.frame.rating.toFixed(1)} (${props.frame.reviewCount})`);

const quickAdd = () => {
  const f = props.frame;
  cart.addFrameOnly(f.id, f.sku, f.colors[0]?.key ?? '', f.defaultSize, f.price);
  uni.showToast({ title: t('toast.addedCart'), icon: 'none' });
};

const icHeart = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;display:block"><path d="M12 20.5C7 16.5 3.5 13.3 3.5 9.6A4.6 4.6 0 0 1 8.1 5c1.6 0 3 .9 3.9 2.2A4.6 4.6 0 0 1 15.9 5a4.6 4.6 0 0 1 4.6 4.6c0 3.7-3.5 6.9-8.5 10.9z"/></svg>`;
const icStar = `<svg viewBox="0 0 24 24" fill="currentColor" style="width:100%;height:100%;display:block"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z"/></svg>`;
const icPlus = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" style="width:100%;height:100%;display:block"><path d="M12 5v14M5 12h14"/></svg>`;
</script>

<style lang="scss" scoped>
.pc{background:$card-warm;border:1rpx solid $line;border-radius:$r-md;overflow:hidden}
.pv{position:relative;height:200rpx;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.5)}
.newtag{position:absolute;top:14rpx;left:14rpx;background:#E7DCC8;color:#8A7B63;font-size:16rpx;font-weight:$fw-semi;letter-spacing:.18em;padding:7rpx 14rpx 7rpx 18rpx;border-radius:999rpx}
.heart{position:absolute;top:8rpx;right:8rpx;width:56rpx;height:56rpx;padding:12rpx;color:#A79E90}
.heart.on{color:$vermillion}
.heart.on svg{fill:$vermillion}
.b{padding:16rpx 18rpx 18rpx}
.n{font-family:$font-serif;font-size:24rpx;font-weight:600;color:$night}
.prow{display:flex;align-items:center;justify-content:space-between;margin-top:6rpx;min-height:52rpx}
.p{font-size:$fs-sm;font-weight:$fw-bold;color:$night}
.add{width:54rpx;height:54rpx;border-radius:16rpx;background:$night;color:#fff;padding:13rpx}
.add:active{transform:scale(.92)}
.meta{display:flex;align-items:center;justify-content:space-between;margin-top:12rpx}
.sws{display:flex;gap:12rpx}
.sw{width:22rpx;height:22rpx;border-radius:50%;border:1rpx solid rgba(0,0,0,.14)}
.sw.on{outline:3rpx solid $night;outline-offset:3rpx}
.rate{display:flex;align-items:center;gap:6rpx;font-size:18rpx;color:$muted}
.star{width:22rpx;height:22rpx;color:$gold}
</style>
