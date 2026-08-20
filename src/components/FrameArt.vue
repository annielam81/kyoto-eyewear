<template>
  <view class="fa" :class="tint" :style="{'--fc': hex}" v-html="svg"></view>
</template>
<script setup lang="ts">
import { computed } from 'vue';
const props = withDefaults(defineProps<{ art: string; hex?: string; tint?: string; view?: string }>(), { hex:'#0D1B2A', tint:'', view:'front' });
/* Placeholder line-art — to be replaced by real product photography (system already keyed by frame+color+view). */
const ARTS: Record<string,string> = {
  round:`<circle cx="55" cy="42" r="28" fill="rgba(255,255,255,.6)"/><circle cx="145" cy="42" r="28" fill="rgba(255,255,255,.6)"/><path d="M83 38q17-12 34 0"/><path d="M27 36L8 26M173 36L192 26"/>`,
  square:`<rect x="25" y="18" width="62" height="46" rx="10" fill="rgba(255,255,255,.6)"/><rect x="113" y="18" width="62" height="46" rx="10" fill="rgba(255,255,255,.6)"/><path d="M87 32q13-9 26 0"/><path d="M25 30L7 22M175 30L193 22"/>`,
  cat:`<path d="M25 42q0-22 32-22q30 0 30 22q0 20-30 20q-32 0-32-20Z" fill="rgba(255,255,255,.6)"/><path d="M113 42q0-22 30-22q32 0 32 22q0 20-32 20q-30 0-30-20Z" fill="rgba(255,255,255,.6)"/><path d="M87 36q13-10 26 0"/><path d="M25 34L6 20M175 34L194 20"/>`,
  sun:`<path d="M25 30h64v10q0 26-32 26q-32 0-32-26Z" fill="var(--fc)" fill-opacity=".82"/><path d="M111 30h64v10q0 26-32 26q-32 0-32-26Z" fill="var(--fc)" fill-opacity=".82"/><path d="M89 34q11-8 22 0"/><path d="M25 32L7 24M175 32L193 24"/>`,
  aviator:`<path d="M28 26h58q4 0 3 6l-4 24q-2 12-26 12q-26 0-30-18l-4-18q-1-6 3-6Z" fill="var(--fc)" fill-opacity=".4"/><path d="M114 26h58q4 0 3 6l-4 18q-4 18-30 18q-24 0-26-12l-4-24q-1-6 3-6Z" fill="var(--fc)" fill-opacity=".4"/><path d="M89 30q11-8 22 0"/><path d="M28 30L8 22M172 30L192 22"/>`,
  side:`<path d="M30 30q-10 28 10 36q22 4 26-22q2-14-10-16Z" fill="rgba(255,255,255,.6)"/><path d="M56 28L178 30q6 1 6 6l-4 20" stroke-linecap="round"/>`,
};
const svg = computed(() => {
  const inner = props.view==='side' ? ARTS.side
    : props.view==='deg' ? `<g transform="matrix(.85 0 -.18 1 22 0)">${ARTS[props.art] ?? ARTS.round}</g>`
    : (ARTS[props.art] ?? ARTS.round);
  return `<svg viewBox="0 0 200 80" style="width:72%;height:auto" fill="none" stroke="var(--fc)" stroke-width="4">${inner}</svg>`;
});
</script>
<style lang="scss" scoped>
.fa{display:flex;align-items:center;justify-content:center;width:100%;height:100%}
.tint-sakura{background:$tint-sakura}.tint-sunrise{background:$tint-sunrise}
.tint-gold{background:$tint-gold}.tint-teal{background:$tint-teal}
</style>
