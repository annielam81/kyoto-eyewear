<!--
  admin/src/views/Orders.vue — 订单真实列表 + 详情（走 provider，非 Coming Soon）。
  空数据时诚实显示空状态。
  约定：admin/src/lib/provider.ts 导出 getProvider() 工厂（脚手架专员提供）；本文件 const db = getProvider()。
-->
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getProvider } from '@/lib/provider';

/** provider 单例（脚手架专员提供 getProvider 工厂） */
const db = getProvider();
import type { CustomerRow, OrderRow } from '../../../supabase/kyoto';

const orders = ref<OrderRow[]>([]);
const customers = ref<CustomerRow[]>([]);
const loading = ref(false);
const err = ref('');
const selected = ref<OrderRow | null>(null);

const customerName = (id: string | null): string => {
  if (!id) return '—';
  return customers.value.find((c) => c.id === id)?.name ?? id;
};

async function load() {
  loading.value = true;
  err.value = '';
  try {
    const [o, c] = await Promise.all([db.listOrders(), db.listCustomers()]);
    orders.value = o;
    customers.value = c;
  } catch (e) {
    err.value = e instanceof Error ? e.message : '加载失败';
  } finally {
    loading.value = false;
  }
}

function fmtMoney(n: number | undefined): string {
  return n === undefined || n === null ? '—' : `$${Number(n).toFixed(2)}`;
}
function fmtDate(s: string): string {
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

onMounted(load);
</script>

<template>
  <div class="pg">
    <header>
      <h2>订单</h2>
      <p class="muted">真实数据（provider）。共 {{ orders.length }} 单。</p>
    </header>

    <p v-if="err" class="err">{{ err }}</p>
    <p v-if="loading" class="muted">加载中…</p>

    <div v-if="!loading && orders.length === 0" class="empty">
      <p>暂无订单</p>
      <p class="muted">当前 provider 中没有任何订单数据——这是真实空状态，不是占位页面。</p>
    </div>

    <div v-else class="layout">
      <!-- 列表 -->
      <section class="panel">
        <table class="dense desktop-only">
          <thead>
            <tr><th>订单号</th><th>客户</th><th>状态</th><th>金额</th><th>下单时间</th></tr>
          </thead>
          <tbody>
            <tr
              v-for="o in orders"
              :key="o.id"
              :class="{ sel: selected?.id === o.id }"
              @click="selected = o"
            >
              <td class="mono">{{ o.orderNumber }}</td>
              <td>{{ customerName(o.customerId) }}</td>
              <td><span class="badge">{{ o.status }}</span></td>
              <td>{{ fmtMoney(o.amounts?.total) }}</td>
              <td class="muted">{{ fmtDate(o.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
        <ul class="cards mobile-only">
          <li
            v-for="o in orders"
            :key="o.id"
            class="card"
            :class="{ sel: selected?.id === o.id }"
            @click="selected = o"
          >
            <div>
              <p class="mono">{{ o.orderNumber }}</p>
              <p class="muted">{{ customerName(o.customerId) }} · {{ fmtDate(o.createdAt) }}</p>
            </div>
            <div class="right">
              <span class="badge">{{ o.status }}</span>
              <strong>{{ fmtMoney(o.amounts?.total) }}</strong>
            </div>
          </li>
        </ul>
      </section>

      <!-- 详情 -->
      <aside v-if="selected" class="panel detail">
        <div class="dhead">
          <h3 class="mono">{{ selected.orderNumber }}</h3>
          <button class="btn xs" @click="selected = null">关闭</button>
        </div>
        <dl class="kv">
          <dt>状态</dt><dd><span class="badge">{{ selected.status }}</span></dd>
          <dt>客户</dt><dd>{{ customerName(selected.customerId) }}</dd>
          <dt>支付</dt><dd>{{ selected.paymentStatus || '—' }}</dd>
          <dt>下单时间</dt><dd>{{ fmtDate(selected.createdAt) }}</dd>
        </dl>
        <h4>商品（{{ selected.items.length }}）</h4>
        <pre class="raw">{{ JSON.stringify(selected.items, null, 2) }}</pre>
        <h4>金额</h4>
        <dl v-if="selected.amounts" class="kv">
          <dt>小计</dt><dd>{{ fmtMoney(selected.amounts.subtotal) }}</dd>
          <dt>运费</dt><dd>{{ fmtMoney(selected.amounts.shipping) }}</dd>
          <dt>税</dt><dd>{{ fmtMoney(selected.amounts.tax) }}</dd>
          <dt>总计</dt><dd><strong>{{ fmtMoney(selected.amounts.total) }}</strong></dd>
        </dl>
        <p v-else class="muted">无金额信息</p>
        <h4>处方 / 镜片</h4>
        <p v-if="selected.prescription" class="muted">已关联处方（详情见处方页）</p>
        <pre v-if="selected.lens" class="raw">{{ JSON.stringify(selected.lens, null, 2) }}</pre>
        <p v-if="!selected.prescription && !selected.lens" class="muted">无</p>
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
.card { border: 1px solid #e3e3e3; border-radius: 10px; padding: 10px 12px; display: flex; justify-content: space-between; gap: 8px; cursor: pointer; background: #fff; }
.card .right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.card p { margin: 0 0 4px; }
.detail .dhead { display: flex; justify-content: space-between; align-items: center; }
.detail h3 { margin: 0; }
.detail h4 { margin: 14px 0 6px; font-size: 14px; }
.kv { display: grid; grid-template-columns: 90px 1fr; gap: 4px 8px; font-size: 13px; margin: 8px 0; }
.kv dt { color: #777; }
.kv dd { margin: 0; }
.raw { background: #f4f4f4; border-radius: 8px; padding: 10px; font-size: 12px; white-space: pre-wrap; max-height: 260px; overflow: auto; }
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
