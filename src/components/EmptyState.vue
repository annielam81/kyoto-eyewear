<template>
  <view class="es"><text class="emo">{{ emoji }}</text><text class="tx">{{ text }}</text><slot /></view>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ text: string; emoji?: string }>(), { emoji: '◯' });
</script>
<style lang="scss" scoped>
.es{display:flex;flex-direction:column;align-items:center;gap:20rpx;padding:120rpx 40rpx;color:$muted;text-align:center}
.emo{font-size:80rpx;opacity:.5}
.tx{font-size:$fs-md;line-height:1.7;white-space:pre-line}
</style>
