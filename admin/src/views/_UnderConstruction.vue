<template>
  <div class="page">
    <div class="card empty">
      <div style="font-size:28px; margin-bottom:8px">🚧</div>
      <div style="font-weight:700; color:var(--indigo); margin-bottom:6px">{{ title }}</div>
      <div class="small muted">
        该视图由另一位专员负责开发，文件 <span class="mono">{{ viewFile }}</span> 尚未提交。<br />
        提交后本页面会自动加载，无需改路由。
      </div>
      <div style="margin-top:14px">
        <router-link class="btn" to="/">返回仪表盘</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const title = computed(() => (route.meta.title as string) || '页面建设中');
const viewFile = computed(() => (route.meta.viewFile as string) || '未知');
</script>
