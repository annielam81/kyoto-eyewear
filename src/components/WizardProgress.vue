<template>
  <view class="wp">
    <view class="top">
      <view class="back" @click="$emit('back')"><text class="chev">‹</text><text>{{ $t('common.back') }}</text></view>
      <KyotoWordmark :height="13" color="rgba(20,27,61,.55)" />
      <text class="step">{{ $t('wizard.step') }} {{ step }} / {{ total }}</text>
    </view>
    <view class="bar"><view v-for="i in total" :key="i" class="seg" :class="{ on: i===step, done: i<step }"></view></view>
  </view>
</template>
<script setup lang="ts">
import KyotoWordmark from './KyotoWordmark.vue';
withDefaults(defineProps<{ step: number; total?: number }>(), { total: 5 });
defineEmits(['back']);
</script>
<style lang="scss" scoped>
/* 本组件是向导页的最顶层元素，因此由它 owning iOS 状态栏/灵动岛的 top inset —— 与
 * App.vue 的 .top-bar、KyotoHeader 的 .hdr 同一套做法。.page-pad 的 padding-top 刻意为 0
 * （见 App.vue 注释），.wz 只声明 padding-bottom，向导页顶部没有其他元素，所以这里只加一次，
 * 不存在重复叠加。H5/Android 上 env() 解析为 0，退化成单纯的 $sp-2，行为不变。 */
.wp{padding-top:calc(#{$sp-2} + #{$safe-t})}
.top{display:flex;align-items:center;justify-content:space-between;padding:10rpx 0}
.back{display:flex;align-items:center;gap:6rpx;color:$teal;font-size:$fs-sm;font-weight:$fw-semi}
.chev{font-size:$fs-lg;line-height:1}
.step{font-size:$fs-xs;color:$muted;font-weight:$fw-semi;letter-spacing:.08em}
.bar{display:flex;gap:10rpx;margin:16rpx 0 30rpx}
.seg{flex:1;height:8rpx;border-radius:$r-pill;background:$line}
.seg.on{background:$accent}.seg.done{background:$accent;opacity:.4}
</style>
