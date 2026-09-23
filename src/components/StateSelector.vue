<template>
  <view>
    <view class="ss-field" :class="{ err: !!error }" @click="open=true">
      <text :class="['ss-val',{ph:!modelValue}]">{{ display }}</text>
      <text class="ss-chev">▾</text>
    </view>
    <text v-if="error" class="ss-err">⚠ {{ error }}</text>
    <view v-if="open" class="ss-mask" @click="open=false">
      <view class="ss-sheet" @click.stop>
        <view class="ss-hd"><text class="ss-t">{{ $t('c3.addr.selectState') }}</text>
          <text class="ss-x" @click="open=false">✕</text></view>
        <scroll-view scroll-y class="ss-list">
          <view v-for="st in US_STATES" :key="st.code" class="ss-row" :class="{on:st.code===modelValue}"
            @click="pick(st.code)">
            <text class="ss-name">{{ st.name[loc] }}</text><text class="ss-code">{{ st.code }}</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { US_STATES, stateByCode } from '@/config/us-states.config';
import type { Locale } from '@/models';
const props = defineProps<{ modelValue: string; error?: string }>();
const emit = defineEmits(['update:modelValue']);
const { locale } = useI18n();
const loc = computed(()=>locale.value as Locale);
const open = ref(false);
const display = computed(()=>{
  const s = stateByCode(props.modelValue);
  return s ? `${s.name[loc.value]} (${s.code})` : '—';
});
const pick = (c: string)=>{ emit('update:modelValue', c); open.value=false; };
</script>
<style lang="scss" scoped>
.ss-field{display:flex;align-items:center;justify-content:space-between;background:#fff;border:3rpx solid $line;border-radius:$r-sm;padding:26rpx;min-height:88rpx;box-sizing:border-box}
.ss-field.err{border-color:$sunrise}
.ss-val{font-size:$fs-md}.ss-val.ph{color:$muted}
.ss-chev{color:$muted}
.ss-err{display:block;font-size:$fs-xs;color:$sunrise;margin-top:8rpx;font-weight:$fw-med}
.ss-mask{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(13,27,42,.45);z-index:$z-sheet;display:flex;align-items:flex-end}
.ss-sheet{background:$paper;border-radius:$r-lg $r-lg 0 0;width:100%;max-height:70vh;display:flex;flex-direction:column;padding-bottom:$safe-b}
.ss-hd{display:flex;justify-content:space-between;align-items:center;padding:28rpx 30rpx 18rpx}
.ss-t{font-size:$fs-md;font-weight:$fw-bold}
.ss-x{width:56rpx;height:56rpx;border-radius:50%;background:$mist;display:flex;align-items:center;justify-content:center;font-size:24rpx}
.ss-list{max-height:56vh;padding:0 18rpx}
.ss-row{display:flex;justify-content:space-between;align-items:center;background:#fff;border:2rpx solid $line;border-radius:$r-sm;padding:22rpx 26rpx;margin-bottom:12rpx}
.ss-row.on{border-color:$accent;background:$tint-accent}
.ss-name{font-size:$fs-sm;font-weight:$fw-med}
.ss-code{font-size:$fs-xs;color:$muted;font-weight:$fw-semi;letter-spacing:.06em}
</style>
