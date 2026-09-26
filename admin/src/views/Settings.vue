<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>设置</h1>
        <div class="sub">Provider 状态 · 环境检查 · Mock 说明</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:14px">
      <h3 style="margin-top:0; color:var(--indigo)">当前数据 Provider</h3>
      <dl class="kv">
        <dt>名称</dt>
        <dd><span class="provider-pill" :class="providerName">{{ providerName === 'mock' ? '本地 Mock' : 'Supabase' }}</span></dd>
        <dt>说明</dt>
        <dd class="small muted">
          {{ providerName === 'mock'
            ? '未检测到 Supabase 环境变量，使用 localStorage 持久化的本地 Mock 数据。'
            : '已连接 Supabase，读写真实数据库。' }}
        </dd>
      </dl>
    </div>

    <div class="card" style="margin-bottom:14px">
      <h3 style="margin-top:0; color:var(--indigo)">环境变量检查清单</h3>
      <div class="checkline">
        <span>{{ hasUrl ? '✅' : '⬜' }}</span>
        <span><span class="mono">VITE_SUPABASE_URL</span> <span class="muted small">{{ hasUrl ? '已设置' : '未设置（留空 = Mock 模式）' }}</span></span>
      </div>
      <div class="checkline">
        <span>{{ hasKey ? '✅' : '⬜' }}</span>
        <span><span class="mono">VITE_SUPABASE_ANON_KEY</span> <span class="muted small">{{ hasKey ? '已设置（已隐藏）' : '未设置（留空 = Mock 模式）' }}</span></span>
      </div>
      <div class="small muted" style="margin-top:8px">
        切换到 Supabase：在 <span class="mono">admin/.env</span>（复制自 <span class="mono">.env.example</span>）填入两个变量后重启 dev server。
        真实 secret 永远不要提交到 git。
      </div>
    </div>

    <div class="card" style="margin-bottom:14px">
      <h3 style="margin-top:0; color:var(--indigo)">Mock 模式说明</h3>
      <div class="small" style="display:grid; gap:6px">
        <div>· 内置账号（密码统一 <span class="mono">kyoto123</span>，<strong>仅本地演示用</strong>）：</div>
        <div class="mono">　owner@kyoto.local — 店主，全部权限（含发布、处方）</div>
        <div class="mono">　admin@kyoto.local — 管理员，可发布、可看处方</div>
        <div class="mono">　staff@kyoto.local — 店员，不可发布、不可看处方</div>
        <div>· 数据保存在浏览器 localStorage（key <span class="mono">kyoto-admin-mock-v1</span>），种子为 6 款真实产品数据。</div>
        <div>· staff 的 publish 限制在 UI（按钮隐藏）+ provider 层（抛错拒绝）双重 enforced。</div>
        <div>· cost / supplier / internalNotes 等内部字段仅后台可见，永远不进入顾客端 DTO（见 supabase/kyoto.ts 的 toCustomerProduct）。</div>
      </div>
      <div class="row" style="margin-top:12px">
        <button class="btn btn-danger" @click="resetMock">重置 Mock 数据为种子</button>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-top:0; color:var(--indigo)">当前登录</h3>
      <dl class="kv">
        <dt>邮箱</dt><dd class="mono">{{ session.profile?.email ?? '—' }}</dd>
        <dt>角色</dt><dd>{{ roleLabel }}</dd>
        <dt>可发布</dt><dd>{{ session.canPublish ? '是' : '否' }}</dd>
        <dt>可看处方</dt><dd>{{ session.canAccessPrescriptions ? '是' : '否' }}</dd>
      </dl>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSessionStore } from '@/stores/session';
import { getProvider, resetProvider, LocalMockProvider } from '@/lib/provider';

const session = useSessionStore();
const providerName = computed(() => getProvider().name);
const hasUrl = computed(() => !!import.meta.env.VITE_SUPABASE_URL);
const hasKey = computed(() => !!import.meta.env.VITE_SUPABASE_ANON_KEY);
const roleLabel = computed(() => {
  const r = session.profile?.role;
  return r === 'owner' ? '店主' : r === 'admin' ? '管理员' : '店员';
});

function resetMock() {
  if (!confirm('确定清空本地 Mock 数据并恢复为初始种子？')) return;
  const p = getProvider();
  if (p instanceof LocalMockProvider) {
    p.resetToSeed();
    resetProvider();
    location.reload();
  } else {
    alert('当前是 Supabase 模式，无需重置');
  }
}
</script>
