<template>
  <div class="login-wrap">
    <div class="login-card">
      <div class="brand">KYOTO</div>
      <div class="tagline">后台管理系统 · 内部工具</div>

      <div style="text-align:center">
        <span class="provider-pill" :class="providerName">
          {{ providerName === 'mock' ? '本地 Mock 模式' : 'Supabase 已连接' }}
        </span>
      </div>

      <form @submit.prevent="onSubmit">
        <div v-if="error" class="login-err">{{ error }}</div>
        <div class="field">
          <label class="label" for="email">邮箱</label>
          <input id="email" v-model="email" class="input" type="email" autocomplete="username" required placeholder="owner@kyoto.local" />
        </div>
        <div class="field">
          <label class="label" for="password">密码</label>
          <input id="password" v-model="password" class="input" type="password" autocomplete="current-password" required />
        </div>
        <button class="btn btn-primary btn-block" :disabled="busy" type="submit">
          {{ busy ? '登录中…' : '登录' }}
        </button>
      </form>

      <div v-if="providerName === 'mock'" class="small muted" style="margin-top:16px">
        <div style="font-weight:600; margin-bottom:6px">Mock 内置账号（密码统一 kyoto123，仅本地演示）：</div>
        <div class="mono">owner@kyoto.local — 全部权限</div>
        <div class="mono">admin@kyoto.local — 可发布</div>
        <div class="mono">staff@kyoto.local — 不可发布 / 不可见处方</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';

const session = useSessionStore();
const route = useRoute();
const router = useRouter();

const email = ref('');
const password = ref('');
const error = ref('');
const busy = ref(false);
const providerName = session.providerName;

async function onSubmit() {
  error.value = '';
  busy.value = true;
  try {
    await session.signIn(email.value.trim(), password.value);
    const redirect = route.query.redirect as string | undefined;
    await router.replace(redirect && redirect.startsWith('/') ? redirect : '/');
  } catch (e) {
    error.value = e instanceof Error ? e.message : '登录失败';
  } finally {
    busy.value = false;
  }
}
</script>
