<template>
  <!-- LOCKED BRAND ASSET · kyoto-wordmark-master.svg · never typeset KYOTO with a font -->
  <view class="kyoto-wordmark" :style="{ height: height + 'px', color }" aria-label="KYOTO">
    <svg viewBox="-6 -6 556 112" xmlns="http://www.w3.org/2000/svg" :style="{height:'100%',width:'auto',display:'block'}">
      <g fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="butt" stroke-linejoin="miter">
        <path d="M6 0V100"/><path d="M60 0L27 42"/><path d="M31 52L62 100"/>
        <path d="M110 0L131 50L152 0"/><path d="M131 64V100"/>
        <path d="M282.22 25.34A43 43 0 1 1 271.66 14.78"/>
        <path d="M371 0V100"/><path d="M336 6H358"/><path d="M384 6H406"/>
        <path d="M459.78 74.66A43 43 0 1 1 470.34 85.22"/>
      </g>
    </svg>
  </view>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ height?: number; color?: string }>(), { height: 18, color: '#141B3D' });
</script>
<style scoped>.kyoto-wordmark{display:inline-flex;align-items:center}</style>
