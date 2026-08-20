<template>
  <view class="lang" :class="{ compact }">
    <text v-for="l in SUPPORTED" :key="l.code" class="opt" :class="{ on: app.locale===l.code }"
      @click="pick(l.code)">{{ l.label }}</text>
  </view>
</template>
<script setup lang="ts">
import { SUPPORTED } from '@/i18n';
import { useAppStore } from '@/stores/app';
import type { Locale } from '@/models';
defineProps<{ compact?: boolean }>();
const app = useAppStore();
const pick = (c: Locale) => app.setLocale(c);
</script>
<style lang="scss" scoped>
.lang{display:inline-flex;border:2rpx solid $line;border-radius:$r-pill;overflow:hidden;background:#fff}
.opt{padding:8rpx 20rpx;font-size:$fs-xs;color:$muted}
.opt.on{background:$night;color:#fff}
.compact .opt{padding:6rpx 14rpx}
</style>
