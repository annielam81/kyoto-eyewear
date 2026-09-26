<!--
  admin/src/views/Customers.vue — 客户真实列表 + 详情（走 provider，非 Coming Soon）。
  空数据时诚实显示空状态。
  约定：admin/src/lib/provider.ts 导出 getProvider() 工厂（脚手架专员提供）；本文件 const db = getProvider()。
-->
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getProvider } from '@/lib/provider';

/** provider 单例（脚手架专员提供 getProvider 工厂） */
const db = getProvider();
import type { CustomerRow, OrderRow, PrescriptionRow } from '../../../supabase/kyoto';

const customers = ref<CustomerRow[]>([]);
const orders = ref<OrderRow[]>([]);
const prescriptions = ref<PrescriptionRow[]>([]);
const loading = ref(false);
const err = ref('');
const selected = ref<CustomerRow | null>(null);

const ordersOf = (id: string) => orders.value.filter((o) => o.customerId === id);
const rxOf = (id: string) => prescriptions.value.filter((p) => p.customerId === id);

function fmtAddr(a: Record<string, unknown>): string {
  const parts = ['line1', 'line2', 'city', 'state', 'postal', 'country']
    .map((k) => a[k])
    .filter(Boolean);
  return parts.length ? parts.join(', ') : JSON.stringify(a);
}

async function load() {
  loading.value = true;
  err.value = '';
  try {
    const [c, o, p] = await Promise.all([
      db.listCustomers(),
      db.listOrders(),
      db.listPrescriptions().catch(() => [] as PrescriptionRow[]),
    ]);
    customers.value = c;
    orders.value = o;
    prescriptions.value = p;
  } catch (e) {
    err.value = e instanceof Error ? e.message : '加载失败';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="pg">
    <header>
      <h2>客户</h2>
      <p class="muted">真实数据（provider）。共 {{ customers.length }} 位客户。</p>
    </header>

    <p v-if="err" class="err">{{ err }}</p>
    <p v-if="loading" class="muted">加载中…</p>

    <div v-if="!loading && customers.length === 0" class="empty">
      <p>暂无客户</p>
      <p class="muted">当前 provider 中没有任何客户数据——这是真实空状态，不是占位页面。</p>
    </div>

    <div v-else class="layout">
      <section class="panel">
        <table class="dense desktop-only">
          <thead>
            <tr><th>姓名</th><th>邮箱</th><th>电话</th><th>订单</th><th>处方</th></tr>
          </thead>
          <tbody>
            <tr
              v-for="c in customers"
              :key="c.id"
              :class="{ sel: selected?.id === c.id }"
              @click="selected = c"
            >
              <td><strong>{{ c.name || '—' }}</strong></td>
              <td class="mono">{{ c.email || '—' }}</td>
              <td class="mono">{{ c.phone || '—' }}</td>
              <td>{{ ordersOf(c.id).length }}</td>
              <td>{{ rxOf(c.id).length }}</td>
            </tr>
          </tbody>
        </table>
        <ul class="cards mobile-only">
          <li
            v-for="c in customers"
            :key="c.id"
            class="card"
            :class="{ sel: selected?.id === c.id }"
            @click="selected = c"
          >
            <div>
              <p><strong>{{ c.name || '—' }}</strong></p>
              <p class="muted mono">{{ c.email || '—' }}</p>
            </div>
            <span class="badge">{{ ordersOf(c.id).length }} 单</span>
          </li>
        </ul>
      </section>

      <aside v-if="selected" class="panel detail">
        <div class="dhead">
          <h3>{{ selected.name || '（未命名）' }}</h3>
          <button class="btn xs" @click="selected = null">关闭</button>
        </div>
        <dl class="kv">
          <dt>邮箱</dt><dd class="mono">{{ selected.email || '—' }}</dd>
          <dt>电话</dt><dd class="mono">{{ selected.phone || '—' }}</dd>
          <dt>注册</dt>
          <dd class="muted">{{ new Date(selected.createdAt).toLocaleString() }}</dd>
        </dl>
        <h4>地址（{{ selected.addresses.length }}）</h4>
        <ul v-if="selected.addresses.length" class="alist">
          <li v-for="(a, i) in selected.addresses" :key="i" class="muted">{{ fmtAddr(a) }}</li>
        </ul>
        <p v-else class="muted">无地址</p>
        <h4>订单（{{ ordersOf(selected.id).length }}）</h4>
        <ul v-if="ordersOf(selected.id).length" class="alist">
          <li v-for="o in ordersOf(selected.id)" :key="o.id">
            <span class="mono">{{ o.orderNumber }}</span>
            <span class="badge">{{ o.status }}</span>
          </li>
        </ul>
        <p v-else class="muted">无订单</p>
        <h4>处方（{{ rxOf(selected.id).length }}）</h4>
        <ul v-if="rxOf(selected.id).length" class="alist">
          <li v-for="p in rxOf(selected.id)" :key="p.id">
            <span class="mono">{{ p.id.slice(0, 8) }}</span>
            <span class="badge">{{ p.verificationStatus }}</span>
          </li>
        </ul>
        <p v-else class="muted">无处方</p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.pg { max-width: 1280px; margin: 0 auto; padding: 16px; }
.muted { color: #777; font-size: 13px; }
.err { color: #c62828; }
.mono { font-family: ui-monospace, monospace; font-size: 12px; }
.empty { padding: 48px 24px; text-align: center; border: 1px dashed #ccc; border-radius: 12px; color: #888; }
.layout { display: grid; grid-template-columns: 1fr 380px; gap: 16px; margin-top: 12px; }
.panel { border: 1px solid #e3e3e3; border-radius: 12px; padding: 12px; background: #fff; }
table.dense { width: 100%; border-collapse: collapse; font-size: 13px; }
table.dense th, table.dense td { border-bottom: 1px solid #eee; padding: 8px; text-align: left; }
table.dense tbody tr { cursor: pointer; }
table.dense tbody tr:hover, tr.sel, li.sel { background: #f5f8fc; }
.badge { background: #eee; border-radius: 10px; padding: 2px 8px; font-size: 11px; }
.cards { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
.card { border: 1px solid #e3e3e3; border-radius: 10px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px; cursor: pointer; background: #fff; }
.card p { margin: 0 0 4px; }
.detail .dhead { display: flex; justify-content: space-between; align-items: center; }
.detail h3 { margin: 0; }
.detail h4 { margin: 14px 0 6px; font-size: 14px; }
.kv { display: grid; grid-template-columns: 70px 1fr; gap: 4px 8px; font-size: 13px; margin: 8px 0; }
.kv dt { color: #777; }
.kv dd { margin: 0; }
.alist { list-style: none; padding: 0; margin: 0; display: grid; gap: 6px; }
.alist li { border: 1px solid #f0f0f0; border-radius: 8px; padding: 6px 10px; font-size: 13px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.btn { border: 1px solid #ccc; background: #fff; border-radius: 8px; padding: 8px 14px; font-size: 14px; cursor: pointer; }
.btn.xs { padding: 4px 8px; font-size: 12px; }
.desktop-only { display: table; }
.mobile-only { display: none; }
@media (max-width: 900px) {
  .desktop-only { display: none; }
  .mobile-only { display: grid; }
  .layout { grid-template-columns: 1fr; }
}
</style>
