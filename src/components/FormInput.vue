<template>
  <view class="fi">
    <text v-if="label" class="fi-lb">{{ label }}</text>
    <input class="fi-in" :class="{ err: !!error }" :type="inputType" :password="type==='password'"
      :value="modelValue" :placeholder="placeholder" @input="onInput" @blur="$emit('blur')"/>
    <text v-if="error" class="fi-err">⚠ {{ error }}</text>
  </view>
</template>
<script setup lang="ts">
import { computed } from 'vue';
const props = withDefaults(defineProps<{ modelValue?: string; label?: string; placeholder?: string;
  type?: 'text'|'email'|'tel'|'number'|'password'; error?: string }>(), { type:'text', modelValue:'' });
const emit = defineEmits(['update:modelValue','blur']);
/* uni-app input types: text | number | digit | tel; email falls back to text */
const inputType = computed(()=>props.type==='email'?'text':props.type==='password'?'text':props.type==='tel'?'number':props.type);
const onInput = (e:any)=>emit('update:modelValue', e.detail.value);
</script>
<style lang="scss" scoped>
.fi{display:flex;flex-direction:column;gap:10rpx;min-width:0}
.fi-lb{font-size:$fs-xs;color:$muted;font-weight:$fw-med}
.fi-in{background:#fff;border:3rpx solid $line;border-radius:$r-sm;padding:26rpx;font-size:$fs-md;min-height:88rpx;box-sizing:border-box;width:100%}
.fi-in.err{border-color:$sunrise;background:#FFF8F5}
.fi-err{font-size:$fs-xs;color:$sunrise;font-weight:$fw-med}
</style>
