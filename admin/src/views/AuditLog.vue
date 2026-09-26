<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>审计日志</h1>
        <div class="sub">谁 · 做了什么 · 什么时候 · 改了什么（before / after）</div>
      </div>
    </div>

    <div class="toolbar">
      <select v-model="fEntity" class="select" @change="reload">
        <option value="">全部实体</option>
        <option value="product">产品</option>
        <option value="product_image">产品图片</option>
        <option value="inventory">库存</option>
        <option value="promotion">促销</option>
      </select>
      <input v-model="fEntityId" class="input" placeholder="实体 ID 过滤（可选）" style="width:220px" @keyup.enter="reload" />
      <button class="btn" @click="reload">筛选</button>
    </div>

    <div v-if="loading" class="empty">加载中…</div>
    <div v-else-if="items.length === 0" class="empty">暂无审计记录</div>
    <div v-else class="card" style="padding:0; overflow:hidden">
      <div class="table-wrap" style="border:none">
        <table class="tbl">
          <thead>
            <tr><th>时间</th><th>操作人</th><th>动作</th><th>实体</th><th class="desktop-only">before → after</th></tr>
          </thead>
          <tbody>
            <tr v-for="a in items" :key="a.id">
              <td class="small muted" style="white-space:nowrap">{{ fmtTime(a.createdAt) }}</td>
              <td class="small">{{ a.actor ?? '—' }}</td>
              <td><span class="badge">{{ a.action }}</span></td>
              <td class="small mono">{{ a.entity }}<br /><span class="muted">{{ shortId(a.entityId) }}</span></td>
              <td class="desktop-only">
                <details>
                  <summary class="small" style="cursor:pointer; color:var(--info)">查看 diff</summary>
                  <div class="row" style="align-items:flex-start; margin-top:6px">
                    <div style="flex:1"><div class="small muted">before</div><div class="jsonbox">{{ pretty(a.before) }}</div></div>
                    <div style="flex:1"><div class="small muted">after</div><div class="jsonbox">{{ pretty(a.after) }}</div></div>
                  </div>
                </details>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getProvider } from '@/lib/provider';
import type { AuditLogRow } from '../../../supabase/kyoto';

const loading = ref(true);
const items = ref<AuditLogRow[]>([]);
const fEntity = ref('');
const fEntityId = ref('');

const fmtTime = (t: string) => new Date(t).toLocaleString('zh-CN', { hour12: false });
const shortId = (id: string) => (id.length > 18 ? id.slice(0, 16) + '…' : id);
const pretty = (v: Record<string, unknown> | null) => (v ? JSON.stringify(v, null, 2) : '—');

async function reload() {
  loading.value = true;
  try {
    items.value = await getProvider().auditList({
      entity: fEntity.value || undefined,
      entityId: fEntityId.value.trim() || undefined,
      limit: 200,
    });
  } finally {
    loading.value = false;
  }
}

onMounted(reload);
</script>
