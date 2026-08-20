<template>
  <view class="pc" @click="$emit('open', frame.id)">
    <view class="img">
      <FrameArt :art="frame.art" :tint="frame.tint" :hex="frame.colors[0].hex" />
      <text v-if="frame.bestSeller" class="tag pink">{{ $t('home.bestsellers') }}</text>
      <text v-else-if="frame.newArrival" class="tag">{{ $t('home.newArrivals') }}</text>
    </view>
    <view class="b">
      <text class="n">{{ frame.name[loc] }}</text>
      <text class="c">{{ frame.category==='sun' ? $t('frames.sun') : $t('frames.optical') }}</text>
      <text class="p">{{ money(frame.price) }}</text>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import FrameArt from './FrameArt.vue';
import { money } from '@/utils/format';
import type { Frame, Locale } from '@/models';
defineProps<{ frame: Frame }>();
defineEmits(['open']);
const { locale } = useI18n();
const loc = computed(() => locale.value as Locale);
</script>
<style lang="scss" scoped>
.pc{background:#fff;border:2rpx solid $line;border-radius:$r-md;overflow:hidden}
.img{height:220rpx;position:relative}
.tag{position:absolute;top:14rpx;left:14rpx;background:$sunrise;color:#fff;font-size:18rpx;letter-spacing:.08em;padding:6rpx 16rpx;border-radius:$r-pill;font-weight:$fw-semi;text-transform:uppercase}
.tag.pink{background:$sakura}
.b{padding:18rpx 22rpx 22rpx;display:flex;flex-direction:column;gap:2rpx}
.n{font-size:$fs-sm;font-weight:$fw-semi}
.c{font-size:$fs-xs;color:$muted}
.p{font-size:$fs-sm;font-weight:$fw-bold;color:$sunrise;margin-top:6rpx}
</style>
