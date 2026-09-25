<template>
  <view class="wp">
    <view class="top">
      <view class="back" @click="$emit('back')"><text class="chev">‹</text></view>
      <text class="ttl">{{ title }}</text>
      <text class="step">{{ step }} / {{ total }}</text>
    </view>
    <view class="bar"><view class="fill" :style="{ width: (step / total * 100) + '%' }"></view></view>
  </view>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ step: number; total?: number; title?: string }>(), { total: 4, title: '' });
defineEmits(['back']);
</script>
<style lang="scss" scoped>
/* 本组件是向导页的最顶层元素，因此由它 owning iOS 状态栏/灵动岛的 top inset —— 与
 * App.vue 的 .top-bar、KyotoHeader 的 .hdr 同一套做法。.page-pad 的 padding-top 刻意为 0
 * （见 App.vue 注释），.wz 只声明 padding-bottom，向导页顶部没有其他元素，所以这里只加一次，
 * 不存在重复叠加。H5/Android 上 env() 解析为 0，退化成单纯的 $sp-2，行为不变。 */
.wp{padding-top:calc(#{$sp-2} + #{$safe-t})}
/* 母版 04–07 的向导页头：返回 / 居中标题 / 右侧 1 / 4 */
.top{display:flex;align-items:center;justify-content:space-between;gap:$sp-2;padding:8rpx 0 16rpx}
.back{width:56rpx;height:56rpx;display:flex;align-items:center;justify-content:flex-start;color:$ink}
.chev{font-size:44rpx;line-height:1;font-weight:$fw-reg}
.ttl{flex:1;text-align:center;font-size:$fs-md;font-weight:$fw-semi;color:$ink;
  overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.step{min-width:56rpx;text-align:right;font-size:$fs-xs;color:$muted;font-weight:$fw-semi;
  font-variant-numeric:tabular-nums}
/* 细进度条：一根发丝底 + Vermilion 进度 */
.bar{height:3rpx;background:$line;border-radius:$r-pill;margin-bottom:$sp-4;overflow:hidden}
.fill{height:100%;background:$accent;border-radius:$r-pill;transition:width $dur}
</style>
